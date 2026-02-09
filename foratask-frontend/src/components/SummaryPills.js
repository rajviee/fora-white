import React, { useState, useEffect, memo, useContext } from 'react'
import { useWindowDimensions, View, Text, Pressable, ActivityIndicator } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from "@react-navigation/native"
import * as navigation from "../navigation/navigationRef"
import api from '../utils/api'
import { DashboardContext } from "../utils/Context/DashboardContext";


const SummaryPills = () => {
  const { isSelfTask, summary, setSummary, loading, setLoading } = useContext(DashboardContext)
  const { width } = useWindowDimensions()
  const isLaptop = width >= 1024
  // const navigation = useNavigation()

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get(`/stats/tasks-summary?isSelfTask=${isSelfTask}`)
        setSummary(response.data)
      } catch (error) {
        console.error("Error fetching task summary:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [isSelfTask])

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" className="mt-5" />
  }

  const totalTasks = summary?.allTimeTotalTasks || 0
  const completedTasks = summary?.allTimeCompletedTasks || 0
  const overdueTasks = summary?.allTimeOverdueTasks || 0
  const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <View
      className=" flex flex-row flex-wrap justify-between"
      style={{
        gap: 12, // spacing between cards (works in RN 0.72+)
      }}
    >
      {/* Add New Task (only on mobile/tablet) */}
      {!isLaptop && (
        <Pressable
          className="flex-row w-full items-center p-3.5 border border-[#00000080] rounded-xl bg-white gap-2.5"
          style={{
            flexBasis: '48%',
            marginBottom: 8,
          }}
          onPress={() => navigation.navigate("Task", { screen: "AddTask" })}
        >
          <View className="p-2.5 rounded-3xl bg-[#1360C6] items-center justify-center">
            <MaterialIcons name="add" size={22} color="#fff" />
          </View>
          <Text className="text-[13px] text-[#030229b3] font-medium">Create Task</Text>
        </Pressable>
      )}

      {/* Card Component */}
      <Pressable
        className="flex-row items-center p-3.5 border border-[#00000080] rounded-xl bg-white gap-2.5"
        style={{
          flexBasis: isLaptop ? '31%' : '48%',
          marginBottom: 8,
        }}
        onPress={() => navigation.navigate("Task", {
          screen: "TaskList",
          params: {
            isAllTime: true,
            isSelfTask:isSelfTask
          }
        })}
      >
        <View className="p-2.5 rounded-3xl bg-[#1360C6] items-center justify-center">
          <MaterialIcons
            name={"list-alt"}
            size={isLaptop ? 28 : 22}
            color="#fff"
          />
        </View>
        <View>
          <Text className="text-lg font-bold text-[#000000b3]">{totalTasks}</Text>
          <Text className="text-[13px] text-[#030229b3] font-medium">Total Task</Text>
        </View>

      </Pressable>
      {[
        { icon: "star", value: `${progress}%`, label: "Task Progress" },
        // { icon: "list-alt", value: totalTasks, label: "Total Task" },
        // { icon: "schedule", value: overdueTasks, label: "Overdue" },
      ].map((item, i) => (
        <View
          key={i}
          className="flex-row items-center p-3.5 border border-[#00000080] rounded-xl bg-white gap-2.5"
          style={{
            flexBasis: isLaptop ? '31%' : '48%',
            marginBottom: 8,
          }}
        >
          <View className="p-2.5 rounded-3xl bg-[#1360C6] items-center justify-center">
            <MaterialIcons
              name={item.icon}
              size={isLaptop ? 28 : 22}
              color="#fff"
            />
          </View>
          <View>
            <Text className="text-lg font-bold text-[#000000b3]">{item.value}</Text>
            <Text className="text-[13px] text-[#030229b3] font-medium">{item.label}</Text>
          </View>
        </View>
      ))}
      <Pressable
        className="flex-row items-center p-3.5 border border-[#00000080] rounded-xl bg-white gap-2.5"
        style={{
          flexBasis: isLaptop ? '31%' : '48%',
          marginBottom: 8,
        }}
        onPress={() =>
          navigation.navigate("Task", {
            screen: "TaskList",
            params: {
              statusFilter: ['Overdue'],
              isAllTime: true,
              isSelfTask:isSelfTask
            },
          })
        }

      >
        <View className="p-2.5 rounded-3xl bg-[#1360C6] items-center justify-center">
          <MaterialIcons
            name={"schedule"}
            size={isLaptop ? 28 : 22}
            color="#fff"
          />
        </View>
        <View>
          <Text className="text-lg font-bold text-[#000000b3]">{overdueTasks}</Text>
          <Text className="text-[13px] text-[#030229b3] font-medium">Overdue</Text>
        </View>

      </Pressable>
    </View>
  )
}

export default memo(SummaryPills);
// export default SummaryPills;

