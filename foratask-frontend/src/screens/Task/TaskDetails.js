// screens/TaskDetail.js
import React, { useEffect, useState } from "react";
import { View, Text, Platform, Linking } from "react-native";
import { useRoute } from "@react-navigation/native";
import api from "../../utils/api";
import useUserStore from "../../stores/useUserStore";
import ViewTask from "./TaskOps/ViewTask"
import EditTask from "./TaskOps/EditTask";
import { useToast } from "../../components/Toast";

export default function TaskDetail() {
  const route = useRoute();
  const { id } = route.params;
  const [task, setTask] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { user } = useUserStore();
  const toast = useToast();

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const res = await api.get(`/task/${id}`);
      setTask(res.data);
    } catch (err) {
      console.error("Error fetching task:", err);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveSuccess = async () => {
    await fetchTask(); // Refresh task data
    setIsEditMode(false);
  };

  const handleTaskUpdate = () => {
    fetchTask(); // Refresh task data
  };

  if (!task) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  // Check if user is viewer/admin (has full edit rights)
  const isViewer = task.observers?.some(observer => observer._id === user._id);
  const isAdmin = user.role === "admin";
  const isDoer = task.assignees?.some(assignee => assignee._id === user._id);
  
  // If user is both doer and viewer, treat as viewer (full edit rights)
  const canEditAll = isViewer || isAdmin;
  const isDoerOnly = isDoer && !canEditAll;

  // Toggle between View and Edit mode (only for viewers/admins and doers)
  if (isEditMode && (canEditAll || isDoerOnly)) {
    return (
      <>
        <toast.ToastContainer />
        <EditTask
          task={task}
          onCancel={handleCancelEdit}
          onSaveSuccess={handleSaveSuccess}
          isDoerOnly={isDoerOnly}
        />
      </>
    );
  }

  return (
    <>
      <toast.ToastContainer />
      <ViewTask
        task={task}
        user={user}
        onEditClick={handleEditClick}
        onTaskUpdate={handleTaskUpdate}
      />
    </>
  );
}