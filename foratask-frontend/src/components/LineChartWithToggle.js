import React, { useState, useEffect, useContext } from "react";
import { View, Text, TouchableOpacity, Dimensions, Platform } from "react-native";
import { LineChart } from "react-native-chart-kit";
import api from "../utils/api";
import { DashboardContext } from "../utils/Context/DashboardContext";

const LineChartWithToggle = () => {
  const { widthComp, isSelfTask, setIsSelfTask } = useContext(DashboardContext);
  // const [isSelfTask, setIsSelfTask] = useState(false);
  const [chartData, setChartData] = useState({
    labels: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        color: () => "#3E529A",
        strokeWidth: 3,
        withShadow: false
      },
      {
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        color: () => "#E65C5E",
        strokeWidth: 2,
        strokeDashArray: [8, 5],
        withDots: false,
        withShadow: false
      },
    ],
  });

  const [hoveredData, setHoveredData] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const screenWidth = widthComp;

  const getFontSize = (baseSize) => {
    if (screenWidth < 640) return baseSize * 0.85;
    if (screenWidth < 768) return baseSize * 0.9;
    if (screenWidth < 1024) return baseSize * 0.95;
    return baseSize;
  };

  // const handleToggleTaskType = (isSelf) => {
  //   setIsSelfTask(isSelf);
  // };

  // Fetch chart data from API
  const fetchChartData = async () => {
    try {
      const response = await api.get("/stats/statisticsGraph", {
        params: { isSelfTask: isSelfTask },
      });
      const data = response.data;

      const labels = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
      ];

      const completedData = Array(12).fill(0);
      const incompleteData = Array(12).fill(0);

      if (Array.isArray(data)) {
        data.forEach((item) => {
          const index = item.month - 1;
          if (index >= 0 && index < 12) {
            completedData[index] = Number(item.completed) || 0;
            incompleteData[index] = Number(item.incomplete) || 0;
          }
        });
      }

      const safeCompletedData = completedData.map(val =>
        Number.isFinite(val) ? val : 0
      );
      const safeIncompleteData = incompleteData.map(val =>
        Number.isFinite(val) ? val : 0
      );

      setChartData({
        labels,
        datasets: [
          {
            data: safeCompletedData,
            color: () => "#1360C6",
            strokeWidth: 3,
            withShadow: false
          },
          {
            data: safeIncompleteData,
            color: () => "#E65C5E",
            strokeWidth: 2,
            strokeDashArray: [8, 5],
            withDots: false,
            withShadow: false
          },
        ],
      });
    } catch (error) {
      console.log("Error fetching chart data:", error);
    }
  };

  useEffect(() => {

    fetchChartData();
  }, [isSelfTask]);

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    backgroundGradientFromOpacity: 0,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
    fillShadowGradient: "transparent",
    fillShadowGradientOpacity: 0,
    propsForLabels: { fontSize: 10, fontWeight: "600" },
    propsForBackgroundLines: { strokeWidth: 0 },
  };

  const handleChartMouseMove = (e) => {
    if (Platform.OS !== 'web') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate which data point is closest
    const chartWidth = screenWidth * 0.99;
    const paddingLeft = 50; // Approximate left padding of the chart
    const paddingRight = 20; // Approximate right padding of the chart
    const dataPointWidth = (chartWidth - paddingLeft - paddingRight) / 11; // 11 intervals between 12 points

    const hoveredIndex = Math.round((x - paddingLeft) / dataPointWidth);

    if (hoveredIndex >= 0 && hoveredIndex < 12) {
      setHoveredData({
        month: chartData.labels[hoveredIndex],
        completed: chartData.datasets[0].data[hoveredIndex],
        incomplete: chartData.datasets[1].data[hoveredIndex],
      });
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleChartMouseLeave = () => {
    setHoveredData(null);
  };

  return (
    <View className="bg-white rounded-xl mt-4 border border-[#00000080] p-5 px-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-[22px] font-semibold">Statistics</Text>
        {/* <View className="flex-row justify-center">
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => handleToggleTaskType(true)}
            className={`border-[1px] border-[#010f42] px-3 py-1.5 rounded-l-[6px] ${isSelfTask ? "bg-[#1360C6]" : "bg-white"}`}
          >
            <Text style={{ fontSize: getFontSize(14) }} className={`${isSelfTask ? "text-white" : "text-[#1360C6]"} font-semibold`}>
              Self
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => handleToggleTaskType(false)}
            className={`border-[1px] border-[#010f42] px-3 py-1.5 rounded-r-[6px] ${!isSelfTask ? "bg-[#1360C6]" : "bg-white"}`}
          >
            <Text style={{ fontSize: getFontSize(14) }} className={`${!isSelfTask ? "text-white" : "text-[#1360C6]"} font-semibold`}>
              Team
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>

      {/* Chart Container with Tooltip */}
      <View
        className="items-center relative"
        onMouseMove={handleChartMouseMove}
        onMouseLeave={handleChartMouseLeave}
        style={{ position: 'relative' }}
      >
        <LineChart
          data={chartData}
          width={screenWidth * 0.99}
          height={260}
          chartConfig={chartConfig}
          bezier
          fromZero={true}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={false}
          withDots={false}
          yAxisInterval={2}

          style={{ borderRadius: 16 }}
        />

        {/* Tooltip Box */}
        {hoveredData && Platform.OS === 'web' && (
          <View
            style={{
              position: 'absolute',
              left: tooltipPos.x,
              top: tooltipPos.y - 80,
              backgroundColor: '#ffffff',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 6,
              paddingTop: 5,
              paddingHorizontal: 10,
              paddingBottom: 7,
              // shadowColor: '#000',
              // shadowOffset: { width: 0, height: 3 },
              // shadowOpacity: 0.15,
              // shadowRadius: 3,
              elevation: 5,
              zIndex: 1000,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>
              {hoveredData.month}
            </Text>
            <Text style={{ fontSize: 12, color: '#1360C6', marginBottom: 2, fontWeight: 600 }}>
              Complete: {hoveredData.completed}
            </Text>
            <Text style={{ fontSize: 12, color: '#E65C5E', fontWeight: 600 }}>
              Incomplete: {hoveredData.incomplete}
            </Text>
          </View>
        )}
      </View>

      {/* Legend */}
      <View className="flex-row justify-center items-center  gap-3">
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-[#1360C6]" />
          <Text className="text-sm font-medium text-gray-600">Completed</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="w-2.5 h-2.5 rounded-full bg-[#E65C5E]" />
          <Text className="text-sm font-medium text-gray-600">Incomplete</Text>
        </View>
      </View>
    </View>
  );
};

export default LineChartWithToggle;