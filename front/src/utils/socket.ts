import { io } from 'socket.io-client';

// El backend de NestJS por defecto corre en el puerto 3000
const URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : 'http://localhost:3000';

export const socket = io(URL, {
  autoConnect: false, // Conectaremos manualmente cuando tengamos el storeId
});
