'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, Loader2, Search, Type, List, Repeat, ChevronsUpDown, ListChecks, Volume2, X } from 'lucide-react';

import { smartDictionary, type SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';
import { Pagination } from './pagination';
import { useActivityLog } from '@/hooks/use-activity-log';
import { ScrollArea } from './ui/scroll-area';

const FormSchema = z.object({
  query: z.string().min(1, 'الرجاء إدخال كلمة أو عبارة.'),
});

type FormValues = z.infer<typeof FormSchema>;

type ResultState = SmartDictionaryOutput | null;

const WORDS_PER_PAGE = 10;

// This schema is used to validate data loaded from localStorage.
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
  const [localDictionary, setLocalDictionary] = useState<SmartDictionaryOutput[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
    },
  });

  const loadLocalDictionary = () => {
    try {
      const storedData = localStorage.getItem('processedWordsDictionary');
      if (storedData) {
        const dictionary = JSON.parse(storedData);
        // Validate each entry and filter out invalid ones
        const validWords = Object.values(dictionary).filter(entry => {
          const parsed = SmartDictionaryOutputSchema.safeParse(entry);
          return parsed.success;
        }) as SmartDictionaryOutput[];
        setLocalDictionary(validWords.sort((a,b) => a.word.localeCompare(b.word)));
      }
    } catch (error) {
      console.error("Failed to load or parse local dictionary:", error);
      toast({title: "فشل تحميل القاموس المحلي", variant: "destructive"});
    }
  };

  // Load the local dictionary on initial component mount.
  useEffect(() => {
    loadLocalDictionary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialState) {
        form.setValue('query', initialState.query);
        setResult(initialState.result);
    }
  }, [initialState, form]);

  const handlePronunciation = (text: string, lang: string) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang));
    
    if (voice) {
        utterance.voice = voice;
    } else {
        console.warn(`No voice found for lang: ${lang}`);
    }
    
    utterance.onerror = (event) => {
        if ((event as SpeechSynthesisErrorEvent).error === 'synthesis-canceled') return;
        console.error("SpeechSynthesis Error:", event);
        toast({ title: "خطأ في النطق", variant: "destructive" });
    };

    window.speechSynthesis.speak(utterance);
  };
  
  const saveWordToLocalDictionary = (wordData: SmartDictionaryOutput) => {
    try {
      const validatedData = SmartDictionaryOutputSchema.parse(wordData);
      const currentData = localStorage.getItem('processedWordsDictionary');
      const currentDictionary = currentData ? JSON.parse(currentData) : {};
      const wordKey = validatedData.word.toLowerCase();
      
      // Save to localStorage only if it's a new word
      if (!currentDictionary[wordKey]) {
        currentDictionary[wordKey] = validatedData;
        localStorage.setItem('processedWordsDictionary', JSON.stringify(currentDictionary));
      }
      
      // Update state to reflect the change immediately
      setLocalDictionary(prev => 
        [...prev.filter(p => p.word.toLowerCase() !== wordKey), validatedData]
        .sort((a,b) => a.word.localeCompare(b.word))
      );
    } catch (e) {
      console.error("Failed to save to local storage", e);
      toast({ title: "فشل حفظ النتيجة محلياً", variant: "destructive" });
    }
  };

  const removeWordFromLocalDictionary = (e: React.MouseEvent, wordToRemove: string) => {
    e.stopPropagation();
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف كلمة "${wordToRemove}" من القاموس المحلي؟`)) {
      return;
    }
    try {
      const storedData = localStorage.getItem('processedWordsDictionary');
      if (storedData) {
        const dictionary = JSON.parse(storedData);
        delete dictionary[wordToRemove.toLowerCase()];
        localStorage.setItem('processedWordsDictionary', JSON.stringify(dictionary));
        loadLocalDictionary(); // Refresh the list from storage
        toast({title: `تم حذف "${wordToRemove}"`});
      }
    } catch (error) {
      console.error("Failed to remove word:", error);
      toast({title: "فشل حذف الكلمة", variant: "destructive"});
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    const query = data.query.trim();
    const lowerCaseQuery = query.toLowerCase();

    // Check local dictionary first
    const foundEntry = localDictionary.find(
      entry => entry.word.toLowerCase() === lowerCaseQuery || entry.arabicMeaning.toLowerCase() === lowerCaseQuery
    );

    if (foundEntry) {
      setResult(foundEntry);
      logActivity({ tool: 'القاموس الذكي', query: query, payload: { ...foundEntry } });
      toast({ title: "تم العثور على الكلمة في القاموس المحلي" });
      setIsLoading(false);
      return;
    }

    try {
      const aiResult = await smartDictionary({ query: query });
      setResult(aiResult);
      logActivity({ tool: 'القاموس الذكي', query: query, payload: { ...aiResult } });
      saveWordToLocalDictionary(aiResult);
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
  
  const handleWordClick = (wordData: SmartDictionaryOutput) => {
    form.setValue('query', wordData.word);
    setResult(wordData);
    logActivity({ tool: 'القاموس الذكي', query: wordData.word, payload: { ...wordData } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const paginatedLocalDictionary = localDictionary.slice(
    (currentPage - 1) * WORDS_PER_PAGE,
    currentPage * WORDS_PER_PAGE
  );

  const BilingualTitle = ({ en, ar, icon }: { en: string; ar: string; icon: React.ReactNode }) => (
    <CardTitle className="flex items-center gap-3 text-xl font-bold">
      {icon}
      <span>{en} <span className="text-muted-foreground text-lg font-normal">/ {ar}</span></span>
    </CardTitle>
  );

  return (
    <>
    <Card className="w-full">
      <CardHeader className="bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
            <BookMarked className="h-8 w-8" />
            <span>القاموس الذكي</span>
          </CardTitle>
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
                        <Input placeholder="أدخل الكلمة هنا..." {...field} className="py-6 text-lg pl-10 border-2 border-primary/20 shadow-inner" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300 border-b-4 border-primary/50 dark:border-primary/20 active:border-b-0">
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
              <h2 className="text-5xl font-bold text-primary tracking-wider">{result.word}</h2>
              <p className="text-2xl text-muted-foreground mt-2">{result.arabicMeaning}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePronunciation(result.word, 'en')}
                className="absolute top-1/2 -translate-y-1/2 right-4 text-primary hover:bg-primary/10 rounded-full h-14 w-14"
                title="نطق الكلمة"
              >
                <Volume2 className="h-7 w-7" />
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
                        <CardContent><p className="text-lg font-semibold">{result.partOfSpeech}</p></CardContent>
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
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {result.synonyms && result.synonyms.length > 0 && (
                                  <div>
                                      <h4 className="font-semibold text-lg mb-2 text-green-600">Synonyms <span className="text-muted-foreground text-sm">/ مرادفات</span></h4>
                                      <Table>
                                           <TableHeader><TableRow>
                                                <TableHead>Word</TableHead>
                                                <TableHead>Meaning</TableHead>
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
                                                <TableHead>Word</TableHead>
                                                <TableHead>Meaning</TableHead>
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

    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
          <ListChecks className="h-8 w-8" />
          <span>الكلمات المحفوظة في القاموس المحلي ({localDictionary.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
         {localDictionary.length > 0 ? (
          <>
            <ScrollArea className="h-96 w-full">
              <Table>
                 <TableHeader>
                  <TableRow>
                    <TableHead>الكلمة الإنجليزية</TableHead>
                    <TableHead>المعنى بالعربية</TableHead>
                    <TableHead className="w-[50px] text-center">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLocalDictionary.map((wordData) => (
                    <TableRow key={wordData.word} className="group cursor-pointer hover:bg-muted/50" onClick={() => handleWordClick(wordData)}>
                      <TableCell className="font-semibold">{wordData.word}</TableCell>
                      <TableCell className="text-muted-foreground">{wordData.arabicMeaning}</TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => removeWordFromLocalDictionary(e, wordData.word)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(localDictionary.length / WORDS_PER_PAGE)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            قاموسك المحلي فارغ. ابدأ بالبحث عن كلمات وستُحفظ هنا تلقائياً.
          </p>
        )}
      </CardContent>
    </Card>
  </>
  );
}
    