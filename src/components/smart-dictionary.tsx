'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, Loader2, Database, Search, Type, List, Repeat, ChevronsUpDown } from 'lucide-react';

import { smartDictionary, type SmartDictionaryInput } from '@/ai/flows/smart-dictionary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from './ui/separator';

const FormSchema = z.object({
  query: z.string().min(1, 'الرجاء إدخال كلمة أو عبارة.'),
  targetLanguage: z.string({ required_error: 'الرجاء اختيار لغة.' }),
});

type FormValues = z.infer<typeof FormSchema>;

// This will be expanded in the next steps to hold the detailed data.
type ResultState = {
  word: string;
  arabicMeaning: string;
  definition: string;
  partOfSpeech: string;
  derivatives: { word: string; partOfSpeech: string; meaning: string }[];
  conjugation: { tense: string; form: string; meaning: string }[];
  synonyms: { word: string; meaning: string }[];
  antonyms: { word: string; meaning: string }[];
} | null;

export function SmartDictionary() {
  const [result, setResult] = useState<ResultState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      // For now, we'll use placeholder data to show the new UI.
      // We will replace this with a real API call later.
      setTimeout(() => {
        setResult({
          word: 'Exacerbate',
          arabicMeaning: 'يفاقم / يفاقم',
          definition: 'To make (a problem, bad situation, or negative feeling) worse.',
          partOfSpeech: 'Verb',
          derivatives: [
            { word: 'Exacerbation', partOfSpeech: 'Noun', meaning: 'تفاقم' },
            { word: 'Exacerbatingly', partOfSpeech: 'Adverb', meaning: 'بشكل متفاقم' },
          ],
          conjugation: [
            { tense: 'Infinitive', form: 'To exacerbate', meaning: 'أن يفاقم' },
            { tense: 'Past Tense', form: 'Exacerbated', meaning: 'فاقم' },
            { tense: 'Past Participle', form: 'Exacerbated', meaning: 'متفاقم' },
          ],
          synonyms: [
            { word: 'Aggravate', meaning: 'يفاقم' },
            { word: 'Worsen', meaning: 'يزيد سوءًا' },
          ],
          antonyms: [
            { word: 'Alleviate', meaning: 'يخفف' },
            { word: 'Soothe', meaning: 'يهدئ' },
          ],
        });
        setIsLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Smart Dictionary Error:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'فشل في جلب التعريف. الرجاء المحاولة مرة أخرى.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
            <BookMarked className="h-8 w-8" />
            <span>القاموس الذكي</span>
          </CardTitle>
          <Button asChild variant="ghost" size="icon" className="group text-primary hover:bg-primary/10" title="مستخرج الكلمات من ملف SQL">
             <Link href="/sql-extractor">
                <Database className="h-6 w-6" />
             </Link>
          </Button>
        </div>
        <CardDescription className="text-lg text-muted-foreground pt-2">
          أدخل كلمة أو عبارة واحصل على تحليل شامل لها باللغتين العربية والإنجليزية.
        </CardDescription>
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
              <FormField
                control={form.control}
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem className="min-w-[180px]">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-6 text-lg">
                          <SelectValue placeholder="اختر اللغة" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English" className="text-lg">الإنجليزية</SelectItem>
                        <SelectItem value="Arabic" className="text-lg">العربية</SelectItem>
                      </SelectContent>
                    </Select>
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
            {/* Word and Meaning */}
            <div className="text-center">
              <h2 className="text-5xl font-bold text-primary">{result.word}</h2>
              <p className="text-2xl text-muted-foreground mt-2">{result.arabicMeaning}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    {/* Definition */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <BookMarked className="text-primary" />
                                <span>Definition / التعريف</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg leading-relaxed">{result.definition}</p>
                        </CardContent>
                    </Card>

                    {/* Part of Speech */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Type className="text-primary" />
                                <span>Part of Speech / التصنيف</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg">{result.partOfSpeech}</p>
                        </CardContent>
                    </Card>
                    
                    {/* Derivatives */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <List className="text-primary" />
                                <span>Derivatives / المشتقات</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Word</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Arabic Meaning</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.derivatives.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.word}</TableCell>
                                            <TableCell>{item.partOfSpeech}</TableCell>
                                            <TableCell>{item.meaning}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Conjugation */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Repeat className="text-primary" />
                                <span>Conjugation / تصريف الفعل</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tense</TableHead>
                                        <TableHead>Form</TableHead>
                                        <TableHead>Arabic Meaning</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {result.conjugation.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.tense}</TableCell>
                                            <TableCell>{item.form}</TableCell>
                                            <TableCell>{item.meaning}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Synonyms & Antonyms */}
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <ChevronsUpDown className="text-primary" />
                                <span>Synonyms & Antonyms / المرادفات والتضاد</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 text-green-600">Synonyms</h4>
                                    <Table>
                                        <TableBody>
                                            {result.synonyms.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="p-2">{item.word}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 text-red-600">Antonyms</h4>
                                    <Table>
                                        <TableBody>
                                            {result.antonyms.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="p-2">{item.word}</TableCell>
                                                </TableRow>
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
  );
}
