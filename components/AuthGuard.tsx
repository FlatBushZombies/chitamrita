"use client"

import React, { useEffect } from "react"
import { View, Text, ActivityIndicator } from "react-native"
import { useAuth as useClerkAuth } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { useTheme } from "@/context/ThemeContext"

interface AuthGuardProps {
    children: React.ReactNode
    redirectTo?: string
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
    children,
    redirectTo = '/(root)/(tabs)/SearchScreen'
}) => {
    const { isLoaded, isSignedIn } = useClerkAuth()
    const router = useRouter()
    const { colors } = useTheme()

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            console.log("User is already signed in, redirecting to:", redirectTo)
            router.replace(redirectTo as any)
        }
    }, [isLoaded, isSignedIn, router, redirectTo])

    // Show loading screen while checking authentication state
    if (!isLoaded) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
            </View>
        )
    }

    // Don't render children if user is already signed in
    if (isSignedIn) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>Redirecting...</Text>
            </View>
        )
    }

    // Render children only if user is not signed in
    return <>{children}</>
}

const styles = {
    loadingContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: "bold" as const,
        marginTop: 20,
    },
} 