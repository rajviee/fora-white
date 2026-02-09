import React, { useEffect, useState, useRef, memo } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react-native';
import api from '../utils/api';
import { useNavigation } from "@react-navigation/native"
import * as navigation from "../navigation/navigationRef"


const NotificationsBadge = memo(() => {
    // const navigation = useNavigation();
    const [unreadCount, setUnreadCount] = useState(0);
    const prevCount = useRef(0);
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const intervalRef = useRef(null); // Store interval ID
    const queryClient = useQueryClient();

    const handleNotificationPress = () => {
        navigation.navigate("Notification")
    }
    console.log("Render");


    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unreadCount');
            const newCount = res.data.count;

            // Trigger shake only if new notifications arrived
            if (newCount > prevCount.current) {
                triggerShake();
                console.log("hello");

            }

            prevCount.current = newCount;
            setUnreadCount(newCount);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const triggerShake = () => {
        shakeAnim.setValue(0);
        Animated.sequence([
            Animated.timing(shakeAnim, {
                toValue: 5,
                duration: 50,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: -5,
                duration: 50,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: 4,
                duration: 50,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: -4,
                duration: 50,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnim, {
                toValue: 0,
                duration: 50,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ]).start();
    };

    useEffect(() => {


        // Set up polling interval
        intervalRef.current = setInterval(fetchUnreadCount, 60000); // Poll every 60 seconds

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []); 
    useEffect(() => {
        fetchUnreadCount();
    }, [])

    return (
        <Animated.View
            style={{
                transform: [
                    {
                        translateX: shakeAnim,
                    },
                ],
            }}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleNotificationPress}
                className="relative p-0"
            >
                <Bell size={20} color="#666" />
                {unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[15px] h-[15px] items-center justify-center">
                        <Text className="text-white text-[10px] font-semibold text-center pb-[1px]">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
});

// Add display name for debugging
NotificationsBadge.displayName = 'NotificationsBadge';

export default NotificationsBadge;