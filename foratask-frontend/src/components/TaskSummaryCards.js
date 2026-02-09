import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import PieChart from 'react-native-pie-chart';
import api from '../utils/api';

const TaskSummaryCards = ({ reportType,fromDate, toDate}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const widthAndHeight = 75;

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/${reportType}`,{params:{
        fromDate,toDate
      }});
      setData(response.data);
    } catch (error) {
      console.error('Error fetching task summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-gray-600">Failed to load data</Text>
      </View>
    );
  }

  const { totalTasks, completedTasks, inProgressTasks, pendingTasks, overdueTasks } = data;

  const cards = [
    {
      title: 'Completed Tasks',
      value: completedTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      color: '#3A974CCC',
      bgColor: '#d1fae5'
    },
    {
      title: 'In Progress Tasks',
      value: inProgressTasks,
      percentage: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0,
      color: '#FFC83BCC',
      bgColor: '#dbeafe'
    },
    {
      title: 'Pending Tasks',
      value: pendingTasks,
      percentage: totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0,
      color: '#D83939CC',
      bgColor: '#fef3c7'
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      percentage: totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0,
      color: '#103362CC',
      bgColor: '#fee2e2'
    }
  ];

  const TaskCard = ({ title, value, percentage, color, bgColor }) => {
    // Build series array with object format {value, color}
    let series = [];
    
    if (percentage > 0) {
      series = [
        { value: percentage, color: color },
        { value: 100 - percentage, color: '#e5e7eb' }
      ];
    } else {
      // If percentage is 0, show one neutral slice
      series = [{ value: 1, color: '#e5e7eb' }];
    }

    const totalSeries = series.reduce((sum, item) => sum + item.value, 0);

    return (
      <View className="bg-white rounded-[10px] p-4 mb-4" style={styles.card}>
        <View className="flex-row justify-between items-start ">
          <View className="flex-1">
            <Text className="text-[#030229] text-sm font-semibold mb-2">{title}</Text>
            <Text className="text-2xl font-bold text-[#000000]">{percentage}%</Text>
            <Text className="text-gray-500 text-xs font-[500] mt-1">
              {value} of {totalTasks} tasks
            </Text>
          </View>
          <View style={styles.chartContainer}>
            <PieChart 
              widthAndHeight={widthAndHeight} 
              series={series} 
              cover={0.78}
            />
            {percentage === 0 && (
              <View style={styles.overlayContainer}>
                <Text style={styles.overlayText}>No Data</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="py-4">
      {/* Grid: 4 columns on laptop, 2 on tablet, 1 on mobile */}
      <View className="flex-row flex-wrap -mx-2">
        {cards.map((card, index) => (
          <View 
            key={index}
            className="w-full sm:w-1/2 lg:w-1/4 px-2"
          >
            <TaskCard {...card} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    borderWidth: 1,
    borderColor: '#00000080',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  overlayContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
});

export default TaskSummaryCards;