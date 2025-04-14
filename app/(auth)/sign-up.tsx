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
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useSignUp } from "@clerk/clerk-expo"
import { COLORS, COMMON_STYLES } from "@/config/config"

const SignUpScreen = () => {
  const navigation = useNavigation()
  const { isLoaded, signUp, setActive } = useSignUp()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignUp = async () => {
    if (!isLoaded) return

    if (!email || !password || !username || !fullName) {
      setError("All fields are required")
      return
    }

    try {
      setError("")
      setIsLoading(true)

      // Start the sign-up process with Clerk
      await signUp.create({
        emailAddress: email,
        password,
        username,
      })

      // Set the user's name
      await signUp.update({
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ").slice(1).join(" "),
      })

      // Prepare verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })

      // Navigate to verification screen
      navigation.navigate("Verification", {
        email,
        verificationStep: "email",
      })
    } catch (err) {
      console.error("Error during sign up:", err)
      setError(err.errors?.[0]?.message || "Failed to create account. Please try again.")
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

          <Text style={styles.welcomeText}>Welcome!</Text>
          <Text style={styles.headerText}>Sign up</Text>
          <Text style={styles.subHeaderText}>Please fill your information</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="email, phone number"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Ionicons name="person-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={styles.inputIcon} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="tag name"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <Ionicons name="at-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="first name and last name"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={fullName}
                onChangeText={setFullName}
              />
              <Ionicons name="person-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Log in</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signupButton} onPress={handleSignUp} disabled={isLoading || !isLoaded}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.signupButtonText}>Done</Text>
              )}
            </TouchableOpacity>
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
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 15,
  },
  loginLinkText: {
    color: COLORS.textSecondary,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  signupButton: {
    ...COMMON_STYLES.button,
    marginTop: 10,
  },
  signupButtonText: {
    ...COMMON_STYLES.buttonText,
  },
})

export default SignUpScreen
