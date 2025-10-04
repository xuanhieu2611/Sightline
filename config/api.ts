// API Configuration
export const API_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development",
}

// Fallback responses for development/testing
export const FALLBACK_RESPONSES = {
  TAP_SCAN: [
    "Two people ahead. Door slightly right. Clear path left.",
    "Obstacle detected at 2 o'clock. Safe passage to your left.",
    "Clear path ahead. No obstacles detected.",
    "Stairs ahead. Handrail on your right.",
    "Doorway detected. Handle on the left side.",
    "Crowded area. Move slowly and stay to the right.",
  ],
  READ_TEXT: [
    "MENU - Coffee $3.50, Tea $2.00",
    "EXIT - Emergency Exit Only",
    "RESTROOM - Women's Room",
    "ELEVATOR - Floor 2, 3, 4",
    "PARKING - Level B2",
    "CAFE - Open 7AM-9PM",
  ],
  FIND_OBJECT: [
    "Exit sign, 1 o'clock, near",
    "Restroom sign, 2 o'clock, 30 feet",
    "Elevator doors, 12 o'clock, 15 feet",
    "Staircase, 1 o'clock, 25 feet",
    "Information desk, 2 o'clock, 40 feet",
  ],
}
