'use client';

import { useEffect, useState, useRef } from 'react';
import { useData } from '@/lib/DataContext';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { AlertCircle } from 'lucide-react';

export function NotificationManager() {
  const { intentions, logs, addNotification } = useData();
  const { toast } = useToast();
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [showDeniedBanner, setShowDeniedBanner] = useState<boolean>(true);
  const [prevIntentions, setPrevIntentions] = useState<any[]>([]);
  const isFirstMount = useRef(true);

  const today = format(new Date(), 'yyyy-MM-dd');

  // Helper to send alert notification
  const sendAlertNotification = (message: string, title: string = 'Reminder') => {
    // Save to in-app log history
    addNotification(title, message);

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico'
        });
        return;
      } catch (e) {
        console.error('Failed to create browser notification, falling back to toast:', e);
      }
    }

    // Fallback to in-app toast
    toast({
      title: title,
      description: message,
    });
  };

  // Helper to clear fired reminders for a task ID
  const clearFiredRemindersForTask = (taskId: string) => {
    if (typeof window !== 'undefined') {
      const fired = localStorage.getItem('gaplogic_notif_fired');
      if (fired) {
        try {
          const firedMap = JSON.parse(fired);
          let updated = false;
          // Delete any keys starting with taskId
          Object.keys(firedMap).forEach(key => {
            if (key.startsWith(`${taskId}_`)) {
              delete firedMap[key];
              updated = true;
            }
          });
          if (updated) {
            localStorage.setItem('gaplogic_notif_fired', JSON.stringify(firedMap));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  // 1. Check and request notification permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setPermissionStatus(permission);
        });
      } else {
        setPermissionStatus(Notification.permission);
      }
    }
  }, []);

  // 2. Track rescheduling to trigger immediate confirmations
  useEffect(() => {
    if (isFirstMount.current) {
      if (intentions && intentions.length > 0) {
        setPrevIntentions(intentions);
        isFirstMount.current = false;
      }
      return;
    }

    if (!intentions || intentions.length === 0) return;

    intentions.forEach(currentTask => {
      const prevTask = prevIntentions.find(t => t.id === currentTask.id);
      if (prevTask) {
        // Detect reschedule changes
        const timeChanged = prevTask.scheduledTime !== currentTask.scheduledTime;
        const dateChanged = prevTask.date !== currentTask.date;
        const statusChangedToRescheduled = prevTask.status !== 'rescheduled' && currentTask.status === 'rescheduled';

        if (timeChanged || dateChanged || statusChangedToRescheduled) {
          const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
          let dayLabel = '';
          if (currentTask.date === today) {
            dayLabel = 'today';
          } else if (currentTask.date === tomorrowStr) {
            dayLabel = 'tomorrow';
          } else {
            dayLabel = `on ${currentTask.date}`;
          }

          const message = `✅ '${currentTask.title}' rescheduled to ${currentTask.scheduledTime} ${dayLabel}`;
          sendAlertNotification(message, 'Task Rescheduled');

          // Clear any old pending notifications tied to this task
          clearFiredRemindersForTask(currentTask.id);
        }
      }
    });

    setPrevIntentions(intentions);
  }, [intentions, prevIntentions, today]);

  // 3. Periodic check for upcoming task reminders (10m and 5m before start time)
  useEffect(() => {
    const checkUpcomingTasks = () => {
      if (!intentions || intentions.length === 0) return;

      const now = new Date();
      
      // Load fired map from localStorage
      let firedMap: Record<string, boolean> = {};
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('gaplogic_notif_fired');
        if (stored) {
          try {
            firedMap = JSON.parse(stored);
          } catch (e) {
            console.error(e);
          }
        }
      }

      let updated = false;

      intentions.forEach(task => {
        // Task must be scheduled or rescheduled, and not completed, skipped, missed, or resolved
        const isActive = 
          task.status !== 'completed' && 
          task.status !== 'skipped' && 
          task.status !== 'missed' && 
          task.status !== 'recovered' && 
          !task.skipped;

        const isResolved = logs ? logs.some(l => l.intentionId === task.id) : false;

        if (!isActive || isResolved) {
          return;
        }

        // Parse scheduled date and time
        const [hour, minute] = task.scheduledTime.split(':').map(Number);
        const [year, month, day] = task.date.split('-').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute, 0);

        const diffMs = scheduledDate.getTime() - now.getTime();
        const diffMins = diffMs / (60 * 1000);

        // 10-minute reminder (diffMins between 9.0 and 11.0 minutes)
        if (diffMins >= 9.0 && diffMins <= 11.0) {
          const key = `${task.id}_${task.date}_${task.scheduledTime}_10m`;
          if (!firedMap[key]) {
            sendAlertNotification(`🔔 '${task.title}' starts in 10 minutes — scheduled for ${task.scheduledTime}`, 'Task Start Reminder');
            firedMap[key] = true;
            updated = true;
          }
        }

        // 5-minute reminder (diffMins between 4.0 and 6.0 minutes)
        if (diffMins >= 4.0 && diffMins <= 6.0) {
          const key = `${task.id}_${task.date}_${task.scheduledTime}_5m`;
          if (!firedMap[key]) {
            sendAlertNotification(`🔔 '${task.title}' starts in 5 minutes — scheduled for ${task.scheduledTime}`, 'Task Start Reminder');
            firedMap[key] = true;
            updated = true;
          }
        }
      });

      if (updated && typeof window !== 'undefined') {
        localStorage.setItem('gaplogic_notif_fired', JSON.stringify(firedMap));
      }
    };

    checkUpcomingTasks();
    const interval = setInterval(checkUpcomingTasks, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [intentions, logs, today]);

  if (permissionStatus !== 'denied' || !showDeniedBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/20 text-red-500 py-2.5 px-4 text-xs font-semibold flex items-center justify-between gap-4 animate-in slide-in-from-top duration-300 backdrop-blur-md">
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <span>Task reminders are disabled because browser notifications are blocked. Please enable notification permissions in your browser settings to get start reminders.</span>
        </div>
        <button 
          onClick={() => setShowDeniedBanner(false)}
          className="text-red-400 hover:text-red-500 font-bold px-2 py-0.5 hover:bg-red-500/10 rounded transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
