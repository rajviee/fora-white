import React, { useState, useEffect, memo, useCallback } from "react"
import { View, Text, Image, TouchableOpacity, ImageBackground, Platform, KeyboardAvoidingView } from "react-native"
import Checkbox from "expo-checkbox"
import InputField from "../components/InputField"
import PrimaryButton from "../components/PrimaryButton"
import { useWindowDimensions } from "react-native"
import useUserStore from "../stores/useUserStore"

const MobileImage = memo(() => {
    return <ImageBackground
        source={require("../../assets/loginbg.png")}
        className="flex-1 justify-center items-center relative"
        resizeMode="cover"
        style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
        }}
        imageStyle={{
            resizeMode: 'cover',
            width: '100%',
            height: '100%'
        }}
    >
        <View className="absolute inset-0 bg-black/40" />
        <View className="absolute top-10 left-6">
            <Image
                source={require("../../assets/logo.png")}
                className="w-28 h-12"
                resizeMode="contain"
            />
        </View>
        <Text className="text-white font-bold text-5xl leading-tight text-center">
            Welcome{"\n"}Back
        </Text>
    </ImageBackground>
})

const LaptopImage = memo(() => {
    return <ImageBackground
        source={require("../../assets/loginbg.png")}
        className="flex-1 relative p-10"
        resizeMode="cover"
        style={{
            minHeight: '100vh',
            width: '100%',
            height: '100%'
        }}
        imageStyle={{
            resizeMode: 'cover',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0
        }}
    >
        <View className="absolute inset-0 bg-black/40" />
        <View className="absolute top-10 left-10">
            <Image
                source={require("../../assets/logo.png")}
                className="w-28 h-12"
                resizeMode="contain"
            />
        </View>
        <View className="flex-1 justify-center pl-8">
            <Text className="text-white font-bold text-6xl leading-tight">
                Welcome{"\n"}Back
            </Text>
        </View>
    </ImageBackground>
})

// Memoize the header section
const LoginHeader = memo(() => (
    <View className="mb-10">
        <Text className="text-3xl font-medium text-[#1360C6] mb-2">
            Log In
        </Text>
        <Text className="text-base text-[#03022980] font-medium leading-6">
            Welcome Back! Please log in to your account.
        </Text>
    </View>
))

// Memoize the remember me section
const RememberMeSection = memo(({ rememberMe, setRememberMe, onForgotPassword, isLoading }) => (
    <View className="flex-row justify-between items-center mt-2 mb-8">
        <View className="flex-row items-center">
            <Checkbox
                value={rememberMe}
                onValueChange={setRememberMe}
                color={rememberMe ? "#1360C6" : undefined}
                disabled={isLoading}
            />
            <Text className="ml-2 text-gray-700 text-base">Remember Me</Text>
        </View>
        <TouchableOpacity
            activeOpacity={1}
            onPress={onForgotPassword}
            disabled={isLoading}
        >
            <Text className="text-gray-500 text-base">Forgot Password?</Text>
        </TouchableOpacity>
    </View>
))

// Memoize error display
const ErrorDisplay = memo(({ errorMessage }) => {
    if (!errorMessage) return null

    return (
        <View className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg">
            <Text className="text-red-600 text-sm font-medium">
                {errorMessage}
            </Text>
        </View>
    )
})

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [rememberMe, setRememberMe] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showSplash, setShowSplash] = useState(true)
    const [errorMessage, setErrorMessage] = useState("")

    const { width } = useWindowDimensions()
    const isMobile = width < 768

    const { login, isLoading, error } = useUserStore()

    useEffect(() => {
        if (isMobile) {
            const timer = setTimeout(() => setShowSplash(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isMobile])

    const keyboardBehavior = Platform.select({
        ios: 'padding',
        android: 'height',
        web: undefined
    })

    // Email validation
    const validateEmail = useCallback((email) => {
        if (!email) return false
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email.trim())
    }, [])

    // Handle login with custom error handling
    const handleLogin = useCallback(async () => {
        try {
            setErrorMessage("")
            console.log(errorMessage,"insubmit");
            if (!email || email.trim() === "") {
                setErrorMessage("Please enter your email address")
                return
            }

            if (!password || password.trim() === "") {
                setErrorMessage("Please enter your password")
                return
            }

            if (!validateEmail(email)) {
                setErrorMessage("Please enter a valid email address")
                return
            }

            const result = await login({
                email: email.trim().toLowerCase(),
                password: password.trim()
            })
            if (!result) {
                return
            }

        } catch (error) {
            console.error("Login error:", error)
            setErrorMessage("An unexpected error occurred. Please try again.")
        }
    }, [email, password, login, error, validateEmail])

    const handleForgotPassword = useCallback(() => {
        console.log("Forgot Password pressed")
    }, [])

    const handleEmailChange = useCallback((text) => {
        setEmail(text)
        if (errorMessage) { setErrorMessage("")}
    }, [errorMessage])

    const handlePasswordChange = useCallback((text) => {
        setPassword(text)
        if (errorMessage) {setErrorMessage("")}
    }, [errorMessage])

    // Memoize setShowPassword callback
    const togglePassword = useCallback(() => {
        setShowPassword(prev => !prev)
    }, [])

    // Splash screen (mobile only)
    if (isMobile && showSplash) {
        return <MobileImage />
    }

    return (
        <View className="flex-1 flex-row bg-white min-h-screen">
            {!isMobile && <LaptopImage />}

            <KeyboardAvoidingView
                className="flex-1 justify-center items-center p-10"
                behavior={keyboardBehavior}
            >
                <View className="w-full max-w-md">
                    <LoginHeader />

                    <InputField
                        label="Email Address"
                        value={email}
                        onChangeText={handleEmailChange}
                        autoCapitalize="none"
                        editable={!isLoading}
                        keyboardType="email-address"
                    />

                    <InputField
                        label="Password"
                        value={password}
                        onChangeText={handlePasswordChange}
                        secureTextEntry
                        showPassword={showPassword}
                        setShowPassword={togglePassword}
                        handleSubmit={handleLogin}
                        editable={!isLoading}
                    />

                    <RememberMeSection
                        rememberMe={rememberMe}
                        setRememberMe={setRememberMe}
                        onForgotPassword={handleForgotPassword}
                        isLoading={isLoading}
                    />

                    <PrimaryButton
                        title="Log In"
                        onPress={handleLogin}
                        loading={isLoading}
                        disabled={isLoading}
                    />
                    <ErrorDisplay errorMessage={errorMessage?errorMessage:error} />
                </View>
            </KeyboardAvoidingView>
        </View>
    )
}