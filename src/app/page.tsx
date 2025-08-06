import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartDictionary } from '@/components/smart-dictionary';
import { SmartTranslation } from '@/components/smart-translation';
import { AboutMe } from '@/components/about-me';
import { ThemeToggle } from '@/components/theme-toggle';
import { Languages, User, Database, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 md:p-8 font-body">
      <div className="w-full max-w-6xl mx-auto">
        <header className="w-full flex justify-between items-center py-6 mb-8 border-b-2 border-primary/20">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            المترجم الذكي
          </h1>
          <ThemeToggle />
        </header>
        <main>
          <Tabs defaultValue="dictionary" className="w-full">
            <TabsList className="flex justify-center flex-wrap w-full bg-transparent p-0 gap-6 mb-8">
              <TabsTrigger value="dictionary" className="text-lg md:text-xl py-3 px-6 rounded-lg shadow-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <Database className="ml-2 h-5 w-5" />
                القاموس الذكي
              </TabsTrigger>
              <TabsTrigger value="translation" className="text-lg md:text-xl py-3 px-6 rounded-lg shadow-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <Languages className="ml-2 h-5 w-5" />
                الترجمة الذكية
              </TabsTrigger>
              <TabsTrigger value="about" className="text-lg md:text-xl py-3 px-6 rounded-lg shadow-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <User className="ml-2 h-5 w-5" />
                أ. اسامة العُمري
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dictionary" className="mt-8">
              <div className="flex flex-col gap-8">
                <SmartDictionary />
                <div className="text-center">
                    <Button asChild variant="link" className="text-lg text-primary hover:text-primary/80">
                      <Link href="/sql-extractor">
                        <LinkIcon className="ml-2 h-5 w-5" />
                        الانتقال إلى مستخرج الكلمات من ملفات SQL
                      </Link>
                    </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="translation" className="mt-8">
              <SmartTranslation />
            </TabsContent>
            <TabsContent value="about" className="mt-8">
              <AboutMe />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
