import React from "react"
import { TouchableOpacity, Text } from "react-native"

export default function PrimaryButton({ title, onPress, className }) {
  return (
    <TouchableOpacity
                activeOpacity={1}
      onPress={onPress}
      className={`bg-[#1360C6] rounded-md py-3 ${className}`}
    >
      <Text className="text-white text-center text-base font-semibold">
        {title}
      </Text>
    </TouchableOpacity>
  )
}
