"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { useSignUp, useAuth as useClerkAuth} from "@clerk/clerk-expo"
import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useAuth } from "@/context/AuthContext"

const SignUpScreen = () => {
  const { colors } = useTheme()
  const { signUp, isLoaded } = useSignUp()
  const { isSignedIn } = useClerkAuth()
  const { signOut } = useClerkAuth()
  const { user, isLoading } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(root)/(tabs)/SearchScreen')
    }
  }, [user, isLoading])

  const handleSignUp = async () => {
    if (!isLoaded) {
      setError("Authentication service is not ready. Please try again later.")
      return
    }

    // Form validation
    if (!email.trim()) {
      setError("Please enter your email")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    if (!password.trim()) {
      setError("Please enter your password")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }
    if (!username.trim()) {
      setError("Please enter a username")
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return
    }
    if (!firstName.trim()) {
      setError("Please enter your first name")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Force sign-out if user is already signed in
      if (isSignedIn) {
        await signOut()
        // Small delay to ensure sign-out completes
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Create the user account
      const result = await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
        username: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      // Handle different sign-up statuses
      if (result.status === "complete") {
        router.replace('/(root)/(tabs)/SearchScreen')
      } else if (result.status === "missing_requirements") {
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

        // Navigate to verification screen
        router.push({
          pathname: "/(auth)/verification",
          params: {
            email: email.trim(),
            verificationStrategy: "sign_up",
          },
        })
      } else {
        setError("Sign up was not completed. Please try again.")
      }
    } catch (err: any) {
      console.error("Error signing up:", err)

      // Handle Clerk errors
      if (err.errors?.[0]?.code === "form_identifier_exists") {
        setError("An account with this email already exists")
      } else if (err.errors?.[0]?.code === "form_username_exists") {
        setError("This username is already taken")
      } else if (err.errors?.[0]?.code === "form_password_pwned") {
        setError("This password has been compromised. Please choose a different one.")
      } else {
        setError(err.errors?.[0]?.longMessage || "Failed to sign up. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.logoContainer}>
            <View style={[styles.logo, { backgroundColor: colors.primary }]} />
            <Text style={[styles.welcomeText, { color: colors.text }]}>Welcome!</Text>
            <Text style={[styles.signUpText, { color: colors.text }]}>Sign up</Text>
            <Text style={[styles.infoText, { color: colors.placeholder }]}>Please fill your information</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.placeholder}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <Ionicons name="mail-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                autoComplete="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.placeholder}
                />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Username"
                placeholderTextColor={colors.placeholder}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoComplete="username"
              />
              <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="First Name"
                placeholderTextColor={colors.placeholder}
                value={firstName}
                onChangeText={setFirstName}
                autoComplete="name-given"
              />
              <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBackground }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Last Name"
                placeholderTextColor={colors.placeholder}
                value={lastName}
                onChangeText={setLastName}
                autoComplete="name-family"
              />
              <Ionicons name="person-outline" size={20} color={colors.placeholder} style={styles.inputIcon} />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.signUpButton, { backgroundColor: colors.primary }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signInContainer}>
              <Text style={[styles.signInText, { color: colors.placeholder }]}>Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/LoginScreen")}>
                <Text style={[styles.signInLink, { color: colors.primary }]}> Log in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "500",
  },
  signUpText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
  },
  formContainer: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  input: {
    flex: 1,
    height: 50,
  },
  inputIcon: {
    padding: 5,
  },
  errorText: {
    color: "#EF4444",
    marginTop: 10,
    textAlign: "center",
  },
  signUpButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signUpButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signInText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: "bold",
  },
})

export default SignUpScreen