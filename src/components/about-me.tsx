import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Mail } from 'lucide-react';

export function AboutMe() {
  return (
    <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-6">
          <Avatar className="h-40 w-40 border-4 border-primary shadow-lg">
            <AvatarImage src="https://placehold.co/200x200.png" alt="أ. اسامة العُمري" data-ai-hint="man portrait" />
            <AvatarFallback>أع</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-3xl font-headline font-bold text-primary">أ. اسامة العُمري</CardTitle>
        <p className="text-muted-foreground text-lg pt-2">خبير لغوي ومطور برمجيات</p>
      </CardHeader>
      <CardContent className="space-y-8 text-center px-4 md:px-8">
        <p className="text-xl leading-relaxed max-w-3xl mx-auto">
          مرحباً بكم في المترجم الذكي! أنا أسامة العمري، وأجمع بين شغفي باللغات والبرمجة لإنشاء أدوات مبتكرة تساعد على سد فجوات التواصل. هذا التطبيق هو ثمرة سنوات من الخبرة في مجال اللغويات الحاسوبية والذكاء الاصطناعي.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 pt-6">
          <div className="flex items-center gap-3 text-lg">
            <Briefcase className="h-6 w-6 text-primary" />
            <span>خبير لغويات حاسوبية</span>
          </div>
          <div className="flex items-center gap-3 text-lg">
            <Mail className="h-6 w-6 text-primary" />
            <span>osama.alomari@example.com</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
