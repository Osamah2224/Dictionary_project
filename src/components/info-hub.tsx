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
                <p>ترجم النصوص بين اللغتين العربية والإنجليزية بسلاسة ودقة. يعمل التطبيق بدون اتصال بالإنترنت للترجمات التي تم طلبها مسبقاً، ويتم حفظ كل شيء في "سجل النشاطات" للمراجعة.</p>
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
          content: (
             <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p className="font-bold text-lg text-primary">الاستاذ المهندس أسامة محمد علي سعيد العُمري</p>
                <p>أسامة العمري قلم يكتب بالأمل ولوحة مفاتيح تغير العالم. في محافظة إب وُلد الشاعر أسامة العُمري ولم يكن يعرف أن طريقه سيكون مليئًا بالكلمات والشفرات البرمجية وأن إصراره البسيط سينحت من حياته قصة تستحق أن تروى.</p>
                
                <h3 className="font-bold text-primary pt-2">البداية في قرية البخاري</h3>
                <p>التحق بمدرسة الإمام علي بن أبي طالب يحمل اول دفتر يخط عليه في المرحلة الاساسية ثم إلى مدرسة أبي بكر الصديق الثانوية حينها اكتشف عالماً جديداً. اللغة الإنجليزية كانت الكلمات الغريبة تشعره بأنه يمسك بمفتاح لأسرار الكون فقرر أن يكون هذا بداية لشغفه وحتى صار مدرس الإنجليزي الذي لا يشبه الآخرين بعد تخرجه من المعهد العالي للمعلمين بين عامي 2016 و2018. لم يكتفِ أسامة بوظيفة مدرس في مدارس الأنوار والريان الأهلية، كان يدرس الفعل المضارع البسيط بينما يفكر: كيف أجعل هذا الزمن مفيداً؟ يتذكر كيف كان يربط أفكاره بين عالم البرمجة والشعر، شاعر كتب بلغة شكسبير و يصمم موقعاً إلكترونياً على حاسوبه القديم قائلاً: "التكنولوجيا ليست رفاهية، إنها سلاحنا".</p>

                <h3 className="font-bold text-primary pt-2">محارب في زمن الحرب بدروع الكورسات المجانية</h3>
                <p>وسط انقطاع الكهرباء المتكرر في إب، كان أسامة ينتظر ساعات حتى تشحن بطارية هاتفه ليستكمل دورة أمن المعلومات من اليونيسيف أو التسويق الرقمي عبر جوجل. يقول مبتسماً: "كنت أحفظ الشفرات البرمجية في ورقة وأحاول تطبيقها لاحقاً حين يعود الانترنت". لم تمنعه الظروف من جمع 9 شهادات في البرمجة وإدارة الأعمال، بل كان يردد: "كل ساعة تعلم هي انتصار على اليأس".</p>
                
                <h3 className="font-bold text-primary pt-2">شاعر بلا جمهور وكاتب بلا ورق</h3>
                <p>في أدراج هاتفه العشرات من القصائد التي لم يقرأها أحد. يكتب عن الحرب أحياناً:</p>
                <blockquote className="border-r-4 border-primary pr-4 italic">
                    يا أيها السحابة المثقوبة بالطائرات<br/>
                    متى تعيدين لسماء إب قبعاتها الخضراء
                </blockquote>
                <p>لكن سرعان ما يحذفها قائلاً: "أشعاري تحتاج لبلد يسمعها". في المقابل، حوّل موهبته الأدبية إلى تصميم مواقع ويب تعرض قصص الناجين من الحرب، كأنه يخيط جراح المكان بكلمات عابرة للحدود. يعيش مع كتبه القديمة والحديثة التي يغوص فيها في عالم اللغة والبرمجة والأدب وعلم النفس والتنمية البشرية. وكوسيلة للتعلم، حاسوبه القديم الذي يحمل ملصقاً مكتوباً عليه "النجاح" لا يختلف عن هاتفه، مفتوح لمن يتصلون به ليسألوه عن تفسير مصطلح تقني أو ليراجع لهم قصيدة نثرية، وهو ما يجعله يشعر بالرضى والارتياح في علاقته الجيدة مع من يكن لهم الاحترام.</p>
                <p>ورغم حصوله على الشهادات، مازال يشعر أن سيرته الذاتية لم تكتمل ويشعر بفراغ العلم والمعرفة. حتى دوره في تغيير السلوكيات المجتمعية مع اليونيسيف لم تكن نظرية فقط، بل حولها إلى مبادرة بسيطة في إقناع الآخرين بأهمية العلم والتعليم.</p>

                <h3 className="font-bold text-primary pt-2">الأسطورة التي لا تنتهي</h3>
                <p>اليوم، بينما تقرأ هذه السطور، ربما يكون أسامة جالساً يرد على الرسائل، او يعمل على تصميم موقع ويب، أو يناقش مع طلابه عبر مجموعة تلجرام كيفية كتابة سطور فلسفة المشاعر أو سيرة ذاتية مؤثرة، دون أن يعلم أن سيرته نفسها أصبحت مثالاً على أن الإرادة التي تصنع من الإنسان كائناً لا يُحاكى، حتى لو بدأ من الصفر.</p>
            </div>
          ),
        });
        break;
      case 'contact':
        setDialogContent({
          title: 'تواصل معنا',
          content: (
            <div className="space-y-3 text-muted-foreground text-base leading-relaxed">
                <p>نسعد دائمًا بتلقي ملاحظاتكم واقتراحاتكم لتطوير التطبيق. يمكنكم التواصل معنا عبر الوسائل التالية:</p>
                <ul className="list-disc list-inside space-y-2 pt-2">
                    <li>
                        <strong>رقم الهاتف:</strong> <a href="tel:+967711666863" className="text-primary hover:underline" dir="ltr">711-666-863</a>
                    </li>
                    <li>
                        <strong>واتساب:</strong> <a href="https://wa.me/967711666863" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">اضغط هنا للتواصل عبر واتساب</a>
                    </li>
                    <li>
                        <strong>تليجرام:</strong> <a href="https://t.me/Kingoffeeling202" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">t.me/Kingoffeeling202</a>
                    </li>
                    <li>
                        <strong>البريد الإلكتروني:</strong> <a href="mailto:osamah771998@gmail.com" className="text-primary hover:underline">osamah771998@gmail.com</a>
                    </li>
                </ul>
            </div>
          )
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
            <div className="pt-4 max-h-[70vh] overflow-y-auto pr-4">{dialogContent?.content}</div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
