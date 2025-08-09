'use client';

import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import type { SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';
import type { SmartTeacherOutput } from '@/ai/flows/smart-teacher';


const ACTIVITY_LOG_KEY = 'appActivityLog';

// We add the original query for the teacher tool to the payload
export type ActivityPayload = SmartDictionaryOutput | (SmartTeacherOutput & { query?: string }) | { translation: string };

export interface ActivityLogItem {
  id: string;
  tool: 'القاموس الذكي' | 'الترجمة الذكية' | 'المعلم الذكي';
  query: string; // The user input (word, text, or lesson title)
  payload: ActivityPayload; // The full result from the AI
  timestamp: string; // ISO 8601 format
}

interface ActivityLogContextType {
  activities: ActivityLogItem[];
  logActivity: (item: Omit<ActivityLogItem, 'id' | 'timestamp'>) => void;
  removeActivity: (id: string) => void;
  clearActivities: () => void;
  getActivityById: (id: string) => ActivityLogItem | undefined;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);


// A new context to pass the click handler down
interface ActivityRestorationContextType {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    dictionaryState: { query: string; result: SmartDictionaryOutput } | null;
    translationState: { query: string; result: { translation: string } } | null;
    teacherState: { query: string; result: SmartTeacherOutput } | null;
    handleActivitySelect: (activity: ActivityLogItem) => void;
}
const ActivityRestorationContext = createContext<ActivityRestorationContextType | undefined>(undefined);

export const useActivityRestoration = () => {
    const context = useContext(ActivityRestorationContext);
    if (context === undefined) {
        throw new Error('useActivityRestoration must be used within an ActivityLogWrapper');
    }
    return context;
};

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
      // Sort by timestamp descending before saving and setting state
      const sortedActivities = updatedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(sortedActivities);
      localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(sortedActivities));
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
    
    const lastActivity = activities[0];
    const isSameQuery = lastActivity?.query === newActivity.query;
    const isSameTool = lastActivity?.tool === newActivity.tool;
    
    let isSameTeacherContent = false;
    if (isSameTool && newActivity.tool === 'المعلم الذكي') {
        const lastPayload = lastActivity.payload as (SmartTeacherOutput & { query?: string });
        const newPayload = newActivity.payload as (SmartTeacherOutput & { query?: string });
        isSameTeacherContent = lastPayload.query === newPayload.query;
    }

    if (isSameTool && (isSameQuery || isSameTeacherContent)) {
       const updatedActivities = [newActivity, ...activities.slice(1)];
       saveActivities(updatedActivities);
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

  const getActivityById = useCallback((id: string) => {
    return activities.find(activity => activity.id === id);
  }, [activities]);

  return (
    <ActivityLogContext.Provider value={{ activities, logActivity, removeActivity, clearActivities, getActivityById }}>
      {children}
    </ActivityLogContext.Provider>
  );
};


export const ActivityLogWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('smart-dictionary');
  const [dictionaryState, setDictionaryState] = useState<{ query: string; result: SmartDictionaryOutput } | null>(null);
  const [translationState, setTranslationState] = useState<{ query: string; result: { translation: string } } | null>(null);
  const [teacherState, setTeacherState] = useState<{ query: string; result: SmartTeacherOutput } | null>(null);

  const handleActivitySelect = (activity: ActivityLogItem) => {
      // Reset all tool-specific states first to ensure a clean slate
      setDictionaryState(null);
      setTranslationState(null);
      setTeacherState(null);

      // Set the state for the selected tool and switch to its tab
      switch(activity.tool) {
        case 'القاموس الذكي':
          setDictionaryState({ query: activity.query, result: activity.payload as SmartDictionaryOutput });
          setActiveTab('smart-dictionary');
          break;
        case 'الترجمة الذكية':
          setTranslationState({ query: activity.query, result: activity.payload as { translation: string } });
          setActiveTab('smart-translation');
          break;
        case 'المعلم الذكي':
          const payload = activity.payload as (SmartTeacherOutput & { query?: string });
          setTeacherState({ query: payload.query || '', result: payload });
          setActiveTab('smart-teacher');
          break;
      }
  };
  
  const contextValue = {
      activeTab,
      setActiveTab,
      dictionaryState,
      translationState,
      teacherState,
      handleActivitySelect,
  };

  return (
    <ActivityLogProvider>
        <ActivityRestorationContext.Provider value={contextValue}>
            {children}
        </ActivityRestorationContext.Provider>
    </ActivityLogProvider>
  );
}


export const useActivityLog = (): ActivityLogContextType => {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog must be used within an ActivityLogProvider');
  }
  return context;
};
    