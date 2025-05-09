"use client"

import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native"
import { useTheme } from "@/context/ThemeContext"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"

const WelcomeScreen = () => {
  const { colors } = useTheme()
  const navigation = useNavigation()
  const router = useRouter()

  return (
    

    <ImageBackground
      source={{
        uri: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background.jpg-7lf5U4B2Uqi8K0YHIdgPaLEltiYIcF.jpeg",
      }}
      style={styles.backgroundImage}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>Chitamrita</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(auth)/sign-up')}>
                <Text style={styles.headerButtonText}>sign up</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(auth)/LoginScreen')}>
                <Text style={styles.headerButtonText}>log in</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.getStartedButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/get-started')}
            >
              <Text style={styles.getStartedText}>Swipe to get started</Text>
              <Ionicons name="arrow-forward-circle" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.languageContainer}>
              <TouchableOpacity style={[styles.languageButton, { backgroundColor: colors.primary }]}>
                <Text style={styles.languageText}>english</Text>
                <Ionicons name="globe-outline" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.premiumButton}>
                <Text style={styles.premiumText}>premium</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.supportButton}>
                <Text style={styles.supportText}>support</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    padding: 10,
    borderRadius: 8,
  },
  logoText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 15,
  },
  headerButton: {
    paddingVertical: 5,
  },
  headerButtonText: {
    color: "white",
    fontSize: 14,
  },
  footer: {
    marginTop: "auto",
    gap: 20,
  },
  getStartedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 30,
    gap: 10,
  },
  getStartedText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  languageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  languageText: {
    color: "white",
    fontSize: 14,
  },
  premiumButton: {
    paddingVertical: 5,
  },
  premiumText: {
    color: "white",
    fontSize: 14,
  },
  supportButton: {
    paddingVertical: 5,
  },
  supportText: {
    color: "white",
    fontSize: 14,
  },
})

export default WelcomeScreen
