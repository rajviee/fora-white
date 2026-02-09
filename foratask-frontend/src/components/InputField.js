import React, { memo } from "react"
import { Text, TextInput, View, TouchableOpacity } from "react-native"
import { Eye, EyeOff } from "lucide-react-native"

 function InputField({
  label,
  value,
  onChangeText,
  secureTextEntry,
  showPassword,
  handleSubmit,
  setShowPassword,
  ...props
}) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-base font-normal text-gray-700 mb-2">{label}</Text>
      )}
      <View className="relative">
        <TextInput
          className="bg-[#EFEFF2] text-black text-base rounded-md h-12 px-4 border border-[#EFEFF280] pr-10"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
          onSubmitEditing={handleSubmit}
        />

        {secureTextEntry && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            {showPassword ? (
              <EyeOff size={20} color="#374151" />
            ) : (
              <Eye size={20} color="#374151" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
export default memo(InputField)