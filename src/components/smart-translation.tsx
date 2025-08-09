'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages, Loader2, Clipboard, Check, History, Camera, Volume2 } from 'lucide-react';

import { smartTranslation, type SmartTranslationInput } from '@/ai/flows/smart-translation';
import { extractTextFromImage } from '@/ai/flows/extract-text';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog } from '@/hooks/use-activity-log';

const FormSchema = z.object({
  text: z.string().min(1, 'الرجاء إدخال نص للترجمة.'),
});

type FormValues = z.infer<typeof FormSchema>;

const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

const TRANSLATION_CACHE_KEY = 'smartTranslationsCache';


interface SmartTranslationProps {
  initialState?: { query: string; result: { translation: string } } | null;
}

export function SmartTranslation({ initialState }: SmartTranslationProps) {
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const [translationsCache, setTranslationsCache] = useState<Record<string, string>>({});
  const { logActivity } = useActivityLog();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      text: '',
    },
  });

  useEffect(() => {
    if (initialState) {
        form.setValue('text', initialState.query);
        setTranslation(initialState.result.translation);
    }
  }, [initialState, form]);

  useEffect(() => {
    try {
      const cachedTranslations = localStorage.getItem(TRANSLATION_CACHE_KEY);
      if (cachedTranslations) {
        setTranslationsCache(JSON.parse(cachedTranslations));
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
}, []);


  const saveTranslationToCache = (original: string, translated: string) => {
    try {
      const updatedCache = { ...translationsCache, [original.toLowerCase()]: translated };
      setTranslationsCache(updatedCache);
      localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to save translation to cache:', error);
      toast({ title: 'فشل حفظ الترجمة محلياً', variant: 'destructive' });
    }
  };
  
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setTranslation(null);
    const query = data.text.trim();
    if (!query) {
      setIsLoading(false);
      return;
    }
    
    const payload = { translation: '' };

    try {
      if (translationsCache[query.toLowerCase()]) {
        const cachedTranslation = translationsCache[query.toLowerCase()];
        setTranslation(cachedTranslation);
        payload.translation = cachedTranslation;
        logActivity({ tool: 'الترجمة الذكية', query: query, payload });
        toast({
          title: 'تم العثور على الترجمة في الذاكرة المحلية',
        });
        setIsLoading(false);
        return;
      }

      const targetLanguage = isArabic(query) ? 'English' : 'Arabic';
      
      const input: SmartTranslationInput = {
        text: query,
        targetLanguage: targetLanguage,
      };

      const translationResult = await smartTranslation(input);
      setTranslation(translationResult.translation);
      payload.translation = translationResult.translation;
      logActivity({ tool: 'الترجمة الذكية', query: query, payload });
      saveTranslationToCache(query, translationResult.translation);

    } catch (error) {
      console.error('Smart Translation Error:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'فشل في ترجمة النص. الرجاء المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'ملف غير صالح',
        description: 'الرجاء اختيار ملف صورة فقط.',
      });
      return;
    }
    
    setIsExtracting(true);
    toast({ title: 'جاري استخراج النص من الصورة...' });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const photoDataUri = reader.result as string;
        const result = await extractTextFromImage({ photoDataUri });
        const currentText = form.getValues('text');
        form.setValue('text', currentText ? `${currentText}\n\n${result.text}` : result.text);
        toast({
            variant: 'default',
            title: 'تم استخراج النص بنجاح!',
            description: 'تمت إضافة النص المستخرج إلى حقل الإدخال.'
        });
      } catch (error) {
        console.error('OCR Error:', error);
        toast({
          variant: 'destructive',
          title: 'حدث خطأ',
          description: 'فشل في استخراج النص من الصورة. الرجاء المحاولة مرة أخرى.',
        });
      } finally {
        setIsExtracting(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = (error) => {
        console.error("File Reader Error:", error);
        toast({ variant: 'destructive', title: 'خطأ في قراءة الملف' });
        setIsExtracting(false);
    }
  };

 const handlePronunciation = (text: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) {
        toast({
            title: "ميزة الصوت غير مدعومة",
            description: "متصفحك لا يدعم ميزة نطق النصوص.",
            variant: "destructive",
        });
        return;
    }
    
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = isArabic(text) ? 'ar' : 'en';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(targetLang));
    
    if (voice) {
        utterance.voice = voice;
    } else {
        console.warn(`No voice found for lang: ${targetLang}`);
    }
    
    utterance.onerror = (event) => {
        if ((event as SpeechSynthesisErrorEvent).error === 'synthesis-canceled') {
            return;
        }
        console.error("SpeechSynthesis Error:", event);
        toast({
            title: "خطأ في النطق",
            description: "حدث خطأ أثناء محاولة نطق النص.",
            variant: "destructive",
        });
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
      setIsCopied(true);
      toast({ title: 'تم نسخ الترجمة بنجاح!' });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
          <Languages className="h-8 w-8" />
          <span>الترجمة الذكية</span>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground pt-2 flex items-center gap-2">
         <History className="h-5 w-5"/>
          <span>
             ترجم بين العربية والإنجليزية. يتم حفظ ترجماتك تلقائيًا للاستخدام دون اتصال بالإنترنت.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold">النص الأصلي (عربي أو إنجليزي)</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Textarea 
                         placeholder="أدخل النص هنا أو استخرجه من صورة..." 
                         className="min-h-[200px] text-lg pr-12 border-2 border-primary/20 shadow-inner" 
                         {...field}
                         disabled={isLoading || isExtracting}
                       />
                       <input 
                         type="file" 
                         ref={fileInputRef} 
                         onChange={handleImageUpload}
                         className="hidden" 
                         accept="image/*" 
                       />
                       <Button 
                         type="button" 
                         variant="ghost" 
                         size="icon" 
                         className="absolute top-3 right-3 text-muted-foreground hover:text-primary"
                         onClick={() => fileInputRef.current?.click()}
                         disabled={isExtracting}
                         aria-label="استخراج النص من صورة"
                         title="استخراج النص من صورة"
                       >
                         {isExtracting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                       </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading || isExtracting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 border-b-4 border-primary/50 dark:border-primary/20 active:border-b-0">
                {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <Languages className="ml-2 h-6 w-6" />}
                <span>ترجم النص</span>
            </Button>
          </form>
        </Form>
        
        {isLoading && !translation && (
          <div className="flex justify-center items-center mt-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {translation && (
          <div className="mt-8 border-t border-primary/20 pt-6 animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-primary">النص المترجم:</h3>
            </div>
             <Card className="relative bg-background/50 rounded-lg p-6 border-2">
                <p className="text-lg leading-relaxed">{translation}</p>
                 <div className="absolute top-2 left-2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handlePronunciation(translation)} className="text-muted-foreground hover:bg-primary/10">
                        <Volume2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="text-muted-foreground hover:bg-primary/10">
                        {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Clipboard className="h-5 w-5" />}
                    </Button>
                </div>
             </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    