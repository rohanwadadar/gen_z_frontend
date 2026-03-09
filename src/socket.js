import { io } from 'socket.io-client';

// In production this will be your Render backend URL.
// Set VITE_BACKEND_URL in Vercel's environment variables.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://gen-z-backend-ujq7.onrender.com';

export const socket = io(BACKEND_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],  // Try WebSocket first, fall back to polling
});
