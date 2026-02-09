import React, { useState } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView } from "react-native";
import api from "../utils/api";

export default function ChangePasswordButton({ userId }) {
    const [visible, setVisible] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [success, setSuccess] = useState(false);
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)[A-Za-z\d\W]{8,}$/;

    const handleSubmit = async () => {
        if (!newPassword || !confirmPassword) {
            setErrorMsg("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg("Passwords do not match");
            return;
        }

        if (!passwordRegex.test(newPassword)) {
            console.log("check");
            setErrorMsg("Password must be at least 7 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.")
            return;
        }

        setErrorMsg("");
        setLoading(true);

        try {
            const response = await api.patch(
                `me/reset-password/${userId}`,
                { password: newPassword },
                { headers: { "Content-Type": "application/json" } }
            );

            // Hide all content & show success screen
            setSuccess(true);

            // Auto close after 2 seconds
            setTimeout(() => {
                setSuccess(false);
                setVisible(false);
                setNewPassword("");
                setConfirmPassword("");
            }, 2000);

        } catch (err) {
            setErrorMsg(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setVisible(false);
        setNewPassword("");
        setConfirmPassword("");
        setErrorMsg("");
        setSuccess(false);
    };

    return (
        <>
            {/* Button to open modal */}
            <TouchableOpacity style={styles.btn} onPress={() => setVisible(true)}>
                <Text style={styles.btnText}>Change Password</Text>
            </TouchableOpacity>

            {/* Modal */}
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <View style={styles.overlay}>
                        <View style={styles.modalContent}>
                            {success ? (
                                // ✅ SUCCESS SCREEN
                                <View style={{ padding: 30, alignItems: "center" }}>
                                    <Text style={{ fontSize: 18, fontWeight: "600", color: "green" }}>
                                        Password updated successfully!
                                    </Text>
                                </View>
                            ) : (
                                // ❌ NORMAL FORM
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <Text style={styles.title}>Change Password</Text>

                                    <TextInput
                                        style={styles.input}
                                        secureTextEntry
                                        placeholder="New Password"
                                        placeholderTextColor="#999"
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        textContentType="newPassword"
                                        autoComplete="password-new"
                                    />

                                    <TextInput
                                        style={styles.input}
                                        secureTextEntry
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#999"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        textContentType="newPassword"
                                        autoComplete="password-new"
                                    />

                                    {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

                                    <TouchableOpacity
                                        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                                        onPress={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.submitText}>Update Password</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                                        <Text style={styles.cancel}>Cancel</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    btn: {
        backgroundColor: "#1360C6",
        padding: 9,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    btnText: {
        color: "#fff",
        fontWeight: "500",
    },
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalContent: {
        width: "90%",
        maxWidth: 400,
        maxHeight: "80%",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
        color: "#000",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        fontSize: 16,
        color: "#000",
        backgroundColor: "#fff",
        ...(Platform.OS === 'android' && {
            fontFamily: 'sans-serif',
        }),
    },
    submitBtn: {
        backgroundColor: "#1360C6",
        padding: 12,
        borderRadius: 8,
        marginTop: 10,
    },
    submitText: {
        textAlign: "center",
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    cancelBtn: {
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        borderColor: "#1360C6",
        borderWidth: 2,
    },
    cancel: {
        textAlign: "center",
        color: "#1360C6",
        fontWeight: "bold",
        fontSize: 16,
    },
    error: {
        color: "red",
        marginBottom: 8,
        fontSize: 14,
    },
});