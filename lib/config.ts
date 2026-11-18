export const CONFIG = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-l25e.onrender.com",
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
  },
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    GUESTS: "/guests",
    STAFF: "/staff",
    ROOM: "/rooms",
    RESERVATION: "/reservation",
    ROOM_TYPE: "/room-types",
    RESERVATION_ROOM: "/reservation-room",
    PAYMENTS: "/payments",
  },
} as const;