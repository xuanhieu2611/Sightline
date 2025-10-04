// API Configuration
export const API_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
}
