'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BookMarked, Loader2 } from 'lucide-react';

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
    <Card className="w-full border-2 border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <BookMarked className="text-accent" />
          <span>القاموس الذكي</span>
        </CardTitle>
        <CardDescription>
          أدخل كلمة أو عبارة واحصل على تعريفها المترجم ومثال على استخدامها في السياق.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الكلمة أو العبارة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: Technology" {...field} />
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
                  <FormLabel>الترجمة إلى</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر اللغة المستهدفة" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Arabic">العربية</SelectItem>
                      <SelectItem value="English">الإنجليزية</SelectItem>
                      <SelectItem value="French">الفرنسية</SelectItem>
                      <SelectItem value="Spanish">الإسبانية</SelectItem>
                      <SelectItem value="German">الألمانية</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>احصل على التعريف</span>
            </Button>
          </form>
        </Form>
        {result && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle>التعريف المترجم</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{result.translatedDefinition}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>مثال على الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic">{result.exampleUsage}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
