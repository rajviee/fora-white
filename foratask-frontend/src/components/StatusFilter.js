import React, {memo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Dimensions, ScrollView } from 'react-native';
import { CheckSquare, Square, ListFilter, X } from 'lucide-react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context"
 function StatusFilter({ selectedStatuses, setSelectedStatuses, setCurrentPage}) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [tempSelected, setTempSelected] = useState([...selectedStatuses]);
  const [buttonLayout, setButtonLayout] = useState(null);
  const buttonRef = React.useRef(null);
  const insets = useSafeAreaInsets()
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  const isPhone = screenWidth < 768;
  const dropdownWidth = isPhone ? Math.min(screenWidth - 32, 320) : 280;

  const statuses = [
    { label: 'Completed', value: 'Completed' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Overdue', value: 'Overdue' },
    { label: 'For Approval', value: 'For Approval' }
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "text-[#D83939CC] ";
      case "In Progress":
        return "text-[#FFC83BCC] ";
      case "Completed":
        return "text-[#3A974CCC] ";
      case "Overdue":
        return "text-[#103362CC] ";
      case "For Approval":
        return "text-[#897DCDCC] ";
      default:
        return "text-gray-700 ";
    }
  };

  const toggleStatus = (value) => {
    setTempSelected(prev =>
      prev.includes(value)
        ? prev.filter(s => s !== value)
        : [...prev, value]
    );
  };

  const handleApply = () => {
    setCurrentPage(1)
    setSelectedStatuses([...tempSelected]);
    setDropdownVisible(false);
  };

  const handleClear = () => {
    setTempSelected([]);
  };

  const handleOpen = () => {
    console.log("Opening modal - isPhone:", isPhone);
    setTempSelected([...selectedStatuses]);

    // For mobile, just open the modal immediately without measuring
    if (isPhone) {
      setButtonLayout({ x: 0, y: 0, width: 0, height: 0, leftPosition: 0 });
      setDropdownVisible(true);
      return;
    }

    // For desktop, measure the button position
    if (buttonRef.current) {
      buttonRef.current.measure((x, y, width, height, pageX, pageY) => {
        console.log("Button measured:", { x, y, width, height, pageX, pageY });

        const screenWidth = Dimensions.get('window').width;
        const dropdownWidth = 280;

        // Adjust position to keep dropdown on screen
        let leftPosition = pageX;
        if (pageX + dropdownWidth > screenWidth) {
          leftPosition = Math.max(16, screenWidth - dropdownWidth - 16);
        }

        setButtonLayout({ x: pageX, y: pageY, width, height, leftPosition });
        setDropdownVisible(true);
      });
    } else {
      // Fallback: open modal anyway
      console.log("Button ref not available, opening modal anyway");
      setButtonLayout({ x: 0, y: 0, width: 0, height: 0, leftPosition: 16 });
      setDropdownVisible(true);
    }
  };

  const handleClose = () => {
    console.log("Closing modal");
    setDropdownVisible(false);
  };

  const handleOutsidePress = () => {
    console.log("Outside press");
    setDropdownVisible(false);
  };

  return (
    <View className="bg-white">
      {/* Status Filter Button */}
      <TouchableOpacity
        ref={buttonRef}
        onPress={handleOpen}
        activeOpacity={1}
        className="flex-row items-center px-3 py-1 bg-white border-2 border-[#00000080] rounded-lg"
      >
        <ListFilter strokeWidth={2.7}  color="#00000080" size={18} />
        <Text className="h-5 ml-2 color-[#00000080] font-semibold text-gray-700 font-[400] text-sm">Status</Text>
        {selectedStatuses.length > 0 && (
          <View className="ml-2 bg-[#1360C6] rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-xs font-bold">{selectedStatuses.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={dropdownVisible}
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <Pressable
          className="flex-1 "
          onPress={handleOutsidePress}
        >
          <Pressable
            className="bg-[#fff] rounded-lg border "
            style={
              isPhone
                ? {
                  // Mobile: Bottom sheet style
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: screenHeight * 0.8,
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  marginBottom: insets.bottom,
                }
                : {
                  // Desktop: Dropdown style
                  position: 'absolute',
                  top: buttonLayout ? buttonLayout.y + buttonLayout.height + 8 : 100,
                  left: buttonLayout ? buttonLayout.leftPosition : 16,
                  width: dropdownWidth,
                  maxHeight: 400,
                }
            }
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header (Mobile only) */}
            {isPhone && (
              <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-base font-semibold text-gray-800">Filter by Status</Text>
                <TouchableOpacity onPress={handleClose} className="p-1" activeOpacity={1}>
                  <X color="#00000080" size={20} />
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              className={isPhone ? "max-h-[60vh]" : "max-h-[300px]"}
              showsVerticalScrollIndicator={false}
            >
              {/* Status Options */}
              <View className={isPhone ? "py-2" : ""}>
                {statuses.map((status, index) => (
                  <View key={status.value}>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => toggleStatus(status.value)}
                      className={`flex-row items-center ${isPhone ? 'px-4 py-3' : 'px-4 py-2.5'}`}
                    >
                      <View className="mr-3">
                        {tempSelected.includes(status.value) ? (
                          <CheckSquare color="#1360C6" size={20} />
                        ) : (
                          <Square color="#6C757D" size={20} />
                        )}
                      </View>
                      <View className={`flex-1 rounded-md px-3 py-1 ${getStatusStyle(status.value)}`}>
                        <Text className={`text-center text-sm font-medium ${getStatusStyle(status.value).split(' ')[0]}`}>
                          {status.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {index < statuses.length - 1 && (
                      <View className="border-b   border-[#6C757D] mx-4 " style={{ borderStyle: 'dashed', borderBottomWidth: 2, }} />

                    )}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View className="border-t border-gray-200" />
            <View className={`flex-row ${isPhone ? 'p-4 gap-2' : 'p-3 gap-2'}`}>
              <TouchableOpacity
                onPress={handleClear}
                activeOpacity={1}
                className={`flex-1 ${isPhone ? 'py-2.5' : 'py-2'} border-2 border-[#1360C6] bg-[#fff] rounded-md`}
              >
                <Text className="text-center text-[#1360C6] font-medium text-sm">Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleApply}
                activeOpacity={1}
                className={`flex-1 ${isPhone ? 'py-2.5' : 'py-2'} bg-[#1360C6] rounded-md`}
              >
                <Text className="text-center text-white font-medium text-sm">Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
export default memo(StatusFilter)