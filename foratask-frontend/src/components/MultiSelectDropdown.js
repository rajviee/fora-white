"use client"

import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import api from "../utils/api"

const MultiSelectDropdown = ({
  label,
  selectedItems = [],
  onSelectionChange,
  excludeIds = [],
  placeholder = "Select items...",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchText, setSearchText] = useState("")
  const [loading, setLoading] = useState(false)

  // Fetch employees from API
  const fetchEmployees = async () => {
    try {
      setLoading(true)
      const response = await api.get("/emp-list")
      const employeeData = response.data.employees || []
      setEmployees(employeeData)
      setFilteredEmployees(employeeData)
    } catch (error) {
      console.error("Error fetching employees:", error)
      // You can add your toast error handling here
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  // Filter employees based on search and exclusions
  useEffect(() => {
    const filtered = employees.filter((emp) => {
      const matchesSearch = emp.name.toLowerCase().includes(searchText.toLowerCase())
      const notSelected = !selectedItems.some((selected) => selected.id === emp.id)
      const notExcluded = !excludeIds.includes(emp.id)
      return matchesSearch && notSelected && notExcluded
    })
    setFilteredEmployees(filtered)
  }, [searchText, employees, selectedItems, excludeIds])

  const handleSelect = (employee) => {
    const newSelection = [...selectedItems, employee]
    onSelectionChange(newSelection)
    setSearchText("")
  }

  const handleRemove = (employeeId) => {
    const newSelection = selectedItems.filter((item) => item.id !== employeeId)
    onSelectionChange(newSelection)
  }

  const renderSelectedItem = ({ item }) => (
    <View className="flex-row items-center bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2">
      <Text className="text-blue-800 text-sm mr-2">{item.name}</Text>
      <TouchableOpacity
                activeOpacity={1} onPress={() => handleRemove(item.id)}>
        <Ionicons name="close-circle" size={16} color="#1e40af" />
      </TouchableOpacity>
    </View>
  )

  const renderEmployeeItem = ({ item }) => (
    <TouchableOpacity
                activeOpacity={1} className="flex-row items-center p-3 border-b border-gray-200" onPress={() => handleSelect(item)}>
      <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-3">
        <Text className="text-white text-sm font-medium">{item.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 font-medium">{item.name}</Text>
        <Text className="text-gray-500 text-sm">{item.email}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-2">{label}</Text>

      {/* Selected Items */}
      {selectedItems.length > 0 && (
        <View className="flex-row flex-wrap mb-2">
          <FlatList
            data={selectedItems}
            renderItem={renderSelectedItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Dropdown Trigger */}
      <TouchableOpacity
                activeOpacity={1}
        className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between bg-white"
        onPress={() => setIsOpen(true)}
      >
        <Text className={`${selectedItems.length > 0 ? "text-gray-900" : "text-gray-500"}`}>
          {selectedItems.length > 0 ? `${selectedItems.length} selected` : placeholder}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#00000080" />
      </TouchableOpacity>

      {/* Modal Dropdown */}
      <Modal visible={isOpen} transparent={true} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-96">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
              <Text className="text-lg font-semibold text-gray-900">Select {label}</Text>
              <TouchableOpacity
                activeOpacity={1} onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#00000080" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="p-4 border-b border-gray-200">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Ionicons name="search" size={20} color="#00000080" />
                <TextInput
                  className="flex-1 ml-2 text-gray-900"
                  placeholder="Search employees..."
                  value={searchText}
                  onChangeText={setSearchText}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Employee List */}
            <FlatList
              data={filteredEmployees}
              renderItem={renderEmployeeItem}
              keyExtractor={(item) => item.id.toString()}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Text className="text-gray-500 text-center">
                    {loading ? "Loading employees..." : "No employees found"}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default MultiSelectDropdown
