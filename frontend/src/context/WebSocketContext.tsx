import React, { createContext, useContext, useRef } from 'react';

type WebSocketContextType = React.RefObject<WebSocket | null> | null;

const WebSocketContext = createContext<WebSocketContextType>(null);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const socketRef = useRef<WebSocket | null>(null);

  return (
    <WebSocketContext.Provider value={socketRef}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
