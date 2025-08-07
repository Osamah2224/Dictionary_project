'use client';

import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import type { SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';
import type { SmartTeacherOutput } from '@/ai/flows/smart-teacher';


const ACTIVITY_LOG_KEY = 'appActivityLog';

// We add the original query for the teacher tool to the payload
export type ActivityPayload = SmartDictionaryOutput | (SmartTeacherOutput & { query?: string }) | { translation: string } | { audioDataUri: string };

export interface ActivityLogItem {
  id: string;
  tool: 'القاموس الذكي' | 'الترجمة الذكية' | 'المعلم الذكي' | 'تحويل النص إلى كلام';
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

export const ActivityLogProvider: React.FC<{ children: React.ReactNode, onActivitySelect: (activity: ActivityLogItem) => void }> = ({ children, onActivitySelect }) => {
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
    
    // Prevent duplicate consecutive entries by checking the last activity's query and tool
    // For the teacher tool, we check the content, not just the title.
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

// A new context to pass the click handler down
type ActivitySelectContextType = (activity: ActivityLogItem) => void;
const ActivitySelectContext = createContext<ActivitySelectContextType | undefined>(undefined);

export const useActivitySelect = () => {
    const context = useContext(ActivitySelectContext);
    if (context === undefined) {
        throw new Error('useActivitySelect must be used within an ActivityLogProvider');
    }
    return context;
};


export const ActivityLogWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);
  
  // This state will hold the data to be passed to the specific tool component
  const [dictionaryState, setDictionaryState] = useState<{ query: string; result: SmartDictionaryOutput } | null>(null);
  const [translationState, setTranslationState] = useState<{ query: string; result: { translation: string } } | null>(null);
  const [teacherState, setTeacherState] = useState<{ query: string; result: SmartTeacherOutput } | null>(null);
  const [ttsState, setTtsState] = useState<{ query: string; result: { audioDataUri: string } } | null>(null);
  const [activeTab, setActiveTab] = useState('smart-dictionary');

  const handleActivitySelect = (activity: ActivityLogItem) => {
      setSelectedActivity(activity);
      // Reset all states
      setDictionaryState(null);
      setTranslationState(null);
      setTeacherState(null);
      setTtsState(null);

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
          // The original lesson content is now stored in the payload.query
          const payload = activity.payload as (SmartTeacherOutput & { query?: string });
          setTeacherState({ query: payload.query || '', result: payload });
          setActiveTab('smart-teacher');
          break;
        case 'تحويل النص إلى كلام':
            setTtsState({ query: activity.query, result: activity.payload as { audioDataUri: string } });
            setActiveTab('text-to-speech');
            break;
      }
  };

  return (
    <ActivityLogProvider onActivitySelect={handleActivitySelect}>
        <ActivitySelectContext.Provider value={handleActivitySelect}>
             {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    // This is how we pass the state down to the children components
                    return React.cloneElement(child, {
                        initialDictionaryState: dictionaryState,
                        initialTranslationState: translationState,
                        initialTeacherState: teacherState,
                        initialTTSState: ttsState,
                        activeTab,
                        setActiveTab
                    } as any);
                }
                return child;
            })}
        </ActivitySelectContext.Provider>
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
