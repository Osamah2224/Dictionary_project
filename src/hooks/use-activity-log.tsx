'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';

const ACTIVITY_LOG_KEY = 'appActivityLog';

export interface ActivityLogItem {
  id: string;
  tool: 'القاموس الذكي' | 'الترجمة الذكية' | 'المعلم الذكي';
  query: string;
  timestamp: string; // ISO 8601 format
}

interface ActivityLogContextType {
  activities: ActivityLogItem[];
  logActivity: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  removeActivity: (id: string) => void;
  clearActivities: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

export const ActivityLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedActivities = localStorage.getItem(ACTIVITY_LOG_KEY);
      if (storedActivities) {
        setActivities(JSON.parse(storedActivities));
      }
    } catch (error) {
      console.error('Failed to load activity log from localStorage:', error);
      toast({ title: 'فشل تحميل سجل النشاطات', variant: 'destructive' });
    }
  }, [toast]);

  const saveActivities = useCallback((updatedActivities: ActivityLogItem[]) => {
    try {
      setActivities(updatedActivities);
      localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(updatedActivities));
    } catch (error) {
      console.error('Failed to save activity log to localStorage:', error);
      toast({ title: 'فشل حفظ سجل النشاطات', variant: 'destructive' });
    }
  }, [toast]);

  const logActivity = useCallback((item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLogItem = {
      ...item,
      id: self.crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    
    // Prevent duplicate consecutive entries
    if (activities[0]?.query === newActivity.query && activities[0]?.tool === newActivity.tool) {
      return;
    }

    const updatedActivities = [newActivity, ...activities];
    saveActivities(updatedActivities);
  }, [activities, saveActivities]);

  const removeActivity = useCallback((id: string) => {
    const updatedActivities = activities.filter(activity => activity.id !== id);
    saveActivities(updatedActivities);
     toast({ title: 'تم حذف النشاط بنجاح' });
  }, [activities, saveActivities, toast]);

  const clearActivities = useCallback(() => {
    saveActivities([]);
    toast({ title: 'تم مسح سجل النشاطات بالكامل', variant: 'destructive' });
  }, [saveActivities, toast]);

  return (
    <ActivityLogContext.Provider value={{ activities, logActivity, removeActivity, clearActivities }}>
      {children}
    </ActivityLogContext.Provider>
  );
};

export const useActivityLog = (): ActivityLogContextType => {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
};
