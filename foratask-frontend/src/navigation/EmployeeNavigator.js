import React from 'react'
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EmployeeDetails from '../screens/Employees/EmployeeDetails';
import AddEmployee from '../screens/Employees/AddEmployee';
import EmployeesList from '../screens/Employees/EmployeesList';
const Stack = createNativeStackNavigator();

function EmployeeNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="EmployeesList" component={EmployeesList} />
            <Stack.Screen name="AddEmployee" component={AddEmployee} />
            <Stack.Screen name="EmployeeDetails" component={EmployeeDetails} />
        </Stack.Navigator>
    )
}

export default EmployeeNavigator
