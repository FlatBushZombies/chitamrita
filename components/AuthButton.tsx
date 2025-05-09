import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native"

type AuthButtonProps = {
  title: string
  onPress: () => void
  isLoading?: boolean
  disabled?: boolean
}

export default function AuthButton({ title, onPress, isLoading = false, disabled = false }: AuthButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, (disabled || isLoading) && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{title}</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#9333EA",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
