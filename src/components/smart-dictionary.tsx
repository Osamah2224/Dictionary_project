'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, Loader2, Database, Search, Type, List, Repeat, ChevronsUpDown, Cog, Play, Pause, Square, ListChecks } from 'lucide-react';

import { smartDictionary, type SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';
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

const FormSchema = z.object({
  query: z.string().min(1, 'الرجاء إدخال كلمة أو عبارة.'),
});

type FormValues = z.infer<typeof FormSchema>;

type ResultState = SmartDictionaryOutput | null;

const WORDS_PER_PAGE = 20;

export function SmartDictionary() {
  const [result, setResult] = useState<ResultState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Word Processor State
  const [isProcessorOpen, setIsProcessorOpen] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalWordsToProcess, setTotalWordsToProcess] = useState(0);
  const [processedWords, setProcessedWords] = useState<WordProcessorResult[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const workerRef = useRef<Worker>();


  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
    },
  });

  const loadProcessedWords = () => {
    try {
      const storedData = localStorage.getItem('processedWordsDictionary');
      if (storedData) {
        const dictionary = JSON.parse(storedData);
        const wordsArray = Object.values(dictionary) as WordProcessorResult[];
        setProcessedWords(wordsArray);
      }
    } catch (error) {
      console.error("Failed to load processed words:", error);
    }
  };

  useEffect(() => {
    loadProcessedWords();

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
        toast({ title: 'تم إيقاف المعالجة.', variant: 'destructive' });
        loadProcessedWords();
      } else if(type === 'WORD_PROCESSED'){
        // Add new word to the list in real-time
        setProcessedWords(prev => [...prev, payload]);
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, [toast]);
  

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    const query = data.query.trim();
    try {
      // 1. Check local storage first
      const storedData = localStorage.getItem('processedWordsDictionary');
      if (storedData) {
        const dictionary = JSON.parse(storedData);
        if (dictionary[query.toLowerCase()]) {
          setResult(dictionary[query.toLowerCase()]);
          setIsLoading(false);
          toast({ title: "تم العثور على الكلمة في القاموس المحلي" });
          return;
        }
      }

      // 2. If not found, call AI
      const aiResult = await smartDictionary({ query: query, targetLanguage: 'English' });
      setResult(aiResult);
      
      // 3. Save the new result to local storage
      try {
        const currentData = localStorage.getItem('processedWordsDictionary');
        const currentDictionary = currentData ? JSON.parse(currentData) : {};
        currentDictionary[query.toLowerCase()] = aiResult;
        localStorage.setItem('processedWordsDictionary', JSON.stringify(currentDictionary));
        loadProcessedWords(); // Refresh list
      } catch (e) {
        console.error("Failed to save to local storage", e);
        toast({ title: "فشل حفظ النتيجة محلياً", variant: "destructive" });
      }

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
    } else {
      workerRef.current?.postMessage({ command: 'start' });
      setProcessingStatus('running');
    }
  };

  const stopProcessing = () => {
    workerRef.current?.postMessage({ command: 'stop' });
  };
  
  const handleWordClick = (wordData: WordProcessorResult) => {
    form.setValue('query', wordData.word);
    setResult(wordData);
  };

  const paginatedProcessedWords = processedWords.slice(
    (currentPage - 1) * WORDS_PER_PAGE,
    currentPage * WORDS_PER_PAGE
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
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>التقدم:</span>
                    <span className='font-bold text-primary'>{processedCount} / {totalWordsToProcess}</span>
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
                  <Button onClick={handleProcessorControl} disabled={processingStatus === 'stopped'} className='w-32'>
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
        
        {isLoading && (
          <div className="flex justify-center items-center mt-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {result && (
          <div className="mt-8 border-t-2 border-primary/10 pt-6 animate-in fade-in duration-500 space-y-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold text-primary">{result.word}</h2>
              <p className="text-2xl text-muted-foreground mt-2">{result.arabicMeaning}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><BookMarked className="text-primary" /><span>Definition / التعريف</span></CardTitle></CardHeader>
                        <CardContent><p className="text-lg leading-relaxed">{result.definition}</p></CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Type className="text-primary" /><span>Part of Speech / التصنيف</span></CardTitle></CardHeader>
                        <CardContent><p className="text-lg">{result.partOfSpeech}</p></CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><List className="text-primary" /><span>Derivatives / المشتقات</span></CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Word</TableHead><TableHead>Type</TableHead><TableHead>Arabic Meaning</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {result.derivatives.map((item, index) => (
                                        <TableRow key={index}><TableCell>{item.word}</TableCell><TableCell>{item.partOfSpeech}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Repeat className="text-primary" /><span>Conjugation / تصريف الفعل</span></CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Tense</TableHead><TableHead>Form</TableHead><TableHead>Arabic Meaning</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {result.conjugation.map((item, index) => (
                                        <TableRow key={index}><TableCell>{item.tense}</TableCell><TableCell>{item.form}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><ChevronsUpDown className="text-primary" /><span>Synonyms & Antonyms / المرادفات والتضاد</span></CardTitle></CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 text-green-600">Synonyms</h4>
                                    <Table>
                                        <TableBody>
                                            {result.synonyms.map((item, index) => (
                                                <TableRow key={index}><TableCell className="p-2">{item.word}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 text-red-600">Antonyms</h4>
                                    <Table>
                                        <TableBody>
                                            {result.antonyms.map((item, index) => (
                                                <TableRow key={index}><TableCell className="p-2">{item.word}</TableCell></TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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

    