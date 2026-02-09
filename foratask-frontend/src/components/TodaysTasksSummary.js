import React, { useContext } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { DashboardContext } from "../utils/Context/DashboardContext";


export default function TodaysTasksSummary() {
  const widthAndHeight = 160;
  const { summary, loading }=useContext(DashboardContext)
  // Show loader while waiting for data
  if (loading || !summary) {
    return (
      <ActivityIndicator
        size="large"
        color="#0A0A2A"
        style={{ marginTop: 20 }}
      />
    );
  }

  // Extract data from API summary
  const high = summary.todayhighPriority || 0;
  const medium = summary.todaymediumPriority || 0;
  const low = summary.todaylowPriority || 0;
  const due = summary.todayoverduePriority || 0;

  // Build series array with object format {value, color}
  let series = [
    { value: high, color: '#1360C6' },
    { value: medium, color: '#1360C6BF' },
    { value: low, color: '#1360C680' },
  ];

  // Add 'Due' slice only if greater than 0
  if (due > 0) {
    series.push({ value: due, color: '#103362' });
  }

  // If all values are 0, show one neutral slice to prevent PieChart errors
  const totalSeries = series.reduce((sum, item) => sum + item.value, 0);
  if (totalSeries === 0) {
    series = [{ value: 1, color: '#E6E7EC' }];
  }

  return (
    <View style={styles.section}>
      <Text className="text-[18px] font-semibold mb-3">Today’s Task Summary</Text>

      <View style={styles.container}>
        <PieChart widthAndHeight={widthAndHeight} series={series} cover={0.8} padAngle={0.05} />
        {totalSeries === 0 && (
          <View
            style={{
              position: 'absolute'
            }}
          >
            <Text style={styles.overlayText}>No Data</Text>
          </View>
        )}
      </View>

      {/* Legends */}
      <View style={styles.legendRow}>
        <LegendDot color="#1360C6" label={`High : ${high}`} />
        <LegendDot color="#1360C6BF" label={`Medium : ${medium}`} />
      </View>
      <View style={styles.legendRow}>
        <LegendDot color="#1360C680" label={`Low : ${low}`} />
        <LegendDot color="#103362" label={`Due : ${due > 0 ? due : 0}`} />
      </View>
    </View>
  );
}

const LegendDot = ({ color, label }) => {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    display: "flex",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#00000080',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
