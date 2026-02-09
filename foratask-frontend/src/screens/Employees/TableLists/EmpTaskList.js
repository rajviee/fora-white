import React, { useRef, useState } from 'react'
import { ScrollView, View, Dimensions, Text, TouchableOpacity, Platform, KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native'
import TaskListTable from '../../../components/TaskListTable'
import SearchReport from '../../../components/SearchReport'
import CalendarDatePicker from '../../../components/CalendarDatePicker'
import StatusFilter from '../../../components/StatusFilter'
import { CheckCircle2, ChevronLeft } from "lucide-react-native"
import ConfirmCompleteModal from '../../../components/ConfirmCompleteModal'
import api from '../../../utils/api'
import { useQueryClient } from '@tanstack/react-query'
import { Checkbox } from "react-native-paper"


function EmpTaskList({userId}) {
    const [debouncedQuery, setDebouncedQuery] = React.useState(null);
    const [isSelfTask, setIsSelfTask] = React.useState(false)
    const [currentPage, setCurrentPage] = React.useState(1);
    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);

    // Create "today at 00:00:00.000"
    const startOfToday = new Date(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate(), 0, 0, 0, 0);

    // Create "today at 23:59:59.999"
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
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
                // status: "Completed"
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
    const handleToggleTaskType = (isSelf) => {
        setIsSelfTask(isSelf)
        setCurrentPage(1)
        setSelectedTaskIds([]) // Clear selections when switching
    }

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
        <View>
            <ConfirmCompleteModal
                visible={confirmVisible}
                onConfirm={handleConfirmBulkComplete}
                onCancel={() => setConfirmVisible(false)}
                message={`Mark ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} as completed?`}
            />
            <View className="bg-white p-0 rounded-xl border-[1.5px] border-[#00000080]">
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
                        <View className="flex-row justify-center items-center">
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => handleToggleTaskType(true)}
                                className={`border-[1px] border-[#1360C6] px-3 py-1.5 rounded-l-[6px] ${isSelfTask ? "bg-[#1360C6]" : "bg-white"}`}
                            >
                                <Text style={{ fontSize: getFontSize(14) }} className={`${isSelfTask ? "text-white" : "text-[#1360C6]"} font-semibold`}>
                                    Self
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => handleToggleTaskType(false)}
                                className={`border-[1px] border-[#1360C6] px-3 py-1.5 rounded-r-[6px] ${!isSelfTask ? "bg-[#1360C6]" : "bg-white"}`}
                            >
                                <Text style={{ fontSize: getFontSize(14) }} className={`${!isSelfTask ? "text-white" : "text-[#1360C6]"} font-semibold`}>
                                    Team
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <CalendarDatePicker fromDate={fromDate} toDate={toDate} setFromDate={setFromDate} setToDate={setToDate} />
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
                    onSelectAllRef={selectAllRef}
                    apiname={`get-employee-tasks?targetUser=${userId}`} />
            </View>
        </View>
    )
}

export default React.memo(EmpTaskList)
