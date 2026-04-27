"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Client, IMessage, IFrame } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./AuthContext";

interface SocketContextType {
  connected: boolean;
  subscribe: (destination: string, callback: (message: any) => void) => () => void;
  publish: (destination: string, body: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("sathi_token") : null;

    // Only connect if user is logged in
    if (!token || !user) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Initialize STOMP client
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws-sathi"),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (process.env.NODE_ENV === "development") {
          console.log("[Socket Debug]:", str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame: IFrame) => {
      console.log("[Socket]: Connected to SATHI WebSocket Server");
      setConnected(true);
      
      // If there were any pending subscriptions (e.g., after a reconnect), re-subscribe
      // (Though client handles this mostly, we can manage it here if needed)
    };

    client.onStompError = (frame) => {
      console.error("[Socket Error]: Broker reported error: " + frame.headers["message"]);
      console.error("[Socket Error]: Additional details: " + frame.body);
    };

    client.onDisconnect = () => {
      console.log("[Socket]: Disconnected");
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [user]);

  const subscribe = (destination: string, callback: (message: any) => void) => {
    if (!clientRef.current || !connected) {
      console.warn("[Socket]: Attempted to subscribe while not connected");
      return () => {};
    }

    const subscription = clientRef.current.subscribe(destination, (message: IMessage) => {
      try {
        const payload = JSON.parse(message.body);
        callback(payload);
      } catch (err) {
        console.error("[Socket]: Failed to parse message body", err);
        callback(message.body);
      }
    });

    console.log(`[Socket]: Subscribed to ${destination}`);

    return () => {
      subscription.unsubscribe();
      console.log(`[Socket]: Unsubscribed from ${destination}`);
    };
  };

  const publish = (destination: string, body: any) => {
    if (!clientRef.current || !connected) {
      console.warn("[Socket]: Attempted to publish while not connected");
      return;
    }

    clientRef.current.publish({
      destination: "/app" + destination,
      body: JSON.stringify(body),
    });
  };

  return (
    <SocketContext.Provider value={{ connected, subscribe, publish }}>
      {children}
    </SocketContext.Provider>
  );
};
