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
          title: 'دليل استخدام التطبيق',
          content: (
            <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
              <p className="font-semibold text-foreground text-lg mb-4">مرحباً بك في رفيقك الذكي لتعلم الإنجليزية!</p>
              
              <div>
                <h3 className="font-bold text-primary mb-2">القاموس الذكي</h3>
                <p>ليس مجرد قاموس عادي! أدخل أي كلمة (إنجليزية أو عربية) واحصل على تحليل لغوي شامل: المعنى الدقيق، نوع الكلمة، المشتقات، تصريفات الأفعال، المرادفات، والأضداد. كل كلمة تبحث عنها تُحفظ تلقائياً في "قاموسك المحلي" للوصول السريع لاحقاً.</p>
              </div>

              <div>
                <h3 className="font-bold text-primary mb-2">الترجمة الذكية</h3>
                <p>ترجم النصوص بين اللغتين العربية والإنجليزية بسلاسة ودقة. يتعرف التطبيق تلقائياً على لغة الإدخال ويترجمها إلى اللغة الأخرى، مع حفظ ترجماتك في "سجل النشاطات" للاستخدام والمراجعة لاحقاً.</p>
              </div>

              <div>
                <h3 className="font-bold text-primary mb-2">المعلم الذكي</h3>
                <p>الأداة الأقوى في التطبيق! الصق أي محتوى درس باللغة الإنجليزية (نص، قطعة، قواعد) أو حتى استخرجه من صورة، واحصل على تحليل تعليمي متكامل باللغة العربية يشمل شرح القواعد، الكلمات الجديدة، المرادفات، وتمارين تفاعلية لترسيخ الفهم.</p>
              </div>

            </div>
          ),
        });
        break;
      case 'developer':
        setDialogContent({
          title: 'عن المطور',
          content: <p className="text-muted-foreground text-base leading-relaxed">تم تصميم وتطوير هذا التطبيق بواسطة الأستاذ أسامة العُمري، إيمانًا منه بأهمية تسخير تقنيات الذكاء الاصطناعي لإنشاء أدوات تعليمية مبتكرة تهدف إلى جعل تعلم اللغة الإنجليزية أكثر سهولة ومتعة للطلاب الناطقين باللغة العربية.</p>,
        });
        break;
      case 'contact':
        setDialogContent({
          title: 'تواصل معنا',
          content: <p className="text-muted-foreground text-base leading-relaxed">نسعد دائمًا بتلقي ملاحظاتكم واقتراحاتكم لتطوير التطبيق. يمكنكم التواصل معنا عبر البريد الإلكتروني: <span className="font-semibold text-primary">osama.alomari.dev@example.com</span></p>,
        });
        break;
    }
  };

  const closeDialog = () => setDialogContent(null);

  const balloonClasses = "h-14 w-14 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out transform";
  const mainButtonClasses = isOpen ? 'rotate-45 bg-destructive' : 'bg-primary';

  return (
    <>
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative flex items-center justify-center">
           {isOpen && (
             <div className="absolute bottom-0 left-0 flex flex-col items-center gap-4 mb-20">
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
      
      <Dialog open={!!dialogContent} onOpenChange={(open) => !open && closeDialog()}>
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
