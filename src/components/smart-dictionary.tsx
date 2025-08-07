'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, Loader2, Database, Search, Type, List, Repeat, ChevronsUpDown, Cog, Play, Pause, Square, ListChecks, Volume2 } from 'lucide-react';

import { smartDictionary, type SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Pagination } from './pagination';
import type { ProcessorWorkerMessage, WordProcessorResult } from '@/workers/word-processor.worker';
import { useActivityLog } from '@/hooks/use-activity-log';

const FormSchema = z.object({
  query: z.string().min(1, 'الرجاء إدخال كلمة أو عبارة.'),
});

type FormValues = z.infer<typeof FormSchema>;

type ResultState = SmartDictionaryOutput | null;

const WORDS_PER_PAGE = 20;
const AUDIO_CACHE_KEY = 'dictionaryAudioCache';

const SmartDictionaryOutputSchema = z.object({
  word: z.string(),
  arabicMeaning: z.string(),
  definition: z.string(),
  partOfSpeech: z.string(),
  derivatives: z.array(z.object({
    word: z.string(),
    partOfSpeech: z.string(),
    meaning: z.string()
  })),
  conjugation: z.array(z.object({
    tense: z.string(),
    form: z.string(),
    meaning: z.string()
  })),
  synonyms: z.array(z.object({
    word: z.string(),
    meaning: z.string()
  })),
  antonyms: z.array(z.object({
    word: z.string(),
    meaning: z.string()
  })),
});

interface SmartDictionaryProps {
  initialState?: { query: string; result: SmartDictionaryOutput } | null;
}


export function SmartDictionary({ initialState }: SmartDictionaryProps) {
  const [result, setResult] = useState<ResultState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
    },
  });

  useEffect(() => {
    if (initialState) {
        form.setValue('query', initialState.query);
        setResult(initialState.result);
    }
  }, [initialState, form]);

  const saveAudioToCache = (word: string, audioDataUri: string) => {
    try {
      const updatedCache = { ...audioCache, [word.toLowerCase()]: audioDataUri };
      setAudioCache(updatedCache);
      localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(updatedCache));
    } catch (error) {
      console.error('Failed to save audio to cache:', error);
    }
  };
  
  const handlePronunciation = async () => {
    if (!result || !result.word) return;

    if (isSpeaking) {
      audioRef.current?.pause();
      audioRef.current!.currentTime = 0;
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    try {
        const cachedAudio = audioCache[result.word.toLowerCase()];
        if (cachedAudio) {
            audioRef.current!.src = cachedAudio;
            audioRef.current!.play();
            return;
        }

        const response = await textToSpeech({ text: result.word });
        if (response.audioDataUri) {
          saveAudioToCache(result.word, response.audioDataUri);
          if (audioRef.current) {
            audioRef.current.src = response.audioDataUri;
            audioRef.current.play();
          }
        }
    } catch (error) {
      console.error("TTS Error:", error);
      toast({
        title: "خطأ في النطق",
        description: "فشل في جلب نطق الكلمة.",
        variant: "destructive",
      });
      setIsSpeaking(false);
    }
  };


  // Word Processor State
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalWordsToProcess, setTotalWordsToProcess] = useState(0);
  const [processedWords, setProcessedWords] = useState<WordProcessorResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const workerRef = useRef<Worker>();

  const loadProcessedWords = () => {
    try {
      const storedData = localStorage.getItem('processedWordsDictionary');
      if (storedData) {
        const dictionary = JSON.parse(storedData);
        const wordsArray = Object.values(dictionary).map(word => SmartDictionaryOutputSchema.parse(word)) as WordProcessorResult[];
        setProcessedWords(wordsArray.sort((a,b) => a.word.localeCompare(b.word)));
      }
    } catch (error) {
      console.error("Failed to load or parse processed words:", error);
      // localStorage.removeItem('processedWordsDictionary');
    }
  };
  
  const saveWordToDictionary = (wordData: WordProcessorResult) => {
    try {
      // Validate data with Zod schema before saving
      const validatedData = SmartDictionaryOutputSchema.parse(wordData);
      
      const currentData = localStorage.getItem('processedWordsDictionary');
      const currentDictionary = currentData ? JSON.parse(currentData) : {};

      // Use the English word as the key, always
      currentDictionary[validatedData.word.toLowerCase()] = validatedData;

      localStorage.setItem('processedWordsDictionary', JSON.stringify(currentDictionary));
      
      setProcessedWords(prev => 
        [...prev.filter(p => p.word.toLowerCase() !== validatedData.word.toLowerCase()), validatedData]
        .sort((a,b) => a.word.localeCompare(b.word))
      );

    } catch (e) {
      console.error("Failed to save to local storage", e);
      toast({ title: "فشل حفظ النتيجة محلياً", variant: "destructive" });
    }
  };


  useEffect(() => {
    loadProcessedWords();
    
    try {
      const cachedAudio = localStorage.getItem(AUDIO_CACHE_KEY);
      if (cachedAudio) {
        setAudioCache(JSON.parse(cachedAudio));
      }
    } catch (error) {
      console.error("Failed to load audio cache", error);
    }


    workerRef.current = new Worker(new URL('../workers/word-processor.worker.ts', import.meta.url));
    
    workerRef.current.onmessage = (event: MessageEvent<ProcessorWorkerMessage>) => {
      const { type, payload } = event.data;
      if (type === 'PROGRESS') {
        setTotalWordsToProcess(payload.total);
        setProcessedCount(payload.processed);
        setProgress(payload.progress);
      } else if (type === 'DONE') {
        setProcessingStatus('idle');
        toast({ title: 'اكتملت المعالجة بنجاح!' });
        loadProcessedWords(); // Refresh the list
      } else if (type === 'STOPPED') {
        setProcessingStatus('stopped');
        toast({ title: 'تم إيقاف المعالجة.', variant: 'default' });
        loadProcessedWords();
      } else if(type === 'WORD_PROCESSED'){
        // The worker has processed a word, now the main thread saves it.
        saveWordToDictionary(payload);
      }
    };
    
    // Create an audio element and attach it to the body
    const audio = new Audio();
    audio.addEventListener('ended', () => setIsSpeaking(false));
    audioRef.current = audio;
    
    return () => {
      workerRef.current?.terminate();
      if (audioRef.current) {
         audioRef.current.removeEventListener('ended', () => setIsSpeaking(false));
         audioRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    const query = data.query.trim();
    if (!query) {
        setIsLoading(false);
        return;
    }
    const lowerCaseQuery = query.toLowerCase();

    try {
      const storedData = localStorage.getItem('processedWordsDictionary');
      if (storedData) {
        const dictionary: Record<string, WordProcessorResult> = JSON.parse(storedData);
        // Search by English word (key) or Arabic meaning (value)
        const foundEntry = Object.values(dictionary).find(
            entry => entry.word.toLowerCase() === lowerCaseQuery || entry.arabicMeaning.toLowerCase() === lowerCaseQuery
        );

        if (foundEntry) {
          setResult(foundEntry);
          logActivity({ tool: 'القاموس الذكي', query: query, payload: { ...foundEntry } });
          toast({ title: "تم العثور على الكلمة في القاموس المحلي" });
          setIsLoading(false);
          return;
        }
      }

      const aiResult = await smartDictionary({ query: query });
      setResult(aiResult);
      logActivity({ tool: 'القاموس الذكي', query: query, payload: { ...aiResult } });
      
      // Save the new result to the local dictionary
      saveWordToDictionary(aiResult);

    } catch (error) {
      console.error('Smart Dictionary Error:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'فشل في جلب التعريف. الرجاء المحاولة مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessorControl = () => {
    if (processingStatus === 'running') {
      workerRef.current?.postMessage({ command: 'pause' });
      setProcessingStatus('paused');
    } else { // 'idle', 'paused', 'stopped'
      const wordsToProcess = JSON.parse(localStorage.getItem('englishWords') || '[]');
      const processedDictionary = JSON.parse(localStorage.getItem('processedWordsDictionary') || '{}');
      workerRef.current?.postMessage({ command: 'start', wordsToProcess, processedDictionary });
      setProcessingStatus('running');
    }
  };

  const stopProcessing = () => {
    workerRef.current?.postMessage({ command: 'stop' });
  };
  
  const handleWordClick = (wordData: WordProcessorResult) => {
    form.setValue('query', wordData.word);
    setResult(wordData);
    logActivity({ tool: 'القاموس الذكي', query: wordData.word, payload: { ...wordData } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginatedProcessedWords = processedWords.slice(
    (currentPage - 1) * WORDS_PER_PAGE,
    currentPage * WORDS_PER_PAGE
  );

  const BilingualTitle = ({ en, ar, icon }: { en: string; ar: string; icon: React.ReactNode }) => (
    <CardTitle className="flex items-center gap-3 text-xl">
      {icon}
      <span>{en} <span className="text-muted-foreground text-lg">/ {ar}</span></span>
    </CardTitle>
  );


  return (
    <>
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
            <BookMarked className="h-8 w-8" />
            <span>القاموس الذكي</span>
          </CardTitle>
          <div className='flex items-center gap-2'>
             <Dialog open={isProcessorOpen} onOpenChange={setIsProcessorOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="group text-primary hover:bg-primary/10" title="معالج الكلمات">
                  <Cog className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className='flex items-center gap-2'>
                    <Cog /> معالج الكلمات الآلي
                  </DialogTitle>
                  <DialogDescription>
                    يقوم هذا المعالج بجلب تفاصيل الكلمات المحفوظة من مستخرج SQL وتخزينها في القاموس المحلي للاستخدام دون الحاجة للإنترنت.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                   <div className='text-center'>
                    <span className='font-bold text-lg text-primary'>{processedCount}</span>
                    <span className='text-muted-foreground'> / {totalWordsToProcess} كلمة تمت معالجتها</span>
                  </div>
                  <Progress value={progress} />
                   <p className='text-sm text-center text-muted-foreground'>
                    {processingStatus === 'running' && 'جاري المعالجة...'}
                    {processingStatus === 'paused' && 'متوقف مؤقتاً.'}
                    {processingStatus === 'stopped' && 'تم الإيقاف.'}
                    {processingStatus === 'idle' && 'في وضع الاستعداد.'}
                  </p>
                </div>
                <DialogFooter className='gap-2'>
                  <Button onClick={stopProcessing} variant="destructive" disabled={processingStatus !== 'running' && processingStatus !== 'paused'}>
                    <Square className="ml-2 h-4 w-4" /> إيقاف نهائي
                  </Button>
                  <Button onClick={handleProcessorControl} disabled={totalWordsToProcess > 0 && processedCount === totalWordsToProcess} className='w-32'>
                    {processingStatus === 'running' ? <><Pause className="ml-2 h-4 w-4" /> إيقاف مؤقت</> : <><Play className="ml-2 h-4 w-4" /> بدء/استئناف</>}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button asChild variant="ghost" size="icon" className="group text-primary hover:bg-primary/10" title="مستخرج الكلمات من ملف SQL">
               <Link href="/sql-extractor">
                  <Database className="h-6 w-6" />
               </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormControl>
                      <div className="relative">
                        <Input placeholder="أدخل الكلمة هنا..." {...field} className="py-6 text-lg pl-10" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
              {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <Search className="ml-2 h-6 w-6" />}
              <span>بحث</span>
            </Button>
          </form>
        </Form>
        
        {isLoading && !result && (
          <div className="flex justify-center items-center mt-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {result && (
          <div className="mt-8 border-t-2 border-primary/10 pt-6 animate-in fade-in duration-500 space-y-8">
            <div className="text-center relative">
              <h2 className="text-5xl font-bold text-primary">{result.word}</h2>
              <p className="text-2xl text-muted-foreground mt-2">{result.arabicMeaning}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePronunciation}
                disabled={isLoading}
                className="absolute top-1/2 -translate-y-1/2 right-4 text-primary hover:bg-primary/10 rounded-full h-14 w-14"
                title="نطق الكلمة"
              >
                {isSpeaking ? <Pause className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
              </Button>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <Card>
                        <CardHeader><BilingualTitle en="Definition" ar="التعريف" icon={<BookMarked className="text-primary" />} /></CardHeader>
                        <CardContent><p className="text-lg leading-relaxed">{result.definition}</p></CardContent>
                    </Card>

                    <Card>
                        <CardHeader><BilingualTitle en="Part of Speech" ar="نوع الكلمة" icon={<Type className="text-primary" />} /></CardHeader>
                        <CardContent><p className="text-lg">{result.partOfSpeech}</p></CardContent>
                    </Card>
                    
                    {result.derivatives && result.derivatives.length > 0 && (
                      <Card>
                          <CardHeader><BilingualTitle en="Derivatives" ar="المشتقات" icon={<List className="text-primary" />} /></CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow>
                                    <TableHead>Word <span className="text-muted-foreground text-sm">/ الكلمة</span></TableHead>
                                    <TableHead>Type <span className="text-muted-foreground text-sm">/ النوع</span></TableHead>
                                    <TableHead>Arabic Meaning <span className="text-muted-foreground text-sm">/ المعنى</span></TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                      {result.derivatives.map((item, index) => (
                                          <TableRow key={index}><TableCell>{item.word}</TableCell><TableCell>{item.partOfSpeech}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                    )}
                </div>

                <div className="space-y-8">
                    {result.conjugation && result.conjugation.length > 0 && (
                      <Card>
                          <CardHeader><BilingualTitle en="Conjugation" ar="تصريف الفعل" icon={<Repeat className="text-primary" />} /></CardHeader>
                          <CardContent>
                              <Table>
                                  <TableHeader><TableRow>
                                    <TableHead>Tense <span className="text-muted-foreground text-sm">/ الزمن</span></TableHead>
                                    <TableHead>Form <span className="text-muted-foreground text-sm">/ الصيغة</span></TableHead>
                                    <TableHead>Arabic Meaning <span className="text-muted-foreground text-sm">/ المعنى</span></TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                      {result.conjugation.map((item, index) => (
                                          <TableRow key={index}><TableCell>{item.tense}</TableCell><TableCell>{item.form}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                    )}

                    {(result.synonyms?.length > 0 || result.antonyms?.length > 0) && (
                      <Card>
                        <CardHeader><BilingualTitle en="Synonyms & Antonyms" ar="المرادفات والتضاد" icon={<ChevronsUpDown className="text-primary" />} /></CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-2 gap-4">
                                {result.synonyms && result.synonyms.length > 0 && (
                                  <div>
                                      <h4 className="font-semibold text-lg mb-2 text-green-600">Synonyms <span className="text-muted-foreground text-sm">/ مرادفات</span></h4>
                                      <Table>
                                           <TableHeader><TableRow>
                                                <TableHead>Word <span className="text-muted-foreground text-sm">/ الكلمة</span></TableHead>
                                                <TableHead>Meaning <span className="text-muted-foreground text-sm">/ المعنى</span></TableHead>
                                          </TableRow></TableHeader>
                                          <TableBody>
                                              {result.synonyms.map((item, index) => (
                                                  <TableRow key={index}>
                                                    <TableCell className="p-2">{item.word}</TableCell>
                                                    <TableCell className="p-2 text-muted-foreground">{item.meaning}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                                )}
                                {result.antonyms && result.antonyms.length > 0 && (
                                  <div>
                                      <h4 className="font-semibold text-lg mb-2 text-red-600">Antonyms <span className="text-muted-foreground text-sm">/ متضادات</span></h4>
                                      <Table>
                                           <TableHeader><TableRow>
                                                <TableHead>Word <span className="text-muted-foreground text-sm">/ الكلمة</span></TableHead>
                                                <TableHead>Meaning <span className="text-muted-foreground text-sm">/ المعنى</span></TableHead>
                                          </TableRow></TableHeader>
                                          <TableBody>
                                              {result.antonyms.map((item, index) => (
                                                  <TableRow key={index}>
                                                    <TableCell className="p-2">{item.word}</TableCell>
                                                    <TableCell className="p-2 text-muted-foreground">{item.meaning}</TableCell>
                                                  </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </div>
                                )}
                            </div>
                        </CardContent>
                      </Card>
                    )}
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
          <ListChecks className="h-8 w-8" />
          <span>الكلمات المعالجة في القاموس المحلي ({processedWords.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
         {processedWords.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {paginatedProcessedWords.map((wordData, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  className="justify-start text-right"
                  onClick={() => handleWordClick(wordData)}
                >
                  {wordData.word}
                </Button>
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(processedWords.length / WORDS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            لا توجد كلمات معالجة حتى الآن. استخدم "معالج الكلمات" لبدء العملية.
          </p>
        )}
      </CardContent>
    </Card>
  </>
  );
}
