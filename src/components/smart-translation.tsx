'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages, Loader2 } from 'lucide-react';

import { smartTranslation, type SmartTranslationInput } from '@/ai/flows/smart-translation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  text: z.string().min(1, 'الرجاء إدخال نص للترجمة.'),
  targetLanguage: z.string({ required_error: 'الرجاء اختيار لغة.' }),
});

type FormValues = z.infer<typeof FormSchema>;

type ResultState = {
  translation: string;
} | null;

export function SmartTranslation() {
  const [result, setResult] = useState<ResultState>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      text: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setResult(null);
    try {
      const translationResult = await smartTranslation(data as SmartTranslationInput);
      setResult(translationResult);
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

  return (
    <Card className="w-full border-2 border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Languages className="text-accent" />
          <span>الترجمة الذكية</span>
        </CardTitle>
        <CardDescription>
          ترجم الجمل والنصوص الكاملة بدقة مع مراعاة السياق.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>النص المراد ترجمته</FormLabel>
                  <FormControl>
                    <Textarea placeholder="أدخل النص هنا..." className="min-h-[150px]" {...field} />
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
              <span>ترجم النص</span>
            </Button>
          </form>
        </Form>
        {result && (
          <div className="mt-8 space-y-4 animate-in fade-in duration-500">
            <Card>
              <CardHeader>
                <CardTitle>النص المترجم</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{result.translation}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
