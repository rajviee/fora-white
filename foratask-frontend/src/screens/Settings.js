import React from "react"
import { View, Text, TouchableOpacity } from "react-native"

export default function Settings({ navigation }) {
  return (
    <View className="flex-1 justify-center items-center bg-green-100">
      <Text className="text-2xl font-bold mb-4">Welcome to Settings 🎉</Text>
      <TouchableOpacity
                activeOpacity={1}
        onPress={() => navigation.navigate("Login")}
        className="bg-blue-500 px-4 py-2 rounded-md"
      >
        <Text className="text-white">Go Back to Login</Text>
      </TouchableOpacity>
    </View>
  )
}
