import React from 'react'
import { Image,View,Text } from 'react-native';
import api from '../utils/api';
const getAvatarUrl = (employee) => {
    if (employee?.avatar?.path) {
        // The backend serves uploads at /api/uploads
        // and path in DB is 'uploads/avatars/...'
        // so we remove 'uploads/' from path to avoid /api/uploads/uploads/
        const cleanPath = employee.avatar.path.replace(/^uploads[\\\/]/, '');
        return `${api.defaults.baseURL}/api/uploads/${cleanPath}`;
    }
    return null;
};
const Avatar = ({ employee, size = 40 }) => {
    const avatarUrl = getAvatarUrl(employee);
    if (avatarUrl) {
        return (
            <Image
                source={{ uri: avatarUrl }}
                style={{ width: size, height: size }}
                className="rounded-full bg-gray-200"
                resizeMode="cover"
            />
        );
    }

    // Fallback to initials
    const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
    return (
        <View
            style={{ width: size, height: size }}
            className="rounded-full bg-[#1360C6] items-center justify-center"
        >
            <Text className="text-white font-semibold" style={{ fontSize: size * 0.4 }}>
                {initials || 'U'}
            </Text>
        </View>
    );
};

export default Avatar
