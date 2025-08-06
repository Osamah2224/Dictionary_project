'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AboutMe() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال رسالة.',
      });
      return;
    }
    
    setIsLoading(true);
    setResponse(null);

    // TODO: Implement actual AI flow call here
    // For now, we'll simulate a response
    setTimeout(() => {
      setResponse(`هذه إجابة تجريبية لرسالتك: "${message}". سيتم هنا عرض الرد من الخبير أ. اسامة العُمري.`);
      setIsLoading(false);
      setMessage('');
    }, 1500);
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl overflow-hidden">
      <CardHeader className="text-center bg-primary/5 pb-4">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <User className="h-16 w-16 text-primary" />
          </div>
        </div>
        <CardTitle className="text-3xl font-headline font-bold text-primary">تواصل مع أ. اسامة العُمري</CardTitle>
        <p className="text-muted-foreground text-lg pt-2">
          هل لديك سؤال أو استفسار؟ أرسل رسالتك مباشرة واحصل على إجابة.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="min-h-[150px] text-lg"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
            {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <Send className="ml-2 h-6 w-6" />}
            <span>إرسال</span>
          </Button>
        </form>

        {isLoading && (
          <div className="flex justify-center items-center mt-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        {response && (
          <div className="mt-8 border-t border-primary/20 pt-6 animate-in fade-in duration-500">
             <h3 className="text-2xl font-bold text-primary mb-4">الرد:</h3>
             <Card className="bg-background/50 rounded-lg p-6">
                <p className="text-lg leading-relaxed">{response}</p>
             </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
