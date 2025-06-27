import Constants from "expo-constants";

const getDevServerUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    return `http://${debuggerHost.split(':').shift()}:3000`;
  }
  return "http://localhost:3000";
};

export const API_BASE_URL = __DEV__ ? `${getDevServerUrl()}/api` : "https://chitamrita-backend.vercel.app/api";
export const SOCKET_URL = __DEV__ ? getDevServerUrl() : "https://chitamrita.vercel.app";