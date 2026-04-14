"use client";

import { useState, useEffect, useRef } from "react";
import { 
  fetchNotifications, 
  fetchUnreadCount, 
  markAllNotificationsRead, 
  markNotificationRead, 
  deleteNotification,
  NotificationDTO 
} from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    const handleUpdate = () => loadNotifications();
    window.addEventListener("notificationsUpdated", handleUpdate);
    
    // Refresh every 60 seconds
    const interval = setInterval(loadNotifications, 60000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notificationsUpdated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await markAllNotificationsRead();
      await loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.notificationId !== id));
      if (notifications.find(n => n.notificationId === id && !n.isRead)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-300"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f0f1a] shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f0f1a] rounded-xl overflow-hidden z-50 animate-fade-in-up border border-indigo-500/20 shadow-2xl">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-tighter disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-slate-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notificationId}
                  onClick={() => !notification.isRead && handleMarkRead(notification.notificationId)}
                  className={`p-4 border-b border-white/5 transition-all cursor-pointer group relative ${
                    notification.isRead ? "opacity-60 grayscale-[0.5]" : "bg-indigo-500/5"
                  } hover:bg-white/5`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.isRead ? "bg-transparent" : "bg-indigo-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${notification.isRead ? "text-slate-400" : "text-white"}`}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-medium">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(notification.notificationId, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-all rounded-md hover:bg-rose-500/10"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
