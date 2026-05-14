import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);

  useEffect(() => {
    if (!user) {
      setChatMessages([]);
    }
  }, [user]);

  function sendMessage(receiverId, text) {
    if (!user || !text.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        senderId: user.id,
        receiverId,
        text: text.trim(),
        sentAt: new Date().toISOString(),
      },
    ]);
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
