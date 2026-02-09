import React, { useState, useEffect } from 'react'
import { Platform, View, Text, Switch, StyleSheet, Linking, Alert } from "react-native"
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from "../utils/api"
import useUserStore from '../stores/useUserStore';
import { useToast } from "../components/Toast"

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const DEFAULT_OBJECT = {
    isOn: false,
    expoPushToken: "",
    time: new Date(),
};

function AllowNotification() {
    const [isOn, setIsOn] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useUserStore()
    const toast = useToast()
    const [notificationData, setNotificationData] = useState({})

    useEffect(() => {
        const loadData = async () => {
            const stored = await AsyncStorage.getItem("notificationData");

            if (!stored) {
                await AsyncStorage.setItem("notificationData", JSON.stringify(DEFAULT_OBJECT));
                setNotificationData(DEFAULT_OBJECT);
                setIsOn(false);
                return;
            }

            const parsed = JSON.parse(stored);
            console.log(parsed, "parsed");
            setNotificationData(parsed);
            setIsOn(parsed.isOn);

            if (parsed.time && !parsed.isOn) {
                const savedDate = new Date(parsed.time);
                const now = new Date();
                const diffDays = (now - savedDate) / (1000 * 60 * 60 * 24);

                if (diffDays >= 7 && user?._id) {
                    console.log("7 days passed → asking for notification permission again");
                    registerForPushNotificationsAsync(user._id);
                }
            }
        };

        if (user?._id) loadData();
    }, [user?._id]); // ✅ Only depend on user._id

    useEffect(() => {
        AsyncStorage.setItem("notificationData", JSON.stringify(notificationData));
    }, [notificationData]);

    async function registerForPushNotificationsAsync(userId) {
        if (!userId) {
            console.log("❌ No userId provided");
            setIsLoading(false);
            return;
        }

        if (Platform.OS === "web") {
            console.log("Skipping push notification setup on web");
            setIsLoading(false);
            return;
        }

        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            console.log("🔍 Current permission status:", existingStatus);

            // If permission is denied (user disabled from settings), prompt to open settings
            if (existingStatus === 'denied') {
                console.log("❌ Permission is DENIED - Cannot request again, must go to settings");
                Alert.alert(
                    "Notifications Disabled",
                    "Notifications are disabled in your device settings. Please enable them to receive alerts.",
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                setIsOn(false);
                                setNotificationData(prev => ({
                                    ...prev,
                                    isOn: false
                                }));
                                setIsLoading(false);
                            }
                        },
                        {
                            text: "Open Settings",
                            onPress: () => {
                                Linking.openSettings();
                                setIsOn(false);
                                setNotificationData(prev => ({
                                    ...prev,
                                    isOn: false
                                }));
                                setIsLoading(false);
                            }
                        }
                    ]
                );
                return;
            }

            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                console.log("📱 Requesting permission... (current status:", existingStatus, ")");
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
                console.log("✅ Permission request result:", status);

                // If user denies permission when prompted
                if (status !== 'granted') {
                    console.log("❌ User denied permission or it's not granted");
                    Alert.alert(
                        "Permission Required",
                        "Notifications are required to receive alerts. Please enable them from your device settings.",
                        [
                            {
                                text: "Cancel",
                                style: "cancel",
                                onPress: () => {
                                    setIsOn(false);
                                    setNotificationData({
                                        isOn: false,
                                        expoPushToken: "",
                                        time: new Date()
                                    });
                                    setIsLoading(false);
                                }
                            },
                            {
                                text: "Open Settings",
                                onPress: () => {
                                    Linking.openSettings();
                                    setIsOn(false);
                                    setNotificationData({
                                        isOn: false,
                                        expoPushToken: "",
                                        time: new Date()
                                    });
                                    setIsLoading(false);
                                }
                            }
                        ]
                    );
                    return;
                }

                console.log("✅ Permission granted!");
            }

            console.log("📲 Getting push token...");
            const token = (await Notifications.getExpoPushTokenAsync({
                projectId: '73ec8829-b5ed-4ef9-b06c-1a440b5a60de'
            })).data;

            console.log('📱 Expo Push Token:', token);

            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    sound: "foranotif.wav",
                });
            }

            await sendTokenToBackend(userId, token);

        } catch (error) {
            console.error("Error in registerForPushNotificationsAsync:", error);
            setIsOn(false);
            setNotificationData(prev => ({
                ...prev,
                isOn: false
            }));
            setIsLoading(false);
            toast.error("Failed to setup notifications");
        }
    }

    async function sendTokenToBackend(userId, token) {
        try {
            const response = await api.post(
                "me/save-token",
                { userId, expoPushToken: token },
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            console.log("Server response:", response.data);

            // ✅ Update state on SUCCESS
            setNotificationData({
                isOn: true,
                expoPushToken: token,
                time: new Date()
            });
            setIsOn(true);
            toast.success("Notifications enabled successfully!");

        } catch (error) {
            console.error("Error saving token:", error);
            toast.error("Error in Notification permission access");

            // ✅ Revert state on ERROR
            setIsOn(false);
            setNotificationData(prev => ({
                ...prev,
                isOn: false
            }));

        } finally {
            setIsLoading(false);
        }
    }

    async function removeTokenfromBackend() {
        try {
            await api.delete(
                "me/remove-token",
                {
                    headers: { "Content-Type": "application/json" },
                }
            );

            // ✅ Update state on SUCCESS
            setNotificationData({
                isOn: false,
                expoPushToken: "",
                time: new Date()
            });
            setIsOn(false);
            toast.success("Notifications disabled successfully!");

        } catch (error) {
            console.error("Error removing token:", error);
            toast.error("Error in Notification permission access");

            // ✅ Revert state on ERROR
            setIsOn(true);
            setNotificationData(prev => ({
                ...prev,
                isOn: true
            }));

        } finally {
            setIsLoading(false);
        }
    }

    const handleToggle = async (newValue) => {
        setIsLoading(true);

        if (newValue) {
            // ✅ DON'T optimistically set to true - wait for permission result
            await registerForPushNotificationsAsync(user._id);
        } else {
            // ✅ CAN optimistically turn off
            setIsOn(false);
            setNotificationData(prev => ({
                ...prev,
                isOn: false
            }));
            await removeTokenfromBackend();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>App Notifications:</Text>
            <Switch
                trackColor={{ false: '#dc3545', true: '#28a745' }}
                thumbColor='#ffffff'
                ios_backgroundColor="#dc3545"
                onValueChange={handleToggle}
                value={isOn}
                disabled={isLoading}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        backgroundColor: 'white',
        flexDirection: 'row',
        gap: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
    },
});

export default AllowNotification