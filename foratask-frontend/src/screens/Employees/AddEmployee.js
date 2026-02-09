import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Image,
  Platform,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Pencil, Eye, EyeOff, Plus, AlertCircle, ChevronDown, ChevronLeft } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../../utils/api";
import { useQueryClient } from "@tanstack/react-query";

const CustomDropdown = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error = null,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue)
    setIsOpen(false)
  }

  return (
    <View className="">
      <Text className="text-sm font-normal text-[#696969] mb-1">
        {label}  <Text className="text-red-500">*</Text>
      </Text>

      {/* Dropdown Button */}
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className={`h-11 sm:h-9 flex-row items-center justify-between border rounded-lg px-3 py-2 ${error ? "border-red-400 bg-red-50" : "border-gray-300 "
          }`}
      >
        <Text className={`flex-1 text-base ${selectedOption ? "text-gray-900" : "text-gray-500"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown
          size={16}
          color="#6B7280"
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }]
          }}
        />
      </Pressable>

      {/* Dropdown Content */}
      {isOpen && (
        <View className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60">
          <ScrollView nestedScrollEnabled={true}>
            {options.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => handleSelect(option.value)}
                className={`flex-row items-center p-3 border-b border-gray-50 ${value === option.value ? "bg-blue-50" : ""
                  }`}
                style={Platform.OS === "web" ? {
                  ':hover': {
                    backgroundColor: '#F9FAFB'
                  }
                } : {}}
              >
                <View className={`w-4 h-4 rounded-full border-2 mr-3 ${value === option.value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}>
                  {value === option.value && (
                    <View className="w-2 h-2 rounded-full bg-white m-auto" />
                  )}
                </View>
                <Text className={`flex-1 text-base ${value === option.value ? "text-blue-700 font-medium" : "text-gray-900"
                  }`}>
                  {option.label}
                </Text>
                {option.color && (
                  <View
                    className="w-3 h-3 rounded-full ml-2"
                    style={{ backgroundColor: option.color }}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>

          {/* Close Button */}
          <Pressable
            onPress={() => setIsOpen(false)}
            className="p-3 border-t border-gray-100 items-center "
          >
            <Text className="text-gray-600 font-medium">Close</Text>
          </Pressable>
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View className="flex-row items-center mt-2">
          <AlertCircle size={16} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}
    </View>
  )
}

// Screen dimensions for responsiveness
const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth > 768;

// 🔹 Format date from yyyy-mm-dd to dd-mm-yyyy
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};



export default function AddEmployee({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const roleOptions = ["employee", "supervisor"];
  const queryClient = useQueryClient();


  const getInitialFormState = () => ({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    contactNumber: "",
    dateOfBirth: "",
    gender: "",
    role: "",
    designation: "",
  });

  const getInitialAvatarState = () => ({
    uri: null,
    file: null,
    name: null,
    type: null,
  });

  const [form, setForm] = useState(getInitialFormState);
  const [avatar, setAvatar] = useState(getInitialAvatarState);

  const avatarSource = useMemo(
    () => (avatar.uri ? { uri: avatar.uri } : require("../../../assets/app_logo.png")),
    [avatar.uri]
  );

  // Clear specific field error when user starts typing
  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (backendError) {
      setBackendError("");
    }
  }, [errors, backendError]);

  const handlePickImage = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = (event) => {
          const file = event.target.files?.[0];
          if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              Alert.alert("Error", "Image size should not exceed 5MB");
              return;
            }
            // Validate file type
            if (!file.type.startsWith("image/")) {
              Alert.alert("Error", "Please select a valid image file");
              return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
              setAvatar({
                uri: e.target.result,
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

        if (!result.canceled && result.assets?.[0]) {
          const asset = result.assets[0];
          setAvatar({
            uri: asset.uri,
            file: null,
            name: asset.fileName || `avatar-${Date.now()}.jpg`,
            type: "image/jpeg",
          });
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  }, []);

  const handleDateChange = useCallback((event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toISOString().split("T")[0];
      setForm((prev) => ({ ...prev, dateOfBirth: formatted }));
      if (errors.dateOfBirth) {
        setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
      }
    }
  }, [errors]);

  const handleWebDateChange = useCallback((event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, dateOfBirth: value }));
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    const { firstName, lastName, email, password, contactNumber, dateOfBirth, gender } = form;

    // First Name validation
    if (!firstName || !firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(firstName.trim())) {
      newErrors.firstName = "First name should contain only letters";
    }

    // Last Name validation
    if (!lastName || !lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(lastName.trim())) {
      newErrors.lastName = "Last name should contain only letters";
    }

    // Email validation
    if (!email || !email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Password validation
    if (!password || !password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
    }

    // Contact Number validation (optional but if provided, validate)
    if (contactNumber) {
      const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10,14}$/;
      if (!phoneRegex.test(contactNumber)) {
        newErrors.contactNumber = "Please enter a valid contact number (10-15 digits)";
      }
    }

    // Date of Birth validation
    if (!dateOfBirth || !dateOfBirth.trim()) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (isNaN(dob.getTime())) {
        newErrors.dateOfBirth = "Please enter a valid date";
      } else if (dob > today) {
        newErrors.dateOfBirth = "Date of birth cannot be in the future";
      } else if (age < 18) {
        newErrors.dateOfBirth = "Employee must be at least 18 years old";
      } else if (age > 100) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
      }
    }

    // Gender validation
    if (!gender || !gender.trim()) {
      newErrors.gender = "Please select a gender";
    }

    // Role validation (optional but if provided, validate)
    if (form.role && form.role.trim() && !roleOptions.includes(form.role.trim())) {
      newErrors.role = "Please select a valid role";
    }

    // Designation validation (optional but if provided, validate)
    if (form.designation && form.designation.trim() && form.designation.trim().length < 2) {
      newErrors.designation = "Designation must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const addEmployee = async (formData, avatarData) => {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value || "");
    });

    if (avatarData?.uri) {
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
      const res = await api.post("add-employee", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      queryClient.invalidateQueries({
        queryKey: ["employees"]
      })
      return res.data;
    } catch (error) {
      console.error("Error adding employee:", error.response?.data || error.message);
      throw error;
    }
  };

  const handleAddEmployee = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      setBackendError("");

      // Trim all string values before sending
      const trimmedForm = Object.keys(form).reduce((acc, key) => {
        acc[key] = typeof form[key] === 'string' ? form[key].trim() : form[key];
        return acc;
      }, {});

      await addEmployee(trimmedForm, avatar);
      setShowConfirm(false);

      Alert.alert("Success", "Employee added successfully!", [
        {
          text: "OK",
          onPress: () => {
            setForm(getInitialFormState());
            setAvatar(getInitialAvatarState());
            setErrors({});
            setBackendError("");
            navigation?.goBack?.();
          },
        },
      ]);
      clearForm()
    } catch (err) {
      console.error("Add Employee Error:", err);

      let errorMessage = "Failed to add employee. Please try again.";

      // Handle different error types
      if (err.response) {
        // Backend returned an error response
        const backendMsg = err.response.data?.message || err.response.data?.error;

        if (backendMsg) {
          errorMessage = backendMsg;
        } else if (err.response.status === 400) {
          errorMessage = "Invalid data provided. Please check all fields.";
        } else if (err.response.status === 401) {
          errorMessage = "Unauthorized. Please log in again.";
        } else if (err.response.status === 403) {
          errorMessage = "You don't have permission to add employees.";
        } else if (err.response.status === 409) {
          errorMessage = "An employee with this email already exists.";
        } else if (err.response.status === 413) {
          errorMessage = "Image file is too large. Please choose a smaller image.";
        } else if (err.response.status === 422) {
          errorMessage = "Invalid data format. Please check all fields.";
        } else if (err.response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        // Handle field-specific errors from backend
        if (err.response.data?.errors && typeof err.response.data.errors === 'object') {
          const fieldErrors = {};
          Object.keys(err.response.data.errors).forEach(key => {
            fieldErrors[key] = Array.isArray(err.response.data.errors[key])
              ? err.response.data.errors[key][0]
              : err.response.data.errors[key];
          });
          setErrors(fieldErrors);
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Network error. Please check your internet connection.";
      } else if (err.message) {
        // Something else happened
        errorMessage = err.message;
      }

      setBackendError(errorMessage);
      setShowConfirm(false);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [form, avatar, validateForm, navigation]);

  const clearForm = useCallback(() => {
    setForm(getInitialFormState());
    setAvatar(getInitialAvatarState());
    setErrors({});
    setBackendError("");
  }, []);

  // Error display component
  const ErrorText = ({ error }) => {
    if (!error) return null;
    return (
      <View className="flex-row items-center mt-1">
        <AlertCircle size={14} color="#ef4444" />
        <Text className="text-red-500 text-xs ml-1">{error}</Text>
      </View>
    );
  };
  const keyboardBehavior = Platform.select({
    ios: 'padding',
    android: 'height',
    web: undefined
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        enabled={Platform.OS !== 'web'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          enableOnAndroid={true}
        >
          {/* Backend Error Banner */}
          <View className="p-4 bg-white">
            <View className="flex-row justify-between items-center mb-6">
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => navigation?.goBack()}
                className="flex-row items-center gap-1"
              >
                <ChevronLeft size={20} color="#000" />
                <Text className="text-base text-black">Back</Text>
              </TouchableOpacity>
            </View>
            {backendError && (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-start">
                <AlertCircle size={20} color="#ef4444" />
                <Text className="text-red-600 text-sm ml-2 flex-1">{backendError}</Text>
              </View>
            )}

            <View className={`${isTablet ? "flex-row" : "flex-col"} items-start`}>
              {/* Avatar Section */}
              <View className={`${isTablet ? "w-1/4" : "w-full"} items-center mb-6`}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePickImage}
                  className="relative"
                >
                  <Image
                    source={avatarSource}
                    style={{
                      width: 112,
                      height: 112,
                      borderRadius: 56,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                    }}
                  />
                  <View className="absolute bottom-0 right-0 bg-[#1360C6] rounded-[50%] p-2">
                    {avatar.uri ? <Pencil size={16} color="white" /> : <Plus size={16} color="white" />}
                  </View>
                </TouchableOpacity>
                <Text className="mt-3 text-lg font-bold text-black">
                  {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : "New Employee"}
                </Text>
                <Text className="mt-1 text-[#1360C6]">{form.email || "Enter email address"}</Text>
              </View>

              {/* Form Section */}
              <View className={`${isTablet ? "w-3/4 pl-6" : "w-full"}`}>
                <Text className="text-xl font-semibold mb-6">Add New Employee</Text>

                {/* Gender Toggle */}
                <View className="mb-4">
                  <View className="flex-row gap-4">
                    {["male", "female"].map((g) => (
                      <TouchableOpacity
                        activeOpacity={1}
                        key={g}
                        onPress={() => handleChange("gender", g)}
                        className={`px-4 py-2 rounded-lg border ${form.gender === g
                          ? "bg-[#1360C6] border-[#1360C6]"
                          : errors.gender
                            ? "bg-white border-red-500"
                            : "bg-white border-gray-300"
                          }`}
                      >
                        <Text className={`${form.gender === g ? "text-white" : "text-black"} font-medium`}>
                          {g.charAt(0).toUpperCase() + g.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <ErrorText error={errors.gender} />
                </View>

                {/* First & Last Name */}
                <View className={`${screenWidth > 480 ? "flex-row gap-2" : "flex-col"} mb-1`}>
                  <View className="flex-1 flex-col gap-1 mb-2">
                    <Text className="text-sm font-normal text-[#696969]">
                      First Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`border rounded-lg px-3 py-2 bg-white text-black ${errors.firstName ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="First Name"
                      value={form.firstName}
                      onChangeText={(t) => handleChange("firstName", t)}
                      maxLength={50}
                    />
                    <ErrorText error={errors.firstName} />
                  </View>
                  <View className="flex-1 flex-col gap-1 mb-2">
                    <Text className="text-sm font-normal text-[#696969]">
                      Last Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`border rounded-lg px-3 py-2 bg-white text-black ${errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="Last Name"
                      value={form.lastName}
                      onChangeText={(t) => handleChange("lastName", t)}
                      maxLength={50}
                    />
                    <ErrorText error={errors.lastName} />
                  </View>
                </View>

                {/* Email */}
                <View className="flex-col gap-1 mb-2">
                  <Text className="text-sm font-normal text-[#696969]">
                    Email ID <Text className="text-red-500">*</Text>
                  </Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 bg-white text-black ${errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Email ID"
                    value={form.email}
                    onChangeText={(t) => handleChange("email", t)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={100}
                  />
                  <ErrorText error={errors.email} />
                </View>

                {/* Password */}
                <View className="flex-col gap-1 mb-2">
                  <Text className="text-sm font-normal text-[#696969]">
                    Password <Text className="text-red-500">*</Text>
                  </Text>
                  <View className={`flex-row items-center border rounded-lg bg-white ${errors.password ? "border-red-500" : "border-gray-300"
                    }`}>
                    <TextInput
                      className="flex-1 px-3 py-2 text-black"
                      placeholder="Password (min 6 chars)"
                      secureTextEntry={!showPassword}
                      value={form.password}
                      onChangeText={(t) => handleChange("password", t)}
                      maxLength={50}
                    />
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowPassword(!showPassword)}
                      className="pr-3"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#9ca3af" />
                      ) : (
                        <Eye size={20} color="#9ca3af" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <ErrorText error={errors.password} />
                </View>

                {/* Date of Birth */}
                <View className="flex-col gap-1 mb-2">
                  <Text className="text-sm font-normal text-[#696969]">
                    Date of Birth <Text className="text-red-500">*</Text>
                  </Text>
                  {Platform.OS === "web" ? (
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleWebDateChange}
                      max={new Date().toISOString().split("T")[0]}
                      className={`w-full border rounded-lg px-3 py-2 bg-white text-gray-400 ${errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                        }`}
                    />
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowDatePicker(true)}
                      className={`border rounded-lg px-3 py-3 bg-white ${errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                        }`}
                    >
                      <Text className={`${form.dateOfBirth ? "text-black" : "text-gray-400"}`}>
                        {form.dateOfBirth
                          ? formatDateToDDMMYYYY(form.dateOfBirth)
                          : "Select Date of Birth"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <ErrorText error={errors.dateOfBirth} />
                </View>

                {/* Contact Number & Role */}
                <View className={`${screenWidth > 480 ? "flex-row gap-2" : "flex-col"} mb-1`}>
                  <View className="flex-1 flex-col gap-1 mb-2">
                    <Text className="text-sm font-normal text-[#696969]">Contact Number</Text>
                    <TextInput
                      className={`border rounded-lg px-3 py-2 bg-white text-black ${errors.contactNumber ? "border-red-500" : "border-gray-300"
                        }`}
                      placeholder="Contact Number"
                      value={form.contactNumber}
                      onChangeText={(t) => handleChange("contactNumber", t)}
                      keyboardType="phone-pad"
                      maxLength={15}
                    />
                    <ErrorText error={errors.contactNumber} />
                  </View>
                  <View className="flex-1 flex-col gap-1 mb-2">
                    <CustomDropdown
                      label="Role"
                      value={form.role}
                      onValueChange={(value) => handleChange("role", value)}
                      options={
                        [
                          { label: "Employee", value: "employee" },
                          { label: "Supervisor", value: "supervisor" }
                        ]
                      }
                      placeholder="Select"
                      error={errors.role}
                      required={false}
                    />

                  </View>
                </View>

                {/* Designation */}
                <View className="flex-col gap-1 mb-6">
                  <Text className="text-sm font-normal text-[#696969]">Designation</Text>
                  <TextInput
                    className={`border rounded-lg px-3 py-2 bg-white text-black ${errors.designation ? "border-red-500" : "border-gray-300"
                      }`}
                    placeholder="Designation"
                    value={form.designation}
                    onChangeText={(t) => handleChange("designation", t)}
                    maxLength={50}
                  />
                  <ErrorText error={errors.designation} />
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="flex-1 border border-gray-400 py-2 rounded-lg"
                    onPress={clearForm}
                    disabled={loading}
                  >
                    <Text className="text-center text-black">Clear Form</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    disabled={loading}
                    className={`flex-1 py-2 rounded-lg ${loading ? "bg-[#1360C6]/70" : "bg-[#1360C6]"}`}
                    onPress={() => setShowConfirm(true)}
                  >
                    <Text className="text-center text-white font-medium">
                      {loading ? "Adding..." : "Add Employee"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Date Picker Mobile */}
          {showDatePicker && Platform.OS !== "web" && (
            <DateTimePicker
              value={form.dateOfBirth ? new Date(form.dateOfBirth) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}



          {/* Confirm Modal */}
          {showConfirm && (
            <Modal transparent animationType="fade" visible>
              <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white p-6 rounded-lg w-80 max-w-[90%]">
                  <Text className="text-lg font-semibold mb-4 text-black">Add Employee</Text>
                  <Text className="text-gray-600 mb-6">
                    Are you sure you want to add this employee?
                  </Text>
                  <View className="flex-row justify-end space-x-4">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setShowConfirm(false)}
                      disabled={loading}
                      className="mr-4"
                    >
                      <Text className="text-black">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      disabled={loading}
                      onPress={handleAddEmployee}
                    >
                      <Text className="text-[#1360C6] font-medium">
                        {loading ? "Adding..." : "Add"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

  );
}