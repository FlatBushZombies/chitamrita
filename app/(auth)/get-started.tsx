"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { COLORS } from "@/config/config"
import { router } from "expo-router"

const TermsScreen = () => {
  const navigation = useNavigation()
  const [agreed, setAgreed] = useState(false)

  const handleAgree = () => {
    router.replace("/(auth)/sign-up")
  }

  const handleDisagree = () => {
    navigation.goBack()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.notificationContainer}>
        <Text style={styles.notificationTitle}>Hello!</Text>
        <Text style={styles.notificationText}>
          Before you create an account, please read and accept the terms and conditions.
        </Text>
      </View>

      <Text style={styles.title}>Terms and Conditions</Text>

      <ScrollView style={styles.termsContainer}>
        <Text style={styles.termsText}>
          1. ACCEPTANCE OF TERMS{"\n\n"}
          By accessing and using this chat application, you agree to be bound by these Terms and Conditions and all
          applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or
          accessing this application.
          {"\n\n"}
          2. USER ACCOUNTS{"\n\n"}
          Users are responsible for maintaining the confidentiality of their account information, including password,
          and for all activities that occur under their account. Users agree to notify us immediately of any
          unauthorized use of their account or any other breach of security.
          {"\n\n"}
          3. USER CONDUCT{"\n\n"}
          Users agree not to use the application to:{"\n"}• Post or transmit any content that is unlawful, harmful,
          threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.{"\n"}• Impersonate
          any person or entity, or falsely state or otherwise misrepresent your affiliation with a person or entity.
          {"\n"}• Upload or transmit any material that infringes any patent, trademark, trade secret, copyright, or
          other proprietary rights.
          {"\n\n"}
          4. PRIVACY POLICY{"\n\n"}
          Your use of the application is also governed by our Privacy Policy, which is incorporated by reference into
          these Terms and Conditions.
          {"\n\n"}
          5. MODIFICATIONS{"\n\n"}
          We reserve the right to modify these terms at any time. Your continued use of the application following the
          posting of changes will mean that you accept and agree to the changes.
        </Text>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.disagreeButton} onPress={handleDisagree}>
          <Text style={styles.disagreeButtonText}>Disagree</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
          <Text style={styles.agreeButtonText}>Agree</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  notificationContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 5,
  },
  notificationText: {
    fontSize: 14,
    color: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },
  termsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  disagreeButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 10,
  },
  disagreeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  agreeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  agreeButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
})

export default TermsScreen

