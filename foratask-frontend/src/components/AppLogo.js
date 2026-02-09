import React from 'react'
import { Image } from 'react-native'
import { socket } from '../utils/socket/socket';
import useUserStore from '../stores/useUserStore';
import { useQueryClient } from '@tanstack/react-query';
import { useWindowDimensions } from "react-native"
import PhoneLogo from "../../assets/phone_logo.png"
import WebLogo from "../../assets/logo.png"


function AppLogo({ height, width }) {
    const userId = useUserStore(state => state.user?._id); // ✅ Only subscribe to _id
    const queryClient = useQueryClient();
    const { width: screenWidth } = useWindowDimensions();
    const isMobile = screenWidth < 1024;


    React.useEffect(() => {
        if (userId) {
            socket.emit("registerUser", userId);
            console.log("Registered user:", userId);
        }
    }, [userId]); // ✅ Only re-run when userId changes

    React.useEffect(() => {
        const handler = (data) => {
            console.log("🔥 New Task Created:", data);

            queryClient.invalidateQueries({
                queryKey: ["getTaskList"],
            });
            queryClient.invalidateQueries({
                queryKey: ["todaysTasks"],
            });
        };

        socket.on("taskCreated", handler);

        return () => {
            socket.off("taskCreated", handler);
        };
    }, []); // ✅ Empty dependency - only setup once


    return (
        <Image
            source={isMobile ? PhoneLogo : WebLogo}
            style={{ width, height, resizeMode: "contain" }}
        />
    )
}

export default React.memo(AppLogo);