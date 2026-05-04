import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setChatMessages([]);
      return undefined;
    }

    const nextSocket = io('http://localhost:5000');
    
    nextSocket.on('connect', () => {
      console.log('Socket connected');
      nextSocket.emit('join_personal_room', user.id);
    });

    nextSocket.on('receive_message', (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [user]);

  function sendMessage(receiverId, text) {
    if (socket && user) {
      socket.emit('send_message', {
        senderId: user.id,
        receiverId: Number(receiverId),
        text
      });
    }
  }

  return (
    <SocketContext.Provider value={{ socket, chatMessages, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
