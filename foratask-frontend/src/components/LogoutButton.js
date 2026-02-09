import React from "react";
import {
  TouchableOpacity,
  Text,
  View,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import useUserStore from "../stores/useUserStore";

const LogoutButton = ({ style }) => {
  const { logout } = useUserStore();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      // ✅ Web fallback using browser confirm dialog
      if (window.confirm("Are you sure you want to logout?")) {
        logout();
      }
    } else {
      // ✅ Native alert dialog
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout },
      ]);
    }
  };

  return (
    <TouchableOpacity
                activeOpacity={1} style={[styles.button, style]} onPress={handleLogout}>
      <Text style={styles.buttonText}>Logout</Text>
    </TouchableOpacity>
  );
};

// Example usage in a profile/settings screen
export const UserProfile = () => {
  const { user } = useUserStore();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>
        Welcome, {user?.name || user?.email || "User"}!
      </Text>
      <LogoutButton />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  welcome: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default LogoutButton;
