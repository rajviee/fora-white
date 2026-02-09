// src/App.js
import "../global.css"
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useWindowDimensions } from "react-native"
import useUserStore, { setNavigationRef } from "./stores/useUserStore";
import LoginScreen from "./screens/LoginScreen";
import NotFoundScreen from "./screens/NotFoundScreen";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import SidebarNavigator from "./navigation/SidebarNavigator";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardProvider } from "./utils/Context/DashboardContext";
import { RouteContext } from "./utils/Context/RouteContext";
import { navigationRef } from "./navigation/navigationRef"
import { Provider as PaperProvider } from 'react-native-paper';

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator();
// export const navigationRef = createNavigationContainerRef();

const linking = {
  prefixes: ["http://localhost:8081/"],
  config: {
    screens: {
      Login: "login",
      Main: {
        screens: {
          Dashboard: "dashboard",
          Task: {
            screens: {
              TaskList: "task",
              AddTask: "task/add",
              TaskDetails: "task/:id",
            },
          },
          Discussion: "discussion",
          Notification: "notification",
          Reports: {
            screens: {
              ReportsList: "reports",
              AdminReport: "reports/admin-report",
              EmployeeReport: "reports/employee-report",
              TimelineReport: "reports/timeline-report",
              RecurringReport: "reports/recurring-report",
              PriorityReport: "reports/priority-report",
              RejectionReport: "reports/rejection-report",
              Performance: "reports/performance"
            }
          },
          Employees: {
            screens: {
              EmployeesList: "employees",
              AddEmployee: "employees/add",
              EmployeeDetails: "employees/:id"
            }
          },
          Settings: "settings",
          Profile: "profile",
        },
      },
      NotFound: "*",
    },
  },
};

export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;
  const { user, isInitialized, initializeStore } = useUserStore();
  const [currentRoute, setCurrentRoute] = useState(null);

  useEffect(() => {
    setNavigationRef(navigationRef);
    initializeStore();
  }, [initializeStore]);

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 justify-center items-center bg-white">
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </SafeAreaProvider>
    );
  }

  const isAuthenticated = !!user;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
         <PaperProvider>
        <RouteContext.Provider value={{ currentRoute, setCurrentRoute }}>
          <NavigationContainer ref={navigationRef}
            onReady={() => {
              const route = navigationRef.getCurrentRoute()?.name;
              setCurrentRoute(route);
            }}
            onStateChange={() => {
              const route = navigationRef.getCurrentRoute()?.name;
              setCurrentRoute(route);
            }} linking={linking}>
            {isAuthenticated ? (
              <DashboardProvider>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen
                    name="Main"
                    component={isMobile ? BottomTabNavigator : SidebarNavigator}
                    options={{
                      gestureEnabled: false,
                      headerBackVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="NotFound"
                    component={NotFoundScreen}
                    options={{ title: "Page Not Found" }}
                  />
                </Stack.Navigator>
              </DashboardProvider>

            ) : (
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen
                  name="NotFound"
                  component={NotFoundScreen}
                  options={{ title: "Page Not Found" }}
                />
              </Stack.Navigator>
            )}
          </NavigationContainer>
        </RouteContext.Provider>
          </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}