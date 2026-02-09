// src/screens/NotFoundScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const NotFoundScreen = () => {
  const navigation = useNavigation();

  const handleGoHome = () => {
    navigation.navigate('Main', { screen: 'Dashboard' });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      handleGoHome();
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-5 bg-gray-50">
      <Text className="text-9xl font-bold text-gray-500 mb-4">404</Text>
      <Text className="text-2xl font-semibold text-gray-900 mb-2 text-center">
        Page Not Found
      </Text>
      <Text className="text-base text-gray-600 text-center mb-8 leading-6 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </Text>
      
      <View className="flex-row gap-3">
        <TouchableOpacity
                activeOpacity={1} 
          className="px-6 py-3 border border-gray-300 bg-white rounded-lg"
          onPress={handleGoBack}
        >
          <Text className="text-base font-medium text-gray-900">Go Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
                activeOpacity={1} 
          className="px-6 py-3 bg-[#1360C6] rounded-lg"
          onPress={handleGoHome}
        >
          <Text className="text-base font-medium text-white">Go Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default NotFoundScreen;