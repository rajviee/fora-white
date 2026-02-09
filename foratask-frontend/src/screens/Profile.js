import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pencil } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import useUserStore from "../stores/useUserStore";
import api from "../utils/api";
import ChangePasswordButton from "../components/ChangePasswordButton";

// 🔹 Get screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth > 768;

// 🔹 Validation utilities
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validateContactNumber = (number) => {
  if (!number) return true; // Optional field
  const phoneRegex = /^\+91[6-9]\d{9}$/;
  return phoneRegex.test(number);
};

const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return "Name cannot be empty";
  }
  if (name.length > 50) {
    return "Name cannot exceed 50 characters";
  }
  return null;
};

const validateDateOfBirth = (date) => {
  if (!date) return null;
  const selectedDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - selectedDate.getFullYear();

  if (selectedDate > today) {
    return "Date of birth cannot be in the future";
  }
  if (age < 18) {
    return "You must be at least 18 years old";
  }
  if (age > 100) {
    return "Please enter a valid date of birth";
  }
  return null;
};

const validateImageFile = (file, uri) => {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  if (Platform.OS === 'web' && file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Only JPG, JPEG, and PNG images are allowed";
    }
    if (file.size > MAX_SIZE) {
      return "Image size must be less than 5MB";
    }
  }
  return null;
};

// 🔹 Normalize avatar path from backend
function getAvatarUrl(user) {
  if (!user?.avatar?.path) return null;
  const cleanPath = user.avatar.path.replace(/\\/g, "/");
  return `${process.env.EXPO_PUBLIC_API_URL}/${cleanPath}`;
}

// 🔹 Service for updating user
const updateUserProfile = async (formData, avatarData) => {
  const { user } = useUserStore.getState();
  const data = new FormData();

  // Append form fields
  data.append("firstName", formData.firstName || "");
  data.append("lastName", formData.lastName || "");
  data.append("dateOfBirth", formData.dateOfBirth || "");
  data.append("gender", formData.gender || "");
  data.append("designation", formData.designation || "");
  data.append("contactNumber", formData.contactNumber || "");

  // Handle avatar upload if there's new avatar data
  if (avatarData?.uri && avatarData?.hasChanged) {
    if (Platform.OS === "web") {
      data.append("avatar", avatarData.file);
    } else {
      data.append("avatar", {
        uri: avatarData.uri,
        name: avatarData.name || `avatar-${Date.now()}.jpg`,
        type: avatarData.type || "image/jpeg",
      });
    }
  }

  try {
    const res = await api.patch(`me/update-user/${user._id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    await useUserStore.getState().fetchUser();
    return res.data;
  } catch (error) {
    console.error("Error updating user profile:", error.response?.data || error.message);
    throw error;
  }
};

export default function Profile() {
  const { user, fetchUser } = useUserStore();
  const [editMode, setEditMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Track initialization
  const isInitialized = useRef(false);
  const scrollViewRef = useRef(null);

  // 🔹 SEPARATE STATES - This prevents avatar changes from affecting form inputs
  const getInitialFormState = (currentUser) => ({
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
    email: currentUser?.email || "",
    contactNumber: currentUser?.contactNumber || "",
    dateOfBirth: currentUser?.dateOfBirth ? currentUser.dateOfBirth.split("T")[0] : "",
    gender: currentUser?.gender || "",
    role: currentUser?.role || "",
    designation: currentUser?.designation || "",
  });

  const getInitialAvatarState = (currentUser) => ({
    uri: currentUser?.avatar?.path ? getAvatarUrl(currentUser) : null,
    hasChanged: false,
    file: null,
    name: null,
    type: null,
  });

  // Separate states for form and avatar
  const [form, setForm] = useState(() => getInitialFormState(user));
  const [avatar, setAvatar] = useState(() => getInitialAvatarState(user));

  // 🔹 Memoized avatar source to prevent unnecessary re-renders
  const avatarSource = useMemo(() => {
    if (avatar.uri) {
      return { uri: avatar.uri };
    }
    return require("../../assets/logo.png");
  }, [avatar.uri]);

  // 🔹 Only update states when user ID changes
  useEffect(() => {
    if (user && user._id && !isInitialized.current) {
      setForm(getInitialFormState(user));
      setAvatar(getInitialAvatarState(user));
      isInitialized.current = true;
    }
  }, [user?._id]);

  // 🔹 Validate all fields before saving
  const validateForm = useCallback(() => {
    const errors = {};

    // Validate first name
    const firstNameError = validateName(form.firstName);
    if (firstNameError) {
      errors.firstName = firstNameError;
    }

    // Validate last name
    const lastNameError = validateName(form.lastName);
    if (lastNameError) {
      errors.lastName = lastNameError;
    }

    // Validate contact number
    if (form.contactNumber && !validateContactNumber(form.contactNumber)) {
      errors.contactNumber = "Please enter a valid contact number (e.g., +911234567890)";
    }

    // Validate date of birth
    const dobError = validateDateOfBirth(form.dateOfBirth);
    if (dobError) {
      errors.dateOfBirth = dobError;
    }

    // Validate designation
    if (form.designation && form.designation.length > 100) {
      errors.designation = "Designation cannot exceed 100 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  // 🔹 Memoized input handlers to prevent recreation on each render
  const handleFirstNameChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, firstName: text }));
    if (validationErrors.firstName) {
      setValidationErrors(prev => ({ ...prev, firstName: null }));
    }
  }, [validationErrors.firstName]);

  const handleLastNameChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, lastName: text }));
    if (validationErrors.lastName) {
      setValidationErrors(prev => ({ ...prev, lastName: null }));
    }
  }, [validationErrors.lastName]);

  const handleContactNumberChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, contactNumber: text }));
    if (validationErrors.contactNumber) {
      setValidationErrors(prev => ({ ...prev, contactNumber: null }));
    }
  }, [validationErrors.contactNumber]);

  const handleDesignationChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, designation: text }));
    if (validationErrors.designation) {
      setValidationErrors(prev => ({ ...prev, designation: null }));
    }
  }, [validationErrors.designation]);

  const handleGenderChange = useCallback((gender) => {
    setForm((prev) => ({ ...prev, gender }));
  }, []);

  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // 🔹 Handle image picker - Updates only avatar state with validation
  const handlePickImage = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files[0];
          if (file) {
            // Validate file
            const fileError = validateImageFile(file);
            if (fileError) {
              Alert.alert("Invalid Image", fileError);
              return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
              setAvatar({
                uri: e.target.result,
                hasChanged: true,
                file: file,
                name: file.name,
                type: file.type,
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

        if (!result.canceled) {
          const asset = result.assets[0];
          const fileExt = asset.uri.split(".").pop();
          const fileName = asset.fileName || `avatar-${Date.now()}.${fileExt}`;
          const mimeType = asset.type
            ? `image/${fileExt === "jpg" ? "jpeg" : fileExt}`
            : "image/jpeg";

          setAvatar({
            uri: asset.uri,
            hasChanged: true,
            file: null,
            name: fileName,
            type: mimeType,
          });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  }, []);

  // 🔹 Format date for display
  const formatDate = useCallback((dateString) => {
    return formatDateToDDMMYYYY(dateString);
  }, []);

  // 🔹 Handle date selection (mobile)
  const handleDateChange = useCallback((event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split("T")[0];
      setForm((prev) => ({ ...prev, dateOfBirth: formatted }));
      if (validationErrors.dateOfBirth) {
        setValidationErrors(prev => ({ ...prev, dateOfBirth: null }));
      }
    }
  }, [validationErrors.dateOfBirth]);

  // 🔹 Handle web date input change
  const handleWebDateChange = useCallback((event) => {
    setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }));
    if (validationErrors.dateOfBirth) {
      setValidationErrors(prev => ({ ...prev, dateOfBirth: null }));
    }
  }, [validationErrors.dateOfBirth]);

  // 🔹 Handle save button click
  const handleSaveClick = useCallback(() => {
    // Dismiss keyboard before validation
    Keyboard.dismiss();

    if (validateForm()) {
      setShowConfirm(true);
    } else {
      Alert.alert(
        "Validation Error",
        "Please fix the errors in the form before saving."
      );
    }
  }, [validateForm]);

  // 🔹 Save profile changes
  const saveChanges = useCallback(async () => {
    try {
      setLoading(true);
      await updateUserProfile(form, avatar);
      setEditMode(false);
      setShowConfirm(false);
      setValidationErrors({});
      // Reset avatar change flag after successful save
      setAvatar(prev => ({ ...prev, hasChanged: false }));
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);

      // Parse backend error message
      let errorMessage = "Failed to update profile. Please try again.";

      if (err.response?.data) {
        if (err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (errorMessage.includes("Unauthorized")) {
        errorMessage = "You don't have permission to update this profile.";
      } else if (errorMessage.includes("different company")) {
        errorMessage = "You cannot update profiles from other companies.";
      } else if (errorMessage.includes("User not found")) {
        errorMessage = "User not found. Please try logging in again.";
      } else if (errorMessage.includes("validation")) {
        errorMessage = "Please check all fields and try again.";
      }

      Alert.alert("Update Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [form, avatar]);

  // 🔹 Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    Keyboard.dismiss();
    setEditMode(false);
    setForm(getInitialFormState(user));
    setAvatar(getInitialAvatarState(user));
    setValidationErrors({});
    Alert.alert("Changes Discarded", "Your profile changes have been reset.");
  }, [user]);
  const trimText = (text, maxLength = 80) =>
    text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

  // 🔹 Memoized ProfileContent to prevent unnecessary re-renders
  const ProfileContent = useMemo(() => (
    <>
      {/* Avatar and Basic Info Section */}
      <View className={`items-center ${isTablet ? 'w-1/4 mb-0' : 'w-full mb-6'}`}>
        <TouchableOpacity
          activeOpacity={1}
          disabled={!editMode}
          onPress={handlePickImage}
        >
          <Image
            source={avatarSource}
            className="w-28 h-28 rounded-full border-3 border-gray-200"
          />
          {editMode && (
            <View className="absolute bottom-0 right-0 bg-[#1360C6] rounded-2xl p-2">
              <Pencil size={16} color="white" />
            </View>
          )}
        </TouchableOpacity>

        <Text className="text-lg font-bold mt-3 text-black text-center">
          {trimText(form.firstName, 20)} {trimText(form.lastName, 20)}
        </Text>

        <Text className="text-[#1360C6] text-center mt-1">
          {form.email}
        </Text>
      </View>

      {/* Form Section */}
      <View className={`${isTablet ? 'w-3/4 pl-6' : 'w-full'}`}>
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold">My Profile</Text>
          <View className="flex-row items-center gap-2">
            <ChangePasswordButton userId={user._id} />
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                setEditMode(!editMode);
                if (editMode) {
                  // Cancel edit mode - reset form and errors
                  Keyboard.dismiss();
                  setForm(getInitialFormState(user));
                  setAvatar(getInitialAvatarState(user));
                  setValidationErrors({});
                }
              }}
            >
              <Pencil size={20} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Gender Toggle */}
        <View className="flex-row gap-4 mb-4">
          {["male", "female"].map((g) => (
            <TouchableOpacity
              activeOpacity={1}
              key={g}
              className={`px-4 py-2 rounded-lg border ${form.gender === g
                ? 'border-[#1360C6] bg-[#1360C6]'
                : 'border-gray-300 bg-white'
                }`}
              disabled={!editMode}
              onPress={() => handleGenderChange(g)}
            >
              <Text className={`font-medium ${form.gender === g ? 'text-white' : 'text-black'}`}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className={`flex-row gap-2 mb-1 ${screenWidth > 480 ? '' : 'flex-col'}`}>
          {/* First Name */}
          <View className="flex-1 flex-col gap-1 mb-2">
            <Text className="text-sm font-normal text-[#696969] flex-1">
              First Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`flex-1 border rounded-lg px-3 py-2 text-black ${validationErrors.firstName
                ? 'border-red-500 bg-red-50'
                : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                }`}
              placeholder="First Name"
              editable={editMode}
              value={form.firstName}
              onChangeText={handleFirstNameChange}
            />
            {validationErrors.firstName && (
              <Text className="text-red-500 text-xs mt-1">{validationErrors.firstName}</Text>
            )}
          </View>

          {/* Last Name */}
          <View className="flex-1 flex-col gap-1 mb-2">
            <Text className="text-sm font-normal text-[#696969] flex-1">
              Last Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              className={`flex-1 border rounded-lg px-3 py-2 text-black ${validationErrors.lastName
                ? 'border-red-500 bg-red-50'
                : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                }`}
              placeholder="Last Name"
              editable={editMode}
              value={form.lastName}
              onChangeText={handleLastNameChange}
            />
            {validationErrors.lastName && (
              <Text className="text-red-500 text-xs mt-1">{validationErrors.lastName}</Text>
            )}
          </View>
        </View>

        {/* Email (read only) */}
        <Text className="text-sm font-normal mb-1 text-[#696969]">
          Email ID
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-3 py-2 mb-4 bg-gray-100 text-black"
          editable={false}
          value={form.email}
        />

        {/* Date of Birth */}
        <View className="mb-2">
          <Text className="text-sm font-normal mb-1 text-[#696969]">
            Date of Birth
          </Text>

          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={handleWebDateChange}
              disabled={!editMode}
              style={{
                width: '100%',
                padding: '6px 12px',
                borderRadius: '8px',
                border: validationErrors.dateOfBirth
                  ? '1px solid #ef4444'
                  : '1px solid #d1d5db',
                backgroundColor: validationErrors.dateOfBirth
                  ? '#fef2f2'
                  : editMode ? 'white' : '#f9fafb',
                fontSize: '16px',
                outline: 'none',
                color: '#000',
              }}
            />
          ) : (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => editMode && setShowDatePicker(true)}
              className={`border rounded-lg px-3 py-3 ${validationErrors.dateOfBirth
                ? 'border-red-500 bg-red-50'
                : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                }`}
              disabled={!editMode}
            >
              <Text className={form.dateOfBirth ? 'text-black' : 'text-gray-400'}>
                {form.dateOfBirth ? formatDate(form.dateOfBirth) : "Select Date of Birth"}
              </Text>
            </TouchableOpacity>
          )}
          {validationErrors.dateOfBirth && (
            <Text className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</Text>
          )}
        </View>

        <View className={`flex-row gap-2 mb-1 ${screenWidth > 480 ? '' : 'flex-col'}`}>

          {/* Contact Number */}
          <View className={`flex-1 flex-col gap-1 mb-2`}>
            <Text className="text-sm font-normal text-[#696969] flex-1">
              Contact Number
            </Text>
            <TextInput
              className={`flex-1 border rounded-lg px-3 py-2 text-black ${validationErrors.contactNumber
                ? 'border-red-500 bg-red-50'
                : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                }`}
              placeholder="e.g., +911234567890"
              editable={editMode}
              value={form.contactNumber}
              onChangeText={handleContactNumberChange}
              keyboardType="phone-pad"
            />
            {validationErrors.contactNumber && (
              <Text className="text-red-500 text-xs mt-1">{validationErrors.contactNumber}</Text>
            )}
          </View>

          {/* Role */}
          <View className={`flex-1 flex-col gap-1 mb-2`}>
            <Text className="text-sm font-normal text-[#696969] flex-1">
              Role
            </Text>
            <TextInput
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-black"
              placeholder="Role"
              editable={false}
              value={form.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : ""}
            />
          </View>

        </View>

        {/* Designation */}
        <Text className="text-sm font-normal mb-1 text-[#696969]">
          Designation
        </Text>
        <TextInput
          className={`border rounded-lg px-3 py-2 mb-4 text-black ${validationErrors.designation
            ? 'border-red-500 bg-red-50'
            : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
            }`}
          placeholder="Designation"
          editable={editMode}
          value={form.designation}
          onChangeText={handleDesignationChange}
        />
        {validationErrors.designation && (
          <Text className="text-red-500 text-xs mt-1">{validationErrors.designation}</Text>
        )}

        {/* Action Buttons */}
        {editMode && (
          <View className="flex-row justify-between mt-6 gap-3">
            <TouchableOpacity
              activeOpacity={1}
              className="border border-gray-400 px-4 py-2 rounded-lg flex-1"
              onPress={handleDiscardChanges}
            >
              <Text className="text-center text-black">Discard Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              disabled={loading}
              className={`bg-[#1360C6] px-4 py-2 rounded-lg flex-1 ${loading ? 'opacity-70' : ''}`}
              onPress={handleSaveClick}
            >
              <Text className="text-white text-center font-medium">
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  ), [
    editMode,
    form,
    avatarSource,
    loading,
    validationErrors,
    handlePickImage,
    handleFirstNameChange,
    handleLastNameChange,
    handleContactNumberChange,
    handleDesignationChange,
    handleGenderChange,
    handleWebDateChange,
    formatDate,
    handleDiscardChanges,
    handleSaveClick,
    isTablet,
    user
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 bg-white"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className={`${isTablet ? 'flex-row items-start' : 'flex-col'}`}>
          {ProfileContent}
        </View>
      </ScrollView>

      {/* Native Date Picker for Mobile */}
      {showDatePicker && Platform.OS !== "web" && Platform.OS !== "ios" && (
        <DateTimePicker
          value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* iOS Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal visible transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white p-5 rounded-t-3xl">
              <View className="flex-row justify-between items-center mb-5">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="text-[#1360C6] text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-black">Select Date</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text className="text-[#1360C6] text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <Modal visible transparent animationType="fade">
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-6 rounded-lg w-80 max-w-[90%]">
              <Text className="text-lg font-semibold mb-4 text-black">
                Confirm Changes
              </Text>
              <Text className="mb-6 text-gray-500">
                Are you sure you want to save these changes to your profile?
              </Text>
              <View className="flex-row justify-end gap-4">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowConfirm(false)}
                  className="px-4 py-2"
                >
                  <Text className="text-black">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={saveChanges}
                  disabled={loading}
                  className={`px-4 py-2 ${loading ? 'opacity-70' : ''}`}
                >
                  <Text className="text-[#1360C6] font-medium">
                    {loading ? "Saving..." : "Save"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
}