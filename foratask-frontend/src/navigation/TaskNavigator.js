// src/navigation/TaskNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TaskList from "../screens/Task/TaskList";   // /task
import AddTask from "../screens/Task/AddTask";     // /task/add
import TaskDetails from "../screens/Task/TaskDetails"; // /task/:id

const Stack = createNativeStackNavigator();

export default function TaskNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TaskList" component={TaskList} />
      <Stack.Screen name="AddTask" component={AddTask} />
      <Stack.Screen name="TaskDetails" component={TaskDetails} />
    </Stack.Navigator>
  );
}
