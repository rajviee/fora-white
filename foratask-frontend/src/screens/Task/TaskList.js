"use client"
import { useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Checkbox } from "react-native-paper"
import { Plus, MoreHorizontal, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react-native"
import CalendarDatePicker from "../../components/CalendarDatePicker"
import StatusFilter from "../../components/StatusFilter"
import TaskListTable from "../../components/TaskListTable"
import api from '../../utils/api'
import { useQueryClient } from '@tanstack/react-query';
import ConfirmCompleteModal from "../../components/ConfirmCompleteModal"

export default function TaskList() {
    const [debouncedQuery, setDebouncedQuery] = React.useState(null);
    const navigation = useNavigation()
    const queryClient = useQueryClient();

    const now = new Date();
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    const startOfToday = new Date(monthAgo.getFullYear(), monthAgo.getMonth(), monthAgo.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [fromDate, setFromDate] = React.useState(startOfToday);
    const [toDate, setToDate] = React.useState(endOfToday);
    const route = useRoute();
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [isReady, setIsReady] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState([]);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [screenWidth, setScreenWidth] = React.useState(Dimensions.get('window').width);

    useEffect(() => {
        const subscription = Dimensions.addEventListener("change", ({ window }) => {
            setScreenWidth(window.width)
        })
        return () => subscription?.remove()
    }, [])

    useEffect(() => {
        const raw = route.params?.statusFilter;
        const isAllTime = route.params?.isAllTime;
        const isSelf = route.params?.isSelfTask;
        if (isSelf) {
            setIsSelfTask(isSelf)
        }
        if (isAllTime) {
            setFromDate(null);
            setToDate(null);
        }
        if (raw) {
            const normalized = Array.isArray(raw) ? raw : [raw];
            setSelectedStatuses(normalized);
        }
        setIsReady(true);
    }, [route.params]);

    const [isSelfTask, setIsSelfTask] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const selectAllRef = useRef(null);

    const getFontSize = (baseSize) => {
        if (screenWidth < 640) return baseSize * 0.85;
        if (screenWidth < 768) return baseSize * 0.9;
        if (screenWidth < 1024) return baseSize * 0.95;
        return baseSize;
    };

    const isPhoneView = screenWidth < 1024;

    const handleToggleTaskType = (isSelf) => {
        setIsSelfTask(isSelf)
        setCurrentPage(1)
        setSelectedTaskIds([]) // Clear selections when switching
    }

    const handleTaskSelectionChange = (newSelectedIds) => {
        setSelectedTaskIds(newSelectedIds);
    };

    const openConfirmModal = () => {
        setConfirmVisible(true);
    };

    const closeConfirmModal = () => {
        setConfirmVisible(false);
    };

    const handleConfirmBulkComplete = async () => {
        if (selectedTaskIds.length === 0) return;

        try {
            // Send array of IDs in the request body
            await api.patch(
                `/task/markAsCompleted`,
                {
                    taskIds: selectedTaskIds,
                    // status: "Completed"
                },
                { headers: { "Content-Type": "application/json" } }
            );

            // Clear selections and refresh data
            setSelectedTaskIds([]);
            queryClient.invalidateQueries(['getTaskList']);
        } catch (err) {
            console.error("Error bulk updating tasks:", err.message);
        } finally {
            closeConfirmModal();
        }
    };

    const handleSelectAll = () => {
        // Call the select all function from TaskListTable
        if (selectAllRef.current) {
            selectAllRef.current();
        }
    };

    return (
        <ScrollView
            className="flex-1 w-full bg-[#FBFBFB]"
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
        >
            <ConfirmCompleteModal
                visible={confirmVisible}
                onConfirm={handleConfirmBulkComplete}
                onCancel={closeConfirmModal}
                message={`Are you sure you want to mark ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} as completed?`}
            />

            <View className="flex-row justify-between pt-2 mb-3">
                <View className="flex-row items-center gap-3">
                    <Text className="text-[1.5rem] font-[600] text-black">Tasks</Text>

                </View>

                <View className="flex-row flex-wrap justify-end gap-2">
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

                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => navigation.navigate("Task", { screen: "AddTask" })}
                        className="flex-row items-center bg-[#1360C6] px-4 py-2 rounded-lg"
                    >
                        <View className="mr-2">
                            <Plus size={18} color="white" />
                        </View>
                        <Text className="text-white font-medium">Add Task</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-white pb-0 rounded-md border-[1.5px] border-[#00000080]">
                <View className="flex-row flex-wrap px-4 pt-4 justify-between items-center py-0 w-full gap-1">
                    <View className="flex-row justify-between items-center w-full lg:w-auto lg:flex-1">
                        <Text className="text-xl font-[600] text-[#1360C6]">All Tasks</Text>
                        {/* Mark as Completed Button - shown when tasks are selected */}
                        {selectedTaskIds.length > 0 && (
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={openConfirmModal}
                                className="flex-row items-center bg-[#1360C6] px-4 py-2 rounded-lg"
                            >
                                <Text className="text-white font-medium">
                                    Mark as Completed ({selectedTaskIds.length})
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View className="flex-row flex-wrap justify-end gap-2 w-full lg:w-auto mt-2 lg:mt-0">
                        <CalendarDatePicker
                            fromDate={fromDate}
                            toDate={toDate}
                            setFromDate={setFromDate}
                            setToDate={setToDate}
                        />
                        <StatusFilter
                            selectedStatuses={selectedStatuses}
                            setSelectedStatuses={setSelectedStatuses}
                            setCurrentPage={setCurrentPage}
                        />

                        {/* Mobile view select all checkbox - hidden on laptop */}
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

                <TaskListTable
                    isReady={isReady}
                    debouncedQuery={debouncedQuery}
                    isSelfTask={isSelfTask}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    fromDate={fromDate}
                    toDate={toDate}
                    selectedStatuses={selectedStatuses}
                    selectedTaskIds={selectedTaskIds}
                    onTaskSelectionChange={handleTaskSelectionChange}
                    onSelectAllRef={selectAllRef}
                />
            </View>
        </ScrollView>
    )
}