import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, clearAllNotifications } from '../api/notificationService';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Disconnect if logged out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('moviemania_token');
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user?._id]);

  // Fetch initial notifications and unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchInitial = async () => {
      try {
        setLoading(true);
        const [notifRes, countRes] = await Promise.all([
          getNotifications(1, 20),
          getUnreadCount()
        ]);
        if (notifRes.success) setNotifications(notifRes.data);
        if (countRes.success) setUnreadCount(countRes.unreadCount);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, [isAuthenticated]);

  const fetchMore = useCallback(async (page) => {
    try {
      const res = await getNotifications(page, 20);
      if (res.success) {
        setNotifications(prev => [...prev, ...res.data]);
      }
      return res;
    } catch (err) {
      console.error('Failed to load more notifications:', err);
      return { success: false };
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  }, []);

  return (
    <SocketContext.Provider value={{
      socket,
      notifications,
      unreadCount,
      loading,
      fetchMore,
      markAsRead,
      markAllRead,
      clearAll
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
