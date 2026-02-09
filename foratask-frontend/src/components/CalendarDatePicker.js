import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, TextInput, Pressable } from 'react-native';
import { Calendar, X, MoveLeft, MoveRight } from 'lucide-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context"

export default function CalendarDatePicker({ fromDate, setFromDate, toDate, setToDate }) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [fromError, setFromError] = useState('');
  const [toError, setToError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [buttonLayout, setButtonLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef(null);
  const insets = useSafeAreaInsets()


  const presets = [
    { label: 'Today', value: 'today' },
    { label: '1 Week', value: '1week' },
    { label: '1 Month', value: '1month' },
    { label: "All Time", value: 'alltime' }
  ];

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Convert Date object to date-only string (YYYY-MM-DD) for consistent comparison
  const toDateString = (date) => {
    if (!date) return null;
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${y}-${m}-${d}`;
  };


  // Create a date at start of day (00:00:00 local time)
  const createStartOfDay = (year, month, day) => {
    return new Date(year, month, day, 0, 0, 0, 0);
  };

  // Create a date at end of day (23:59:59.999 local time)
  const createEndOfDay = (year, month, day) => {
    return new Date(year, month, day, 23, 59, 59, 999);
  };


  const formatDate = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

  const formatDisplayDate = (date) => {
    if (!date ) return '';
    // console.log(typeof date,"date print");
    
    // console.log(!date,"data");
    
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const parseInputDate = (input) => {
    const parts = input.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parseInt(parts[2]);

      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
      }

      if (day < 1 || day > 31) return null;
      if (month < 0 || month > 11) return null;
      if (year < 1900 || year > 2100) return null;

      const date = new Date(year, month, day);

      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return date;
      }
    }
    return null;
  };

  const validateDateInput = (input, errorSetter) => {
    if (input.length === 0) {
      errorSetter('');
      return true;
    }

    if (input.length < 10) {
      errorSetter('');
      return false;
    }

    const parts = input.split('/');
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (day < 1 || day > 31) {
      errorSetter('Invalid day');
      return false;
    }

    if (month < 1 || month > 12) {
      errorSetter('Invalid month');
      return false;
    }

    if (year < 1900 || year > 2100) {
      errorSetter('Invalid year');
      return false;
    }

    const date = parseInputDate(input);
    if (!date) {
      errorSetter('Invalid date');
      return false;
    }

    errorSetter('');
    return true;
  };

  const handlePresetSelect = (preset) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    let fromDate, toDate;

    switch (preset) {
      case 'today':
        fromDate = createStartOfDay(year, month, day);
        toDate = createEndOfDay(year, month, day);
        break;
      case '1week':
        // 7 days: today and 6 days before
        const weekAgo = new Date(year, month, day - 6);
        fromDate = createStartOfDay(weekAgo.getFullYear(), weekAgo.getMonth(), weekAgo.getDate());
        toDate = createEndOfDay(year, month, day);
        break;
      case '1month':
        // 30 days: today and 29 days before
        const monthAgo = new Date(year, month, day - 29);
        fromDate = createStartOfDay(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate());
        toDate = createEndOfDay(year, month, day);
        break;
      case 'alltime':
        fromDate = null;
        toDate = null;
        break;
    }

    setFromInput(formatDisplayDate(fromDate));
    setToInput(formatDisplayDate(toDate));
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setFromError('');
    setToError('');
    setSelectedPreset(preset);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const handleDateSelect = (date) => {
    if (!date) return;

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    if (!tempFromDate || (tempFromDate && tempToDate)) {
      // Start new selection
      const startDate = createStartOfDay(year, month, day);
      setTempFromDate(startDate);
      setTempToDate(null);
      setFromInput(formatDisplayDate(startDate));
      setToInput('');
      setSelectedPreset(null);
      setFromError('');
      setToError('');
    } else {
      // Complete the range
      const selectedDate = createStartOfDay(year, month, day);
      const fromDateOnly = createStartOfDay(tempFromDate.getFullYear(), tempFromDate.getMonth(), tempFromDate.getDate());

      if (selectedDate < fromDateOnly) {
        // Selected date is before from date, swap them
        const endDate = createEndOfDay(tempFromDate.getFullYear(), tempFromDate.getMonth(), tempFromDate.getDate());
        setTempToDate(endDate);
        setTempFromDate(selectedDate);
        setToInput(formatDisplayDate(endDate));
        setFromInput(formatDisplayDate(selectedDate));
      } else {
        // Selected date is after from date
        const endDate = createEndOfDay(year, month, day);
        setTempToDate(endDate);
        setToInput(formatDisplayDate(endDate));
      }
      setFromError('');
      setToError('');
    }
  };

  const formatDateInput = (text, prevText) => {
    const cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.length > 8) return prevText;

    let formatted = '';
    for (let i = 0; i < cleaned.length; i++) {
      if (i === 2 || i === 4) {
        formatted += '/';
      }
      formatted += cleaned[i];
    }

    return formatted;
  };

  const handleFromInputChange = (text) => {
    const formatted = formatDateInput(text, fromInput);
    setFromInput(formatted);

    if (formatted.length === 10) {
      const isValid = validateDateInput(formatted, setFromError);
      if (isValid) {
        const date = parseInputDate(formatted);
        if (date) {
          const startDate = createStartOfDay(date.getFullYear(), date.getMonth(), date.getDate());
          setTempFromDate(startDate);
          setSelectedPreset(null);

          if (tempToDate) {
            const toDateOnly = createStartOfDay(tempToDate.getFullYear(), tempToDate.getMonth(), tempToDate.getDate());
            if (startDate > toDateOnly) {
              setFromError('From date must be before To date');
            } else {
              setFromError('');
            }
          }
        }
      } else {
        setTempFromDate(null);
      }
    } else {
      setFromError('');
      if (formatted.length === 0) {
        setTempFromDate(null);
      }
    }
  };

  const handleToInputChange = (text) => {
    const formatted = formatDateInput(text, toInput);
    setToInput(formatted);

    if (formatted.length === 10) {
      const isValid = validateDateInput(formatted, setToError);
      if (isValid) {
        const date = parseInputDate(formatted);
        if (date) {
          const endDate = createEndOfDay(date.getFullYear(), date.getMonth(), date.getDate());
          setTempToDate(endDate);
          setSelectedPreset(null);

          if (tempFromDate) {
            const fromDateOnly = createStartOfDay(tempFromDate.getFullYear(), tempFromDate.getMonth(), tempFromDate.getDate());
            const toDateOnly = createStartOfDay(date.getFullYear(), date.getMonth(), date.getDate());
            if (toDateOnly < fromDateOnly) {
              setToError('To date must be after From date');
            } else {
              setToError('');
            }
          }
        }
      } else {
        setTempToDate(null);
      }
    } else {
      setToError('');
      if (formatted.length === 0) {
        setTempToDate(null);
      }
    }
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return toDateString(date1) === toDateString(date2);
  };

  const isDateInRange = (date) => {
    if (!date || !tempFromDate || !tempToDate) return false;
    const dateStr = toDateString(date);
    const fromStr = toDateString(tempFromDate);
    const toStr = toDateString(tempToDate);
    return dateStr >= fromStr && dateStr <= toStr;
  };

  const isDateSelected = (date) => {
    if (!date) return false;
    return isSameDay(date, tempFromDate) || isSameDay(date, tempToDate);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleApply = () => {
    
    if (selectedPreset === "alltime" || tempFromDate && tempToDate && !fromError && !toError) {
      setFromDate(tempFromDate);
      setToDate(tempToDate);
      setIsModalVisible(false);

      console.log('From Date:', tempFromDate);
      console.log('To Date:', tempToDate);
      console.log('From Date (ISO):', formatDate(tempFromDate));
      console.log('To Date (ISO):', formatDate(tempToDate));
    }
  };

  const handleOpenModal = () => {
    console.log("Open");

    buttonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setButtonLayout({ x: pageX, y: pageY, width, height });
    });

    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setFromInput(fromDate ? formatDisplayDate(fromDate) : '');
    setToInput(toDate ? formatDisplayDate(toDate) : '');
    setFromError('');
    setToError('');
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleOutsidePress = () => {
    handleCloseModal();
  };

  const calendarDays = generateCalendarDays();

  return (
    <View className=" bg-white ">
      {/* Calendar Button */}
      <TouchableOpacity
        activeOpacity={1}
        ref={buttonRef}
        className="flex-row items-center justify-center self-start border-2 border-[#00000080] rounded-lg px-2 py-1"
        onPress={handleOpenModal}
      >
        <Calendar strokeWidth={2.7} color="#00000080" size={18} />
        <Text className="font-semibold color-[#00000080] text-xs sm:text-sm ml-2">
          {fromDate && toDate
            ? `${formatDisplayDate(fromDate)} - ${formatDisplayDate(toDate)}`
            : 'All Time Tasks'}
        </Text>
      </TouchableOpacity>


      {/* Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <Pressable
          className="flex-1  justify-end md:justify-start"
          onPress={handleOutsidePress}
        >
          <Pressable
            className="bg-white border border-gray-200 rounded-t-2xl md:rounded-lg shadow-2xl w-full md:w-auto md:max-w-[300px] max-w-[400px] mx-auto"
            style={{
              position: 'relative',
              ...(typeof window !== 'undefined' && window.innerWidth >= 768 ? {
                position: 'absolute',
                top: Math.min(buttonLayout.y + buttonLayout.height + 8, window.innerHeight - 450),
                left: buttonLayout.x - buttonLayout.width / 2,
                maxHeight: '480px',
              } : {
                marginBottom: insets.bottom, // Lift up by 40px + safe area
              }),
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-3 py-2 border-b border-gray-200">
              <Text className="text-sm font-semibold text-gray-800">Select Date Range</Text>
              <TouchableOpacity activeOpacity={1} onPress={handleCloseModal} className="p-0.5">
                <X color="#00000080" size={18} />
              </TouchableOpacity>
            </View>

            <ScrollView className="max-h-[75vh] md:max-h-[420px]">
              {/* Presets */}
              <View className="p-2">
                <View className="flex-row gap-1.5">
                  {presets.map((preset) => (
                    <TouchableOpacity
                      activeOpacity={1}
                      key={preset.value}
                      className={`px-2 py-1 rounded border ${selectedPreset === preset.value
                        ? 'bg-[#1360C6] border-[#1360C6]'
                        : 'bg-white border-gray-300'
                        }`}
                      onPress={() => handlePresetSelect(preset.value)}
                    >
                      <Text className={`text-[10px] font-medium ${selectedPreset === preset.value ? 'text-white' : 'text-gray-700'
                        }`}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date Inputs */}
              <View className="px-2 pb-1.5">
                <View className="flex-row gap-1.5">
                  <View className="flex-1">
                    <Text className="text-[9px] text-gray-600 mb-0.5">From (DD/MM/YYYY)</Text>
                    <TextInput
                      className={`border rounded px-1.5 py-1 text-[11px] ${fromError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        } text-gray-800`}
                      placeholder="01/01/2024"
                      placeholderTextColor="#9ca3af"
                      value={fromInput}
                      onChangeText={handleFromInputChange}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    {fromError ? (
                      <Text className="text-[8px] text-red-500 mt-0.5">{fromError}</Text>
                    ) : null}
                  </View>

                  <View className="flex-1">
                    <Text className="text-[9px] text-gray-600 mb-0.5">To (DD/MM/YYYY)</Text>
                    <TextInput
                      className={`border rounded px-1.5 py-1 text-[11px] ${toError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        } text-gray-800`}
                      placeholder="31/01/2024"
                      placeholderTextColor="#9ca3af"
                      value={toInput}
                      onChangeText={handleToInputChange}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    {toError ? (
                      <Text className="text-[8px] text-red-500 mt-0.5">{toError}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Calendar */}
              <View className="px-2 pb-2">
                {/* Month Navigation */}
                <View className="flex-row items-center justify-between mb-1">
                  <TouchableOpacity
                    activeOpacity={1}
                    className="px-1.5 py-1.5 rounded bg-gray-100"
                    onPress={handlePrevMonth}
                  >
                    {/* <Text className="text-gray-700 text-xs">←</Text> */}
                    <MoveLeft size={12} />
                  </TouchableOpacity>

                  <Text className="text-[11px] font-semibold text-gray-800">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={1}
                    className="px-1.5 py-1.5 rounded bg-gray-100"
                    onPress={handleNextMonth}
                  >
                    <MoveRight size={12} />
                    {/* <Text className="text-gray-700 text-xs">→</Text> */}
                  </TouchableOpacity>
                </View>

                {/* Day Names */}
                <View className="flex-row mb-0.5">
                  {dayNames.map((day, i) => (
                    <View key={i} className="flex-1 items-center py-0.5">
                      <Text className="text-[8px] font-semibold text-gray-500">{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Grid */}
                <View className="flex-row flex-wrap">
                  {calendarDays.map((date, index) => {
                    const inRange = isDateInRange(date);
                    const selected = isDateSelected(date);

                    return (
                      <View key={index} className="w-[14.28%] p-[1px]">
                        {date ? (
                          <TouchableOpacity
                            activeOpacity={1}
                            className={`aspect-square items-center justify-center rounded ${selected
                              ? 'bg-[#1360C6]'
                              : inRange
                                ? 'bg-[#1360C61A]'
                                : ''
                              }`}
                            onPress={() => handleDateSelect(date)}
                          >
                            <Text className={`text-[10px] ${selected
                              ? 'text-white font-semibold'
                              : inRange
                                ? 'text-[#1360C6] font-medium'
                                : 'text-gray-800'
                              }`}>
                              {date.getDate()}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="aspect-square" />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View className="p-2 border-t border-gray-200 flex-row gap-1.5">
              <TouchableOpacity
                activeOpacity={1}
                className="flex-1 py-1.5 rounded border border-gray-300 items-center"
                onPress={handleCloseModal}
              >
                <Text className="text-gray-700 font-medium text-[11px]">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={1}
                className={`flex-1 py-1.5 rounded items-center ${selectedPreset === "alltime" || tempFromDate && tempToDate && !fromError && !toError ? 'bg-[#1360C6]' : 'bg-gray-300'
                  }`}
                onPress={handleApply}
                disabled={!(selectedPreset === "alltime" || tempFromDate && tempToDate && !fromError && !toError)}
              >
                <Text className="text-white font-semibold text-[11px]">Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}