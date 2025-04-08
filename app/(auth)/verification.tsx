"use client"

import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { COLORS, COMMON_STYLES } from "@/config/config"

const VerificationScreen = () => {
  const navigation = useNavigation()
  const route = useRoute()
  const { verifyCode, isLoading } = useAuth()

  const { email, isReset = false } = route.params || {}

  const [code, setCode] = useState(["", "", "", ""])
  const [displayCode, setDisplayCode] = useState("")
  const [error, setError] = useState("")
  const [timer, setTimer] = useState(60)

  const inputRefs = useRef([])

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prevTimer) => (prevTimer > 0 ? prevTimer - 1 : 0))
    }, 1000)

    return () => clearInterval(countdown)
  }, [])

  useEffect(() => {
    setDisplayCode(code.join(""))
  }, [code])

  const handleCodeChange = (text, index) => {
    if (text.length > 1) {
      // Handle paste of full code
      const pastedCode = text.slice(0, 4).split("")
      const newCode = [...code]

      for (let i = 0; i < pastedCode.length; i++) {
        if (index + i < 4) {
          newCode[index + i] = pastedCode[i]
        }
      }

      setCode(newCode)

      // Focus on last input or dismiss keyboard if complete
      if (index + pastedCode.length >= 4) {
        Keyboard.dismiss()
      } else if (inputRefs.current[index + pastedCode.length]) {
        inputRefs.current[index + pastedCode.length].focus()
      }
    } else {
      // Handle single digit input
      const newCode = [...code]
      newCode[index] = text
      setCode(newCode)

      // Auto-advance to next input
      if (text !== "" && index < 3 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus()
      }
    }
  }

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && index > 0 && code[index] === "") {
      const newCode = [...code]
      newCode[index - 1] = ""
      setCode(newCode)
      inputRefs.current[index - 1].focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join("")

    if (fullCode.length !== 4) {
      setError("Please enter the complete verification code")
      return
    }

    try {
      setError("")
      await verifyCode(email, fullCode)

      if (isReset) {
        // Navigate to reset password screen
        navigation.navigate("ResetPassword", { email, code: fullCode })
      } else {
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        })
      }
    } catch (err) {
      setError("Invalid verification code. Please try again.")
      console.error(err)
    }
  }

  const handleResendCode = async () => {
    try {
      // In a real app, call the API to resend code
      setTimer(60)
      setError("")
      // Reset code fields
      setCode(["", "", "", ""])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError("Failed to resend code. Please try again.")
      console.error(err)
    }
  }

  const handleDigitPress = (digit) => {
    // Find the first empty slot
    const emptyIndex = code.findIndex((c) => c === "")

    if (emptyIndex !== -1) {
      const newCode = [...code]
      newCode[emptyIndex] = digit
      setCode(newCode)

      // Focus next input or dismiss keyboard if complete
      if (emptyIndex < 3) {
        inputRefs.current[emptyIndex + 1]?.focus()
      } else {
        Keyboard.dismiss()
      }
    }
  }

  const handleBackspace = () => {
    // Find the last non-empty slot
    const lastFilledIndex = [...code].reverse().findIndex((c) => c !== "")

    if (lastFilledIndex !== -1) {
      const actualIndex = 3 - lastFilledIndex
      const newCode = [...code]
      newCode[actualIndex] = ""
      setCode(newCode)
      inputRefs.current[actualIndex]?.focus()
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo} />
        </View>

        <Text style={styles.headerText}>Verification Code</Text>
        <Text style={styles.subHeaderText}>
          Please enter Code sent to{"\n"}
          {email}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <View key={index} style={styles.codeInputWrapper}>
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.codeInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
              <View style={styles.codeUnderline} />
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.verifyButton}
          onPress={handleVerify}
          disabled={isLoading || code.some((digit) => digit === "")}
        >
          {isLoading ? <ActivityIndicator color={COLORS.text} /> : <Text style={styles.verifyButtonText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={handleResendCode} disabled={timer > 0}>
          <Text style={styles.resendButtonText}>{timer > 0 ? `Resend Code (${timer}s)` : "Resend Code"}</Text>
        </TouchableOpacity>

        <View style={styles.keypadContainer}>
          <Text style={styles.displayCode}>{displayCode}</Text>

          <View style={styles.keypad}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.keypadButton}
                onPress={() => handleDigitPress(digit.toString())}
              >
                <Text style={styles.keypadButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.keypadButton} onPress={() => handleDigitPress("0")}>
              <Text style={styles.keypadButtonText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.keypadButton} onPress={handleBackspace}>
              <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  logoContainer: {
    marginVertical: 20,
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 30,
  },
  codeInputWrapper: {
    alignItems: "center",
  },
  codeInput: {
    width: 40,
    height: 50,
    fontSize: 24,
    textAlign: "center",
    color: COLORS.text,
  },
  codeUnderline: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.text,
  },
  verifyButton: {
    ...COMMON_STYLES.button,
    width: "80%",
    marginBottom: 15,
  },
  verifyButtonText: {
    ...COMMON_STYLES.buttonText,
  },
  resendButton: {
    padding: 10,
  },
  resendButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  keypadContainer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  displayCode: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  keypadButton: {
    width: "30%",
    height: 60,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
  },
})

export default VerificationScreen

