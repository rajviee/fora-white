import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pencil, ChevronLeft } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../../utils/api";
import ChangePasswordButton from "../../components/ChangePasswordButton";
import { useQueryClient } from '@tanstack/react-query';
import EmpTaskList from "./TableLists/EmpTaskList";


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
    return "Employee must be at least 18 years old";
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
function getAvatarUrl(avatar) {
  if (!avatar?.path) return null;
  const cleanPath = avatar.path.replace(/\\/g, "/");
  return `${process.env.EXPO_PUBLIC_API_URL}/${cleanPath}`;
}

// 🔹 Service for fetching user info
const fetchUserInfo = async (userId) => {
  try {
    const res = await api.get(`me/userinfo?id=${userId}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching user info:", error);
    throw error;
  }
};

// 🔹 Service for updating user


export default function EmployeeDetails({ navigation }) {
  // Get userId from route params
  const route = useRoute();
  const { id } = route.params;
  const userId = id;

  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const queryClient = useQueryClient();


  // 🔹 SEPARATE STATES
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
    uri: currentUser?.avatar ? getAvatarUrl(currentUser.avatar) : null,
    hasChanged: false,
    file: null,
    name: null,
    type: null,
  });

  const [form, setForm] = useState(() => getInitialFormState(user));
  const [avatar, setAvatar] = useState(() => getInitialAvatarState(user));

  // 🔹 Fetch user data on mount
  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await fetchUserInfo(userId);
      setUser(userData);
      setForm(getInitialFormState(userData));
      setAvatar(getInitialAvatarState(userData));
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to load employee data. Please try again.";
      Alert.alert("Error", errorMsg);
      if (navigation?.goBack) {
        navigation.goBack();
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Memoized avatar source
  const avatarSource = useMemo(() => {
    if (avatar.uri) {
      return { uri: avatar.uri };
    }
  }, [avatar.uri]);

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
  const trimText = (text, maxLength = 80) =>
    text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

  // 🔹 Input handlers with validation
  const handleFirstNameChange = useCallback((text) => {
    setForm((prev) => ({ ...prev, firstName: text }));
    // Clear error when user starts typing
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

  // 🔹 Handle image picker with validation
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
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
  }, []);

  // 🔹 Handle date selection
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

  const handleWebDateChange = useCallback((event) => {
    setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }));
    if (validationErrors.dateOfBirth) {
      setValidationErrors(prev => ({ ...prev, dateOfBirth: null }));
    }
  }, [validationErrors.dateOfBirth]);

  // 🔹 Handle save button click
  const handleSaveClick = useCallback(() => {
    if (validateForm()) {
      setShowConfirm(true);
    } else {
      Alert.alert(
        "Validation Error",
        "Please fix the errors in the form before saving."
      );
    }
  }, [validateForm]);

  const updateUserProfile = async (userId, formData, avatarData) => {
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
      const res = await api.patch(`me/update-user/${userId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      queryClient.invalidateQueries({
        queryKey: ["employees"],
      });
      return res.data;
    } catch (error) {
      console.error("Error updating user profile:", error.response?.data || error.message);
      throw error;
    }
  };

  // 🔹 Save changes
  const saveChanges = useCallback(async () => {
    try {
      setSaving(true);
      await updateUserProfile(userId, form, avatar);
      await loadUserData();
      setEditMode(false);
      setShowConfirm(false);
      setValidationErrors({});
      setAvatar(prev => ({ ...prev, hasChanged: false }));
      Alert.alert("Success", "Employee profile updated successfully!");
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
        errorMessage = "You don't have permission to update this employee's profile.";
      } else if (errorMessage.includes("different company")) {
        errorMessage = "You cannot update employees from other companies.";
      } else if (errorMessage.includes("User not found")) {
        errorMessage = "Employee not found. They may have been removed.";
      } else if (errorMessage.includes("validation")) {
        errorMessage = "Please check all fields and try again.";
      }

      Alert.alert("Update Failed", errorMessage);
    } finally {
      setSaving(false);
    }
  }, [userId, form, avatar]);

  // 🔹 Handle discard changes
  const handleDiscardChanges = useCallback(() => {
    setEditMode(e => !e);
    setForm(getInitialFormState(user));
    setAvatar(getInitialAvatarState(user));
    setValidationErrors({});
    // Alert.alert("Changes Discarded", "Profile changes have been reset.");
  }, [user]);

  // 🔹 Handle deactivate
  const handleDeactivate = useCallback(() => {
    Alert.alert(
      "Deactivate Employee",
      "Are you sure you want to deactivate this employee?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => {
            // Implement deactivate API call here
            console.log("Deactivate employee:", userId);
          }
        },
      ]
    );
  }, [userId]);

  // 🔹 Get status badge
  const getStatusBadge = (role) => {
    return role === "employee" ? "Active" : role || "Active";
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#1360C6" />
        <Text className="mt-3 text-gray-500">Loading employee details...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#FBFBFB]"
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="bg-white  p-4 mb-3 border-[1.5px] rounded-xl border-[#00000080]">

        {/* Header with Back Button */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => navigation?.goBack()}
            className="flex-row items-center gap-1"
          >
            <ChevronLeft size={22} color="#000" />
            <Text className="text-[1.5rem] font-[600] text-black">Employee Details</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-col md:flex-row justify-between items-center pb-4 gap-4">
          {/* Avatar + Name */}
          <View className="flex-col md:flex-row md:w-1/4 w-full items-center gap-2">
            <TouchableOpacity
              activeOpacity={1}
              disabled={!editMode}
              onPress={handlePickImage}
            >
              {avatarSource ? (
                <Image
                  source={avatarSource}
                  style={{ borderColor: "#e5e7eb" }}
                  className="w-20 h-20 md:w-16 md:h-16 rounded-full border-1"
                />
              ) : (
                <View
                  style={{ width: 64, height: 64 }}
                  className="rounded-full bg-[#1360C6] items-center justify-center"
                >
                  <Text className="text-white font-semibold" style={{ fontSize: 64 * 0.4 }}>
                    {`${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {editMode && (
                <View className="absolute bottom-0 right-0 bg-[#1360C6] rounded-2xl p-2">
                  <Pencil size={10} color="white" />
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-col  items-center md:items-start">
              <Text className="text-[1.3rem] font-[600] text-black mt-3 text-center">
                {trimText(form.firstName, 10)} {trimText(form.lastName, 10)}
              </Text>

              <View className="bg-green-100 px-3 py-1 rounded-[5px] w-16 mt-2 ">
                <Text className="text-green-600 text-xs font-medium text-center">
                  {getStatusBadge(form.role)}
                </Text>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <ChangePasswordButton userId={id} />
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => handleDiscardChanges()}
              className="flex-row items-center bg-[#fff] border-[2px] border-[#1360C6] px-4 py-2 rounded-md"
            >
              {/* <Pencil size={14} color="white" /> */}
              <Text className="text-[#1360C6] text-md font-[600]">
                {editMode ? "Cancel" : "Edit"}
              </Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* Form Section */}
        <View className="w-full md:pl-6">
          <View className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">

            {/* First Name */}
            <View className="col-span-1">
              <Text className="text-sm font-normal mb-2 text-gray-600">
                First Name <Text className="text-red-500">*</Text>
              </Text>
              {form.firstName ?
                <TextInput
                  className={` border rounded-lg px-3 py-2 text-black ${validationErrors.firstName
                    ? 'border-red-500 bg-red-50'
                    : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                    }`}
                  placeholder="First Name"
                  editable={editMode}
                  value={form.firstName}
                  onChangeText={handleFirstNameChange}
                /> : <Text className="border rounded-lg px-3 py-2 text-black border-gray-300 bg-gray-50">{form.firstName}</Text>
              }
              {validationErrors.firstName && (
                <Text className="text-red-500 text-xs mt-1">{validationErrors.firstName}</Text>
              )}
            </View>

            {/* Last Name */}
            <View className="col-span-1">
              <Text className="text-sm font-normal mb-2 text-gray-600">
                Last Name <Text className="text-red-500">*</Text>
              </Text>
              {form.lastName ?
                <TextInput
                  className={` border rounded-lg px-3 py-2 text-black ${validationErrors.lastName
                    ? 'border-red-500 bg-red-50'
                    : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                    }`}
                  placeholder="Last Name"
                  editable={editMode}
                  value={form.lastName}
                  onChangeText={handleLastNameChange}
                />
                : <Text className="border rounded-lg px-3 py-2 text-black border-gray-300 bg-gray-50">{form.lastName}</Text>}
              {validationErrors.lastName && (
                <Text className="text-red-500 text-xs mt-1">{validationErrors.lastName}</Text>
              )}
            </View>

            {/* Email ID */}
            <View className="col-span-1">
              <Text className="text-sm font-normal mb-2 text-gray-600">Email ID</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-black"
                editable={false}
                value={form.email}
              />
            </View>

            {/* Contact Number */}
            <View className="col-span-1">
              <Text className="text-sm font-normal mb-2 text-gray-600">Contact Number</Text>
              <TextInput
                className={`border rounded-lg px-3 py-2 text-black ${validationErrors.contactNumber
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
            <View className="col-span-1">
              <Text className="text-sm font-normal mb-2 text-gray-600">Role</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-black"
                editable={false}
                value={form.role ? form.role.charAt(0).toUpperCase() + form.role.slice(1) : ""}
              />
            </View>

            {/* Date of Birth */}
            <View className="col-span-1">
              <Text className="text-sm font-normal mb-2 text-gray-600">Date of Birth</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleWebDateChange}
                  disabled={!editMode}
                  className={`w-full px-3 py-1 rounded-lg border ${validationErrors.dateOfBirth
                    ? 'border-red-500 bg-red-50'
                    : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                    } text-base outline-none text-black`}
                />
              ) : (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => editMode && setShowDatePicker(true)}
                  className={`border rounded-lg px-3 py-2 ${validationErrors.dateOfBirth
                    ? 'border-red-500 bg-red-50'
                    : editMode ? 'border-gray-300 bg-white' : 'border-gray-300 bg-gray-50'
                    }`}
                  disabled={!editMode}
                >
                  <Text className={form.dateOfBirth ? "text-black" : "text-gray-400"}>
                    {form.dateOfBirth ? formatDate(form.dateOfBirth) : "Select Date of Birth"}
                  </Text>
                </TouchableOpacity>
              )}
              {validationErrors.dateOfBirth && (
                <Text className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</Text>
              )}
            </View>

          </View>

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
                disabled={saving}
                className={`bg-[#1360C6] px-4 py-2 rounded-lg flex-1 ${saving ? "opacity-70" : ""}`}
                onPress={handleSaveClick}
              >
                <Text className="text-white text-center font-medium">
                  {saving ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Native Date Picker for Mobile */}
        {showDatePicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
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
                <Text className="mb-6 text-gray-600">
                  Are you sure you want to save these changes to the employee profile?
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
                    disabled={saving}
                    className={`px-4 py-2 ${saving ? "opacity-70" : ""}`}
                  >
                    <Text className="text-[#1360C6] font-medium">
                      {saving ? "Saving..." : "Save"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
      <View >
        <EmpTaskList userId={userId} />
      </View>
    </ScrollView>
  );
}