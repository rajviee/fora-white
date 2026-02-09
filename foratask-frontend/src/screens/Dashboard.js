import React, { useContext, useEffect, useRef, useState } from "react"
import { View, Text, useWindowDimensions, ScrollView, Dimensions, TouchableOpacity } from "react-native"
import useUserStore from "../stores/useUserStore"
import { Button } from "react-native-paper"
import { MaterialIcons } from "@expo/vector-icons"
import SummaryPills from "../components/SummaryPills"
import TasksTable from "../components/TasksTable"
import { useNavigation } from "@react-navigation/native"
import TodaysTasksSummary from "../components/TodaysTasksSummary"
import LineChartWithToggle from "../components/LineChartWithToggle"
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import api from "../utils/api"
import { useToast } from "../components/Toast"
import { DashboardContext, DashboardProvider } from "../utils/Context/DashboardContext"
import { SearchBar } from "../navigation/SidebarNavigator"


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function DashboardUi() {
  const { isSelfTask, setIsSelfTask } = useContext(DashboardContext)
  const { user } = useUserStore()
  const navigation = useNavigation()
  const { width } = useWindowDimensions()
  const [screenWidth, setScreenWidth] = React.useState(Dimensions.get('window').width);
  const [screenHeight, setScreenHeight] = React.useState(Dimensions.get('window').height);
  const isLargeScreen = width >= 1024
  const toast = useToast()

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  const getFontSize = (baseSize) => {
    if (screenWidth < 640) return baseSize * 0.85;
    if (screenWidth < 768) return baseSize * 0.9;
    if (screenWidth < 1024) return baseSize * 0.95;
    return baseSize;
  };

  const handleToggleTaskType = (isSelf) => {
    setIsSelfTask(isSelf);
  };

  async function sendTokenToBackend(userId, token) {
    try {
      const response = await api.post(
        "me/save-token",
        { userId, expoPushToken: token },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Token saved to backend:", response.data);
      await AsyncStorage.setItem("notificationData", JSON.stringify({
        isOn: true,
        expoPushToken: token,
        time: new Date()
      }));

    } catch (error) {
      console.error("❌ Error saving token to backend:", error);
      toast.error("Failed to save notification token");
    }
  }

  async function registerForPushNotificationsAsync(userId) {
    if (!userId) {
      console.log("❌ No userId provided");
      return;
    }

    if (Platform.OS === "web") {
      console.log("⏭️ Skipping push notification setup on web");
      return;
    }

    // Check if physical device
    if (!Device.isDevice) {
      console.log("⚠️ Must use a physical device for push notifications");
      return;
    }

    try {
      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log("🔍 Current permission status:", existingStatus);

      let finalStatus = existingStatus;

      // Only ask for permission if not already determined
      if (existingStatus === 'undetermined') {
        console.log("📱 Requesting permission for the first time...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("✅ Permission result:", status);
      }

      // If permission denied or not granted, save state and exit
      if (finalStatus !== 'granted') {
        console.log("❌ Permission not granted:", finalStatus);
        await AsyncStorage.setItem("notificationData", JSON.stringify({
          isOn: false,
          expoPushToken: "",
          time: new Date()
        }));
        return;
      }

      console.log("✅ Permission granted, getting token...");

      // Set up Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          sound: "foranotif.wav",
        });
      }

      // Get Expo push token
      const token = (await Notifications.getExpoPushTokenAsync({
        projectId: '73ec8829-b5ed-4ef9-b06c-1a440b5a60de'
      })).data;

      console.log('📱 Expo Push Token:', token);

      // Save token to backend
      await sendTokenToBackend(userId, token);

    } catch (error) {
      console.error("❌ Error in registerForPushNotificationsAsync:", error);

      // Handle specific FCM errors
      if (error.message?.includes('SERVICE_NOT_AVAILABLE')) {
        console.log("⚠️ Google Play Services unavailable - this is common on emulators");
        toast.warning("Push notifications unavailable on this device");
      } else if (error.message?.includes('TIMEOUT')) {
        console.log("⚠️ Network timeout");
        toast.warning("Network timeout - please try again");
      } else {
        toast.error("Failed to setup notifications");
      }

      // Save failed state
      await AsyncStorage.setItem("notificationData", JSON.stringify({
        isOn: false,
        expoPushToken: "",
        time: new Date()
      }));
    }
  }

  // ✅ Check and request notifications on first load
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!user?._id) return;

      try {
        const stored = await AsyncStorage.getItem("notificationData");

        // ✅ If no data exists OR notifications are OFF
        if (!stored) {
          console.log("🆕 First time user - requesting notification permission");
          await registerForPushNotificationsAsync(user._id);
        } else {
          const parsed = JSON.parse(stored);
          console.log("📋 Existing notification data:", parsed);

          // ✅ Check if 7 days have passed since last denial
          if (!parsed.isOn && parsed.time) {
            const savedDate = new Date(parsed.time);
            const now = new Date();
            const diffDays = (now - savedDate) / (1000 * 60 * 60 * 24);

            if (diffDays >= 7) {
              console.log("⏰ 7 days passed since last denial - asking again");
              await registerForPushNotificationsAsync(user._id);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error initializing notifications:", error);
      }
    };

    initializeNotifications();
  }, [user?._id]); // ✅ Only run when user._id changes

  return (
    <ScrollView className="flex-1 bg-[#FBFBFB] p-4">
      <View className="mb-3 w-full flex-row items-top justify-between">
        <Text className="text-2xl font-bold text-[#495057]">Dashboard</Text>
        <View className="flex flex-row gap-2">
          <View className="flex-row justify-center">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => handleToggleTaskType(true)}
              className={`border-[1px] border-[#1360C6] px-3 py-1.5 rounded-l-[6px] ${isSelfTask ? "bg-[#1360C6]" : "bg-white"}`}
            >
              <Text style={{ fontSize: getFontSize(14) }} className={` ${isSelfTask ? "text-white" : "text-[#1360C6]"} font-semibold`}>
                Self
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => handleToggleTaskType(false)}
              className={`border-[1px] border-[#1360C6] px-3 py-1.5 rounded-r-[6px] ${!isSelfTask ? "bg-[#1360C6]" : "bg-"}`}
            >
              <Text style={{ fontSize: getFontSize(14) }} className={` ${!isSelfTask ? "text-white" : "text-[#1360C6]"} font-semibold`}>
                Team
              </Text>
            </TouchableOpacity>
          </View>
          {isLargeScreen && (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => navigation.navigate("Task", { screen: "AddTask" })}
              className="flex-row items-center bg-[#1360C6]  px-2 py-2 pr-3  rounded-lg"
            >
              <View className="mr-2">
                <MaterialIcons name="add" color={"white"} size={19} />
              </View>
              <Text className="text-white font-medium">New Task</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {isLargeScreen ? (
        <View className="flex-row w-full flex-1">
          <View className="w-[70%] pr-3">
            <SummaryPills />
            <TasksTable />
            <LineChartWithToggle />
          </View>
          <View className="w-[30%]">
            <TodaysTasksSummary />
          </View>
        </View>
      ) : (
        <View className="w-full pb-6">
          <View className="mb-1">
          <SearchBar/>
          </View>
          <SummaryPills />
          <TodaysTasksSummary />
          <TasksTable />
          <LineChartWithToggle />
        </View>
      )}
    </ScrollView>
  )
}

export default function Dashboard() {
  return <DashboardUi />
}