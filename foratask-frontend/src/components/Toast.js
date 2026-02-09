"use client"

import { useState, useEffect } from "react"
import { View, Text, Animated, Platform } from "react-native"
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react-native"
import { Pressable } from "react-native"


export const Toast = ({ message, type, visible, onHide, duration = 3000 }) => {
  const [fadeAnim] = useState(new Animated.Value(0))
  const [slideAnim] = useState(new Animated.Value(-100))

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(
        () => {
          hideToast()
        },
        Platform.OS === "web" ? duration : duration + 1000,
      )

      return () => clearTimeout(timer)
    }
  }, [visible])

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide()
    })
  }

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#10b981",
          borderColor: "#059669",
          iconColor: "#ffffff",
        }
      case "error":
        return {
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          iconColor: "#ffffff",
        }
      case "warning":
        return {
          backgroundColor: "#f59e0b",
          borderColor: "#d97706",
          iconColor: "#ffffff",
        }
      default:
        return {
          backgroundColor: "#00000080",
          borderColor: "#4b5563",
          iconColor: "#ffffff",
        }
    }
  }

  const getIcon = () => {
    const { iconColor } = getToastStyles()
    switch (type) {
      case "success":
        return <CheckCircle size={20} color={iconColor} />
      case "error":
        return <XCircle size={20} color={iconColor} />
      case "warning":
        return <AlertCircle size={20} color={iconColor} />
      default:
        return <AlertCircle size={20} color={iconColor} />
    }
  }

  const { backgroundColor, borderColor } = getToastStyles()

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: Platform.OS === "web" ? 20 : Platform.OS === "ios" ? 60 : 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="mx-4"
    >
      <View
        style={{
          backgroundColor,
          borderColor,
        }}
        className="flex-row items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 shadow-lg mx-2 sm:mx-0"
      >
        <View className="mr-2 sm:mr-3">{getIcon()}</View>
        <Text className="flex-1 text-white font-medium text-sm sm:text-base leading-5">{message}</Text>
        <Pressable
          onPress={hideToast}
          className="ml-2 sm:ml-3 p-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color="#ffffff" />
        </Pressable>
      </View>
    </Animated.View>
  )
}

// Toast context and hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = useState([])
  
  const showToast = (message, type = "success") => {
    
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type, visible: true }])
  }

  const hideToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
          onHide={() => hideToast(toast.id)}
        />
      ))}
    </>
  )

  return {
    showToast,
    ToastContainer,
    success: (message) => showToast(message, "success"),
    error: (message) => showToast(message, "error"),
    warning: (message) => showToast(message, "warning"),
  }
}
