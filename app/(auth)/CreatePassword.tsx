"use client"

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "@/config/config";

const CreatePasswordScreen = () => {
    const router = useRouter();
    const { signIn, isLoaded } = useSignIn();
    const params = useLocalSearchParams();
    const { email } = params;

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password validation states
    const [hasAlphabet, setHasAlphabet] = useState(false);
    const [hasNumbers, setHasNumbers] = useState(false);
    const [hasSpecialChars, setHasSpecialChars] = useState(false);

    // Validate password on change
    useEffect(() => {
        setHasAlphabet(/[a-zA-Z]{3,}/.test(password));
        setHasNumbers(/\d{2,}/.test(password));
        setHasSpecialChars(/[^a-zA-Z0-9]{2,}/.test(password));
    }, [password]);

    const isPasswordValid = hasAlphabet && hasNumbers && hasSpecialChars;
    const doPasswordsMatch = password === confirmPassword;
    const canProceed = isPasswordValid && doPasswordsMatch && password.length > 0;

    const handleResetPassword = async () => {
        if (!isLoaded || !canProceed) return;

        try {
            setIsLoading(true);
            setError('');

            // Attempt to reset the password
            const result = await signIn.attemptFirstFactor({
                strategy: "reset_password_email_code",
                code: params.code as string,
                password,
            });

            if (result.status === "complete") {
                // Password reset successful, redirect to login
                router.replace('/(auth)/LoginScreen');
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } catch (err: any) {
            console.error('Error resetting password:', err);
            setError(err.errors?.[0]?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Logo */}
            <View style={styles.logoContainer}>
                <View style={styles.logo} />
            </View>

            {/* Header */}
            <Text style={styles.title}>Create a secure password</Text>
            <Text style={styles.subtitle}>Please enter a strong password and keep it well</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Password Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="New password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color={COLORS.textSecondary}
                    />
                </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>A strong password has:</Text>
                <Text style={[styles.requirement, hasAlphabet ? styles.requirementMet : {}]}>
                    At least 3 alphabet
                </Text>
                <Text style={[styles.requirement, hasNumbers ? styles.requirementMet : {}]}>
                    At least 2 numbers
                </Text>
                <Text style={[styles.requirement, hasSpecialChars ? styles.requirementMet : {}]}>
                    At least 2 special characters
                </Text>
            </View>

            {/* Done Button */}
            <TouchableOpacity
                style={[styles.button, !canProceed && styles.buttonDisabled]}
                disabled={!canProceed || isLoading}
                onPress={handleResetPassword}
            >
                {isLoading ? (
                    <ActivityIndicator color={COLORS.text} />
                ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logo: {
        width: 60,
        height: 60,
        backgroundColor: COLORS.primary,
        borderRadius: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: 15,
    },
    inputContainer: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        height: 55,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: '100%',
        color: COLORS.text,
        paddingHorizontal: 15,
        fontSize: 16,
    },
    eyeIcon: {
        padding: 15,
    },
    requirementsContainer: {
        marginTop: 10,
        marginBottom: 30,
    },
    requirementsTitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 5,
    },
    requirement: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 3,
    },
    requirementMet: {
        color: COLORS.primary,
    },
    button: {
        backgroundColor: COLORS.primary,
        height: 55,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CreatePasswordScreen;