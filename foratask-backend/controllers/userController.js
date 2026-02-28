const express = require("express");
const router = express.Router();
const User = require("../models/user");
const avatarMiddleware = require("../middleware/uploadAvatarMiddleware");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const userInfoSafe = async (req, res) => {
  try {

    if (!req.query.id || (req.query.id && (req.user.role == 'admin' || (req.user.role == 'supervisor' && req.user.subordinates.includes(req.query.id))))
    ) {
      let user_id = req.query.id || req.user.id;
      const user = await User.findById(user_id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({ message: "Access denied: Different company" });
      }
      return res.status(200).json(user);
    }
    return res.status(403).json({ message: 'Access denied' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const userInfo = async (req, res) => {
  try {

    if (!req.query.id || (req.query.id && (req.user.role == 'admin' || (req.user.role == 'supervisor' && req.user.subordinates.includes(req.query.id))))
    ) {
      let user_id = req.query.id || req.user.id;
      const user = await User.findById(user_id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.company.toString() !== req.user.company.toString()) {
        return res.status(403).json({ message: "Access denied: Different company" });
      }
      return res.status(200).json(user);
    }
    return res.status(403).json({ message: 'Access denied' });
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const updateUser = async (req, res) => {
  try {
    // Input validation
    if (!req.params.id) {
      return res.status(400).json({
        message: "Employee ID is required"
      });
    }

    // Authorization check
    const userIdToUpdate = req.params.id;

    // Only admin or the user themselves can update
    if (req.user.role !== "admin" && req.params.id !== req.user.id.toString()) {
      return res.status(403).json({
        message: "You don't have permission to update this employee's profile."
      });
    }

    // Fetch existing user
    const existingUser = await User.findById(userIdToUpdate);
    if (!existingUser) {
      return res.status(404).json({
        message: "Employee not found. They may have been removed from the system."
      });
    }

    // Company validation
    if (existingUser.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({
        message: "You cannot update employees from other companies."
      });
    }

    // Validate allowed fields
    const allowedFields = ["firstName", "lastName", "dateOfBirth", "gender", "designation", "contactNumber","role"];
    const updates = {};

    // Build updates object with validation
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const value = req.body[field];

        // Field-specific validation
        switch (field) {
          case "firstName":
          case "lastName":
            if (!value || value.trim().length === 0) {
              return res.status(400).json({
                message: `${field === 'firstName' ? 'First' : 'Last'} name cannot be empty`
              });
            }
            if (value.length > 50) {
              return res.status(400).json({
                message: `${field === 'firstName' ? 'First' : 'Last'} name cannot exceed 50 characters`
              });
            }
            updates[field] = value.trim();
            break;

          case "contactNumber":
            if (value) {
              const phoneRegex = /^\+[1-9]\d{1,3}[1-9]\d{6,14}$/;
              if (!phoneRegex.test(value)) {
                return res.status(400).json({
                  message: "Please enter a valid contact number in international format (e.g., +911234567890)"
                });
              }
            }
            updates[field] = value || null;
            break;

          case "dateOfBirth":
            if (value) {
              const dob = new Date(value);
              const today = new Date();
              const age = today.getFullYear() - dob.getFullYear();

              if (isNaN(dob.getTime())) {
                return res.status(400).json({
                  message: "Please enter a valid date of birth"
                });
              }
              if (dob > today) {
                return res.status(400).json({
                  message: "Date of birth cannot be in the future"
                });
              }
              if (age < 16) {
                return res.status(400).json({
                  message: "Employee must be at least 16 years old"
                });
              }
              if (age > 100) {
                return res.status(400).json({
                  message: "Please enter a valid date of birth"
                });
              }
            }
            updates[field] = value || null;
            break;

          case "gender":
            if (value && !['male', 'female', 'other', 'prefer-not-to-say'].includes(value)) {
              return res.status(400).json({
                message: "Invalid gender value"
              });
            }
            updates[field] = value || null;
            break;

          case "designation":
            if (value && value.length > 100) {
              return res.status(400).json({
                message: "Designation cannot exceed 100 characters"
              });
            }
            updates[field] = value || null;
            break;
          case "role":
            if(value && !['employee','supervisor'].includes(value)){
              return res.status(400).json({
                message: "Invalid value"
              });
            }
            updates[field]=value || "employee";
            break;

          default:
            updates[field] = value;
        }
      }
    }

    // Handle avatar upload with validation
    if (req.file) {
      // Validate file size (5MB max)
      const MAX_SIZE = 5 * 1024 * 1024;
      if (req.file.size > MAX_SIZE) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Failed to delete invalid file:", err.message);
        });
        return res.status(400).json({
          message: "Image size must be less than 5MB"
        });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        // Clean up uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Failed to delete invalid file:", err.message);
        });
        return res.status(400).json({
          message: "Only JPG, JPEG, and PNG images are allowed"
        });
      }

      // Delete old avatar if exists
      if (existingUser.avatar?.path) {
        fs.unlink(existingUser.avatar.path, (err) => {
          if (err) console.error("Failed to delete old avatar:", err.message);
        });
      }

      updates.avatar = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path.replace(/\\/g, '/'),
        size: req.file.size,
        mimeType: req.file.mimetype,
        fileExtension: path.extname(req.file.originalname),
      };
    }

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields to update"
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userIdToUpdate,
      { $set: updates },
      { new: true, runValidators: true }
    )
    // .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        message: "Failed to update employee. Please try again."
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Update user error:", err);

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed: " + errors.join(', ')
      });
    }

    // Handle mongoose cast errors
    if (err.name === 'CastError') {
      return res.status(400).json({
        message: "Invalid employee ID format"
      });
    }

    // Generic error
    res.status(500).json({
      message: "An error occurred while updating the profile. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const userToUpdate = req.params.id;
    const { password } = req.body;
    console.log(req.user.role)
    if (req.user.role !== 'admin' && req.user.id !== userToUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }
    else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)[A-Za-z\d\W]{8,}$/;

      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const updateUserPassword = await User.findByIdAndUpdate(
        userToUpdate,
        { $set: { password: hashedPassword } }
      );
      if (!updateUserPassword) {
        return res.status(404).json({ message: 'Failed to update password. Please try again.' })
      };
      return res.status(200).json({
        message: 'Password updated successfully!',
        user: userToUpdate
      })
    }
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

//check if subscription is from this account                     ---------admin only api---------
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized operation: Deletion of employee data is not permitted.' });
    }
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Company check
    if (userToDelete.company.toString() !== req.user.company.toString()) {
      return res.status(403).json({ message: 'Unauthorized operation: Cannot delete users from another company.' });
    }


    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Employee Deleted Successfully!" });
  }
  catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

const usersList = async (req, res) => {
  try {
    const { searchTerm } = req.query;

    let filter = { company: req.user.company, };
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'i');
      filter.$or = [
        { email: regex },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: regex
            }
          }
        }
      ];
    }

    // Find users based on the search filter
    const usersList = await User.find(filter, {
      firstName: 1,
      lastName: 1,
      avatar: 1,
      _id: 1
    });

    if (!usersList || usersList.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.status(200).json(usersList);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const saveExpoPushToken = async (req, res) => {

  try {
    console.log(req.body, "body");

    const { expoPushToken, userId } = req.body;

    if (!expoPushToken) {
      return res.status(400).json({ message: 'Expo push token is required' });
    }
    console.log(expoPushToken, "expotoken");

    const user = await User.findByIdAndUpdate(
      userId,
      { expoPushToken },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Expo push token saved successfully', user });
  } catch (err) {
    console.error('Error saving Expo push token:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
const removeExpoPushToken = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId, "userId removeExpoPushToken");
    const user = await User.findByIdAndUpdate(
      userId,
      { expoPushToken: "" },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ message: 'Expo Push token removed successfully', user });

  } catch (e) {
    console.error('Error removing Expo push token:', err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { userInfo, updateUser, deleteUser, usersList, saveExpoPushToken, removeExpoPushToken, resetPassword };