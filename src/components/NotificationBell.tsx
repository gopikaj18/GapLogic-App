'use client';

import { useState, useRef, useEffect } from 'react';
import { useData } from '@/lib/DataContext';
import { Bell, BellOff, CheckCheck, Trash2, X } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export function NotificationBell() {
  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  const getRelativeTime = (isoString: string) => {
    try {
      const date = parseISO(isoString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-card/85 hover:bg-muted/70 border border-border shadow-md flex items-center justify-center relative transition-all active:scale-95 duration-150 group"
        aria-label="Notification bell"
      >
        <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black animate-bounce font-mono">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-[420px] bg-card border border-border shadow-2xl rounded-2xl p-4 z-50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              {notifications && notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/5 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark read
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear all
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-colors sm:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[320px] overflow-y-auto scrollbar-thin pr-1 space-y-2">
            {!notifications || notifications.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <BellOff className="w-8 h-8 text-muted mx-auto opacity-40" />
                <p className="text-xs text-muted-foreground italic">No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all flex items-start justify-between gap-3 text-left ${
                    notif.read
                      ? 'bg-muted/10 border-border hover:bg-muted/20'
                      : 'bg-primary/5 border-primary/20 hover:bg-primary/10 shadow-sm'
                  }`}
                >
                  <div className="space-y-1 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground leading-tight">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.body}
                    </p>
                    <span className="text-[9px] text-muted-foreground/80 font-mono block mt-1">
                      {getRelativeTime(notif.timestamp)}
                    </span>
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
