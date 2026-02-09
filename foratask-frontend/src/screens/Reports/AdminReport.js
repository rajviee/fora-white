import React, { useState, useEffect } from 'react'
import { ScrollView, View, Dimensions, Text, TouchableOpacity, Platform, KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native'
import TaskSummaryCards from '../../components/TaskSummaryCards';
import { ChevronLeft } from "lucide-react-native"
import TaskListTable from '../../components/TaskListTable';
import SearchReport from '../../components/SearchReport';
import CalendarDatePicker from '../../components/CalendarDatePicker';
import { useNavigation } from "@react-navigation/native"
import StatusFilter from '../../components/StatusFilter';
// Add these to your imports:
import { useRef } from "react"  // if not already imported
import { CheckCircle2 } from "lucide-react-native"
import ConfirmCompleteModal from "../../components/ConfirmCompleteModal"
import api from '../../utils/api'
import { useQueryClient } from '@tanstack/react-query'
import { Checkbox } from "react-native-paper"


function AdminReport() {
  const [debouncedQuery, setDebouncedQuery] = React.useState(null);
  const navigation = useNavigation()
  const [isSelfTask, setIsSelfTask] = React.useState(false)
  const [currentPage, setCurrentPage] = React.useState(1);
  // Get the current date/time
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

  // Create "today at 00:00:00.000"
  const startOfToday = new Date(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate(), 0, 0, 0, 0);

  // Create "today at 23:59:59.999"
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Now set them in state
  const [fromDate, setFromDate] = React.useState(startOfToday);
  const [toDate, setToDate] = React.useState(endOfToday);

  const queryClient = useQueryClient();  // if not already there
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const selectAllRef = useRef(null);

  const handleTaskSelectionChange = (newSelectedIds) => {
    setSelectedTaskIds(newSelectedIds);
  };

  const handleConfirmBulkComplete = async () => {
    if (selectedTaskIds.length === 0) return;
    try {
      await api.patch(`/task/markAsCompleted`, {
        taskIds: selectedTaskIds,
      }, { headers: { "Content-Type": "application/json" } });
      setSelectedTaskIds([]);
      queryClient.invalidateQueries(['getTaskList']);
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      setConfirmVisible(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAllRef.current) {
      selectAllRef.current();
    }
  };

  const [selectedStatuses, setSelectedStatuses] = React.useState([]);
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = React.useState(Dimensions.get('window').height);
    const isPhoneView = screenWidth < 1024;

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);
  const getFontSize = (baseSize) => {
    if (screenWidth < 640) return baseSize * 0.85; // Small mobile
    if (screenWidth < 768) return baseSize * 0.9;  // Large mobile
    if (screenWidth < 1024) return baseSize * 0.95; // Tablet
    return baseSize; // Desktop
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}  // << important
    >
      <ScrollView
        className="flex-1 w-full bg-[#FBFBFB]"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ConfirmCompleteModal
          visible={confirmVisible}
          onConfirm={handleConfirmBulkComplete}
          onCancel={() => setConfirmVisible(false)}
          message={`Mark ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} as completed?`}
        />

        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => navigation?.goBack()}
            className="flex-row items-center gap-1"
          >
            <ChevronLeft size={22} color="#000" />
            <Text style={{ fontSize: getFontSize(20) }} className="text-[1.5rem] font-[600] text-black">Admin Report </Text>
          </TouchableOpacity>
          <CalendarDatePicker fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} />
        </View>


        <TaskSummaryCards reportType={'admin-report-summary'} fromDate={fromDate} toDate={toDate} />
        <View className="bg-white rounded-md border-[1.5px] border-[#00000080]">
          <View className="flex-row flex-wrap justify-between items-center py-2 px-4 w-full gap-1">
            <View className="flex-row justify-between items-center w-full lg:w-auto lg:flex-1">
              <Text className="font-[600] text-xl mb-2 sm:mb-0">All Task </Text>
              {selectedTaskIds.length > 0 && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setConfirmVisible(true)}
                  className="flex-row items-center bg-[#1360C6] px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-medium">
                    Mark as Completed ({selectedTaskIds.length})
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row flex-wrap justify-end gap-2 w-full lg:w-auto  lg:mt-0">
              <SearchReport setDebouncedQuery={setDebouncedQuery} setCurrentPage={setCurrentPage} />
              <StatusFilter
                selectedStatuses={selectedStatuses}
                setSelectedStatuses={setSelectedStatuses}
                setCurrentPage={setCurrentPage}
              />
              {isPhoneView && (
                <Checkbox
                  uncheckedColor="#00000080"
                  className="mr-[10px] pt-1"
                  status={selectedTaskIds.length > 0 ? "checked" : "unchecked"}
                  onPress={handleSelectAll}
                />
              )}
            </View>
          </View>
          <TaskListTable debouncedQuery={debouncedQuery} isSelfTask={isSelfTask} currentPage={currentPage} setCurrentPage={setCurrentPage} fromDate={fromDate} toDate={toDate} selectedStatuses={selectedStatuses}
            selectedTaskIds={selectedTaskIds}
            onTaskSelectionChange={handleTaskSelectionChange}
            onSelectAllRef={selectAllRef} />
        </View>
        {/* </View> */}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export default AdminReport
