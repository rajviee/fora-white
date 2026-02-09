"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  Alert,
  Image,
} from "react-native";
import { Search, Plus, Filter, User, ChevronLeft, ChevronRight } from "lucide-react-native";
import Avatar from "../../components/Avatar";
import api from "../../utils/api";
import { useApiQuery } from "../../utils/useApiQuery";

// Skeleton Components
const SkeletonBox = ({ width = "100%", height = 16, className = "" }) => (
  <View
    className={`bg-gray-200 rounded ${className}`}
    style={{ width, height }}
  />
);

const SkeletonCardLoader = ({ count = 5 }) => (
  <View className="py-2">
    {Array.from({ length: count }).map((_, index) => (
      <View
        key={`skeleton-card-${index}`}
        className="bg-white rounded-lg border border-gray-200 p-4 mb-3 mx-0 shadow-sm"
      >
        <View className="flex-row items-start">
          <View className="mr-3">
            <SkeletonBox width={60} height={60} className="rounded-full" />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between mb-2">
              <SkeletonBox width="50%" height={18} />
              <SkeletonBox width={80} height={24} className="rounded-md" />
            </View>
            <SkeletonBox width="70%" height={14} className="mb-2" />
            <SkeletonBox width="90%" height={14} className="mb-2" />
            <SkeletonBox width="60%" height={14} />
          </View>
        </View>
      </View>
    ))}
  </View>
);

const SkeletonTableLoader = ({ count = 5, isPhoneView }) => (
  <View className="w-full min-w-[300px]">
    {Array.from({ length: count }).map((_, index) => (
      <View
        key={`skeleton-row-${index}`}
        className={`flex-row items-center border-b border-gray-200 py-3 px-4 min-h-[60px] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
          }`}
      >
        <View className="w-[60px] items-center pr-2">
          <SkeletonBox width={40} height={40} className="rounded-full" />
        </View>
        <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[2] min-w-[160px]'} pr-2`}>
          <SkeletonBox width="80%" height={14} />
        </View>
        <View className={`${isPhoneView ? 'flex-[1.5] min-w-[150px]' : 'flex-[1.5] min-w-[150px]'} px-2`}>
          <SkeletonBox width="70%" height={14} />
        </View>
        <View className={`${isPhoneView ? 'flex-[2] min-w-[180px]' : 'flex-[2] min-w-[200px]'} px-2`}>
          <SkeletonBox width="85%" height={14} />
        </View>
        <View className={`${isPhoneView ? 'flex-[1.3] min-w-[140px]' : 'flex-[1.3] min-w-[140px]'} px-2`}>
          <SkeletonBox width="75%" height={14} />
        </View>
        <View className={`${isPhoneView ? 'w-[100px]' : 'w-[100px]'} px-2 items-center`}>
          <SkeletonBox width={70} height={24} className="rounded" />
        </View>
      </View>
    ))}
  </View>
);

export default function EmployeeList({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filterrole, setFilterrole] = useState("All Employees");
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isPhoneView = screenWidth < 1024;

  const queryParams = useMemo(() => ({
    search: debouncedQuery,
    page: currentPage - 1, // API uses 0-based indexing
    perPage,
  }), [debouncedQuery, currentPage, perPage]);

  const { data, isLoading, isFetching, error } = useApiQuery({
    key: "employees",
    url: "/emp-list",
    params: queryParams,
    keepPreviousData: false,
    staleTime: 30000,
    select: (res) => ({
      employees: res.employees || res || [],
      totalPages: res.totalPages || 0,
      totalEmp: res.totalEmp || 0,
    }),
    onError: () => {
      Alert.alert("Error", "Failed to load employees");
    },
  });

  const employees = data?.employees || [];
  const totalPages = data?.totalPages || 0;
  const totalEmp = data?.totalEmp || 0;

  const filteredEmployees = useMemo(() => {
    if (filterrole !== "All Employees") {
      return employees.filter((emp) => emp.role === filterrole);
    }
    return employees;
  }, [employees, filterrole]);

  const handleAddEmployee = useCallback(() => {
    navigation?.navigate?.("Employees", { screen: "AddEmployee" });
  }, [navigation]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const trimText = (text, maxLength = 80) =>
    text?.length > maxLength ? text.slice(0, maxLength) + '…' : text;

  // Pagination Component
  const renderPagination = () => {
    if (isLoading || totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 3;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View className={`flex-row items-center ${isPhoneView ? "justify-between" : "justify-center"} py-4 px-2 gap-2`}>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`flex-row items-center px-3 py-2 rounded-md border-2 ${currentPage === 1
            ? "border-[#00000040] bg-gray-200"
            : "border-[#00000080] bg-white hover:bg-gray-50"
            }`}
        >
          <ChevronLeft
            strokeWidth={2.7}
            size={16}
            color={currentPage === 1 ? "#00000040" : "#00000080"}
          />
          <Text  className={`ml-1 text-sm color-[#00000080] font-semibold`}>
            Prev
          </Text>
        </TouchableOpacity>

        {isPhoneView ? <View className="px-3"><Text className="font-semibold color-[#00000080]">
          {`Page ${currentPage} of ${endPage}`}
        </Text>
        </View> :
          <View className="flex-row items-center mx-2">
            {startPage > 1 && (
              <>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => handlePageChange(1)}
                  className="px-3 py-2 rounded-md border-2 border-[#00000080] bg-white mx-1"
                >
                  <Text className="text-sm text-[#00000080] font-semibold">1</Text>
                </TouchableOpacity>
                {startPage > 2 && (
                  <Text className="px-2 text-sm text-[#00000080]">...</Text>
                )}
              </>
            )}

            {pageNumbers.map((pageNum) => (
              <TouchableOpacity
                activeOpacity={1}
                key={pageNum}
                onPress={() => handlePageChange(pageNum)}
                className={`px-3 py-2 rounded-md font-semibold border-2 mx-1 ${pageNum === currentPage
                  ? "bg-[#1360C6] border-[#1360C6]"
                  : "border-[#00000080] bg-white"
                  }`}
              >
                <Text className={`text-sm ${pageNum === currentPage ? "text-white" : "text-[#00000080]"} font-semibold `}>
                  {pageNum}
                </Text>
              </TouchableOpacity>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <Text className="px-2 text-sm text-gray-500">...</Text>
                )}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => handlePageChange(totalPages)}
                  className="px-3 py-2 rounded-md border-2  border-[#00000080] bg-white mx-1"
                >
                  <Text className="text-sm text-[#00000080] font-semibold">{totalPages}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>}

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`flex-row items-center px-3 py-2 rounded-md border-2 ${currentPage === totalPages
            ? "border-[#00000040] bg-gray-200"
            : "border-[#00000080] bg-white hover:bg-gray-50"
            }`}
        >
          <Text  className={`mr-1 text-sm color-[#00000080] font-semibold`}>
            Next
          </Text>
          <ChevronRight
            strokeWidth={2.7}
            size={16}
            color={currentPage === totalPages ? "#00000040" : "#00000080"}
          />
        </TouchableOpacity>

      </View>
    );
  };

  // Card View for Phone
  const EmployeeCard = ({ employee, index }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Employees", {
          screen: "EmployeeDetails",
          params: { id: employee._id },
        })
      }
      className="bg-white rounded-lg border border-[#00000080] p-4 mb-3 mx-0 shadow-sm"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <View className="mr-3">
          <Avatar employee={employee} size={60} />
        </View>

        <View className="flex-1">
          <View className="flex-row justify-between">
            <Text className={`${isPhoneView ?"text-md font-bold":"text-lg font-semibold"}   text-gray-900 mb-1`}>
              {`${trimText(employee.firstName, 7) || ""} ${trimText(employee.lastName, 6) || ""}`.trim() || "N/A"}
            </Text>
            <View className="bg-[#E5E9F8] px-3 py-0 rounded-md items-center flex justify-center">
              <Text className="text-sm font-medium text-black">
                {employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : "Employee"}
              </Text>
            </View>
          </View>

          <Text className="text-md text-gray-600 mb-2">
            {employee.designation || "N/A"}
          </Text>

          <View className="space-y-1">
            <View className="flex-row items-center">
              <Text className="text-md text-gray-700 flex-1" numberOfLines={1}>
                {employee.email || "N/A"}
              </Text>
            </View>

            <View className="flex-row items-center">
              <Text className="text-md text-gray-700">
                {employee.contactNumber || "N/A"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Table Header
  const TableHeader = () => (
    <View className="flex-row items-center border-b border-gray-300 py-3 px-4 bg-[#1360C6]">
      <View className="w-[60px] items-center pr-2">
        <Text className="text-white text-sm font-semibold">Photo</Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[2] min-w-[160px]'} pr-2`}>
        <Text className="text-white text-sm font-semibold">Name</Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[1.5] min-w-[150px]' : 'flex-[1.5] min-w-[150px]'} px-2`}>
        <Text className="text-white text-sm font-semibold">Designation</Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[2] min-w-[180px]' : 'flex-[2] min-w-[200px]'} px-2`}>
        <Text className="text-white text-sm font-semibold">Email Id</Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[1.3] min-w-[140px]' : 'flex-[1.3] min-w-[140px]'} px-2`}>
        <Text className="text-white text-sm font-semibold text-center">Contact No</Text>
      </View>
      <View className={`${isPhoneView ? 'w-[100px]' : 'w-[100px]'} px-2`}>
        <Text className="text-white text-sm font-semibold text-center">Role</Text>
      </View>
    </View>
  );

  // Table Row
  const TableRow = ({ employee, index }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("Employees", {
          screen: "EmployeeDetails",
          params: { id: employee._id },
        })
      }
      className={`flex-row items-center border-b border-gray-200 py-3 px-4 min-h-[60px] ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
        }`}
      activeOpacity={0.7}
    >
      <View className="w-[60px] items-center pr-2">
        <Avatar employee={employee} size={40} />
      </View>
      <View className={`${isPhoneView ? 'flex-[2.5] min-w-[180px]' : 'flex-[2] min-w-[160px]'} pr-2`}>
        <Text
          numberOfLines={isPhoneView ? 1 : 2}
          ellipsizeMode="tail"
          className="text-gray-700 text-sm"
        >
          {`${employee.firstName || ""} ${employee.lastName || ""}`.trim() || "N/A"}
        </Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[1.5] min-w-[150px]' : 'flex-[1.5] min-w-[150px]'} px-2`}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-gray-700 text-sm"
        >
          {employee.designation || "N/A"}
        </Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[2] min-w-[180px]' : 'flex-[2] min-w-[200px]'} px-2`}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-gray-700 text-sm"
        >
          {employee.email || "N/A"}
        </Text>
      </View>
      <View className={`${isPhoneView ? 'flex-[1.3] min-w-[140px]' : 'flex-[1.3] min-w-[140px]'} px-2`}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-gray-700 text-sm text-center"
        >
          {employee.contactNumber || "N/A"}
        </Text>
      </View>
      <View className={`${isPhoneView ? 'w-[100px]' : 'w-[100px]'} px-2 items-center`}>
        <View className="bg-blue-50 px-2 py-1 rounded">
          <Text className="text-gray-700 text-sm text-center font-medium">
            {employee.role ? employee.role.charAt(0).toUpperCase() + employee.role.slice(1) : "Employee"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const showSkeleton = isLoading && !data;

  return (
    <ScrollView
      className="flex-1 w-full bg-[#FBFBFB]"
      contentContainerStyle={{ padding: 16   }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Section */}
      <View className="flex-row justify-between items-center mb-5">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-amber-500 mb-1">
            {totalEmp} Employee{totalEmp !== 1 ? "s" : ""}
          </Text>
        </View>

        <TouchableOpacity
          className="flex-row items-center bg-[#1360C6] px-4 py-2 rounded-md gap-1"
          onPress={handleAddEmployee}
        >
          <Plus size={16} color="white" />
          <Text className="text-white text-sm font-medium">Add Employee</Text>
        </TouchableOpacity>
      </View>

      {/* Filter & Search */}
      <View className="bg-white p-2 rounded-md border-[1.5px] border-[#00000080]">
        <View className="flex-row p-2 pb-1 flex-wrap items-center justify-between mb-4 gap-2">
          <Text className="text-xl font-bold text-[#1360C6]">
            All Employees
          </Text>

          <View className="flex-row items-center bg-white border border-[#00000080] px-3 py-0 rounded-md">
            <Search size={18} color="#00000080" className="mr-2" />
            <TextInput
              className="flex-1 text-base text-black"
              placeholder="Search"
              placeholderTextColor="#00000080"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Content Area */}
        <View className="flex-1">
          {showSkeleton ? (
            // Show Skeleton Loading
            isPhoneView ? (
              <ScrollView
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
              >
                <SkeletonCardLoader count={perPage} />
              </ScrollView>
            ) : (
              <ScrollView
                horizontal={isPhoneView}
                showsHorizontalScrollIndicator={isPhoneView}
                showsVerticalScrollIndicator={!isPhoneView}
                persistentScrollbar={true}
                className="flex-1 max-h-[75vh]"
                contentContainerStyle={isPhoneView ? { minWidth: '100%' } : undefined}
              >
                <SkeletonTableLoader count={perPage} isPhoneView={isPhoneView} />
              </ScrollView>
            )
          ) : (
            // Show Actual Data
            <>
              {isPhoneView ? (
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}
                >
                  {filteredEmployees.length > 0 ? (
                    <View className="py-2">
                      {filteredEmployees.map((employee, index) => (
                        <EmployeeCard
                          key={employee._id || index}
                          employee={employee}
                          index={index}
                        />
                      ))}
                    </View>
                  ) : (
                    <View className="p-10 items-center justify-center">
                      <Text className="text-lg text-gray-400 text-center">
                        {searchQuery.trim()
                          ? "No employees found matching your search"
                          : "No employees found"}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              ) : (
                <View className="flex-1 border border-[#00000080] rounded-lg bg-white overflow-hidden max-h-[75vh]">
                  {/* Sticky Header */}
                  <View className="bg-white">
                    <TableHeader />
                  </View>

                  {/* Scrollable Content */}
                  <ScrollView showsVerticalScrollIndicator>
                    <ScrollView
                      horizontal={isPhoneView}
                      showsHorizontalScrollIndicator={isPhoneView}
                      persistentScrollbar
                      contentContainerStyle={isPhoneView ? { minWidth: '100%' } : undefined}
                    >
                      <View className="min-w-[300px]">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee, index) => (
                            <TableRow
                              key={employee._id || index}
                              employee={employee}
                              index={index}
                            />
                          ))
                        ) : (
                          <View className="p-10 items-center justify-center bg-white">
                            <Text className="text-lg text-gray-400 text-center">
                              {searchQuery.trim()
                                ? "No employees found matching your search"
                                : "No employees found"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </ScrollView>
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </View>
      {renderPagination()}
      </View>

      {/* Pagination */}
    </ScrollView>
  );
}