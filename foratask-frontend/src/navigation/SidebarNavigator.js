import React, { useState, useEffect, useRef } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Platform, Image, ScrollView, TextInput, Modal, Pressable, Keyboard } from "react-native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useNavigation, useRoute } from '@react-navigation/native'  // KEEP ONLY THIS
import { LinearGradient } from "expo-linear-gradient"
import { Portal, Provider } from 'react-native-paper';
import {
  LayoutDashboard,
  SquareCheckBig,
  MessagesSquare,
  SquareMenu,
  Users,
  Settings as Cog,
  Search,
  Bell,
  User,
  ChevronDown,
  ChevronRight, X
} from "lucide-react-native"
import useUserStore from "../stores/useUserStore"
import Dashboard from "../screens/Dashboard"
import NotificationPage from "../screens/NotificationPage"
import Task from "../screens/Task/AddTask"
import Discussion from "../screens/Discussion"
import Reports from "../screens/Reports/Reports"
import AdminReport from "../screens/Reports/AdminReport"
import EmployeeReport from "../screens/Reports/EmployeeReport"
import TimelineReport from "../screens/Reports/TimelineReport"
import RecurringReport from "../screens/Reports/RecurringReport"
import PriorityReport from "../screens/Reports/PriorityReport"
import RejectionReport from "../screens/Reports/RejectionReport"
import Performance from "../screens/Reports/Performance"
import Employees from "../screens/Employees"
import Settings from "../screens/Settings"
import Profile from "../screens/Profile"
import api, { removetoken } from "../utils/api"
import { useWindowDimensions } from "react-native"
import TaskNavigator from "./TaskNavigator";
import EmployeeNavigator from "./EmployeeNavigator"
import NotificationsBadge from "../components/NotificationsBadge"
import AppLogo from "../components/AppLogo"
import * as navigation from "../navigation/navigationRef"
import { RouteContext } from "../utils/Context/RouteContext"
import Avatar from "../components/Avatar"
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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


const Stack = createNativeStackNavigator()
const ReportsStack = createNativeStackNavigator()




export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [layout, setLayout] = useState(null);
  const searchBarRef = useRef(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchTasks(searchQuery);
      } else {
        setResults([]);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const searchTasks = async (query) => {
    setIsLoading(true);

    try {
      const response = await api.get(
        `${process.env.EXPO_PUBLIC_API_URL}/task/search?q=${encodeURIComponent(query)}`
      );
      const data = response.data;

      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;

    if (Platform.OS === 'web') {
      // Web: Use getBoundingClientRect for accurate positioning
      if (searchBarRef.current) {
        const rect = searchBarRef.current.getBoundingClientRect?.();
        if (rect) {
          setLayout({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width,
          });
        }
      }
    } else {
      // Native: Use measure callback
      event.target.measure((fx, fy, w, h, pageX, pageY) => {
        setLayout({
          top: pageY + h + 4,
          left: pageX,
          width: w,
        });
      });
    }
  };

  const handleFocus = () => {
    setIsFocused(true);

    // Remeasure on focus for both platforms
    if (Platform.OS === 'web' && searchBarRef.current) {
      const rect = searchBarRef.current.getBoundingClientRect?.();
      if (rect) {
        setLayout({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  };

  const handleTaskPress = (taskId) => {
    Keyboard.dismiss();
    setIsFocused(false);
    setSearchQuery('');
    setResults([]);
    navigation.navigate('Task', {
      screen: 'TaskDetails',
      params: { id: taskId },
    });
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
  };

  const showDropdown = isFocused && layout && (searchQuery.length > 0 || isLoading);

  return (
    <>
      <View
        ref={searchBarRef}
        style={{ minWidth: isMobile?300:600 }}
        className="flex py-1"
        onLayout={handleLayout}
      >
        <View className="flex-row items-center border border-[#00000080] rounded-lg px-2 bg-[#1360C61A] h-10">
          <Search size={20} color="#6c757dcd" className="mr-2" />

          <TextInput
            placeholder="Search tasks..."
            className="flex-1 text-base py-0 border-0 outline-none"
            placeholderTextColor="#6c757dcd"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleFocus}
            onBlur={() => {
              setTimeout(() => setIsFocused(false), 200);
            }}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} className="p-1">
              <X size={16} color="#6c757dcd" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showDropdown && (
        <Portal>
          <View
            style={{
              position: 'absolute',
              top: layout.top,
              left: layout.left,
              width: layout.width,
              zIndex: 9999,
              elevation: 5,
            }}
          >
            <View className="bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
              <ScrollView
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {isLoading ? (
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View key={i} className="px-4 py-3">
                        <View className="h-4 bg-gray-200 rounded-md w-3/4 mb-2" />
                        <View className="h-3 bg-gray-200 rounded-md w-full" />
                      </View>
                    ))}
                  </>
                ) : results.length > 0 ? (
                  results.map((task, index) => (
                    <TouchableOpacity
                      key={task._id}
                      activeOpacity={0.7}
                      onPress={() => handleTaskPress(task._id)}
                    >
                      <View className="px-4 py-3">
                        <Text
                          className="text-base font-medium text-gray-800 mb-1"
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        {task.description ? (
                          <Text className="text-sm text-gray-600" numberOfLines={2}>
                            {task.description}
                          </Text>
                        ) : null}
                      </View>

                      {index < results.length - 1 && (
                        <View className="h-[1px] bg-gray-100 mx-4" />
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="px-4 py-6 items-center">
                    <Text className="text-gray-500 text-sm">No tasks found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Portal>
      )}
    </>
  );
}


const allownavigation = (user, name) => {
  const AdminSupervisorAllowed = ["Dashboard", "Discussion", "Settings", "Reports", "Task", "Notification", "Employees", "Profile"]
  const EmployeeAllowed = ["Dashboard", "Reports", "Task", "Notification", "Profile"]
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

// Report sub-options with their respective components
const reportTypes = [
  { name: "Admin Report", path: "AdminReport", component: AdminReport },
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
        options={{ title: 'Reports' }}
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

// Config of screens
const screens = [
  { name: "Dashboard", icon: LayoutDashboard, component: Dashboard },
  { name: "Task", icon: SquareCheckBig, component: TaskNavigator },
  { name: "Notification", icon: Bell, component: NotificationPage, hideFromSidebar: true },
  { name: "Reports", icon: SquareMenu, component: ReportsNavigator, hasDropdown: true },
  { name: "Employees", icon: Users, component: EmployeeNavigator },
  { name: "Profile", icon: User, component: Profile, hideFromSidebar: true },
]


function AppLayout({ children }) {
  return (
    <View className="flex-row h-full">

      {/* LEFT SIDEBAR – doesn't re-render */}
      <Sidebar />

      <View className="flex-1 bg-gray-50">

        {/* TOPBAR – doesn't re-render */}
        <TopBar />

        {/* INNER SCREENS */}
        <View className="flex-1">
          {children}
        </View>
      </View>
    </View>
  );
}
export default function SidebarNavigator() {
  const { user } = useUserStore();

  return (
    <AppLayout>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{ headerShown: false }}
      >
        {screens
          .filter(s => allownavigation(user, s.name))
          .map((s) => (
            <Stack.Screen
              key={s.name}
              name={s.name}
              component={s.component}
            />
          ))}
      </Stack.Navigator>
    </AppLayout>
  );
}
const TopBar = React.memo(() => {
  // const navigation = useNavigation();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const { user, logout } = useUserStore();


  const handleProfilePress = () => {
    setDropdownVisible(false);
    navigation.navigate("Profile");
  };

  const handleLogout =async () => {
    setDropdownVisible(false);
    await removetoken();
    await logout();
    navigation.replace("Login");
  };

  return (
    <View className="h-16 bg-white  border-b border-[#000]  flex-row items-center justify-between px-6">
      <SearchBar />

      <View className="flex-row items-center space-x-4">
        <NotificationsBadge />

        <View>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setDropdownVisible(true)}
            className="flex-row items-center gap-2"
          >
            <Avatar employee={user} size={32} />
            <Text className="text-sm font-medium text-gray-700">
              {`${user.firstName} ${user.lastName}`}
            </Text>
            <ChevronDown size={16} color="#666" />
          </TouchableOpacity>

          {dropdownVisible && (
            <Modal
              transparent
              animationType="fade"
              visible={dropdownVisible}
              onRequestClose={() => setDropdownVisible(false)}
            >
              <Pressable className="flex-1" onPress={() => setDropdownVisible(false)}>
                <View className="absolute top-14 right-6 w-40 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <TouchableOpacity activeOpacity={1} onPress={handleProfilePress} className="px-4 py-2">
                    <Text className="text-gray-700">Profile</Text>
                  </TouchableOpacity>

                  <View className="h-[1px] bg-gray-200" />

                  <TouchableOpacity activeOpacity={1} onPress={handleLogout} className="px-4 py-2">
                    <Text className="text-red-600 font-medium">Logout</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>
          )}
        </View>
      </View>
    </View>
  );
});
const Sidebar = React.memo(() => {
  // const navigation = useNavigation();
  const [reportsExpanded, setReportsExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const { user } = useUserStore();
  const sidebarWidth = width < 1300 ? 190 : 210;
  const { currentRoute } = React.useContext(RouteContext)

  return (
    <View style={{ width: sidebarWidth }} className="h-full bg-[#1360C6] ">
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => navigation.navigate("Dashboard")}
        className="p-6"
      >
        <AppLogo width={155} height={55} />
      </TouchableOpacity>

      <View className="mt-3">
        {screens
          .filter(s => !s.hideFromSidebar)
          .filter(s => allownavigation(user, s.name))
          .map((s) => {
            const focused =
              tabRouteMap[s.name]?.includes(currentRoute);

            return (
              <View key={s.name}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {
                    if (s.hasDropdown) {
                      setReportsExpanded(!reportsExpanded);
                      navigation.navigate(s.name);
                    } else {
                      navigation.navigate(s.name);
                    }
                  }}
                >
                  {focused ? (
                    <LinearGradient
                      colors={["#D4AF37B3","#EFF4FF59","#EFF4FF0D", "#1360C6"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 0 }}
                      locations={[0, 0.2, 0.4,0.6]}
                      className="flex-row items-center px-4 py-2"
                    >
                      <View className="w-1 h-8 mr-3 bg-transparent" />
                      <s.icon size={20} color="#fff" />
                      <Text className="ml-3 text-[#fff] font-semibold text-base flex-1">
                        {s.name}
                      </Text>
                      {s.hasDropdown && (
                        reportsExpanded ?
                          <ChevronDown size={16} color="#fff" /> :
                          <ChevronRight size={16} color="#fff" />
                      )}
                    </LinearGradient>
                  ) : (
                    <View className="flex-row items-center px-4 py-2">
                      <View className="w-1 h-8 mr-3" />
                      <s.icon size={20} color="#fff" />
                      <Text className="ml-3 text-[#fff] text-base flex-1">{s.name}</Text>
                      {s.hasDropdown && (
                        reportsExpanded ?
                          <ChevronDown size={18} color="#fff" /> :
                          <ChevronRight size={18} color="#fff" />
                      )}
                    </View>
                  )}
                </TouchableOpacity>

                {s.hasDropdown && reportsExpanded && (
                  <View>
                    {reportTypes
                      .filter(r => allowshowreport(user, r.path))
                      .map((report) => {
                        const isReportFocused = currentRoute === report.path;
                        return (<TouchableOpacity
                          activeOpacity={1}
                          key={report.path}
                          onPress={() =>
                            navigation.navigate("Reports", { screen: report.path })
                          }
                          className="flex-row items-center pl-14 pr-4 py-2.5"
                        >
                          <Text className={`text-sm ${isReportFocused ? 'text-[#fff] font-bold' : 'text-[#ffffffcc]'}`}>{report.name}</Text>
                        </TouchableOpacity>)
                      })}
                  </View>
                )}
              </View>
            );
          })}
      </View>
    </View>
  );
});


