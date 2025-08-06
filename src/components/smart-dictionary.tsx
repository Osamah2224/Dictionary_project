'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Database, Loader2 } from 'lucide-react';

import { smartDictionary, type SmartDictionaryInput } from '@/ai/flows/smart-dictionary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
          <Database className="h-8 w-8 text-accent" />
          <span>القاموس الذكي</span>
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground pt-2">
          أدخل كلمة أو عبارة واحصل على تعريفها المترجم ومثال على استخدامها في السياق.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">الكلمة أو العبارة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: Technology" {...field} className="py-6 text-lg"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetLanguage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg">الترجمة إلى</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="py-6 text-lg">
                        <SelectValue placeholder="اختر اللغة المستهدفة" />
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
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
              {isLoading && <Loader2 className="h-6 w-6 animate-spin" />}
              <span>احصل على التعريف</span>
            </Button>
          </form>
        </Form>
        {result && (
          <div className="mt-10 space-y-6 animate-in fade-in duration-500">
            <Card className="bg-background/50 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">التعريف المترجم</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{result.translatedDefinition}</p>
              </CardContent>
            </Card>
            <Card className="bg-background/50 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl text-primary">مثال على الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-lg">{result.exampleUsage}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
