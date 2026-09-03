import { io } from 'socket.io-client';

let socket;
export function getSocket() {
  if (!socket) socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', { autoConnect: false });
  return socket;
}
export function subscribeToExecution(id, handlers = {}) {
  const client = getSocket();
  client.connect();
  client.emit('join:execution', id);
  if (handlers.event) client.on('agent:event', handlers.event);
  if (handlers.status) client.on('execution:status', handlers.status);
  return () => {
    client.emit('leave:execution', id);
    if (handlers.event) client.off('agent:event', handlers.event);
    if (handlers.status) client.off('execution:status', handlers.status);
  };
}
