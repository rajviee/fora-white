import React from "react"
import { View, Text, TouchableOpacity, useWindowDimensions, ScrollView ,Pressable} from "react-native"
import { BarChart3, User, Clock, RefreshCw, AlertCircle, XCircle, TrendingUp,Users } from "lucide-react-native"
import useUserStore from "../../stores/useUserStore"
export default function Reports({ navigation }) {
  const { width } = useWindowDimensions()
  const isLargeScreen = width >= 1024
  const { user } = useUserStore.getState();
  const reportButtons = [
    { name: "Admin Report", path: "AdminReport", icon: BarChart3, color: "#1360C680", textColor: "#1360C6", iconColor: "#FFFFFF" },
    { name: "Self Report", path: "EmployeeReport", icon: Users, color: "#1360C640", textColor: "#1360C6", iconColor: "#FFFFFF" },
    // { name: "Timeline Report", path: "TimelineReport", icon: Clock, color: "#F3E5FF", textColor: "#9333EA", iconColor: "#9333EA" },
    // { name: "Recurring Report", path: "RecurringReport", icon: RefreshCw, color: "#E5FFF5", textColor: "#059669", iconColor: "#059669" },
    // { name: "Priority Report", path: "PriorityReport", icon: AlertCircle, color: "#FFF5E5", textColor: "#EA580C", iconColor: "#EA580C" },
    // { name: "Rejection Report", path: "RejectionReport", icon: XCircle, color: "#FFE5F5", textColor: "#EC4899", iconColor: "#EC4899" },
    // { name: "Performance", path: "Performance", icon: TrendingUp, color: "#E5FFFF", textColor: "#0891B2", iconColor: "#0891B2" },
  ]
  const allowshowreport = (user, name) => {
    const AdminSupervisorAllowed = ["AdminReport", "EmployeeReport"]
    const EmployeeAllowed = ["EmployeeReport"]
    if (user.role === "admin" || user.role === "supervisor") {
      return AdminSupervisorAllowed.includes(name)
    } else if (user.role === "employee") {
      return EmployeeAllowed.includes(name)
    }
  }

  const handleNavigate = (path) => {
    navigation.navigate("Reports", { screen: path })
  }

  // Uniform button dimensions
  const buttonWidth = isLargeScreen ? '22%' : '45%'
  const buttonHeight = isLargeScreen ? 160 : 140
  const iconSize = isLargeScreen ? 24 : 20
  const iconContainerSize = isLargeScreen ? 48 : 40
  const fontSize = isLargeScreen ? 16 : 14
  const paddingSize = isLargeScreen ? 16 : 12

  return (
    <ScrollView className="flex-1  p-5  bg-[#FBFBFB]" showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-800">Reports</Text>
        <Text className="text-gray-600 mt-1">Select a report type to view detailed analytics</Text>
      </View>

      {/* Grid of Report Buttons */}
      <View 
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
          // justifyContent: 'space-between',
        }}
      >
        {reportButtons.filter(r=>allowshowreport(user,r.path)).map((report) => {
          const Icon = report.icon
          return (
            <Pressable
                activeOpacity={1}
              key={report.path}
              onPress={() => handleNavigate(report.path)}
              style={{
                backgroundColor: report.color,
                width: buttonWidth,
                height: buttonHeight,
                borderRadius: 12,
                padding: paddingSize,
                justifyContent: 'space-between',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                marginBottom: 16,
              }}
             
            >
              {/* Icon */}
              <View 
                style={{
                  width: iconContainerSize,
                  height: iconContainerSize,
                  borderRadius: 8,
                  backgroundColor: '#1360C6',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon size={iconSize} color="#fff" />
              </View>

              {/* Text */}
              <Text 
                style={{
                  fontSize: fontSize,
                  fontWeight: '600',
                  color: report.textColor,
                  marginTop: 6,
                }}
              >
                {report.name}
              </Text>
            </Pressable>
          )
        })}
      </View>
      <View className="h-10"/>
    </ScrollView>
  )
}
