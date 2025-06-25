import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"
import { io } from "socket.io-client"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL,
  headers: { "Content-Type": "application/json" },
});

export const socket = io(import.meta.env.VITE_SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

