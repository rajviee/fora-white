// components/EditTask.js
import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Platform, ScrollView, TouchableOpacity, ToastAndroid, Modal, KeyboardAvoidingView, Linking } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import api from "../../../utils/api";
import { Calendar, Clock, Trash2, Upload, AlertCircle, ChevronDown, X, Plus, Download, ChevronLeft } from "lucide-react-native";
import { useToast } from "../../../components/Toast";
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "../../../components/Avatar";
import { useNavigation } from "@react-navigation/native"

const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "#D83939CC";
    case "In Progress":
      return "#FFC83BCC";
    case "Completed":
      return "#3A974CCC";
    case "Overdue":
      return "#103362CC";
    case "For Approval":
      return "#897DCDCC";
    default:
      return "#000000"; // fallback
  }
};

const CustomDropdown = ({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  error = null,
  required = false,
  isStatusDropdown = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue);
    setIsOpen(false);
  };

  const handleOpen = () => {
    if (Platform.OS === 'web') {
      if (buttonRef.current) {
        buttonRef.current.measureInWindow((x, y, width, height) => {
          setDropdownPosition({ top: y + height + 8, left: x, width });
          setIsOpen(true);
        });
      }
    } else {
      setIsOpen(true);
    }
  };

  // Get status styling
  const getStatusStyle = () => {
    if (!isStatusDropdown || !selectedOption) return null;

    switch (selectedOption.value) {
      case "Overdue":
        return { bg: "bg-[#103362CC]", text: "text-white", chevron: "#fff" };
      case "For Approval":
        return { bg: "bg-[#897DCDCC]", text: "text-white", chevron: "#fff" };
      case "Pending":
        return { bg: "bg-[#D83939CC]", text: "text-white", chevron: "#fff" };
      case "In Progress":
        return { bg: "bg-[#FFC83BCC]", text: "text-white", chevron: "#fff" };
      case "Completed":
        return { bg: "bg-[#3A974CCC]", text: "text-white", chevron: "#fff" };
      default:
        return { bg: "bg-white", text: "text-gray-900", chevron: "#6B7280" };
    }
  };

  const statusStyle = getStatusStyle();

  return (
    <View className={label ? "mb-4" : "mb-0"}>
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {label} {required && "*"}
        </Text>
      )}

      <Pressable
        ref={buttonRef}
        onPress={handleOpen}
        className={`h-23 flex-row items-center justify-between rounded-lg px-4 ${label ? "py-3" : "py-2"} ${isStatusDropdown && statusStyle
          ? statusStyle.bg
          : error
            ? "border-red-400 bg-red-50"
            : "border border-gray-300 bg-white"
          }`}
      >
        <Text className={`flex-1 text-base font-medium ${isStatusDropdown && statusStyle
          ? statusStyle.text
          : selectedOption
            ? "text-gray-900"
            : "text-gray-500"
          }`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown
          size={20}
          color={isStatusDropdown && statusStyle ? statusStyle.chevron : "#6B7280"}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {error && (
        <View className="flex-row items-center mt-2">
          <AlertCircle size={16} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          onPress={() => setIsOpen(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
            alignItems: Platform.OS === 'web' ? 'flex-start' : 'center'
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              {
                backgroundColor: 'white',
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                maxHeight: 380,
                ...(Platform.OS === 'web' ? {
                  position: 'absolute',
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                } : {
                  width: '90%',
                  maxWidth: 400,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 10
                })
              }
            ]}
          >
            {Platform.OS !== 'web' && (
              <View className="p-4 border-b border-gray-200">
                <Text className="text-base font-semibold text-gray-900">{label || placeholder}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: Platform.OS === 'web' ? 200 : 300 }}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  className={`flex-row items-center p-3 rounded-lg border-b border-gray-50 ${value === option.value ? "bg-blue-50" : ""}`}
                >
                  <View className={`w-4 h-4 rounded-full border-2 mr-3 ${value === option.value ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                    {value === option.value && (
                      <View className="w-2 h-2 rounded-full bg-white m-auto" />
                    )}
                  </View>
                  <Text className={`flex-1 text-base ${value === option.value ? "text-blue-700 font-medium" : "text-gray-900"}`}>
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

            <Pressable
              onPress={() => setIsOpen(false)}
              className="p-2 border-t rounded-lg border-gray-100 items-center bg-white"
            >
              <Text className="text-gray-600 font-medium">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const formatDateForDisplay = (date) => {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatTimeForDisplay = (date) => {
  if (!date) return "";
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('en-US', {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};

const UserSelector = ({ selectedUsers, onUsersChange, placeholder, error, type }) => {
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/me/usersList");
      if (response.data && Array.isArray(response.data)) {
        setAvailableUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    const notSelected = !selectedUsers.find(selected => selected._id === user._id);
    return matchesSearch && notSelected;
  });

  const handleUserSelect = (user) => {
    if (!selectedUsers.find(selected => selected._id === user._id)) {
      onUsersChange([...selectedUsers, user]);
    }
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleUserRemove = (userId) => {
    onUsersChange(selectedUsers.filter(user => user._id !== userId));
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        {placeholder} {type === "doer" ? "*" : ""}
      </Text>

      <Pressable
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex-row items-center justify-between border rounded-lg ${selectedUsers.length === 0 ? "px-4 py-3" : "px-2 py-2"} ${error ? "border-red-400 bg-red-50" : "border-gray-300 gap-1"}`}
      >
        {selectedUsers.length === 0 && (
          <View className="flex-row items-center flex-1">
            <Plus size={18} color="#6B7280" />
            <Text className="ml-2 text-gray-600 text-base">
              Add {type === "doer" ? "Doer" : "Viewer"}
            </Text>
          </View>
        )}
        <View className="flex-1">
          {selectedUsers.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <View
                  key={user._id}
                  className="flex-row items-center rounded-lg px-2 py-2 border border-black"
                >
                  <Avatar employee={user} size={25} />
                  <Text className="text-[#495057] text-sm font-medium ml-2">
                    {user.firstName} {user.lastName}
                  </Text>
                  <Pressable
                    onPress={() => handleUserRemove(user._id)}
                    className="ml-1"
                  >
                    <X size={14} color="#1C1B1F" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
        <ChevronDown
          size={18}
          color="#6B7280"
          style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}
        />
      </Pressable>

      {isDropdownOpen && (
        <View className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60">
          <View className="p-3 border-b border-gray-100">
            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <ScrollView className="max-h-48" nestedScrollEnabled={true}>
            {loading ? (
              <View className="p-4 items-center">
                <Text className="text-gray-500">Loading users...</Text>
              </View>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Pressable
                  key={user._id}
                  onPress={() => handleUserSelect(user)}
                  className="flex-row items-center p-3 border-b border-gray-50"
                >
                  <Avatar employee={user} size={25} />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-medium text-base">
                      {user.firstName} {user.lastName}
                    </Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <View className="p-4 items-center">
                <Text className="text-gray-500">
                  {searchTerm ? "No users found" : "No available users"}
                </Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={() => {
              setIsDropdownOpen(false);
              setSearchTerm("");
            }}
            className="p-3 border-t border-gray-100 items-center"
          >
            <Text className="text-gray-600 font-medium">Close</Text>
          </Pressable>
        </View>
      )}

      {error && (
        <View className="flex-row items-center mt-2">
          <AlertCircle size={16} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}
    </View>
  );
};

const WebDateTimeInput = ({ value, onChange, mode, placeholder, error, className }) => {
  if (Platform.OS !== "web") return null;

  const formatValueForInput = () => {
    if (!value) return "";
    const localDate = value instanceof Date ? value : new Date(value);

    if (mode === "date") {
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (mode === "time") {
      const hours = localDate.getHours().toString().padStart(2, '0');
      const minutes = localDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    if (mode === "datetime-local") {
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const hours = localDate.getHours().toString().padStart(2, '0');
      const minutes = localDate.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    return "";
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    if (!inputValue) return;

    let newDate;

    if (mode === "date") {
      const [year, month, day] = inputValue.split('-').map(Number);
      newDate = new Date(year, month - 1, day);
    } else if (mode === "time") {
      const [hours, minutes] = inputValue.split(":").map(Number);
      newDate = new Date();
      newDate.setHours(hours, minutes, 0, 0);
    } else if (mode === "datetime-local") {
      const [datePart, timePart] = inputValue.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = timePart.split(':').map(Number);
      newDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    if (newDate && !isNaN(newDate.getTime())) {
      onChange(null, newDate);
    }
  };

  return (
    <div className="relative flex-1">
      <input
        type={mode}
        value={formatValueForInput()}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500 bg-red-50" : "border-gray-300"} ${className}`}
      />
    </div>
  );
};

const WebFileDropzone = ({ onFilesAdded }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  if (Platform.OS !== "web") return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    onFilesAdded(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    onFilesAdded(selectedFiles);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
      onClick={() => document.getElementById("file-input-edit").click()}
    >
      <input id="file-input-edit" type="file" multiple className="hidden" onChange={handleFileSelect} />
      <Upload className="mx-auto mb-2 text-gray-400" size={24} />
      <p className="text-gray-500 text-sm">
        {isDragOver ? "Drop files here..." : "Drag & drop files here, or click to browse"}
      </p>
    </div>
  );
};

export default function EditTask({ task, onCancel, onSaveSuccess, isDoerOnly = false }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigation = useNavigation()

  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [selectedDoers, setSelectedDoers] = useState(task.assignees || []);
  const [selectedViewers, setSelectedViewers] = useState(task.observers || []);
  const [dueDate, setDueDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dueTime, setDueTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Reminder - Now includes both date and time
  const [reminder, setReminder] = useState(null);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  const [priority, setPriority] = useState(task.priority || "Medium");
  const [taskType, setTaskType] = useState(task.taskType || "Single");
  const [recurringSchedule, setRecurringSchedule] = useState(task.recurringSchedule || null);
  const [repeatReminder, setRepeatReminder] = useState(task.repeatReminder || '10m');
  const [isManualReminder, setIsManualReminder] = useState(false); // Track if user manually set reminder
  const [allowReminder, setAllowReminder] = useState([
    { label: "10m", value: "10m" },
    { label: "30m", value: "30m" },
    { label: "1h", value: "1h" },
    { label: "1d", value: "1d" },
    { label: "1w", value: "1w" },
  ]);

  const [files, setFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState(task.documents || []);
  const [documentsToDelete, setDocumentsToDelete] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(task.status || "Pending");

  // Helper function to calculate reminder based on repeatReminder
  const calculateReminderFromRepeat = (dueDateTime, repeatValue) => {
    if (!dueDateTime || !repeatValue) return null;

    const dueTime = new Date(dueDateTime);
    let reminderTime = new Date(dueTime);

    switch (repeatValue) {
      case '10m':
        reminderTime.setMinutes(reminderTime.getMinutes() - 10);
        break;
      case '30m':
        reminderTime.setMinutes(reminderTime.getMinutes() - 30);
        break;
      case '1h':
        reminderTime.setHours(reminderTime.getHours() - 1);
        break;
      case '1d':
        reminderTime.setDate(reminderTime.getDate() - 1);
        break;
      case '1w':
        reminderTime.setDate(reminderTime.getDate() - 7);
        break;
      default:
        return null;
    }

    return reminderTime;
  };

  // Helper function to calculate repeatReminder based on manual reminder input
  const calculateRepeatFromReminder = (reminderDateTime, dueDateTime) => {
    if (!reminderDateTime || !dueDateTime) return null;

    const timeDiffMs = new Date(dueDateTime) - new Date(reminderDateTime);

    if (timeDiffMs <= 0) return null; // Invalid: reminder is after due date

    const timeDiffMinutes = Math.floor(timeDiffMs / (1000 * 60));
    const timeDiffHours = Math.floor(timeDiffMs / (1000 * 60 * 60));
    const timeDiffDays = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24));

    // Match to closest repeat interval with tolerance
    if (Math.abs(timeDiffMinutes - 10) <= 1) return '10m';
    if (Math.abs(timeDiffMinutes - 30) <= 1) return '30m';
    if (Math.abs(timeDiffHours - 1) <= 0.02) return '1h';
    if (Math.abs(timeDiffDays - 1) <= 0.02) return '1d';
    if (Math.abs(timeDiffDays - 7) <= 0.1) return '1w';

    return null; // No match - will show dash
  };

  useEffect(() => {
    if (task.dueDateTime) {
      const dueDateTime = new Date(task.dueDateTime);
      setDueDate(new Date(dueDateTime.getFullYear(), dueDateTime.getMonth(), dueDateTime.getDate()));
      setDueTime(dueDateTime);
    }

    if (task.reminder) {
      setReminder(new Date(task.reminder));
      setIsManualReminder(false); // Initialize as auto-calculated
    }
  }, [task]);

  // Update allowed reminder options based on due date/time
  useEffect(() => {
    if (!dueDate || !dueTime) {
      setAllowReminder([
        { label: "10m", value: "10m" },
        { label: "30m", value: "30m" },
        { label: "1h", value: "1h" },
        { label: "1d", value: "1d" },
        { label: "1w", value: "1w" },
      ]);
      return;
    }

    const dueDateTime = new Date(dueDate);
    const timeObj = new Date(dueTime);
    dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

    const now = new Date();
    const timeDiffMs = dueDateTime - now;

    const timeDiffMinutes = timeDiffMs / (1000 * 60);
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);

    const validReminders = [];

    if (timeDiffMinutes >= 10) validReminders.push({ label: "10m", value: "10m" });
    if (timeDiffMinutes >= 30) validReminders.push({ label: "30m", value: "30m" });
    if (timeDiffHours >= 1) validReminders.push({ label: "1h", value: "1h" });
    if (timeDiffDays >= 1) validReminders.push({ label: "1d", value: "1d" });
    if (timeDiffDays >= 7) validReminders.push({ label: "1w", value: "1w" });

    setAllowReminder(validReminders);

    // Auto-calculate reminder if not manually set
    if (!isManualReminder) {
      const newReminder = calculateReminderFromRepeat(dueDateTime, repeatReminder);
      if (newReminder) {
        setReminder(newReminder);
      }
    }
  }, [dueDate, dueTime, repeatReminder, isManualReminder]);

  // Handle repeatReminder change - updates reminder automatically
  const handleRepeatReminderChange = (value) => {
    setRepeatReminder(value);
    setIsManualReminder(false);

    if (dueDate && dueTime) {
      const dueDateTime = new Date(dueDate);
      const timeObj = new Date(dueTime);
      dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

      const newReminder = calculateReminderFromRepeat(dueDateTime, value);
      if (newReminder) {
        setReminder(newReminder);
        setErrors({ ...errors, reminder: null });
      }
    }
  };

  // Handle manual reminder change - adjusts repeatReminder or sets to dash
const handleReminderChange = (event, selectedDateTime, type) => {
  if (Platform.OS === "android") {
    setShowReminderDatePicker(false);
    setShowReminderTimePicker(false);
  }

  if (!selectedDateTime) return;

  let newReminder = new Date(reminder || new Date());

  if (type === "date") {
    // Update date part
    newReminder.setFullYear(selectedDateTime.getFullYear());
    newReminder.setMonth(selectedDateTime.getMonth());
    newReminder.setDate(selectedDateTime.getDate());
  } else if (type === "time") {
    // Update time part
    newReminder.setHours(selectedDateTime.getHours());
    newReminder.setMinutes(selectedDateTime.getMinutes());
    newReminder.setSeconds(0);
    newReminder.setMilliseconds(0);
  } else if (type === "datetime") {
    // Update both date and time (for web)
    // selectedDateTime is already a Date object from WebDateTimeInput
    newReminder = selectedDateTime;
  }

  // Validate against due date/time
  if (dueDate && dueTime) {
    const dueDateTime = new Date(dueDate);
    const timeObj = new Date(dueTime);
    dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

    if (newReminder >= dueDateTime) {
      setErrors({ ...errors, reminder: "Reminder must be before due date/time" });
      toast.error("Reminder must be before due date/time");
      return;
    }

    if (newReminder < new Date()) {
      setErrors({ ...errors, reminder: "Reminder cannot be in the past" });
      toast.error("Reminder cannot be in the past");
      return;
    }
  }

  setReminder(newReminder);
  setIsManualReminder(true); // Mark as manually set
  setErrors({ ...errors, reminder: null });

  // Try to match to a repeat interval
  if (dueDate && dueTime) {
    const dueDateTime = new Date(dueDate);
    const timeObj = new Date(dueTime);
    dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

    const matchedRepeat = calculateRepeatFromReminder(newReminder, dueDateTime);
    if (matchedRepeat) {
      setRepeatReminder(matchedRepeat);
    } else {
      setRepeatReminder('-'); // Set to dash if no match
    }
  }
};

  const pickFileMobile = async () => {
    try {
      const totalDocs = existingDocuments.length + files.length;
      if (totalDocs >= 3) {
        toast.warning("Maximum 3 documents allowed");
        return;
      }

      if (!DocumentPicker.getDocumentAsync) {
        toast.error("File picker is not available on this device");
        return;
      }

      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const remainingSlots = 3 - totalDocs;
        const validFiles = [];
        for (const asset of res.assets.slice(0, remainingSlots)) {
          if (asset.name && asset.uri) {
            if (asset.size && asset.size > 10 * 1024 * 1024) continue;
            validFiles.push({
              name: asset.name,
              uri: asset.uri,
              size: asset.size || 0,
              mimeType: asset.mimeType || "application/octet-stream",
              type: asset.mimeType || "application/octet-stream",
            });
          }
        }
        if (validFiles.length > 0) {
          setFiles([...files, ...validFiles]);
          toast.success(`${validFiles.length} file(s) selected`);
        }
      }
    } catch (error) {
      toast.error("Failed to pick file");
    }
  };

  const handleWebFiles = (newFiles) => {
    const totalDocs = existingDocuments.length + files.length;
    if (totalDocs >= 3) {
      toast.warning("Maximum 3 documents allowed");
      return;
    }

    const remainingSlots = 3 - totalDocs;
    const validFiles = [];
    for (const file of Array.from(newFiles).slice(0, remainingSlots)) {
      if (file.size > 10 * 1024 * 1024) continue;
      validFiles.push({
        name: file.name,
        size: file.size,
        type: file.type,
        uri: URL.createObjectURL(file),
        file: file,
      });
    }
    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles]);
      toast.success(`${validFiles.length} file(s) added`);
    }
  };

  const removeFile = (index) => {
    const fileToRemove = files[index];
    if (Platform.OS === "web" && fileToRemove?.uri?.startsWith("blob:")) {
      URL.revokeObjectURL(fileToRemove.uri);
    }
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDeleteExistingDocument = (docId) => {
    setExistingDocuments(existingDocuments.filter(doc => doc._id !== docId));
    setDocumentsToDelete([...documentsToDelete, docId]);
    toast.success("Document marked for deletion");
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }

    if (selectedDate) {
      let newDate = new Date(selectedDate);
      if (type === "date") {
        newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      }

      switch (type) {
        case "date":
          setDueDate(newDate);
          setErrors({ ...errors, dueDate: null });
          break;
        case "time":
          setDueTime(newDate);
          setErrors({ ...errors, dueTime: null });
          break;
      }
    }
  };

  const validateForm = () => {
    if (isDoerOnly) return true;

    const newErrors = {};
    if (!title.trim()) newErrors.title = "Task title is required";
    if (selectedDoers.length === 0) newErrors.doers = "At least one doer must be selected";
    if (!priority) newErrors.priority = "Priority must be selected";
    if (!taskType) newErrors.taskType = "Task type must be selected";
    if (taskType === "Recurring" && !recurringSchedule) newErrors.recurringSchedule = "Recurring schedule must be selected";

    // Validate reminder is before due date/time
    if (reminder && dueDate && dueTime) {
      const dueDateTime = new Date(dueDate);
      const timeObj = new Date(dueTime);
      dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

      if (reminder >= dueDateTime) {
        newErrors.reminder = "Reminder must be before due date/time";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.warning(Object.values(newErrors)[0]);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const formData = new FormData();

      if (isDoerOnly) {
        if (task.status !== status) {
          formData.append("status", status);
        }

        if (documentsToDelete.length > 0) {
          documentsToDelete.forEach((docId, idx) => {
            formData.append(`documentsToDelete[${idx}]`, docId);
          });
        }

        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          if (Platform.OS === "web" && file.file) {
            formData.append("file", file.file);
          } else if (Platform.OS !== "web" && file.uri) {
            formData.append("file", {
              uri: file.uri,
              name: file.name || `file_${index}`,
              type: file.mimeType || file.type || "application/octet-stream",
            });
          }
        }
      } else {
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("priority", priority);
        formData.append("taskType", taskType);
        if (task.status !== status) {
          formData.append("status", status);
        }

        if (taskType === "Recurring" && recurringSchedule) {
          formData.append("recurringSchedule", recurringSchedule);
        }

        if (dueDate && dueTime) {
          const combinedDateTime = new Date(
            dueDate.getFullYear(),
            dueDate.getMonth(),
            dueDate.getDate(),
            dueTime.getHours(),
            dueTime.getMinutes(),
            0,
            0
          );
          formData.append("dueDateTime", combinedDateTime.toISOString());
        }

        // Only send reminder if repeatReminder is not dash
        if (reminder && repeatReminder !== '-') {
          formData.append("reminder", reminder.toISOString());
        }

        if (repeatReminder && repeatReminder !== '-') {
          formData.append("repeatReminder", repeatReminder);
        }

        selectedDoers.forEach((val, idx) => {
          formData.append(`assignees[${idx}]`, val._id);
        });
        selectedViewers.forEach((val, idx) => {
          formData.append(`observers[${idx}]`, val._id);
        });

        if (documentsToDelete.length > 0) {
          documentsToDelete.forEach((docId, idx) => {
            formData.append(`documentsToDelete[${idx}]`, docId);
          });
        }

        for (let index = 0; index < files.length; index++) {
          const file = files[index];
          if (Platform.OS === "web" && file.file) {
            formData.append("file", file.file);
          } else if (Platform.OS !== "web" && file.uri) {
            formData.append("file", {
              uri: file.uri,
              name: file.name || `file_${index}`,
              type: file.mimeType || file.type || "application/octet-stream",
            });
          }
        }
      }

      const response = await api.patch(`/task/edit/${task._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200 || response.status === 201) {
        if (Platform.OS === "android") {
          ToastAndroid.show("Task updated successfully!", ToastAndroid.SHORT);
        } else {
          toast.success("Task updated successfully!");
        }

        queryClient.invalidateQueries({ queryKey: ["getTaskList"] });
        queryClient.invalidateQueries({ queryKey: ["todaysTasks"] });

        onSaveSuccess();
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isDateTimeCrossed = (dueDateTime) => {
    if (!dueDateTime) return false;
    const due = new Date(dueDateTime).getTime();
    const now = Date.now();
    return now > due;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFB]">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height', web: undefined })}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 p-4"
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
          <Text className="text-[1.8rem] font-[600] text-[#495057] pb-3">Edit Task</Text>
          <View className="p-3 bg-white border-2 border-[#EAEAEA] rounded-[6px]">
            {/* Status Dropdown */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Update Status</Text>
              <View className="w-48">
                <CustomDropdown
                  value={status}
                  onValueChange={setStatus}
                  options={
                    isDoerOnly
                      ? [
                        { label: task.status, value: task.status, color: getStatusColor(task.status) },
                        { label: "In Progress", value: "In Progress", color: "#E9AE15" },
                        { label: "Complete", value: "Completed", color: "#3A974C" },
                      ]
                      : [
                        { label: task.status, value: task.status, color: getStatusColor(task.status) },
                        ...(task.status === "For Approval"
                          ? [
                            isDateTimeCrossed(task.dueDateTime)
                              ? { label: "Overdue", value: "Overdue", color: "#1360C6" }
                              : { label: "Pending", value: "Pending", color: "#D83939" },
                          ]
                          : []),
                        { label: "Complete", value: "Completed", color: "#3A974C" },
                      ]
                  }
                  placeholder="Select Status"
                  error={null}
                  required={false}
                  isStatusDropdown={true}
                />
              </View>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Task Name *</Text>
              <TextInput
                placeholder="Enter task title"
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) setErrors({ ...errors, title: null });
                }}
                editable={!isDoerOnly}
                className={`border rounded-lg px-4 py-3 text-gray-900 text-base ${isDoerOnly ? "bg-gray-100" : ""} ${errors.title ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                placeholderTextColor="#9CA3AF"
              />
              {errors.title && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={16} color="#EF4444" />
                  <Text className="text-red-500 text-sm ml-2">{errors.title}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
              <TextInput
                placeholder="Enter task description"
                value={description}
                onChangeText={setDescription}
                editable={!isDoerOnly}
                className={`border border-gray-300 rounded-lg px-4 py-3 text-gray-900 min-h-[80px] text-base ${isDoerOnly ? "bg-gray-100" : ""}`}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
              />
            </View>

            {/* User Selectors */}
            {!isDoerOnly ? (
              <>
                <UserSelector
                  selectedUsers={selectedDoers}
                  onUsersChange={(users) => {
                    setSelectedDoers(users);
                    if (errors.doers) setErrors({ ...errors, doers: null });
                  }}
                  placeholder="Doers"
                  error={errors.doers}
                  type="doer"
                />

                <UserSelector
                  selectedUsers={selectedViewers}
                  onUsersChange={setSelectedViewers}
                  placeholder="Viewers"
                  error={errors.viewers}
                  type="viewer"
                />
              </>
            ) : (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Doers</Text>
                  <View className="flex-row flex-wrap gap-2 border border-gray-300 rounded-lg p-3 bg-gray-100">
                    {selectedDoers.map((user) => (
                      <View
                        key={user._id}
                        className="flex-row items-center rounded-lg px-2 py-2 border border-black bg-white"
                      >
                        <Avatar employee={user} size={25} />
                        <Text className="text-[#495057] text-sm font-medium ml-2">
                          {user.firstName} {user.lastName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Viewers</Text>
                  <View className="flex-row flex-wrap gap-2 border border-gray-300 rounded-lg p-3 bg-gray-100">
                    {selectedViewers.map((user) => (
                      <View
                        key={user._id}
                        className="flex-row items-center rounded-lg px-2 py-2 border border-black bg-white"
                      >
                        <Avatar employee={user} size={25} />
                        <Text className="text-[#495057] text-sm font-medium ml-2">
                          {user.firstName} {user.lastName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Date/Time and other fields */}
            {!isDoerOnly ? (
              <>
                {/* Due Date & Time Row */}
                <View className="mb-4">
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Due Date *</Text>
                      {Platform.OS === "web" ? (
                        <WebDateTimeInput
                          value={dueDate}
                          onChange={(event, date) => handleDateChange(event, date, "date")}
                          mode="date"
                          placeholder="Select due date"
                          error={errors.dueDate}
                        />
                      ) : (
                        <Pressable
                          onPress={() => setShowDatePicker(true)}
                          className={`flex-row items-center border rounded-lg px-4 py-3 ${errors.dueDate ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                        >
                          <Calendar size={18} color="#6B7280" />
                          <Text className="ml-2 text-gray-900 flex-1 text-sm">
                            {dueDate ? formatDateForDisplay(dueDate) : "Select due date"}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-700 mb-2">Due Time *</Text>
                      {Platform.OS === "web" ? (
                        <WebDateTimeInput
                          value={dueTime}
                          onChange={(event, date) => handleDateChange(event, date, "time")}
                          mode="time"
                          placeholder="Select due time"
                          error={errors.dueTime}
                        />
                      ) : (
                        <Pressable
                          onPress={() => setShowTimePicker(true)}
                          className={`flex-row items-center border rounded-lg px-4 py-3 ${errors.dueTime ? "border-red-400 bg-red-50" : "border-gray-300"}`}
                        >
                          <Clock size={18} color="#6B7280" />
                          <Text className="ml-2 text-gray-900 flex-1 text-sm">
                            {dueTime ? formatTimeForDisplay(dueTime) : "Select due time"}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>

                {/* Priority & Type Row */}
                <View className="mb-4">
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <CustomDropdown
                        label="Priority"
                        value={priority}
                        onValueChange={(value) => {
                          setPriority(value);
                          if (errors.priority) setErrors({ ...errors, priority: null });
                        }}
                        options={[
                          { label: "High", value: "High", color: "#DC2626" },
                          { label: "Medium", value: "Medium", color: "#EA580C" },
                          { label: "Low", value: "Low", color: "#16A34A" },
                        ]}
                        placeholder="Select Priority"
                        error={errors.priority}
                        required={true}
                      />
                    </View>

                    <View className="flex-1">
                      <CustomDropdown
                        label="Type"
                        value={taskType}
                        onValueChange={(value) => {
                          setTaskType(value);
                          if (errors.taskType) setErrors({ ...errors, taskType: null });
                        }}
                        options={[
                          { label: "Single", value: "Single" },
                          { label: "Recurring", value: "Recurring" }
                        ]}
                        placeholder="Select TaskType"
                        error={errors.taskType}
                        required={true}
                      />
                    </View>
                  </View>
                </View>

                {/* Recurring Schedule */}
                {taskType === "Recurring" && (
                  <CustomDropdown
                    label="Recurring Schedule"
                    value={recurringSchedule}
                    onValueChange={(value) => {
                      setRecurringSchedule(value);
                      if (errors.recurringSchedule) setErrors({ ...errors, recurringSchedule: null });
                    }}
                    options={[
                      { label: "Daily", value: "Daily" },
                      { label: "Weekly", value: "Weekly" },
                      { label: "Monthly", value: "Monthly" },
                      { label: "Quarterly", value: "3-Months" },
                    ]}
                    placeholder="Select Schedule"
                    error={errors.recurringSchedule}
                    required={true}
                  />
                )}

                {/* Reminder - Now with Date and Time */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Reminder *</Text>

                  {Platform.OS === "web" ? (
                    <View className={`w-full flex-row items-center border p-2 rounded-lg bg-white gap-2 ${errors.reminder ? "border-red-400 bg-red-50" : "border-gray-300"}`}>
                      <View className="flex-1">
                        <WebDateTimeInput
                          value={reminder}
                          onChange={(event, date) => handleReminderChange(event, date, "datetime")}
                          mode="datetime-local"
                          placeholder="Select reminder date & time"
                          error={null}
                          className="border-none"
                        />
                      </View>

                      <View className="w-24">
                        <CustomDropdown
                          value={repeatReminder}
                          onValueChange={handleRepeatReminderChange}
                          options={[
                            { label: "—", value: "-" },
                            ...allowReminder
                          ]}
                          placeholder="10m"
                          error={null}
                          required={false}
                        />
                      </View>
                    </View>
                  ) : (
                    <View>
                      <View className="flex-row gap-2 mb-2">
                        <Pressable
                          onPress={() => setShowReminderDatePicker(true)}
                          className={`flex-1 flex-row items-center border rounded-lg px-3 py-3 ${errors.reminder ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                        >
                          <Calendar size={16} color="#6B7280" />
                          <Text className="ml-2 text-gray-900 text-sm flex-1">
                            {reminder ? formatDateForDisplay(reminder) : "Select date"}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => setShowReminderTimePicker(true)}
                          className={`flex-1 flex-row items-center border rounded-lg px-3 py-3 ${errors.reminder ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
                        >
                          <Clock size={16} color="#6B7280" />
                          <Text className="ml-2 text-gray-900 text-sm flex-1">
                            {reminder ? formatTimeForDisplay(reminder) : "Select time"}
                          </Text>
                        </Pressable>
                      </View>

                      <View className="w-full">
                        <CustomDropdown
                          label="Repeat Before Due"
                          value={repeatReminder}
                          onValueChange={handleRepeatReminderChange}
                          options={[
                            { label: "—", value: "-" },
                            ...allowReminder
                          ]}
                          placeholder="Select interval"
                          error={null}
                          required={false}
                        />
                      </View>
                    </View>
                  )}

                  {errors.reminder && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={14} color="#EF4444" />
                      <Text className="text-red-500 text-sm ml-2">{errors.reminder}</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Due Date & Time</Text>
                  <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-100">
                    <Text className="text-gray-900">
                      {dueDate && dueTime
                        ? `${formatDateForDisplay(dueDate)} at ${formatTimeForDisplay(dueTime)}`
                        : "No deadline set"}
                    </Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Priority</Text>
                  <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-100">
                    <Text className="text-gray-900">{priority}</Text>
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Task Type</Text>
                  <View className="border border-gray-300 rounded-lg px-4 py-3 bg-gray-100">
                    <Text className="text-gray-900">
                      {taskType}{taskType === "Recurring" && recurringSchedule ? ` - ${recurringSchedule}` : ""}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Existing Documents */}
            {existingDocuments && existingDocuments.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">
                  Existing Documents ({existingDocuments.length + files.length}/3)
                </Text>
                {existingDocuments.map((doc) => (
                  <View
                    key={doc._id}
                    className="flex-row items-center justify-between rounded-lg p-3 border border-gray-200 mb-2 bg-gray-50"
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-gray-900 font-medium text-sm" numberOfLines={1}>
                        {doc.originalName}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        {doc.fileExtension.toUpperCase()} • Uploaded by {doc.uploadedBy?.firstName}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          const url = `${process.env.EXPO_PUBLIC_API_URL}/${doc.path.replace(/\\/g, "/")}`;
                          if (Platform.OS === "web") {
                            window.open(url, "_blank");
                          } else {
                            Linking.openURL(url);
                          }
                        }}
                        className="p-2 bg-blue-100 rounded-lg"
                      >
                        <Download size={14} color="#2563EB" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteExistingDocument(doc._id)}
                        className="p-2 bg-red-100 rounded-lg"
                        disabled={loading}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* File Upload */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Upload New Documents ({existingDocuments.length + files.length}/3)
              </Text>
              {Platform.OS === "web" ? (
                <WebFileDropzone onFilesAdded={handleWebFiles} />
              ) : (
                <Pressable
                  onPress={pickFileMobile}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center"
                  disabled={loading}
                >
                  <Upload size={20} color="#6B7280" />
                  <Text className="text-gray-600 mt-2 text-sm font-medium">Tap to select files</Text>
                </Pressable>
              )}

              {files.length > 0 && (
                <View className="mt-3">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    New Files ({files.length})
                  </Text>
                  {files.map((file, index) => (
                    <View
                      key={index}
                      className="flex-row items-center justify-between rounded-lg p-3 border border-gray-200 mb-2"
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-gray-900 font-medium text-sm" numberOfLines={1}>
                          {file.name}
                        </Text>
                        {file.size && <Text className="text-gray-500 text-xs">{formatFileSize(file.size)}</Text>}
                      </View>
                      <Pressable
                        onPress={() => removeFile(index)}
                        className="p-2 bg-red-100 rounded-lg"
                        disabled={loading}
                      >
                        <Trash2 size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-2 mt-4">
              <Pressable
                onPress={onCancel}
                className="flex-1 border border-gray-300 rounded-md py-2 items-center bg-white"
                disabled={loading}
              >
                <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={handleSave}
                className={`flex-1 rounded-md py-2 items-center ${loading ? "bg-gray-400" : "bg-[#1360C6]"}`}
              >
                <Text className="text-white font-semibold text-base">{loading ? "Updating..." : "Update"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Date/Time Pickers - Mobile Only */}
          {Platform.OS !== "web" && (
            <>
              {showDatePicker && (
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => handleDateChange(event, date, "date")}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={dueTime || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, time) => handleDateChange(event, time, "time")}
                />
              )}

              {showReminderDatePicker && (
                <DateTimePicker
                  value={reminder || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => handleReminderChange(event, date, "date")}
                />
              )}

              {showReminderTimePicker && (
                <DateTimePicker
                  value={reminder || new Date()}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, time) => handleReminderChange(event, time, "time")}
                />
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}