import { useState, useEffect, useRef } from "react"
import { View, Text, TextInput, Pressable, Platform, ScrollView, ToastAndroid, Image, Modal, KeyboardAvoidingView } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker"
import api from "../../utils/api"
import useUserStore from "../../stores/useUserStore"
import { Calendar, Clock, Trash2, Upload, AlertCircle, ChevronDown, X, User, Plus } from "lucide-react-native"
import { useToast } from "../../components/Toast"
import { useNavigation } from "@react-navigation/native"
import { useQueryClient } from "@tanstack/react-query";
import Avatar from "../../components/Avatar";

const CustomDropdown = ({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option",
  error = null,
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const buttonRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value)

  const handleSelect = (selectedValue) => {
    onValueChange(selectedValue)
    setIsOpen(false)
  }

  const handleOpen = () => {
    if (Platform.OS === 'web') {
      // Web: use measureInWindow
      if (buttonRef.current) {
        buttonRef.current.measureInWindow((x, y, width, height) => {
          setDropdownPosition({ top: y + height + 8, left: x, width })
          setIsOpen(true)
        })
      }
    } else {
      // Native: just open modal, we'll use centered approach
      setIsOpen(true)
    }
  }

  return (
    <View className={label ? "mb-4" : "mb-0"}>
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {label} {required && "*"}
        </Text>
      )}

      {/* Dropdown Button */}
      <Pressable
        ref={buttonRef}
        onPress={handleOpen}
        className={`h-23 flex-row items-center justify-between border rounded-lg px-4 ${label ? "py-3" : "py-2"} ${error ? "border-red-400 bg-red-50" : "border-gray-300"
          }`}
        style={{ backgroundColor: 'white' }}
      >
        <Text className={`flex-1 text-base ${selectedOption ? "text-gray-900" : "text-gray-500"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown
          size={18}
          color="#6B7280"
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }]
          }}
        />
      </Pressable>

      {/* Error Message */}
      {error && (
        <View className="flex-row items-center mt-2">
          <AlertCircle size={16} color="#EF4444" />
          <Text className="text-red-500 text-sm ml-2">{error}</Text>
        </View>
      )}

      {/* Modal Dropdown */}
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
            backgroundColor: 'rgba(0, 0, 0, 0)',
            justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
            alignItems: Platform.OS === 'web' ? 'flex-start' : 'center'
          }}
        >
          {/* Dropdown Content */}
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
            {/* Header for Native */}
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
                  className={`flex-row items-center p-3 rounded-lg  border-b border-gray-50 ${value === option.value ? "bg-blue-50" : ""
                    }`}
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
              className="p-2 border-t rounded-lg border-gray-100 items-center bg-white"
            >
              <Text className="text-gray-600 font-medium">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const formatDateForDisplay = (date) => {
  if (!date) return "";

  // Ensure we're working with a Date object
  const dateObj = date instanceof Date ? date : new Date(date);

  // Format as DD-MM-YYYY
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  return `${day}-${month}-${year}`;
};

// Format time for display (shows local time)
const formatTimeForDisplay = (date) => {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleTimeString('en-US', {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
};

// Format date and time for display
const formatDateTimeForDisplay = (date) => {
  if (!date) return "";
  return `${formatDateForDisplay(date)} ${formatTimeForDisplay(date)}`;
};

// Custom User Selector Component
const UserSelector = ({ selectedUsers, onUsersChange, placeholder, error, type }) => {
  const [availableUsers, setAvailableUsers] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch users from API
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get("/me/usersList") // Adjust endpoint as needed
      if (response.data && Array.isArray(response.data)) {
        setAvailableUsers(response.data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      // You might want to show a toast error here
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search term and exclude already selected users
  const filteredUsers = availableUsers.filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase())
    const notSelected = !selectedUsers.find(selected => selected._id === user._id)
    return matchesSearch && notSelected
  })

  // Add user to selected list
  const handleUserSelect = (user) => {
    if (!selectedUsers.find(selected => selected._id === user._id)) {
      onUsersChange([...selectedUsers, user])
    }
    setIsDropdownOpen(false)
    setSearchTerm("")
  }

  // Remove user from selected list
  const handleUserRemove = (userId) => {
    onUsersChange(selectedUsers.filter(user => user._id !== userId))
  }

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-2">
        {placeholder} {type === "doer" ? "*" : ""}
      </Text>

      {/* Selected Users Display */}


      {/* Dropdown Button */}
      <Pressable
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        className={`flex-row items-center justify-between border rounded-lg ${selectedUsers.length === 0 ? "px-4 py-3" : "px-2 py-2"}  ${error ? "border-red-400 bg-red-50" : "border-gray-300 gap-1"
          }`}
      >
        {selectedUsers.length === 0 && <View className="flex-row items-center flex-1">
          <Plus size={18} color="#6B7280" />
          <Text className="ml-2 text-gray-600 text-base">
            Add {type === "doer" ? "Doer" : "Viewer"}
          </Text>
        </View>}
        <View className="flex-1">
          {selectedUsers.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <View
                  key={user._id}
                  className="flex-row items-center  rounded-lg px-2 py-2 border border-black"
                >
                  <Avatar employee={user} size={25} />
                  <Text className="text-[#495057] text-sm  font-medium ml-2">
                    {user.firstName} {user.lastName}
                  </Text>
                  <Pressable
                    onPress={() => handleUserRemove(user._id)}
                    className="ml-1 "
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
          style={{
            transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }]
          }}

        />
      </Pressable>

      {/* Dropdown Content */}
      {isDropdownOpen && (
        <View className="mt-2 border border-gray-200 rounded-lg bg-white shadow-lg max-h-60">
          {/* Search Input */}
          <View className="p-3 border-b border-gray-100">
            <TextInput
              placeholder="Search users..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              className="border border-gray-300 rounded-lg px-3 py-2 text-gray-900 "
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Users List */}
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
                  className="flex-row items-center p-3 border-b border-gray-50 hover:"
                  style={Platform.OS === "web" ? {
                    ':hover': {
                      backgroundColor: '#F9FAFB'
                    }
                  } : {}}
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

          {/* Close Button */}
          <Pressable
            onPress={() => {
              setIsDropdownOpen(false)
              setSearchTerm("")
            }}
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

const WebDateTimeInput = ({ value, onChange, mode, placeholder, error, className }) => {
  if (Platform.OS !== "web") return null;

  const formatValueForInput = () => {
    if (!value) return "";

    const localDate = value instanceof Date ? value : new Date(value);

    if (mode === "date") {
      // Format as YYYY-MM-DD for date input
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (mode === "time") {
      // HTML time input expects 24-hour format (HH:MM) even though we display 12-hour
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
      // Parse date input and create local date
      const [year, month, day] = inputValue.split('-').map(Number);
      newDate = new Date(year, month - 1, day); // month is 0-indexed
    } else if (mode === "time") {
      // For time, use current date with selected time
      const [hours, minutes] = inputValue.split(":").map(Number);
      newDate = new Date();
      newDate.setHours(hours, minutes, 0, 0);
    } else if (mode === "datetime-local") {
      // Parse datetime-local format: YYYY-MM-DDTHH:MM
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
        className={`w-full px-4 py-2 border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${error ? "border-red-500 bg-red-50" : "border-gray-300"
          } ${className}`}
      />
    </div>
  );
};

// Web-specific file dropzone component
const WebFileDropzone = ({ onFilesAdded }) => {
  const [isDragOver, setIsDragOver] = useState(false)

  if (Platform.OS !== "web") return null

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    onFilesAdded(droppedFiles)
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    onFilesAdded(selectedFiles)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
      onClick={() => document.getElementById("file-input").click()}
    >
      <input id="file-input" type="file" multiple className="hidden" onChange={handleFileSelect} />
      <Upload className="mx-auto mb-2 text-gray-400" size={24} />
      <p className="text-gray-500 text-sm">
        {isDragOver ? "Drop files here..." : "Drag & drop files here, or click to browse"}
      </p>
    </div>
  )
}

export default function AddTask() {
  const navigation = useNavigation()
  // Fields

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedDoers, setSelectedDoers] = useState([])
  const { user } = useUserStore.getState();
  const [selectedViewers, setSelectedViewers] = useState([user])

  // Date & Time
  const [dueDate, setDueDate] = useState(null)
  const [dueTime, setDueTime] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Reminder - Now includes both date and time
  const [reminder, setReminder] = useState(null)
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false)
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false)

  // Dropdowns
  const [priority, setPriority] = useState("Medium")
  const [taskType, setTaskType] = useState("Single")
  const [recurringSchedule, setRecurringSchedule] = useState(null)
  const [repeatReminder, setRepeatReminder] = useState('10m')
  const [isManualReminder, setIsManualReminder] = useState(false) // Track if user manually set reminder
  const [allowReminder, setAllowReminder] = useState([
    { label: "10m", value: "10m" },
    { label: "30m", value: "30m" },
    { label: "1h", value: "1h" },
    { label: "1d", value: "1d" },
    { label: "1w", value: "1w" },
  ]);

  // Files
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const toast = useToast()

  const queryClient = useQueryClient();

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
    if (Math.abs(timeDiffHours - 1) <= 0.02) return '1h'; // ~1 minute tolerance
    if (Math.abs(timeDiffDays - 1) <= 0.02) return '1d'; // ~30 minute tolerance
    if (Math.abs(timeDiffDays - 7) <= 0.1) return '1w'; // ~2 hour tolerance

    return null; // No match - will show dash
  };

  // Initialize dates properly
  const initializeDates = () => {
    // Initialize with current local date/time
    const now = new Date();

    // Set default due date to today
    setDueDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

    // Set default due time to one hour after current time
    const oneHourLater = new Date(now);
    oneHourLater.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
    setDueTime(oneHourLater);

    // Set default reminder to 10 min before task end 
    const defaultReminder = new Date(oneHourLater);
    defaultReminder.setMinutes(defaultReminder.getMinutes() - 10);
    setReminder(defaultReminder);
    setIsManualReminder(false);
  };

  // Call this in useEffect or component initialization
  useEffect(() => {
    initializeDates();
  }, []);

  // Update allowed reminder options based on due date/time
  useEffect(() => {
    if (!dueDate || !dueTime) {
      // Reset to all options if no due date/time is set
      setAllowReminder([
        { label: "10m", value: "10m" },
        { label: "30m", value: "30m" },
        { label: "1h", value: "1h" },
        { label: "1d", value: "1d" },
        { label: "1w", value: "1w" },
      ]);
      return;
    }

    // Create a combined Date object: date from dueDate, time from dueTime
    const dueDateTime = new Date(dueDate);
    const timeObj = new Date(dueTime);
    dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

    const now = new Date();
    const timeDiffMs = dueDateTime - now;

    // Calculate differences
    const timeDiffMinutes = timeDiffMs / (1000 * 60);
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
    const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);

    const validReminders = [];

    // 10m - show if at least 10 minutes away
    if (timeDiffMinutes >= 10) {
      validReminders.push({ label: "10m", value: "10m" });
    }

    // 30m - show if at least 30 minutes away
    if (timeDiffMinutes >= 30) {
      validReminders.push({ label: "30m", value: "30m" });
    }

    // 1h - show if at least 1 hour away
    if (timeDiffHours >= 1) {
      validReminders.push({ label: "1h", value: "1h" });
    }

    // 1d - show if at least 1 day away
    if (timeDiffDays >= 1) {
      validReminders.push({ label: "1d", value: "1d" });
    }

    // 1w - show if at least 7 days away
    if (timeDiffDays >= 7) {
      validReminders.push({ label: "1w", value: "1w" });
    }

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
    setIsManualReminder(false); // Mark as auto-calculated

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
        console.log(newReminder, "newReminder");
        console.log(dueDateTime, "dueDateTime");
        console.log(newReminder >= dueDateTime);

        setErrors({ ...errors, reminder: "Reminder must be before due date/time" });
        toast.error("Reminder must be before due date/time");
        return;
      }

      if (newReminder < new Date()) {
        console.log(newReminder, "newReminder");
        console.log(new Date(), "new Date()");
        console.log(newReminder >= new Date());
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
      console.log("  Starting mobile file picker...")

      // Check if DocumentPicker is available
      if (!DocumentPicker.getDocumentAsync) {
        toast.error("File picker is not available on this device")
        return
      }

      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: "*/*",
        copyToCacheDirectory: true, // Ensure files are accessible
      })

      console.log("  DocumentPicker result:", res)

      if (!res.canceled && res.assets && res.assets.length > 0) {
        // Handle newer Expo DocumentPicker versions (SDK 49+)
        const validFiles = []
        const invalidFiles = []

        for (const asset of res.assets) {
          // Validate file properties
          if (asset.name && asset.uri) {
            // Check file size (limit to 10MB per file)
            if (asset.size && asset.size > 10 * 1024 * 1024) {
              invalidFiles.push(`${asset.name} (too large - max 10MB)`)
              continue
            }

            const fileObj = {
              name: asset.name,
              uri: asset.uri,
              size: asset.size || 0,
              mimeType: asset.mimeType || "application/octet-stream",
              type: asset.mimeType || "application/octet-stream",
            }

            validFiles.push(fileObj)
            console.log("  Valid file added:", fileObj)
          } else {
            invalidFiles.push(asset.name || "Unknown file")
          }
        }

        if (validFiles.length > 0) {
          setFiles([...files, ...validFiles])
          toast.success(`${validFiles.length} file(s) selected successfully`)
        }

        if (invalidFiles.length > 0) {
          toast.warning(`${invalidFiles.length} file(s) could not be added: ${invalidFiles.join(", ")}`)
        }
      } else if (res.type === "success") {
        // Handle older Expo DocumentPicker versions (SDK 48 and below)
        console.log("  Adding legacy file:", res)

        if (res.name && res.uri) {
          // Check file size for legacy format
          if (res.size && res.size > 10 * 1024 * 1024) {
            toast.error(`File too large: ${res.name} (max 10MB)`)
            return
          }

          const fileObj = {
            name: res.name,
            uri: res.uri,
            size: res.size || 0,
            mimeType: res.mimeType || "application/octet-stream",
            type: res.mimeType || "application/octet-stream",
          }

          setFiles([...files, fileObj])
          toast.success("File selected successfully")
        } else {
          toast.error("Invalid file selected")
        }
      } else {
        console.log("  File picker was canceled")
      }
    } catch (error) {
      console.error("  File picker error:", error)

      let errorMessage = "Failed to pick file. Please try again."

      if (error.message?.includes("Permission")) {
        errorMessage = "Permission denied. Please allow file access in your device settings."
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    }
  }

  const handleWebFiles = (newFiles) => {
    try {
      console.log("  Processing web files:", newFiles)

      if (!newFiles || newFiles.length === 0) {
        toast.warning("No files selected")
        return
      }

      const validFiles = []
      const invalidFiles = []

      for (const file of newFiles) {
        // Validate file properties
        if (!file.name || !file.size) {
          invalidFiles.push("Invalid file")
          continue
        }

        // Check file size (limit to 10MB per file)
        if (file.size > 10 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large - max 10MB)`)
          continue
        }

        // Check file type (basic validation)
        const allowedTypes = [
          "image/",
          "text/",
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument",
          "application/vnd.openxmlformats-officedocument",
          "application/zip",
          "application/json",
          "video/",
          "audio/",
        ]

        const isAllowedType = allowedTypes.some((type) => file.type.startsWith(type))
        if (!isAllowedType && file.type !== "") {
          console.warn("  Potentially unsafe file type:", file.type)
          // Still allow but warn user
        }

        try {
          const fileObj = {
            name: file.name,
            size: file.size,
            type: file.type,
            uri: URL.createObjectURL(file),
            file: file, // Store the actual File object for upload
          }

          validFiles.push(fileObj)
          console.log("  Valid web file added:", fileObj)
        } catch (urlError) {
          console.error("  Error creating object URL:", urlError)
          invalidFiles.push(`${file.name} (processing error)`)
        }
      }

      if (validFiles.length > 0) {
        setFiles([...files, ...validFiles])
        toast.success(`${validFiles.length} file(s) added successfully`)
      }

      if (invalidFiles.length > 0) {
        toast.warning(`${invalidFiles.length} file(s) could not be added: ${invalidFiles.join(", ")}`)
      }
    } catch (error) {
      console.error("  Web file handling error:", error)
      toast.error("Failed to process files. Please try again.")
    }
  }

  const removeFile = (index) => {
    try {
      const fileToRemove = files[index]
      const newFiles = files.filter((_, i) => i !== index)

      // Clean up object URLs on web
      if (Platform.OS === "web" && fileToRemove?.uri?.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.uri)
      }

      setFiles(newFiles)
      toast.success(`Removed ${fileToRemove?.name || "file"}`)
    } catch (error) {
      console.error("  Error removing file:", error)
      toast.error("Failed to remove file")
    }
  }

  // Updated date change handler for due date/time
  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }

    if (selectedDate) {
      // Create a new date object to avoid mutation
      let newDate = new Date(selectedDate);

      // Ensure the date is treated as local time
      if (type === "date") {
        // For date selection, preserve the local date
        newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      }

      console.log(`${type} selected (local):`, newDate.toString());

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

  // Enhanced validation with error tracking
  const validateForm = () => {
    const newErrors = {}

    if (!title.trim()) {
      newErrors.title = "Task title is required"
    }

    if (selectedDoers.length === 0) {
      newErrors.doers = "At least one doer must be selected"
    }

    if (!priority) {
      newErrors.priority = "Priority must be selected"
    }

    if (!taskType) {
      newErrors.taskType = "Task type must be selected"
    }

    if (taskType === "Recurring" && !recurringSchedule) {
      newErrors.recurringSchedule = "Recurring schedule must be selected"
    }

    // Validate reminder is before due date/time
    if (reminder && dueDate && dueTime) {
      const dueDateTime = new Date(dueDate);
      const timeObj = new Date(dueTime);
      dueDateTime.setHours(timeObj.getHours(), timeObj.getMinutes(), 0, 0);

      if (reminder >= dueDateTime) {
        newErrors.reminder = "Reminder must be before due date/time"
      }
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0]
      toast.warning(firstError)
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    const showSuccessToast = () => {
      if (Platform.OS === "android") {
        ToastAndroid.show("Task created successfully!", ToastAndroid.SHORT)
      } else {
        toast.success("Task created successfully!")
      }
    }

    try {
      setLoading(true)
      console.log("  Starting form submission...")

      const formData = new FormData()
      formData.append("title", title.trim())
      formData.append("description", description.trim())
      formData.append("priority", priority)
      formData.append("taskType", taskType)

      if (taskType === "Recurring" && recurringSchedule) {
        formData.append("recurringSchedule", recurringSchedule)
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
        )
        formData.append("dueDateTime", combinedDateTime.toISOString())
      }

      // Only send reminder if repeatReminder is not dash
      if (reminder && repeatReminder !== '-') {
        formData.append("reminder", reminder.toISOString())
      }

      if (repeatReminder && repeatReminder !== '-') {
        formData.append("repeatReminder", repeatReminder)
      }

      selectedDoers.forEach((val, idx) => {
        formData.append(`assignees[${idx}]`, val._id)
      })
      selectedViewers.forEach((val, idx) => {
        formData.append(`observers[${idx}]`, val._id)
      })

      // File uploads
      let successfulFiles = 0
      let failedFiles = 0

      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        try {
          if (Platform.OS === "web" && file.file) {
            formData.append("file", file.file)
            successfulFiles++
          } else if (Platform.OS !== "web" && file.uri) {
            const fileObj = {
              uri: file.uri,
              name: file.name || `file_${index}`,
              type: file.mimeType || file.type || "application/octet-stream",
            }
            formData.append("file", fileObj)
            successfulFiles++
          } else {
            failedFiles++
          }
        } catch (fileError) {
          console.error(`  Error processing file ${index}:`, fileError)
          failedFiles++
        }
      }

      if (failedFiles > 0) {
        toast.warning(`${failedFiles} file(s) could not be uploaded`)
      }

      console.log("  Sending request to API...")

      const response = await api.post("/task/add-task", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // timeout: 60000,
      })

      console.log("  API response:", response)

      if (response.status === 200 || response.status === 201) {
        showSuccessToast() // ✅ Only one toast
        queryClient.invalidateQueries({
          queryKey: ["getTaskList"],
        });
        queryClient.invalidateQueries({
          queryKey: ["todaysTasks"],
        });

        setTimeout(() => {
          resetForm()
          navigation.navigate("Dashboard") // ✅ Navigate after 1.5 sec
        }, 1500)
      }
    } catch (err) {
      console.error("  Submit error:", err)

      let errorMessage = "Failed to create task. Please try again."
      if (err.code === "NETWORK_ERROR" || err.message?.includes("Network")) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (err.code === "TIMEOUT_ERROR" || err.message?.includes("timeout")) {
        errorMessage = "Upload timeout. Please try with smaller files or check your connection."
      } else if (err.response?.status === 413) {
        errorMessage = "Files too large. Please reduce file sizes and try again."
      } else if (err.response?.status === 400) {
        errorMessage = err.response?.data?.error || "Invalid request. Please check your input."
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later."
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getDefaultFormState = () => {
    const now = new Date();

    return {
      title: "",
      description: "",
      selectedDoers: [],
      selectedViewers: [user],
      priority: "Medium",
      taskType: "Single",
      recurringSchedule: null,
      repeatReminder: "10m",
      dueDate: now,
      dueTime: now,
      reminder: new Date(now.getTime() + 50 * 60 * 1000),
      files: [],
    };
  };

  const isFormAtDefault = () => {
    const defaults = getDefaultFormState();

    return (
      title === defaults.title &&
      description === defaults.description &&
      selectedDoers.length === 0 &&
      selectedViewers.length === 1 &&
      priority === defaults.priority &&
      taskType === defaults.taskType &&
      recurringSchedule === defaults.recurringSchedule &&
      repeatReminder === defaults.repeatReminder &&
      files.length === 0
    );
  };

  // Reset form
  const resetForm = () => {
    console.log("i tried");
    if (isFormAtDefault()) {
      navigation.navigate("Dashboard");
      return;
    }

    // Clean up object URLs on web
    if (Platform.OS === "web") {
      files.forEach((file) => {
        if (file.uri?.startsWith("blob:")) {
          URL.revokeObjectURL(file.uri)
        }
      })
    }

    setTitle("")
    setDescription("")
    setSelectedDoers([])
    setSelectedViewers([user])
    setPriority("Medium")
    setTaskType("Single")
    setRecurringSchedule(null)
    setRepeatReminder('10m')

    const now = new Date();
    setDueDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    const oneHourLater = new Date(now);
    oneHourLater.setHours(now.getHours() + 1, now.getMinutes(), 0, 0);
    setDueTime(oneHourLater);

    const defaultReminder = new Date(oneHourLater);
    defaultReminder.setMinutes(defaultReminder.getMinutes() - 10);
    setReminder(defaultReminder);
    setIsManualReminder(false);

    setFiles([])
    setErrors({})
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFB]">
      <toast.ToastContainer />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: 'height', web: undefined })}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}

          <View className="px-4 py-6">
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="px-4 py-6 bg-white">
                <Text className="text-2xl font-bold text-gray-900 mb-2">Create New Task</Text>
              </View>
              {/* Title */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Task Name *</Text>
                <TextInput
                  placeholder="Enter task title"
                  value={title}
                  onChangeText={(text) => {
                    setTitle(text)
                    if (errors.title) setErrors({ ...errors, title: null })
                  }}
                  className={`border rounded-lg px-4 py-3 text-gray-900 text-base ${errors.title ? "border-red-400 bg-red-50" : "border-gray-300 "
                    }`}
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
                <TextInput
                  placeholder="Enter task description"
                  value={description}
                  onChangeText={setDescription}
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900  min-h-[80px] text-base"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#9CA3AF"
                  textAlignVertical="top"
                />
              </View>

              {/* Custom User Selectors */}
              <UserSelector
                selectedUsers={selectedDoers}
                onUsersChange={(users) => {
                  setSelectedDoers(users)
                  if (errors.doers) setErrors({ ...errors, doers: null })
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

              {/* Due Date & Time Row - Made responsive with proper spacing */}
              <View className="mb-4">
                <View className="flex-row  gap-2">
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
                        className={`flex-row items-center border rounded-lg px-4 py-3 ${errors.dueDate ? "border-red-400 bg-red-50" : "border-gray-300 "
                          }`}
                      >
                        <Calendar size={18} color="#6B7280" />
                        <Text className="ml-2 text-gray-900 flex-1 text-sm">
                          {dueDate ? formatDateForDisplay(dueDate) : "Select due date"}
                        </Text>
                      </Pressable>
                    )}
                    {errors.dueDate && (
                      <View className="flex-row items-center mt-1">
                        <AlertCircle size={14} color="#EF4444" />
                        <Text className="text-red-500 text-xs ml-1">{errors.dueDate}</Text>
                      </View>
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
                        className={`flex-row items-center border rounded-lg px-4 py-3 ${errors.dueTime ? "border-red-400 bg-red-50" : "border-gray-300 "
                          }`}
                      >
                        <Clock size={18} color="#6B7280" />
                        <Text className="ml-2 text-gray-900 flex-1 text-sm">
                          {dueTime ? formatTimeForDisplay(dueTime) : "Select due time"}
                        </Text>
                      </Pressable>
                    )}
                    {errors.dueTime && (
                      <View className="flex-row items-center mt-1">
                        <AlertCircle size={14} color="#EF4444" />
                        <Text className="text-red-500 text-xs ml-1">{errors.dueTime}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* Priority & Type Row - Custom dropdowns */}
              <View className="mb-4">
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <CustomDropdown
                      label="Priority"
                      value={priority}
                      onValueChange={(value) => {
                        setPriority(value)
                        if (errors.priority) setErrors({ ...errors, priority: null })
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
                        setTaskType(value)
                        if (errors.taskType) setErrors({ ...errors, taskType: null })
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

              {/* Recurring Schedule - Custom dropdown */}
              {taskType === "Recurring" && (
                <CustomDropdown
                  label="Recurring Schedule"
                  value={recurringSchedule}
                  onValueChange={(value) => {
                    setRecurringSchedule(value)
                    if (errors.recurringSchedule) setErrors({ ...errors, recurringSchedule: null })
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

                {Platform.OS === "web" ? (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Reminder *</Text>
                    <View className={`w-full flex-row items-center border p-2 rounded-lg bg-white gap-2 ${errors.reminder ? "border-red-400 bg-red-50" : "border-gray-300"}`}>
                      {/* Web DateTime Picker */}
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

                      {/* Dropdown inside same box */}
                      <View className="w-24">
                        <CustomDropdown
                          value={repeatReminder}
                          onValueChange={handleRepeatReminderChange}
                          options={[
                            { label: "-", value: "-" },
                            ...allowReminder
                          ]}
                          placeholder="10m"
                          error={null}
                          required={false}
                        />
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Reminder (Select Custom or  predefined) *</Text>
                    <View>
                      {/* Mobile Date and Time Pickers */}
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

                      {/* Repeat Reminder Dropdown */}
                      <View className="w-full">
                        <CustomDropdown
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
                  </>
                )}

                {errors.reminder && (
                  <View className="flex-row items-center mt-2">
                    <AlertCircle size={14} color="#EF4444" />
                    <Text className="text-red-500 text-sm ml-2">{errors.reminder}</Text>
                  </View>
                )}
              </View>

              {/* File Upload - Improved mobile file upload UI */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Upload Document</Text>
                {Platform.OS === "web" ? (
                  <WebFileDropzone onFilesAdded={handleWebFiles} />
                ) : (
                  <Pressable
                    onPress={pickFileMobile}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center "
                    disabled={loading}
                  >
                    <Upload size={20} color="#6B7280" />
                    <Text className="text-gray-600 mt-2 text-sm font-medium">Tap to select files</Text>
                    <Text className="text-gray-500 text-xs mt-1">Support multiple files (max 10MB each)</Text>
                  </Pressable>
                )}

                {/* File Preview - Improved mobile file list */}
                {files.length > 0 && (
                  <View className="mt-3">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Selected Files ({files.length})
                      {files.length > 0 && (
                        <Text className="text-gray-500 font-normal text-xs">
                          {" "}
                          • Total: {formatFileSize(files.reduce((sum, file) => sum + (file.size || 0), 0))}
                        </Text>
                      )}
                    </Text>
                    {files.map((file, index) => (
                      <View
                        key={index}
                        className="flex-row items-center justify-between  rounded-lg p-3 border border-gray-200 mb-2"
                      >
                        <View className="flex-1 mr-3">
                          <Text className="text-gray-900 font-medium text-sm" numberOfLines={1}>
                            {file.name}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            {file.size && <Text className="text-gray-500 text-xs">{formatFileSize(file.size)}</Text>}
                            {file.type && (
                              <Text className="text-gray-400 text-xs ml-2">• {file.type.split("/")[0] || "file"}</Text>
                            )}
                          </View>
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
            </View>

            {/* Action Buttons - Improved mobile button layout */}
            <View className="flex-row gap-2 mt-6">
              <Pressable
                onPress={resetForm}
                className="flex-1 border border-gray-300 rounded-md py-2 items-center bg-white"
                disabled={loading}
              >
                <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
              </Pressable>

              <Pressable
                disabled={loading}
                onPress={handleSubmit}
                className={`flex-1 rounded-md py-2 items-center ${loading ? "bg-gray-400" : "bg-[#1360C6]"}`}
              >
                <Text className="text-white font-semibold text-base">{loading ? "Creating..." : "Save"}</Text>
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
  )
}