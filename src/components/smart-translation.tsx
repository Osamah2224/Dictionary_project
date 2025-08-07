'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages, Loader2, Clipboard, Check, History, Camera, Volume2, Pause } from 'lucide-react';

import { smartTranslation, type SmartTranslationInput } from '@/ai/flows/smart-translation';
import { extractTextFromImage } from '@/ai/flows/extract-text';
import { textToSpeech } from '@/ai/flows/text-to-speech';
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

// Function to detect if the text is primarily Arabic
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const [translationsCache, setTranslationsCache] = useState<Record<string, string>>({});
  const { logActivity } = useActivityLog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);


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
      const cachedData = localStorage.getItem(TRANSLATION_CACHE_KEY);
      if (cachedData) {
        setTranslationsCache(JSON.parse(cachedData));
      }
    } catch (error) {
      console.error('Failed to load cache:', error);
    }
    
    return () => {
      if (audioRef.current) {
         audioRef.current.pause();
         audioRef.current = null;
      }
    };
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
      // Check cache first
      if (translationsCache[query.toLowerCase()]) {
        const cachedTranslation = translationsCache[query.toLowerCase()];
        setTranslation(cachedTranslation);
        payload.translation = cachedTranslation;
        logActivity({ tool: 'الترجمة الذكية', query: query, payload });
        toast({
          title: 'تم العثور على الترجمة في الذاكرة المحلية',
          description: 'هذه الترجمة تم جلبها من جهازك دون الحاجة للإنترنت.',
        });
        setIsLoading(false);
        return;
      }

      // If not in cache, proceed with API call
      const targetLanguage = isArabic(query) ? 'English' : 'Arabic';
      
      const input: SmartTranslationInput = {
        text: query,
        targetLanguage: targetLanguage,
      };

      const translationResult = await smartTranslation(input);
      setTranslation(translationResult.translation);
      payload.translation = translationResult.translation;
      logActivity({ tool: 'الترجمة الذكية', query: query, payload });
      
      // Save the new translation to cache
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

  const handlePronunciation = async () => {
    if (!translation) return;

    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const response = await textToSpeech({ text: translation });
      if (response.audioDataUri) {
        playAudio(response.audioDataUri);
      } else {
        setIsSpeaking(false);
        throw new Error("No audio data received.");
      }
    } catch (error) {
      console.error("TTS Error:", error);
      toast({
        title: "خطأ في النطق",
        description: "فشل في جلب نطق النص.",
        variant: "destructive",
      });
      setIsSpeaking(false);
    }
  };
  
  const playAudio = (audioDataUri: string) => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    const audio = new Audio(audioDataUri);
    audioRef.current = audio;
    audio.play();
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => {
        setIsSpeaking(false);
        toast({ title: "خطأ في تشغيل الصوت", variant: "destructive" });
    }
  }

  const handleCopy = () => {
    if (translation) {
      navigator.clipboard.writeText(translation);
      setIsCopied(true);
      toast({ title: 'تم نسخ الترجمة بنجاح!' });
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
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
                  <FormLabel className="text-lg">النص الأصلي (عربي أو إنجليزي)</FormLabel>
                  <FormControl>
                    <div className="relative">
                       <Textarea 
                         placeholder="أدخل النص هنا أو استخرجه من صورة..." 
                         className="min-h-[200px] text-lg pr-12" 
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
            <Button type="submit" disabled={isLoading || isExtracting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
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
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handlePronunciation} disabled={isSpeaking} className="text-muted-foreground hover:bg-primary/10">
                        {isSpeaking ? <Pause className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCopy} className="text-muted-foreground hover:bg-primary/10">
                        {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Clipboard className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
             <Card className="relative bg-background/50 rounded-lg p-6">
                <p className="text-lg leading-relaxed">{translation}</p>
             </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
