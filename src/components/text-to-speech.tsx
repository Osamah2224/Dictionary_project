'use client';

import * as React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AudioLines, Loader2, Play, Pause, History, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { useActivityLog } from '@/hooks/use-activity-log';

const FormSchema = z.object({
  text: z.string().min(1, 'الرجاء إدخال نص لتحويله.'),
});

type FormValues = z.infer<typeof FormSchema>;

const TTS_CACHE_KEY = 'ttsCache';

interface TextToSpeechProps {
  initialState?: { query: string; result: { audioDataUri: string } } | null;
}

export function TextToSpeech({ initialState }: TextToSpeechProps) {
  const [audioDataUri, setAudioDataUri] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { toast } = useToast();
  const [ttsCache, setTtsCache] = React.useState<Record<string, string>>({});
  const { logActivity } = useActivityLog();
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { text: '' },
  });

  React.useEffect(() => {
    // Restore state from activity log
    if (initialState) {
        form.setValue('text', initialState.query);
        setAudioDataUri(initialState.result.audioDataUri);
    }
  }, [initialState, form]);
  
  React.useEffect(() => {
    // Load cache from localStorage
    try {
      const cachedData = localStorage.getItem(TTS_CACHE_KEY);
      if (cachedData) {
        setTtsCache(JSON.parse(cachedData));
      }
    } catch (error) {
      console.error('Failed to load TTS cache:', error);
    }
    
    // Setup audio element
    const audio = new Audio();
    audio.addEventListener('play', () => setIsPlaying(true));
    audio.addEventListener('pause', () => setIsPlaying(false));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', () => setIsPlaying(true));
        audioRef.current.removeEventListener('pause', () => setIsPlaying(false));
        audioRef.current.removeEventListener('ended', () => setIsPlaying(false));
      }
    };
  }, []);

  const saveToCache = (text: string, dataUri: string) => {
    try {
      const updatedCache = { ...ttsCache, [text.toLowerCase()]: dataUri };
      setTtsCache(updatedCache);
      localStorage.setItem(TTS_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to save to TTS cache:', error);
      toast({ title: 'فشل حفظ الصوت محلياً', variant: 'destructive' });
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAudioDataUri(null);
    const query = data.text.trim();
    if (!query) {
      setIsLoading(false);
      return;
    }
    
    const payload = { audioDataUri: '' };

    try {
      // Check cache first
      if (ttsCache[query.toLowerCase()]) {
        const cachedAudio = ttsCache[query.toLowerCase()];
        setAudioDataUri(cachedAudio);
        payload.audioDataUri = cachedAudio;
        logActivity({ tool: 'تحويل النص إلى كلام', query: query, payload });
        toast({ title: 'تم العثور على الصوت في الذاكرة المحلية' });
        setIsLoading(false);
        return;
      }

      // If not in cache, call the API
      const result = await textToSpeech({ text: query });
      if (result.audioDataUri) {
        setAudioDataUri(result.audioDataUri);
        payload.audioDataUri = result.audioDataUri;
        logActivity({ tool: 'تحويل النص إلى كلام', query: query, payload });
        saveToCache(query, result.audioDataUri);
      } else {
         throw new Error("لم يتم إرجاع بيانات صوتية.");
      }
    } catch (error) {
      console.error('Text-to-Speech Error:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'فشل في تحويل النص إلى كلام. الرجاء المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlayback = () => {
      if (!audioRef.current || !audioDataUri) return;
      audioRef.current.src = audioDataUri;

      if (isPlaying) {
          audioRef.current.pause();
      } else {
          audioRef.current.play();
      }
  };
  
  const handleDownload = () => {
      if (!audioDataUri) return;
      const link = document.createElement('a');
      link.href = audioDataUri;
      link.download = `speech_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
          <AudioLines className="h-8 w-8" />
          <span>تحويل النص إلى كلام</span>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground pt-2 flex items-center gap-2">
         <History className="h-5 w-5"/>
          <span>
             حوّل أي نص إلى صوت مسموع. يتم حفظ النتائج تلقائيًا للاستخدام دون اتصال.
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
                  <FormLabel className="text-lg">النص المراد تحويله</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="أدخل النص هنا..." 
                      className="min-h-[200px] text-lg" 
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <AudioLines className="ml-2 h-6 w-6" />}
                <span>حوّل إلى كلام</span>
            </Button>
          </form>
        </Form>
        
        {isLoading && !audioDataUri && (
          <div className="flex justify-center items-center mt-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="text-xl text-muted-foreground ml-4">جاري تحويل النص، قد يستغرق هذا بعض الوقت...</p>
          </div>
        )}

        {audioDataUri && (
          <div className="mt-8 border-t border-primary/20 pt-6 animate-in fade-in duration-500">
             <h3 className="text-2xl font-bold text-primary mb-4">النتيجة الصوتية:</h3>
             <Card className="relative bg-background/50 rounded-lg p-6 flex items-center justify-center gap-4">
                <Button onClick={handlePlayback} size="lg" className="h-16 w-16 rounded-full">
                    {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                </Button>
                <audio ref={audioRef} src={audioDataUri} className="hidden" />
                <Button onClick={handleDownload} variant="outline" size="lg" className="h-16 w-16 rounded-full">
                    <Download className="h-8 w-8" />
                </Button>
             </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
