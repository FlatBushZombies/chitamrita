// API configuration
export const API_URL = "http://localhost:3000"

// Theme colors
export const COLORS = {
  primary: "#a855f7", // Purple
  secondary: "#9333ea", // Darker purple
  background: "#121212", // Dark background
  card: "#1e1e1e", // Slightly lighter dark
  text: "#ffffff",
  textSecondary: "#a0a0a0",
  border: "#2a2a2a",
  error: "#ef4444",
  success: "#22c55e",
}

// Common styles
export const COMMON_STYLES = {
  inputContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
  },
  input: {
    color: COLORS.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "bold",
  },
}

