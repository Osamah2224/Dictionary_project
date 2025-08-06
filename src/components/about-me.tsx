import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Mail } from 'lucide-react';

export function AboutMe() {
  return (
    <Card className="w-full border-2 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-32 w-32 border-4 border-primary">
            <AvatarImage src="https://placehold.co/200x200.png" alt="أ. اسامة العُمري" data-ai-hint="man portrait" />
            <AvatarFallback>أع</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-2xl font-headline text-primary">أ. اسامة العُمري</CardTitle>
        <p className="text-muted-foreground">خبير لغوي ومطور برمجيات</p>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <p className="text-lg leading-relaxed">
          مرحباً بكم في المترجم الذكي! أنا أسامة العمري، وأجمع بين شغفي باللغات والبرمجة لإنشاء أدوات مبتكرة تساعد على سد فجوات التواصل. هذا التطبيق هو ثمرة سنوات من الخبرة في مجال اللغويات الحاسوبية والذكاء الاصطناعي.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <Briefcase className="text-accent" />
            <span>خبير لغويات حاسوبية</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="text-accent" />
            <span>osama.alomari@example.com</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
