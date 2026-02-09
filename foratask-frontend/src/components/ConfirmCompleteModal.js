import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

const ConfirmCompleteModal = ({ 
    visible, 
    onConfirm, 
    onCancel, 
    message = "Are you sure you want to mark this task as completed?" 
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-lg p-6 mx-4 w-full max-w-md">
                    <View className="items-center mb-4">
                        <View className="bg-[#1360C6]/10 rounded-full p-3 mb-3">
                            <AlertCircle size={32} color="#1360C6" />
                        </View>
                        <Text className="text-xl font-semibold text-gray-900 mb-2">
                            Confirm Completion
                        </Text>
                        <Text className="text-gray-600 text-center">
                            {message}
                        </Text>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={onCancel}
                            className="flex-1 bg-gray-100 py-3 rounded-lg"
                        >
                            <Text className="text-gray-700 font-medium text-center">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={onConfirm}
                            className="flex-1 bg-[#1360C6] py-3 rounded-lg"
                        >
                            <Text className="text-white font-medium text-center">
                                Confirm
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmCompleteModal;