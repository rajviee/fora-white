import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../utils/api';
import AllowNotification from '../components/AllowNotification';
import { Pressable } from 'react-native';
const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingActions, setProcessingActions] = useState({});
    const navigation = useNavigation();

    // Mock API functions - replace with your actual API calls
    const fetchNotifications = async () => {
        try {
            // Replace with your actual API endpoint
            const response = await api.get("/notifications/getAllNotifications/");
            const data = await response.data;
            setNotifications(data);
            // console.log(data, "noti");

        } catch (error) {
            console.error('Error fetching notifications:', error);

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleTaskApproval = async (notificationId, action) => {
        setProcessingActions(prev => ({ ...prev, [notificationId]: true }));

        try {
            // Replace with your actual API endpoint
            const response = await api.patch(
                `/notifications/handleTaskApproval/${notificationId}`,
                { action }, // body
                {
                    headers: { "Content-Type": "application/json" }, // overrides default multipart/form-data
                }
            );

            // With Axios, successful responses are automatically resolved
            // No need to check response.ok - just access response.data directly
            const result = response.data;
            Alert.alert('Success', result.message || 'Action completed successfully');

            // Update notification in local state
            setNotifications(prev =>
                prev.map(notif =>
                    notif._id === notificationId
                        ? { ...notif, action: { ...notif.action, chosen: action }, isRead: true }
                        : notif
                )
            );

        } catch (error) {
            console.error('Error handling task approval:', error);

            // Handle different types of errors
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message || 'Server error occurred';
                Alert.alert('Error', errorMessage);
            } else if (error.request) {
                // Network error
                Alert.alert('Error', 'Network error - please check your connection');
            } else {
                // Other error
                Alert.alert('Error', 'Failed to process request');
            }
        } finally {
            setProcessingActions(prev => ({ ...prev, [notificationId]: false }));
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'taskApproval':
                return 'checkmark-circle-outline';
            case 'taskRejected':
                return 'close-circle-outline';
            case 'reminder':
                return 'alarm-outline';
            case 'overdue':
                return 'warning-outline';
            case 'system':
                return 'information-circle-outline';
            default:
                return 'notifications-outline';
        }
    };



    const formatTimeAgo = (date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    function formatTime(date) {

        return new Date(date).toLocaleDateString() + ', ' + new Date(date).toLocaleTimeString();
    }
    const trimText = (text, maxLength = 80) =>
        text?.length > maxLength ? text.slice(0, maxLength) + '…' : text;


    const renderNotification = (notification) => {
        const isProcessing = processingActions[notification._id];
        const hasActionButtons = notification.type === 'taskApproval' && !notification.action?.chosen;
        const actionChosen = notification.action?.chosen;

        return (
            <View
                key={notification._id}
                className={` mx-4 mb-3 rounded-lg  
                    }`}
            >
                <View className="py-2">
                    <Pressable
                        className="
                            flex-row items-start cursor-pointer px-4 py-2 rounded-lg gap-2
                            bg-transparent
                            hover:bg-[#1360C61A]
                            
                            transition-all
                            duration-200
                         "
                        onPress={() =>
                            navigation.navigate("Task", {
                                screen: "TaskDetails",
                                params: { id: notification.taskId },
                            })
                        }
                    >


                        {/* Notification Icon */}



                        {/* Notification Content */}
                        <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                                {/* Left side: Icon and Text */}
                                <View className="flex-row items-center flex-1">
                                    <View className="py-[5px] px-[6px] bg-[#1360C6] rounded-[10px]">
                                        <Ionicons
                                            name={getNotificationIcon(notification.type)}
                                            size={25}
                                            color="#fff"
                                        />      
                                    </View>
                                    <Text
                                        className={`text-gray-800 text-base leading-5 ml-2 flex-1 ${!notification.isRead ? 'font-semibold' : 'font-normal'
                                            }`}
                                    >
                                        {notification.type === 'reminder' ? (
                                            <>
                                                <Text className="font-medium">Reminder:</Text>{' '}
                                                {trimText(notification.message, 60)}{' '}
                                                {formatTime(notification.dueDateTime)}
                                            </>
                                        ) : (
                                            trimText(notification.message, 60)
                                        )}
                                    </Text>

                                </View>

                                {/* Right side: Time */}
                                <Text className="text-gray-500 text-sm ml-2">
                                    {formatTimeAgo(notification.createdAt)}
                                </Text>
                            </View>

                            {/* Action Status */}
                            {actionChosen && (
                                <View className="flex-row mt-2 pl-9 ">
                                    <TouchableOpacity
                                        className={`bg-[#1360C6] px-4 py-2 rounded-lg flex-row items-center`}
                                        disabled={true}
                                    >
                                        <Text className="text-white font-medium text-sm">
                                            {actionChosen === 'approve' ? 'Approved' : 'Rejected'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Unread Indicator
                        {!notification.isRead && (
                            <View className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        )} */}
                    </Pressable>

                    {/* Action Buttons */}
                    {hasActionButtons && (
                        <View className="flex-row gap-2  mt-4 pl-9">
                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => handleTaskApproval(notification._id, 'approve')}
                                disabled={isProcessing}
                                className="bg-[#1360C6] px-4 py-2 rounded-lg flex-row items-center  "
                            >
                                {/* {isProcessing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <Ionicons name="checkmark" size={16} color="white" />
                                )} */}
                                <Text className="text-white font-medium text-sm">
                                    {isProcessing ? 'Processing...' : 'Approve'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                activeOpacity={1}
                                onPress={() => handleTaskApproval(notification._id, 'reject')}
                                disabled={isProcessing}
                                className="bg-white border border-gray-300 px-4 py-2 rounded-lg flex-row items-center  "
                            >
                                {/* {isProcessing ? (
                                    <ActivityIndicator size="small" color="#00000080" />
                                ) : (
                                    // <Ionicons name="close" size={16} color="#00000080" />
                                )} */}
                                <Text className="text-gray-700 font-medium text-sm">
                                    {isProcessing ? 'Processing...' : 'Reject'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const groupNotificationsByDate = (notifications) => {
        const grouped = {};

        notifications.forEach(notification => {
            const date = new Date(notification.createdAt);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let dateKey;
            if (date.toDateString() === today.toDateString()) {
                dateKey = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                dateKey = 'Yesterday';
            } else {
                dateKey = date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(notification);
        });

        return grouped;
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color="#1360C6" />
                <Text className="mt-2 text-gray-600">Loading notifications...</Text>
            </View>
        );
    }

    const groupedNotifications = groupNotificationsByDate(notifications);

    return (
        <View className="m-3 bg-white flex-1 rounded-md">

            <View className="p-4 flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-[#000]">Notifications</Text>
                <TouchableOpacity
                    activeOpacity={1} onPress={onRefresh}>
                    <Ionicons name="refresh" size={24} color="#000" />
                </TouchableOpacity>
            </View>
            <ScrollView

                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >

                {/* <View className="pt-3 bg-white"> */}

                {notifications.length === 0 ? (
                    <View>
                        <View className="py-1 px-4 flex-row items-center justify-end">
                            {Platform.OS === "android" && <AllowNotification />}
                        </View>
                        <View className="flex-1 justify-center items-center py-20">
                            <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
                            <Text className="text-gray-500 text-lg mt-4">No notifications yet</Text>
                            <Text className="text-gray-400 text-sm mt-1">
                                You'll see new notifications here
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View className="py-4">
                        {Object.entries(groupedNotifications).map(([date, notificationGroup], index) => (
                            <View key={date} className="mb-6">
                                <View className="py-1 px-4 flex-row items-center flex-wrap-reverse justify-between">
                                    <Text className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                        {date}
                                    </Text>

                                    {index === 0 && Platform.OS === "android" && <AllowNotification />}
                                </View>

                                {notificationGroup.map(renderNotification)}
                            </View>
                        ))}
                    </View>
                )}
                {/* </View> */}
            </ScrollView>
        </View>
    );
};

export default NotificationPage;