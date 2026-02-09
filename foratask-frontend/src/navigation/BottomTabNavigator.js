import React, { useState } from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { View, Text, TouchableOpacity, Image, Modal, Pressable } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import {
  LayoutDashboard,
  SquareCheckBig,
  MessagesSquare,
  SquareMenu,
  Users,
  Settings as Cog,
  Bell,
  User,
} from "lucide-react-native"
import Dashboard from "../screens/Dashboard"
import NotificationPage from "../screens/NotificationPage"
import Task from "../screens/Task/AddTask"
import Discussion from "../screens/Discussion"
import Reports from "../screens/Reports/Reports"
import Employees from "../screens/Employees"
import Settings from "../screens/Settings"
import Profile from "../screens/Profile"
import useUserStore from "../stores/useUserStore"
import TaskNavigator from "./TaskNavigator";
import EmployeeNavigator from "./EmployeeNavigator"
import AdminReport from "../screens/Reports/AdminReport"
import EmployeeReport from "../screens/Reports/EmployeeReport"
import TimelineReport from "../screens/Reports/TimelineReport"
import RecurringReport from "../screens/Reports/RecurringReport"
import PriorityReport from "../screens/Reports/PriorityReport"
import RejectionReport from "../screens/Reports/RejectionReport"
import Performance from "../screens/Reports/Performance"
import NotificationsBadge from "../components/NotificationsBadge"
import AppLogo from "../components/AppLogo"
import * as navigation from "../navigation/navigationRef"
import { RouteContext } from "../utils/Context/RouteContext"
import Avatar from "../components/Avatar"
import { removetoken } from "../utils/api"

const Stack = createNativeStackNavigator()
const ReportsStack = createNativeStackNavigator()
export const tabRouteMap = {
  Dashboard: ["Dashboard"],

  Task: [
    "Task",        // parent itself
    "TaskList",
    "AddTask",
    "TaskDetails",
  ],

  Discussion: ["Discussion"],

  Notification: ["Notification"],

  Reports: [
    "Reports",        // parent itself
    "ReportsList",
    "AdminReport",
    "EmployeeReport",
    "TimelineReport",
    "RecurringReport",
    "PriorityReport",
    "RejectionReport",
    "Performance",
  ],

  Employees: [
    "Employees",       // parent
    "EmployeesList",
    "AddEmployee",
    "EmployeeDetails",
  ],

  Settings: ["Settings"],

  Profile: ["Profile"],
};


// Same screen configuration as SidebarNavigator for consistency
const allownavigation = (user, name) => {
  const AdminSupervisorAllowed = ["Dashboard", "Task", "Reports", "Notification", "Employees", "Profile"]
  const EmployeeAllowed = ["Dashboard", "Task", "Reports", "Notification", "Profile"]
  if (user.role === "admin" || user.role === "supervisor") {
    return AdminSupervisorAllowed.includes(name)
  } else if (user.role === "employee") {
    return EmployeeAllowed.includes(name)
  }
}

const allowshowreport = (user, name) => {
  const AdminSupervisorAllowed = ["AdminReport", "EmployeeReport"]
  const EmployeeAllowed = ["EmployeeReport"]
  if (user.role === "admin" || user.role === "supervisor") {
    return AdminSupervisorAllowed.includes(name)
  } else if (user.role === "employee") {
    return EmployeeAllowed.includes(name)
  }
}

const reportTypes = [
  { name: "Admin Report", path: "AdminReport", component: AdminReport, },
  { name: "Self Report", path: "EmployeeReport", component: EmployeeReport },
]

// Create Reports Navigator
function ReportsNavigator() {
  const { user } = useUserStore.getState();

  return (
    <ReportsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ReportsStack.Screen
        name="ReportsList"
        component={Reports}
      />
      {reportTypes.filter(r => allowshowreport(user, r.path)).map((report) => (
        <ReportsStack.Screen
          key={report.path}
          name={report.path}
          component={report.component}
        />
      ))}
    </ReportsStack.Navigator>
  )
}

const screens = [
  { name: "Dashboard", icon: LayoutDashboard, component: Dashboard },
  { name: "Task", icon: SquareCheckBig, component: TaskNavigator },
  { name: "Reports", icon: SquareMenu, component: ReportsNavigator },
  { name: "Employees", icon: Users, component: EmployeeNavigator },
  { name: "Notification", icon: Bell, component: NotificationPage, hideFromBottomBar: true },
  { name: "Profile", icon: User, component: Profile, hideFromBottomBar: true },
]

function getAvatarUrl(user) {
  if (!user?.avatar?.path) return null;
  const cleanPath = user.avatar.path.replace(/\\/g, "/");
  return `${process.env.EXPO_PUBLIC_API_URL}/${cleanPath}`;
}

/**
 * Top Bar Component for Mobile - Memoized to prevent re-renders
 */
const TopBar = React.memo(() => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { user, logout } = useUserStore();

  // ✅ Only subscribe to what you need
  const userAvatar = useUserStore(state => state.user?.avatar);

  const insets = useSafeAreaInsets()

  const handleProfilePress = () => {
    setDropdownVisible(false);
    navigation.navigate("Profile");
  };

  const handleLogout = async () => {
    setDropdownVisible(false);
    await removetoken();
    await logout();
    navigation.replace("Login");
  };



  return (
    <View
      style={{
        height: insets.top + 55,
        paddingTop: insets.top
      }}
      className="bg-white border-b border-[#00000080] flex-row items-center justify-between px-6 pl-0"
    >
      {/* Left - Logo */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.navigate("Dashboard")}
        className="p-0"
      >
        <AppLogo width={100} height={36} />
      </TouchableOpacity>

      {/* Right - Bell + Profile */}
      <View className="flex-row items-center  gap-3">
        {/* Notification Bell */}
        <NotificationsBadge navigation={navigation} />

        {/* Profile Pic */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDropdownVisible(true)}
          className="flex-row items-center space-x-2"
        >
          <Avatar employee={user} size={30} />
        </TouchableOpacity>

        {dropdownVisible && (
          <Modal
            transparent
            animationType="fade"
            visible={dropdownVisible}
            onRequestClose={() => setDropdownVisible(false)}
          >
            <Pressable
              className="flex-1"
              onPress={() => setDropdownVisible(false)}
            >
              <View className="absolute top-14 right-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleProfilePress}
                  className="px-4 py-2 "
                >
                  <Text className="text-gray-700">Profile</Text>
                </TouchableOpacity>
                <View className="h-[1px] bg-gray-200" />
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={handleLogout}
                  className="px-4 py-2 "
                >
                  <Text className="text-red-600 font-medium">Logout</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}
      </View>
    </View>
  )
});

/**
 * Custom Bottom Bar Component - Memoized to prevent re-renders
 */
const BottomBar = React.memo(() => {
  const insets = useSafeAreaInsets()
  const { user } = useUserStore();
  const { currentRoute } = React.useContext(RouteContext)
  return (
    <View
      style={{
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom,
      }}
      className="bg-[#1360C6] border-t border-gray-200  flex-row items-center justify-around px-4"
    >
      {screens
        .filter(s => allownavigation(user, s.name))
        .filter(s => !s.hideFromBottomBar)
        .map((s) => {
          const focused =
            tabRouteMap[s.name]?.includes(currentRoute);
          return (
            <TouchableOpacity
              activeOpacity={1}
              key={s.name}
              onPress={() => navigation.navigate(s.name)}
              className="flex-1 items-center justify-center py-2 "
            >
              {focused ? (
                <LinearGradient
                  colors={["#D4AF3780", "#EFF4FF59", "#EFF4FF66"]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  locations={[0, 0.4, 0.6]}
                  style={{
                    padding: 8,
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderTopLeftRadius: 6,
                    borderTopRightRadius: 6,
                  }}
                >
                  <s.icon size={20} color="#fff" />
                </LinearGradient>
              ) : (
                <View
                  style={{
                    padding: 8,
                    minWidth: 44,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <s.icon size={20} color="#fff" />
                </View>
              )}

            </TouchableOpacity>
          )
        })}
    </View>
  )
})

// /**
//  * Screen wrapper that includes topbar and bottom bar
//  */
// function ScreenWithBottomBar({ component: Component, navigation, route, ...props }) {
//   const currentRoute = route.name

//   return (
//     <View className="flex-1 bg-gray-50">
//       {/* Top Bar - Memoized, only updates when navigation prop changes */}
//       <TopBar navigation={navigation} />

//       {/* Main Content - This is what changes when navigating */}
//       <View className="flex-1">
//         <Component {...props} navigation={navigation} />
//       </View>

//       {/* Bottom Bar - Memoized, only updates when navigation or currentRoute changes */}
//       <BottomBar navigation={navigation} currentRoute={currentRoute} />
//     </View>
//   )
// }

/**
 * Custom Bottom Tab Navigator using Stack Navigator
 */
// export default function CustomBottomTabNavigator() {
//   const { user } = useUserStore();

//   return (
//     <Stack.Navigator
//       initialRouteName="Dashboard"
//       screenOptions={{
//         headerShown: false,
//       }}
//     >
//       {screens.filter(s => allownavigation(user, s.name)).map((s) => (
//         <Stack.Screen
//           key={s.name}
//           name={s.name}
//         >
//           {(screenProps) => (
//             <ScreenWithBottomBar
//               component={s.component}
//               {...screenProps}
//             />
//           )}
//         </Stack.Screen>
//       ))}
//     </Stack.Navigator>
//   )
// }


function MainLayout({ children }) {
  const insets = useSafeAreaInsets();



  return (
    <View className="flex-1 bg-gray-50">
      {/* TopBar stays mounted */}
      <TopBar />

      {/* Main Content */}
      <View className="flex-1">{children}</View>

      {/* BottomBar stays mounted */}
      <BottomBar />
    </View>
  );
}
export default function CustomBottomTabNavigator() {
  const { user } = useUserStore();

  return (
    <MainLayout >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screens.filter(s => allownavigation(user, s.name)).map(s => (
          <Stack.Screen key={s.name} name={s.name}>
            {(props) => (
              <s.component {...props} />
            )}
          </Stack.Screen>
        ))}
      </Stack.Navigator>
    </MainLayout>
  );
}