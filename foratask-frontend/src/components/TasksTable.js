import React, { useContext, useState, useRef, useEffect } from 'react'
import { Checkbox } from 'react-native-paper';
import { View, Text, Dimensions, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import api from '../utils/api';
import { useNavigation } from '@react-navigation/native';
import ConfirmCompleteModal from "./ConfirmCompleteModal"
import { useApiQuery } from '../utils/useApiQuery';
import { DashboardContext } from "../utils/Context/DashboardContext";
import { useQueryClient } from '@tanstack/react-query';


function TasksTable() {
  const { setWidthComp, isSelfTask, setIsSelfTask } = useContext(DashboardContext);
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [tasks, setTasks] = React.useState([]);
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = React.useState(Dimensions.get('window').height);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(0);
  const [perPage] = React.useState(5);
  const [totalTasks, setTotalTasks] = React.useState(0);

  // ========================================
  // MULTI-SELECT STATE
  // ========================================
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
  const selectAllRef = useRef(null);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  const queryParams = React.useMemo(() => ({
    isSelfTask,
    page: currentPage - 1,
    perPage
  }), [isSelfTask, currentPage, perPage])

  const { data, isLoading, error } = useApiQuery({
    key: "todaysTasks",
    url: "/stats/todaysTasks",
    params: queryParams,
    select: (res) => {
      const tasks = (res.tasks || []).map((task) => ({
        id: task._id,
        _id: task._id,
        isChecked: task.status === 'Completed',
        taskName: task.title,
        description: task.description,
        title: task.title,
        assignee: task.assignees || [],
        observers: task.observers || [],
        priority: task.priority,
        deadline: new Date(task.dueDateTime).toLocaleDateString(),
        dueDateTime: task.dueDateTime,
        status: task.status,
        createdAt: task.createdAt
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
  })

  React.useEffect(() => {
    if (data) {
      setTasks(data.tasks);
      setTotalPages(data.totalPages);
      setTotalTasks(data.totalTasks);
    }
  }, [data]);

  // Responsive font sizes based on screen width
  const getFontSize = (baseSize) => {
    if (screenWidth < 640) return baseSize * 0.85;
    if (screenWidth < 768) return baseSize * 0.9;
    if (screenWidth < 1024) return baseSize * 0.95;
    return baseSize;
  };



  const isPhoneView = screenWidth < 1024;

  // ========================================
  // MULTI-SELECT HANDLERS
  // ========================================
  const handleTaskSelectionChange = (taskId) => {
    const task = tasks.find(t => t.id === taskId);

    // Don't allow selecting already completed tasks
    if (task?.status === "Completed") return;

    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleSelectAll = () => {
    // Filter out completed tasks
    const incompleteTasks = tasks.filter(task => task.status !== "Completed");

    if (selectedTaskIds.length === incompleteTasks.length) {
      // Deselect all
      setSelectedTaskIds([]);
    } else {
      // Select all incomplete tasks
      setSelectedTaskIds(incompleteTasks.map(task => task.id));
    }
  };

  // Expose handleSelectAll to parent component for mobile select-all
  useEffect(() => {
    if (selectAllRef) {
      selectAllRef.current = handleSelectAll;
    }
  }, [tasks, selectedTaskIds]);

  const handleConfirmBulkComplete = async () => {
    if (selectedTaskIds.length === 0) return;

    try {
      await api.patch(
        `/task/markAsCompleted`,
        {
          taskIds: selectedTaskIds,
          // status: "Completed" 
        },
        { headers: { "Content-Type": "application/json" } }
      );

      // Update local state
      setTasks(
        tasks.map((t) =>
          selectedTaskIds.includes(t.id) ? { ...t, isChecked: true, status: "Completed" } : t
        )
      );

      setSelectedTaskIds([]);
      queryClient.invalidateQueries(['todaysTasks']);
    } catch (err) {
      console.error("Error bulk updating tasks:", err.message);
    } finally {
      setBulkConfirmVisible(false);
    }
  };

  // ========================================
  // SINGLE TASK HANDLERS (existing)
  // ========================================
  const openConfirmModal = (taskId) => {
    setSelectedTaskId(taskId);
    setConfirmVisible(true);
  };

  const closeConfirmModal = () => {
    setConfirmVisible(false);
    setSelectedTaskId(null);
  };

  const handleConfirmComplete = async () => {
    if (!selectedTaskId) return;
    try {
      setTasks(
        tasks.map((t) =>
          t.id === selectedTaskId ? { ...t, isChecked: true, status: "Completed" } : t
        )
      );

      await api.patch(
        `/task/update/${selectedTaskId}`,
        { status: "Completed" },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      queryClient.invalidateQueries(['todaysTasks']);
    } catch (err) {
      console.error("Error updating task:", err.message);
    } finally {
      closeConfirmModal();
    }
  };

  const handleToggleTaskType = (isSelf) => {
    setIsSelfTask(isSelf);
    setCurrentPage(1);
    setSelectedTaskIds([]); // Clear selections when toggling
  };

  const trimText = (text, maxLength = 80) =>
    text?.length > maxLength ? text.slice(0, maxLength) + '…' : text;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedTaskIds([]); // Clear selections when changing pages
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'High':
        return "bg-[#1360C6] text-white";
      case 'Medium':
        return "bg-[#1360C6BF] text-white";
      case 'Low':
        return "bg-[#1360C680] text-white";
      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "text-[#FFF] bg-[#D83939CC]  text-center"
      case "In Progress":
        return "text-[#FFF] bg-[#FFC83BCC]  text-center"
      case "Completed":
        return "text-[#FFF] bg-[#3A974CCC]  text-center"
      case "Overdue":
        return "text-[#FFF] bg-[#103362CC]  text-center"
      case "For Approval":
        return "text-[#FFF] bg-[#897DCDCC]  text-center"
      default:
        return ""
    }
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;

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
            <View className={`flex-row items-center ${isPhoneView?"justify-between":"justify-center"} py-4 px-2 gap-2`}>
                
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
      key={index}
      onPress={() => navigation.navigate("Task", {
        screen: "TaskDetails",
        params: { id: item._id }
      })}>
      <View
        key={item.id}
        className="bg-white rounded-lg border-[1px] border-[#010f42] p-4 pt-1 mb-4 mx-0"
      >
        <View className="flex-row items-center justify-between">
          <Text
            style={{ fontSize: getFontSize(18) }}
            className={`text-gray-900 font-semibold  ${item.isChecked ? 'line-through opacity-60' : ''}`}
          >
            {trimText(item.taskName, 23)}
          </Text>
          <Checkbox
            className="pb-1"
            status={selectedTaskIds.includes(item.id) || item.isChecked ? "checked" : "unchecked"}
            onPress={() => item.isChecked ? openConfirmModal(item.id) : handleTaskSelectionChange(item.id)}
            uncheckedColor="#00000080"
            disabled={item.isChecked}
          />
        </View>

        <View className=" border-t-[1px] border-[#010f42] pt-3">
          <View className="flex-row items-center mb-2">
            <View className="flex-row items-center mr-4">
              <Text style={{ fontSize: getFontSize(14) }} className={`${getPriorityClass(item.priority)} rounded-md px-3 py-1.5 text-center font-medium`}>
                {item.priority}
              </Text>
            </View>

            <Text style={{ fontSize: getFontSize(14) }} className={`${getStatusClass(item.status)} rounded-md px-3 py-1.5 text-center font-medium`}>
              {item.status}
            </Text>
          </View>
          <Text
            style={{ fontSize: getFontSize(14) }}
            className="text-[#010f42] mb-2"
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

  const renderTable = () => {
    // Count incomplete tasks only
    const incompleteTasks = tasks.filter(task => task.status !== "Completed");
    const allIncompleteSelected = incompleteTasks.length > 0 &&
      selectedTaskIds.length === incompleteTasks.length;

    return (
      <View className="w-full min-w-[300px]">
        <View className="flex-row items-center border-b border-[#00000080] py-3 px-4 ">
          {/* Desktop Select All Checkbox */}
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
            <Text style={{ fontSize: getFontSize(16) }} className="text-[#6C757D] font-[600]">Task Name</Text>
          </View>
          <View className={`${isPhoneView ? 'w-[90px]' : 'w-[110px]'} px-2`}>
            <Text style={{ fontSize: getFontSize(16) }} className="text-[#6C757D] text-center font-[600]">Priority</Text>
          </View>
          <View className={`${isPhoneView ? 'flex-1 min-w-[100px]' : 'flex-[1.3] min-w-[120px]'} px-2`}>
            <Text style={{ fontSize: getFontSize(16) }} className="text-[#6C757D] font-[600]">Deadline</Text>
          </View>
          <View className={`${isPhoneView ? 'w-[120px]' : 'w-[130px]'} px-2`}>
            <Text style={{ fontSize: getFontSize(16) }} className="text-[#6C757D] font-[600] text-center">Status</Text>
          </View>
        </View>

        {tasks.map((item, index) => (
          <View
            className={`flex-row items-center border-b border-gray-200 py-2 px-4 min-h-[55px] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              }`}
            key={item.id}
          >
            <View className="w-[50px] items-center justify-center">
              <Checkbox
                status={selectedTaskIds.includes(item.id) || item.isChecked ? "checked" : "unchecked"}
                onPress={() => item.isChecked ? openConfirmModal(item.id) : handleTaskSelectionChange(item.id)}
                uncheckedColor="#00000080"
                disabled={item.isChecked}
              />
            </View>
            <View
              className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[3] min-w-[220px]'} pr-2`}
            >
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => navigation.navigate("Task", {
                  screen: "TaskDetails",
                  params: { id: item._id }
                })}
              >
                <Text
                  numberOfLines={isPhoneView ? 1 : 2}
                  ellipsizeMode="tail"
                  style={{ fontSize: getFontSize(16), lineHeight: getFontSize(20) }}
                  className={`text-gray-900 ${item.isChecked ? 'line-through opacity-60' : ''}`}
                >
                  {item.taskName}
                </Text>
              </TouchableOpacity>
            </View>
            <View className={`${isPhoneView ? 'w-[90px]' : 'w-[110px]'} px-2 items-center`}>
              <View className="w-[90%]">
                <Text style={{ fontSize: getFontSize(14) }} className={`${getPriorityClass(item.priority)} rounded-md px-3 py-2 text-center font-medium`}>
                  {item.priority}
                </Text>
              </View>
            </View>
            <View className={`${isPhoneView ? 'flex-1 min-w-[100px]' : 'flex-[1.3] min-w-[120px]'} px-2`}>
              <Text style={{ fontSize: getFontSize(16) }} className="text-gray-700">
                {new Date(item.dueDateTime).toLocaleTimeString('en-US', {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            </View>
            <View className={`${isPhoneView ? 'w-[120px]' : 'w-[130px]'} px-2 items-center`}>
              <View className="w-[90%]">
                <Text style={{ fontSize: getFontSize(14) }} className={`${getStatusClass(item.status)} rounded-md px-3 py-2 text-center font-medium`}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {tasks.length === 0 && (
          <View className="py-12 items-center bg-white">
            <Text style={{ fontSize: getFontSize(16) }} className="text-gray-500">No tasks found</Text>
            <Text style={{ fontSize: getFontSize(14) }} className="text-gray-400 mt-1">
              {isSelfTask ? "You don't have any self tasks yet" : "No team tasks available"}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCards = () => (
    <View className="py-2 px-3">
      {tasks.length === 0 && (
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

  return (
    <View onLayout={(e) => {
      const { width } = e.nativeEvent.layout;
      setWidthComp(width)
    }} className="flex-1 w-full bg-white rounded-xl border-[1px] border-[#00000080]">

      {/* Single Task Completion Modal */}
      {/* <ConfirmCompleteModal
        visible={confirmVisible}
        onConfirm={handleConfirmComplete}
        onCancel={closeConfirmModal}
      /> */}

      {/* Bulk Task Completion Modal */}
      <ConfirmCompleteModal
        visible={bulkConfirmVisible}
        onConfirm={handleConfirmBulkComplete}
        onCancel={() => setBulkConfirmVisible(false)}
        message={`Are you sure you want to mark ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''} as completed?`}
      />

      <View className="flex-row justify-between items-start px-6 pt-2 gap-2">
        <View className="flex-row items-center justify-between gap-3 flex-1">
          <Text style={{ fontSize: getFontSize(20) }} className="font-semibold ">
            Today's Task
          </Text>

          {/* Mark as Completed Button - appears when tasks selected */}
          {selectedTaskIds.length > 0 && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setBulkConfirmVisible(true)}
              className="flex-row items-center bg-[#1360C6] px-3 py-1.5 rounded-lg"
            >
              <Text style={{ fontSize: getFontSize(13) }} className="text-white font-medium">
                Mark as Completed ({selectedTaskIds.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mobile Select-All Checkbox - only visible on phone view */}
        {isPhoneView && (
          <Checkbox
            uncheckedColor="#00000080"
            className="mr-1.5 py-0"
            status={selectedTaskIds.length > 0 ? "checked" : "unchecked"}
            onPress={handleSelectAll}
          />
        )}
      </View>

      <View className="flex-1 rounded-lg mb-4 bg-white ">
        {isPhoneView ? (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={true}
            persistentScrollbar={true}
          >
            {renderCards()}
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
            {renderTable()}
          </ScrollView>
        )}
      </View>

      {renderPagination()}
    </View>
  )
}

export default TasksTable