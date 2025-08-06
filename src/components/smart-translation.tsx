'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Languages, Loader2, Clipboard, Check } from 'lucide-react';

import { smartTranslation, type SmartTranslationInput } from '@/ai/flows/smart-translation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  text: z.string().min(1, 'الرجاء إدخال نص للترجمة.'),
});

type FormValues = z.infer<typeof FormSchema>;

// Function to detect if the text is primarily Arabic
const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text);

export function SmartTranslation() {
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      text: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setTranslation(null);
    try {
      // Determine the target language based on the input text
      const targetLanguage = isArabic(data.text) ? 'English' : 'Arabic';
      
      const input: SmartTranslationInput = {
        text: data.text,
        targetLanguage: targetLanguage,
      };

      const translationResult = await smartTranslation(input);
      setTranslation(translationResult.translation);
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
        <CardDescription className="text-lg text-muted-foreground pt-2">
          ترجم بين العربية والإنجليزية. أدخل النص في أي من اللغتين واحصل على الترجمة الفورية.
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
                    <Textarea placeholder="أدخل النص هنا..." className="min-h-[200px] text-lg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <Languages className="ml-2 h-6 w-6" />}
                <span>ترجم النص</span>
            </Button>
          </form>
        </Form>
        
        {isLoading && (
          <div className="flex justify-center items-center mt-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {translation && (
          <div className="mt-8 border-t border-primary/20 pt-6 animate-in fade-in duration-500">
             <h3 className="text-2xl font-bold text-primary mb-4">النص المترجم:</h3>
             <Card className="relative bg-background/50 rounded-lg p-6">
                <p className="text-lg leading-relaxed">{translation}</p>
                <Button variant="ghost" size="icon" className="absolute top-2 left-2 text-muted-foreground hover:bg-primary/10" onClick={handleCopy}>
                    {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Clipboard className="h-5 w-5" />}
                </Button>
             </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
