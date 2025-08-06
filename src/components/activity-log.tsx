'use client';

import { useActivityLog, useActivitySelect } from '@/hooks/use-activity-log';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { History, Trash2, BookMarked, Languages, GraduationCap, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const TOOL_ICONS = {
  'القاموس الذكي': <BookMarked className="h-5 w-5 text-primary" />,
  'الترجمة الذكية': <Languages className="h-5 w-5 text-primary" />,
  'المعلم الذكي': <GraduationCap className="h-5 w-5 text-primary" />,
};

export function ActivityLog() {
  const { activities, clearActivities, removeActivity } = useActivityLog();
  const onActivitySelect = useActivitySelect();

  const handleClear = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح كل سجل النشاطات؟ لا يمكن التراجع عن هذا الإجراء.')) {
      clearActivities();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 flex items-center justify-center"
          aria-label="سجل النشاطات"
        >
          <History className="h-8 w-8" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl">
            <History className="h-6 w-6" />
            سجل النشاطات
          </SheetTitle>
          <SheetDescription>
            هنا تجد آخر النشاطات التي قمت بها. انقر على أي نشاط للعودة لتفاصيله.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4 pr-4 -mr-6">
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <SheetClose asChild key={activity.id}>
                <Card 
                    className="relative group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onActivitySelect(activity)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                     <CardTitle className="text-lg flex items-center gap-3">
                       {TOOL_ICONS[activity.tool as keyof typeof TOOL_ICONS]}
                       {activity.tool}
                     </CardTitle>
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute top-1 left-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        onClick={(e) => { e.stopPropagation(); removeActivity(activity.id); }}
                        aria-label="Remove activity"
                      >
                       <X className="h-4 w-4" />
                     </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-md font-semibold truncate" title={activity.query}>"{activity.query}"</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ar })}
                    </p>
                  </CardContent>
                </Card>
                </SheetClose>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full text-muted-foreground py-16">
                 <History className="h-16 w-16 mb-4" />
                 <p className="text-lg">لا توجد أي نشاطات مسجلة بعد.</p>
                 <p className="text-sm">ابدأ باستخدام أدوات التطبيق ليظهر سجلك هنا.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
          {activities.length > 0 && (
            <SheetClose asChild>
              <Button variant="destructive" onClick={handleClear} className="w-full">
                <Trash2 className="ml-2 h-4 w-4" />
                مسح كل السجل
              </Button>
            </SheetClose>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
