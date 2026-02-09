import { io } from "socket.io-client";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;
// MUST NOT include trailing slash

export const socket = io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket"],   // FORCE WEBSOCKET
    reconnection: true,
    reconnectionAttempts: 10,
    timeout: 20000,
});
