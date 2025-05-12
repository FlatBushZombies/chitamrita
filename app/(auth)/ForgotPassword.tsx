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
  ActivityIndicator,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useSignIn } from "@clerk/clerk-expo"
import { COLORS } from "@/config/config"

const ForgotPasswordScreen = () => {
  const router = useRouter()
  const { isLoaded, signIn } = useSignIn()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendCode = async () => {
    if (!isLoaded) return

    if (!email) {
      setError("Please enter your email")
      return
    }

    try {
      setError("")
      setIsLoading(true)

      // Start the password reset process
      const result = await signIn.create({
        identifier: email,
      })

      if (result.status === "needs_first_factor" && result.supportedFirstFactors) {
        // Prepare email verification for password reset
        const emailFactor = result.supportedFirstFactors.find(
          (factor) => factor.strategy === "reset_password_email_code"
        );

        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "reset_password_email_code",
            emailAddressId: emailFactor.emailAddressId,
          });

          // Navigate to verification screen
          router.push({
            pathname: "/(auth)/verification",
            params: {
              email,
              verificationStrategy: "reset_password_email_code",
            },
          });
        } else {
          setError("Email verification not available. Please try again.");
        }
      } else {
        setError("Failed to initiate password reset. Please try again.");
      }
    } catch (err: any) {
      console.error("Error during password reset:", err)
      if (err.errors?.[0]?.code === "form_identifier_not_found") {
        setError("No account found with this email. Please check your input.")
      } else {
        setError(err.errors?.[0]?.message || "Failed to send reset code. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardAvoid}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo} />
          </View>

          <Text style={styles.headerText}>Forgot your password?</Text>
          <Text style={styles.subHeaderText}>Please enter your email to get the reset code</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Ionicons name="mail-outline" size={20} color={COLORS.text} style={styles.inputIcon} />
            </View>

            <TouchableOpacity style={styles.sendButton} onPress={handleSendCode} disabled={isLoading || !isLoaded}>
              {isLoading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.sendButtonText}>Send Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
  },
  headerText: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.text,
    fontSize: 16,
  },
  inputIcon: {
    marginLeft: 10,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  sendButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default ForgotPasswordScreen
