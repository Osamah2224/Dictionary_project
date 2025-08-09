'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HelpCircle, Sparkles, User, MessageSquare, Info } from 'lucide-react';

export function InfoHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<{ title: string; content: React.ReactNode } | null>(null);

  const toggleHub = () => setIsOpen(!isOpen);

  const openDialog = (type: 'instructions' | 'developer' | 'contact') => {
    setIsOpen(false); // Close the hub when a dialog opens
    switch (type) {
      case 'instructions':
        setDialogContent({
          title: 'تعليمات استخدام التطبيق',
          content: (
            <div className="space-y-4 text-muted-foreground">
              <p>مرحباً بك في تطبيق أ. أسامة العُمري التعليمي!</p>
              <p><strong>القاموس الذكي:</strong> أدخل أي كلمة إنجليزية أو عربية واحصل على تحليل لغوي شامل يتضمن المعنى، نوع الكلمة، المشتقات، التصريفات، المرادفات، والأضداد.</p>
              <p><strong>الترجمة الذكية:</strong> ترجم النصوص بين اللغتين العربية والإنجليزية بسهولة. يتعرف التطبيق تلقائياً على اللغة المدخلة.</p>
              <p><strong>المعلم الذكي:</strong> الصق أي محتوى درس باللغة الإنجليزية (نص، قطعة، قواعد) واحصل على تحليل تعليمي متكامل باللغة العربية، بما في ذلك شرح القواعد، الكلمات الجديدة، والتمارين.</p>
            </div>
          ),
        });
        break;
      case 'developer':
        setDialogContent({
          title: 'عن المطور',
          content: <p className="text-muted-foreground">تم تطوير هذا التطبيق بواسطة الأستاذ أسامة العُمري كأداة مساعدة ومبتكرة لطلاب اللغة الإنجليزية.</p>,
        });
        break;
      case 'contact':
        setDialogContent({
          title: 'تواصل معنا',
          content: <p className="text-muted-foreground">للتواصل أو تقديم الملاحظات، يمكنكم مراسلتنا عبر البريد الإلكتروني: contact@example.com</p>,
        });
        break;
    }
  };

  const closeDialog = () => setDialogContent(null);

  const balloonClasses = "h-14 w-14 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out transform";
  const mainButtonClasses = isOpen ? 'rotate-45 bg-destructive' : 'bg-primary';

  return (
    <>
      <div className="fixed bottom-6 right-28 z-50">
        <div className="relative flex items-center justify-center">
           {isOpen && (
             <div className="absolute bottom-0 right-0 flex flex-col items-center gap-4 mb-20">
                <button
                    onClick={() => openDialog('instructions')}
                    className={`${balloonClasses} bg-blue-500 hover:bg-blue-600 -translate-y-2`}
                    aria-label="تعليمات الاستخدام"
                    title="تعليمات الاستخدام"
                >
                    <Info className="h-7 w-7" />
                </button>
                 <button
                    onClick={() => openDialog('developer')}
                    className={`${balloonClasses} bg-green-500 hover:bg-green-600`}
                    aria-label="عن المطور"
                    title="عن المطور"
                 >
                    <User className="h-7 w-7" />
                 </button>
                 <button
                    onClick={() => openDialog('contact')}
                    className={`${balloonClasses} bg-yellow-500 hover:bg-yellow-600 translate-y-2`}
                    aria-label="تواصل معنا"
                    title="تواصل معنا"
                 >
                    <MessageSquare className="h-7 w-7" />
                 </button>
             </div>
           )}
          <Button
            onClick={toggleHub}
            className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 ${mainButtonClasses}`}
            aria-label="القائمة الذكية"
          >
            <Sparkles className="h-8 w-8" />
          </Button>
        </div>
      </div>
      
      <Dialog open={!!dialogContent} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">{dialogContent?.title}</DialogTitle>
          </DialogHeader>
          <DialogDescription asChild>
            <div className="pt-4">{dialogContent?.content}</div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
