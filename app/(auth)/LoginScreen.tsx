"use client"

import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSignIn } from "@clerk/clerk-expo"
import { COLORS, COMMON_STYLES } from "@/config/config"
import { useRouter } from "expo-router"

const LoginScreen = () => {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async () => {
    if (!isLoaded) return

    if (!identifier || !password) {
      setError("All fields are required")
      return
    }

    try {
      setError("")
      setIsLoading(true)

      // Start the sign-in process with Clerk
      const signInAttempt = await signIn.create({
        identifier: identifier,
        password,
      })

      // Check if the sign-in was successful
      if (signInAttempt.status === "complete") {
        // Set the active session
        await setActive({ session: signInAttempt.createdSessionId })

        // Navigate to main app
        router.replace("/HomeScreen")
      } else if (signInAttempt.status === "needs_second_factor") {
        // Handle 2FA if needed
        router.push("/(auth)/verification", {
          signInId: signIn.id,
        })
      } else if (signInAttempt.status === "needs_identifier" || signInAttempt.status === "needs_password") {
        setError("Please enter both email and password")
      } else if (signInAttempt.status === "needs_first_factor") {
        // Handle email verification code
        router.push("/(auth)/verification", {
          email: identifier,
          verificationStep: "login",
        })
      }
    } catch (err: any) {
      console.error("Error during sign in:", err)

      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const clerkError = err.errors[0]

        if (clerkError.code === "form_identifier_not_found") {
          setError("No account found with this email or username")
        } else if (clerkError.code === "form_password_incorrect") {
          setError("Incorrect password")
        } else {
          setError(clerkError.message || "Invalid credentials. Please try again.")
        }
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logo} />
          </View>

          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.headerText}>Chitamrita</Text>
          <Text style={styles.subHeaderText}>Please fill your information</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email or username"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoComplete="email"
              />
              <Ionicons name="person-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity style={styles.inputIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity onPress={() => router.push("/(auth)/ForgotPassword")}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading || !isLoaded}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupLinkContainer}>
              <Text style={styles.signupLinkText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  welcomeText: {
    color: COLORS.text,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  headerText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  subHeaderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 30,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 15,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    ...COMMON_STYLES.inputContainer,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    ...COMMON_STYLES.input,
    flex: 1,
  },
  inputIcon: {
    marginLeft: 10,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: 5,
  },
  forgotPasswordText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  loginButton: {
    ...COMMON_STYLES.button,
    marginTop: 20,
  },
  loginButtonText: {
    ...COMMON_STYLES.buttonText,
  },
  signupLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupLinkText: {
    color: COLORS.textSecondary,
  },
  signupLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
})

export default LoginScreen
