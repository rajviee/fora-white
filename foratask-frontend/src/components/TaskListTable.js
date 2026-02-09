import React, { useState, useEffect, useMemo } from "react"
import api from '../utils/api'
import { View, Text, ScrollView, Dimensions, TouchableOpacity, Pressable } from 'react-native'
import { Checkbox } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import * as navigation from "../navigation/navigationRef"
import { Plus, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react-native"
import { useApiQuery } from "../utils/useApiQuery"
import { useQueryClient } from '@tanstack/react-query';

const getPriorityClass = (priority) => {
    switch (priority) {
        case "High":
            return "bg-[#1360C6] text-white rounded-lg px-3 py-1 text-center"
        case "Medium":
            return "bg-[#1360C6BF] text-white rounded-lg px-3 py-1 text-center"
        case "Low":
            return "bg-[#1360C680] text-white rounded-lg px-3 py-1 text-center"
        default:
            return ""
    }
}

const getStatusClass = (status) => {
    switch (status) {
        case "Pending":
            return "text-white bg-[#D83939CC] rounded-md px-3 py-1 text-center"
        case "In Progress":
            return "text-white bg-[#FFC83BCC] rounded-md px-3 py-1 text-center"
        case "Completed":
            return "text-white bg-[#3A974CCC] rounded-md px-3 py-1 text-center"
        case "Overdue":
            return "text-white bg-[#103362CC] rounded-md px-3 py-1 text-center"
        case "For Approval":
            return "text-white bg-[#897DCDCC] rounded-md px-1 py-1 text-center"
        default:
            return ""
    }
}

// Skeleton Components
const SkeletonBox = ({ width = "100%", height = 16, className = "" }) => (
    <View
        className={`bg-gray-200 rounded  ${className}`}
        style={{ width, height }}
    />
);
const trimText = (text, maxLength = 80) =>
    text?.length > maxLength ? text.slice(0, maxLength) + '…' : text;

const SkeletonCardLoader = ({ count = 5, getFontSize }) => (
    <View className="py-2 px-0">
        {Array.from({ length: count }).map((_, index) => (
            <View
                key={`skeleton-card-${index}`}
                className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-4 mx-0"
            >
                <View className="flex-row items-start justify-between mb-3">
                    <SkeletonBox width="70%" height={getFontSize(18)} />
                    <SkeletonBox width={24} height={24} className="rounded-md" />
                </View>

                <View className="border-t border-gray-200 pt-3">
                    <View className="flex-row items-center mb-2">
                        <SkeletonBox width={80} height={getFontSize(28)} className="mr-4 rounded-md" />
                        <SkeletonBox width={100} height={getFontSize(28)} className="rounded-md" />
                    </View>

                    <SkeletonBox width="90%" height={getFontSize(14)} className="mb-2" />
                    <SkeletonBox width="60%" height={getFontSize(14)} className="mb-2" />

                    <View className="flex-row items-center mt-2">
                        <SkeletonBox width={120} height={getFontSize(14)} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);


const SkeletonTableLoader = ({ count = 5, getFontSize, isPhoneView }) => (
    <View className="w-full min-w-[300px]">
        {/* Header */}
        <View className="flex-row items-center py-3 px-4">
            <View className="w-[50px] items-center justify-center" />
            <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[3] min-w-[220px]'} pr-2`}>
                <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 font-medium">Task Name</Text>
            </View>
            <View className={`${isPhoneView ? 'w-[90px]' : 'w-[110px]'} px-2`}>
                <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 text-center font-medium">Priority</Text>
            </View>
            <View className={`${isPhoneView ? 'flex-1 min-w-[100px]' : 'flex-[1.3] min-w-[120px]'} px-2`}>
                <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 font-medium">Deadline</Text>
            </View>
            <View className={`${isPhoneView ? 'w-[120px]' : 'w-[130px]'} px-2`}>
                <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 font-medium text-center">Status</Text>
            </View>
        </View>

        {/* Skeleton Rows */}
        {Array.from({ length: count }).map((_, index) => (
            <View
                key={`skeleton-row-${index}`}
                className={`flex-row items-center border-b border-gray-200 py-1 px-4 min-h-[50px] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
            >
                <View className="w-[50px] items-center justify-center">
                    <SkeletonBox width={24} height={24} className="rounded-md" />
                </View>

                <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[3] min-w-[220px]'} pr-2`}>
                    <SkeletonBox width="85%" height={getFontSize(14)} />
                </View>

                <View className={`${isPhoneView ? 'w-[90px]' : 'w-[110px]'} px-2 items-center`}>
                    <SkeletonBox width="90%" height={getFontSize(26)} className="rounded-md" />
                </View>

                <View className={`${isPhoneView ? 'flex-1 min-w-[100px]' : 'flex-[1.3] min-w-[120px]'} px-2`}>
                    <SkeletonBox width="80%" height={getFontSize(14)} />
                </View>

                <View className={`${isPhoneView ? 'w-[120px]' : 'w-[130px]'} px-2 items-center`}>
                    <SkeletonBox width="90%" height={getFontSize(26)} className="rounded-md" />
                </View>
            </View>
        ))}
    </View>
);

function TaskListTable({
    isReady = true,
    debouncedQuery,
    apiname = "/task/getTaskList",
    isSelfTask,
    currentPage,
    setCurrentPage,
    fromDate,
    toDate,
    selectedStatuses,
    selectedTaskIds = [],
    onTaskSelectionChange = () => { },
    onSelectAllRef = null
}) {
    const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width)
    const [perPage] = useState(10)

    useEffect(() => {
        const subscription = Dimensions.addEventListener("change", ({ window }) => {
            setScreenWidth(window.width)
        })
        return () => subscription?.remove()
    }, [])
    const queryClient = useQueryClient();


    const queryParams = useMemo(() => ({
        fromDate,
        toDate,
        search: debouncedQuery,
        isSelfTask,
        page: currentPage - 1,
        perPage,
        ...(selectedStatuses?.length > 0
            ? { status: selectedStatuses.join(",") }
            : {}),
    }), [
        fromDate,
        toDate,
        debouncedQuery,
        isSelfTask,
        currentPage,
        perPage,
        selectedStatuses,
    ]);

    const {
        data,
        isLoading,
        isFetching,
        error,
        isSuccess,
    } = useApiQuery({
        key: ["getTaskList", apiname, queryParams],
        url: apiname,
        params: queryParams,
        enabled: isReady,
        keepPreviousData: false,
        staleTime: 30000,
        select: (res) => {
            const tasks = (res.tasks || []).map((task) => ({
                id: task._id,
                _id: task._id,
                isChecked: task.status === "Completed",
                taskName: task.title,
                description: task.description,
                title: task.title,
                assignee: task.assignees || [],
                observers: task.observers || [],
                priority: task.priority,
                deadline: new Date(task.dueDateTime).toLocaleDateString(),
                dueDateTime: task.dueDateTime,
                status: task.status,
                createdAt: task.createdAt,
            }));

            return {
                tasks,
                totalPages: res.totalPages || 0,
                totalTasks: res.totalTasks || 0,
            };
        },
        onError: (err) => {
            console.log("Error fetching tasks:", err.message);
        },
    });

    const tasks = data?.tasks || [];
    const totalPages = data?.totalPages || 0;
    const totalTasks = data?.totalTasks || 0;

    const [confirmVisible, setConfirmVisible] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    const openConfirmModal = (taskId) => {
        setSelectedTaskId(taskId);
        setConfirmVisible(true);
    };



    const handleCheckboxToggle = (taskId) => {
        const task = tasks.find(t => t.id === taskId);

        // Don't allow selecting already completed tasks
        if (task?.status === "Completed") return;

        if (selectedTaskIds.includes(taskId)) {
            onTaskSelectionChange(selectedTaskIds.filter(id => id !== taskId));
        } else {
            onTaskSelectionChange([...selectedTaskIds, taskId]);
        }
    };

    const handleSelectAll = () => {
        // Filter out completed tasks
        const incompleteTasks = tasks.filter(task => task.status !== "Completed");

        if (selectedTaskIds.length === incompleteTasks.length) {
            // Deselect all
            onTaskSelectionChange([]);
        } else {
            // Select all incomplete tasks
            onTaskSelectionChange(incompleteTasks.map(task => task.id));
        }
    };

    // Expose handleSelectAll to parent component
    useEffect(() => {
        if (onSelectAllRef) {
            onSelectAllRef.current = handleSelectAll;
        }
    }, [tasks, selectedTaskIds, onSelectAllRef]);

    const getFontSize = (baseSize) => {
        if (screenWidth < 640) return baseSize * 0.85;
        if (screenWidth < 768) return baseSize * 0.9;
        if (screenWidth < 1024) return baseSize * 0.95;
        return baseSize;
    };

    const isPhoneView = screenWidth < 1024

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
            // Clear selections when changing pages
            onTaskSelectionChange([]);
        }
    }

    const renderPagination = () => {
        if (isLoading || totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 3;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <View className={`flex-row items-center ${isPhoneView ? "justify-between" : "justify-center"} py-4 px-2 gap-2`}>

                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex-row items-center px-3 py-2 rounded-md border-2 ${currentPage === 1
                        ? "border-[#00000040] bg-gray-200"
                        : "border-[#00000080] bg-white hover:bg-gray-50"
                        }`}
                >
                    <ChevronLeft
                        strokeWidth={2.7}
                        size={getFontSize(16)}
                        color={currentPage === 1 ? "#00000040" : "#00000080"}
                    />
                    <Text style={{ fontSize: getFontSize(16) }} className={`ml-1 color-[#00000080] font-semibold`}>
                        Prev
                    </Text>
                </TouchableOpacity>

                {isPhoneView ? <View className="px-3"><Text className="font-semibold color-[#00000080]">
                    {`Page ${currentPage} of ${endPage}`}
                </Text>
                </View> :
                    <View className="flex-row items-center mx-2">
                        {startPage > 1 && (
                            <>
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => handlePageChange(1)}
                                    className="px-3 py-2 rounded-md border-2 border-[#00000080] bg-white mx-1"
                                >
                                    <Text style={{ fontSize: getFontSize(14) }} className="text-[#00000080] font-semibold">1</Text>
                                </TouchableOpacity>
                                {startPage > 2 && (
                                    <Text style={{ fontSize: getFontSize(14) }} className="px-2 text-[#00000080]">...</Text>
                                )}
                            </>
                        )}

                        {pageNumbers.map((pageNum) => (
                            <TouchableOpacity
                                activeOpacity={1}
                                key={pageNum}
                                onPress={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 rounded-md font-semibold border-2 mx-1 ${pageNum === currentPage
                                    ? "bg-[#1360C6] border-[#1360C6]"
                                    : "border-[#00000080] bg-white"
                                    }`}
                            >
                                <Text style={{ fontSize: getFontSize(14) }} className={`${pageNum === currentPage ? "text-white" : "text-[#00000080]"} font-semibold `}>
                                    {pageNum}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        {endPage < totalPages && (
                            <>
                                {endPage < totalPages - 1 && (
                                    <Text style={{ fontSize: getFontSize(14) }} className="px-2 text-gray-500">...</Text>
                                )}
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onPress={() => handlePageChange(totalPages)}
                                    className="px-3 py-2 rounded-md border-2  border-[#00000080] bg-white mx-1"
                                >
                                    <Text style={{ fontSize: getFontSize(14) }} className="text-[#00000080] font-semibold">{totalPages}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>}

                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex-row items-center px-3 py-2 rounded-md border-2 ${currentPage === totalPages
                        ? "border-[#00000040] bg-gray-200"
                        : "border-[#00000080] bg-white hover:bg-gray-50"
                        }`}
                >
                    <Text style={{ fontSize: getFontSize(16) }} className={`mr-1 color-[#00000080] font-semibold`}>
                        Next
                    </Text>
                    <ChevronRight
                        strokeWidth={2.7}
                        size={getFontSize(16)}
                        color={currentPage === totalPages ? "#00000040" : "#00000080"}
                    />
                </TouchableOpacity>

            </View>
        );
    };

    const renderCard = (item, index) => (
        <Pressable
            key={item.id}
            onPress={() => navigation.navigate("Task", {
                screen: "TaskDetails",
                params: { id: item._id }
            })}
        >
            <View className="bg-white rounded-lg border-[1.5px] border-[#00000080] p-4 mb-4 mx-0">
                <View className="flex-row items-start justify-between">
                    <Text
                        style={{ fontSize: getFontSize(18) }}
                        className={`text-gray-900 font-semibold ${item.isChecked ? 'line-through opacity-60' : ''}`}
                    >
                        {trimText(item.taskName, 23)}
                    </Text>
                    <Checkbox
                        className="pb-1"
                        status={selectedTaskIds.includes(item.id) || item.isChecked ? "checked" : "unchecked"}
                        onPress={() => item.isChecked ? openConfirmModal(item.id) : handleCheckboxToggle(item.id)}
                        uncheckedColor="#00000080"
                        disabled={item.isChecked}
                    />
                </View>

                <View className="border-t border-gray-200 pt-3">
                    <View className="flex-row items-center mb-2">
                        <View className="flex-row items-center mr-4">
                            <Text style={{ fontSize: getFontSize(13) }} className={`${getPriorityClass(item.priority)} rounded-md px-3 py-1.5 text-center font-medium`}>
                                {item.priority}
                            </Text>
                        </View>

                        <Text style={{ fontSize: getFontSize(14) }} className={`${getStatusClass(item.status)} px-3 py-1.5 font-medium`}>
                            {item.status}
                        </Text>
                    </View>
                    <Text
                        style={{ fontSize: getFontSize(14) }}
                        className="text-gray-700 mb-2"
                    >
                        {trimText(item.description, 30)}
                    </Text>

                    <View className="flex-row items-center">
                        <Text style={{ fontSize: getFontSize(14) }} className="text-[#010f42]">
                            {item.dueDateTime
                                ? new Date(item.dueDateTime).toLocaleString("en-US", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                })
                                : "No Deadline"}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );

    const renderTableHeader = () => {
        // Count incomplete tasks only
        const incompleteTasks = tasks.filter(task => task.status !== "Completed");
        const allIncompleteSelected = incompleteTasks.length > 0 &&
            selectedTaskIds.length === incompleteTasks.length;

        return (
            <View className="flex-row items-center py-3 px-4 bg-white border-b border-[#00000080]">
                <View className="w-[50px] items-center justify-center">
                    <Checkbox
                        uncheckedColor="#00000080"
                        className="py-0"
                        status={allIncompleteSelected ? "checked" : "unchecked"}
                        onPress={handleSelectAll}
                        disabled={incompleteTasks.length === 0}
                    />
                </View>

                <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[3] min-w-[220px]'} pr-2`}>
                    <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 font-medium">
                        Task Name
                    </Text>
                </View>

                <View className={`${isPhoneView ? 'w-[90px]' : 'w-[110px]'} px-2`}>
                    <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 text-center font-medium">
                        Priority
                    </Text>
                </View>

                <View className={`${isPhoneView ? 'flex-1 min-w-[100px]' : 'flex-[1.3] min-w-[120px]'} px-2`}>
                    <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 font-medium">
                        Deadline
                    </Text>
                </View>

                <View className={`${isPhoneView ? 'w-[120px]' : 'w-[130px]'} px-2`}>
                    <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700 font-medium text-center">
                        Status
                    </Text>
                </View>
            </View>
        );
    };

    const renderTableRows = () => (
        <>
            {tasks.map((item, index) => (
                <View
                    key={item.id}
                    className={`flex-row items-center border-b border-gray-200 py-1 px-4 min-h-[50px]
          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                    <View className="w-[50px] items-center justify-center">
                        <Checkbox
                            status={selectedTaskIds.includes(item.id) || item.isChecked ? "checked" : "unchecked"}
                            onPress={() => item.isChecked ? openConfirmModal(item.id) : handleCheckboxToggle(item.id)}
                            uncheckedColor="#00000080"
                            disabled={item.isChecked}
                        />
                    </View>

                    <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[3] min-w-[220px]'} pr-2`}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() =>
                                navigation.navigate("Task", {
                                    screen: "TaskDetails",
                                    params: { id: item._id },
                                })
                            }
                        >
                            <Text
                                numberOfLines={isPhoneView ? 1 : 2}
                                ellipsizeMode="tail"
                                style={{ fontSize: getFontSize(14), lineHeight: getFontSize(20) }}
                                className={`text-gray-900 ${item.isChecked ? 'line-through opacity-60' : ''}`}
                            >
                                {item.taskName}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View className={`${isPhoneView ? 'w-[90px]' : 'w-[110px]'} px-2 items-center`}>
                        <View className="w-[90%]">
                            <Text
                                style={{ fontSize: getFontSize(13) }}
                                className={`${getPriorityClass(item.priority)} rounded-md px-3 py-2 text-center font-medium`}
                            >
                                {item.priority}
                            </Text>
                        </View>
                    </View>

                    <View className={`${isPhoneView ? 'flex-1 min-w-[100px]' : 'flex-[1.3] min-w-[120px]'} px-2`}>
                        <Text style={{ fontSize: getFontSize(14) }} className="text-gray-700">
                            <Text style={{ fontSize: getFontSize(14) }} className="text-[#010f42]">
                                {item.dueDateTime
                                    ? new Date(item.dueDateTime).toLocaleString("en-US", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    })
                                    : "No Deadline"}
                            </Text>
                        </Text>
                    </View>

                    <View className={`${isPhoneView ? 'w-[120px]' : 'w-[130px]'} px-2 items-center`}>
                        <View className="w-[90%]">
                            <Text
                                style={{ fontSize: getFontSize(14) }}
                                className={`${getStatusClass(item.status)} font-medium`}
                            >
                                {item.status}
                            </Text>
                        </View>
                    </View>
                </View>
            ))}

            {tasks.length === 0 && isSuccess && (
                <View className="py-12 items-center bg-white">
                    <Text style={{ fontSize: getFontSize(16) }} className="text-gray-500">
                        No tasks found
                    </Text>
                    <Text style={{ fontSize: getFontSize(14) }} className="text-gray-400 mt-1">
                        {isSelfTask
                            ? "You don't have any self tasks yet"
                            : "No team tasks available"}
                    </Text>
                </View>
            )}
        </>
    );

    const renderCards = () => (
        <View className="p-2">
            {tasks.length === 0 && isSuccess && (
                <View className="py-12 items-center">
                    <Text style={{ fontSize: getFontSize(16) }} className="text-gray-500">No tasks found</Text>
                    <Text style={{ fontSize: getFontSize(14) }} className="text-gray-400 mt-1">
                        {isSelfTask ? "You don't have any self tasks yet" : "No team tasks available"}
                    </Text>
                </View>
            )}
            {tasks.map((item, index) => renderCard(item, index))}
        </View>
    );

    const showSkeleton = isLoading && !data;

    return (
        <View className="flex-1 w-full">
            <View className="flex-1 rounded-lg mb-4 bg-white">
                {showSkeleton ? (
                    isPhoneView ? (
                        <ScrollView
                            className="flex-1"
                            showsVerticalScrollIndicator={true}
                            persistentScrollbar={true}
                        >
                            <SkeletonCardLoader count={perPage} getFontSize={getFontSize} />
                        </ScrollView>
                    ) : (
                        <ScrollView
                            horizontal={isPhoneView}
                            showsHorizontalScrollIndicator={isPhoneView}
                            showsVerticalScrollIndicator={!isPhoneView}
                            persistentScrollbar={true}
                            className="flex-1 max-h-[75vh]"
                            contentContainerStyle={isPhoneView ? { minWidth: '100%' } : undefined}
                        >
                            <SkeletonTableLoader
                                count={perPage}
                                getFontSize={getFontSize}
                                isPhoneView={isPhoneView}
                            />
                        </ScrollView>
                    )
                ) : (
                    <>
                        {isPhoneView ? (
                            <ScrollView
                                className="flex-1"
                                showsVerticalScrollIndicator={true}
                                persistentScrollbar={true}
                            >
                                {renderCards()}
                            </ScrollView>
                        ) : (
                            <View className="flex-1 max-h-[75vh]">
                                <View className="bg-white">
                                    {renderTableHeader()}
                                </View>

                                <ScrollView showsVerticalScrollIndicator>
                                    <ScrollView
                                        horizontal={isPhoneView}
                                        showsHorizontalScrollIndicator={isPhoneView}
                                        persistentScrollbar
                                        contentContainerStyle={isPhoneView ? { minWidth: '100%' } : undefined}
                                    >
                                        <View className="min-w-[300px]">
                                            {renderTableRows()}
                                        </View>
                                    </ScrollView>
                                </ScrollView>
                            </View>
                        )}
                    </>
                )}
            </View>
            {renderPagination()}
        </View>
    )
}

export default TaskListTable