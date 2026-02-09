// components/ViewTask.js
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Platform, Linking, Pressable, Modal, TextInput } from "react-native";
import { Clock, FileText, Download, Edit, Upload, Trash2, ChevronDown, AlertCircle, ChevronLeft, X } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import Avatar from "../../../components/Avatar";
import { useToast } from "../../../components/Toast";
import { useNavigation } from "@react-navigation/native"
import api from "../../../utils/api";

const getPriorityClass = (priority) => {
  switch (priority) {
    case "High":
      return {
        container: "bg-[#1360C6] rounded-lg px-3 py-1",
        text: "text-white text-center font-medium",
      };
    case "Medium":
      return {
        container: "bg-[#1360C6BF] rounded-lg px-3 py-1",
        text: "text-white text-center font-medium",
      };
    case "Low":
      return {
        container: "bg-[#1360C680] rounded-lg px-3 py-1",
        text: "text-white text-center font-medium",
      };
    default:
      return { container: "", text: "" };
  }
};

const getStatusClass = (status) => {
  switch (status) {
    case "Pending":
      return {
        container: "bg-[#D83939CC] rounded-md px-3 py-1",
        text: "text-white text-center font-medium",
      };
    case "In Progress":
      return {
        container: "bg-[#FFC83BCC] rounded-md px-3 py-1",
        text: "text-white text-center font-medium",
      };
    case "Completed":
      return {
        container: "bg-[#3A974CCC] rounded-md px-3 py-1",
        text: "text-white text-center font-medium",
      };
    case "Overdue":
      return {
        container: "bg-[#103362CC] rounded-md px-3 py-1",
        text: "text-white text-center font-medium",
      };
    case "For Approval":
      return {
        container: "bg-[#897DCDCC] rounded-md px-3 py-1",
        text: "text-white text-center font-medium",
      };
    default:
      return { container: "", text: "" };
  }
};

const trimText = (text, maxLength = 80) =>
  text.length > maxLength ? text.slice(0, maxLength) + '…' : text;

export default function ViewTask({ task, user, onEditClick, onTaskUpdate }) {
  const toast = useToast();
  const navigation = useNavigation()

  // Determine user role
  const isDoer = task.assignees?.some(assignee => assignee._id === user._id);
  const isViewer = task.observers?.some(observer => observer._id === user._id);
  const isAdmin = user.role === "admin";

  // If user is both doer and viewer, treat as viewer (full edit rights)
  const canEditAll = isViewer || isAdmin;
  const canEdit = isDoer || canEditAll;
  const isCompleted = task.status === "Completed";

  return (
    <ScrollView className="flex-1 bg-[#FBFBFB] p-4">
      <View className="flex-row justify-between items-center mb-3">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => navigation?.goBack()}
          className="flex-row items-center gap-1"
        >
          <ChevronLeft size={22} color="#000" />
          <Text className="text-[1.5rem] font-[600] text-black">Task</Text>
        </TouchableOpacity>
      </View>
      {/* <Text className="text-[1.8rem] font-[600] text-[#495057] pb-3">Task</Text> */}
      <View className="p-3 bg-white border border-[#efeff2] rounded-[6px]">
        {/* Title & Description */}
        <View className="sm:flex-row flex-col justify-between mb-4 gap-1">
          <Text className="text-lg font-semibold">{task.title}</Text>
          <View className="flex-row gap-2">
            <View className={getStatusClass(task.status).container}>
              <Text className={getStatusClass(task.status).text}>{task.status}</Text>
            </View>
            <View className={getPriorityClass(task.priority).container}>
              <Text className={getPriorityClass(task.priority).text}>{task.priority}</Text>
            </View>
            {/* Edit Button - Show for doers, viewers, admins if not completed */}
            {canEdit && !isCompleted && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onEditClick}
                className="bg-[#fff] border-[1.5px] border-[#1360C6] rounded-lg px-3 py-1 flex-row items-center gap-2"
              >
                {/* <Edit size={16} color="#1360C6" /> */}
                <Text className="text-[#1360C6] text-center font-medium">Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="sm:flex-row flex-col justify-between items-start mb-4 gap-2">
          {task?.description && (
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="text-gray-600 text-md font-[600]">
                {task.description}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-1 shrink-0">
            <Clock size={16} color="#495057" />
            <Text className="text-[#495057] text-sm font-[600]">
              {task.dueDateTime
                ? new Date(task.dueDateTime).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })
                : "No Deadline"}
            </Text>
          </View>
        </View>

        {/* Documents - Read only */}
        {task.documents.length >= 1 && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">All Documents</Text>
            {task.documents?.map((doc) => (
              <View
                key={doc._id}
                className="flex-row items-center justify-between border-2 border-gray-200 rounded-md px-3 py-2 mb-2"
              >
                <View className="flex-row items-center space-x-2 py-1">
                  <FileText size={22} color="#495057" />
                  <Text
                    className="text-[#495057] font-semibold w-[100px]"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {doc.originalName}
                  </Text>
                </View>
                <View className="flex-row space-x-3 gap-3 sm:gap-10">
                  <View className="flex-row items-center gap-2">
                    <Avatar employee={doc?.uploadedBy} size={25} />
                    <Text className="font-semibold text-[#495057]">{`${doc?.uploadedBy.firstName}`}</Text>
                  </View>
                  <Text className="text-xs text-black p-1 bg-[#1360C61A] rounded-md">
                    {doc.fileExtension.toUpperCase()}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                      const url = `${process.env.EXPO_PUBLIC_API_URL}/${doc.path.replace(/\\/g, "/")}`;
                      if (Platform.OS === "web") {
                        window.open(url, "_blank");
                      } else {
                        Linking.openURL(url);
                      }
                    }}
                  >
                    <Download size={18} color="#1360C6" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Assignees / Doer */}
        {task.assignees.length >= 1 && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Doer</Text>
            <View className="flex-row flex-wrap gap-2">
              {task.assignees?.map((assignee) => (
                <View
                  key={assignee._id}
                  className="flex-row items-center border border-black rounded-lg px-3 py-1.5"
                >
                  <Avatar employee={assignee} size={25} />
                  <Text className="font-semibold text-[#495057] ml-2" numberOfLines={1} ellipsizeMode="tail">
                    {`${trimText(assignee.firstName, 9)} ${trimText(assignee.lastName, 7)}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Observers / Viewer */}
        {task.observers.length >= 1 && (
          <View className="mb-4">
            <Text className="text-base font-semibold mb-2">Viewer</Text>
            <View className="flex-row flex-wrap gap-2">
              {task.observers?.map((observer) => (
                <View
                  key={observer._id}
                  className="flex-row items-center border border-black rounded-lg px-3 py-1.5"
                >
                  <Avatar employee={observer} size={25} />
                  <Text className="font-semibold text-[#495057] ml-2" numberOfLines={1}>
                    {`${trimText(observer.firstName, 9)} ${trimText(observer.lastName, 7)}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}