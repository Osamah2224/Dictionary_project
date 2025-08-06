'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, Loader2, Database, Search } from 'lucide-react';

import { smartDictionary, type SmartDictionaryInput } from '@/ai/flows/smart-dictionary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const FormSchema = z.object({
  query: z.string().min(1, 'الرجاء إدخال كلمة أو عبارة.'),
  targetLanguage: z.string({ required_error: 'الرجاء اختيار لغة.' }),
});

type FormValues = z.infer<typeof FormSchema>;

type ResultState = {
  translatedDefinition: string;
  exampleUsage: string;
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
      const dictionaryResult = await smartDictionary(data as SmartDictionaryInput);
      setResult(dictionaryResult);
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
          أدخل كلمة أو عبارة واحصل على تعريفها المترجم ومثال على استخدامها في السياق.
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
                        <SelectItem value="Arabic" className="text-lg">العربية</SelectItem>
                        <SelectItem value="English" className="text-lg">الإنجليزية</SelectItem>
                        <SelectItem value="French" className="text-lg">الفرنسية</SelectItem>
                        <SelectItem value="Spanish" className="text-lg">الإسبانية</SelectItem>
                        <SelectItem value="German" className="text-lg">الألمانية</SelectItem>
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
          <div className="mt-8 border-t border-primary/20 pt-6 animate-in fade-in duration-500">
             <h3 className="text-2xl font-bold text-primary mb-4">النتائج:</h3>
             <div className="space-y-6">
                <Card className="bg-background/50 rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">التعريف المترجم</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg leading-relaxed">{result.translatedDefinition}</p>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">مثال على الاستخدام</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="italic text-lg leading-relaxed">{result.exampleUsage}</p>
                  </CardContent>
                </Card>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
