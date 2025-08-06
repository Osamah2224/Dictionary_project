import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartDictionary } from '@/components/smart-dictionary';
import { SmartTranslation } from '@/components/smart-translation';
import { AboutMe } from '@/components/about-me';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 font-body">
      <div className="w-full max-w-5xl mx-auto">
        <header className="w-full flex justify-between items-center py-6 mb-6 border-b border-border">
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">
            المترجم الذكي
          </h1>
          <ThemeToggle />
        </header>
        <main>
          <Tabs defaultValue="dictionary" className="w-full">
            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto md:h-12 bg-transparent p-0 gap-4">
              <TabsTrigger value="dictionary" className="text-base md:text-lg py-3 rounded-lg shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all duration-300">
                القاموس الذكي
              </TabsTrigger>
              <TabsTrigger value="translation" className="text-base md:text-lg py-3 rounded-lg shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all duration-300">
                الترجمة الذكية
              </TabsTrigger>
              <TabsTrigger value="about" className="text-base md:text-lg py-3 rounded-lg shadow-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all duration-300">
                أ. اسامة العُمري
              </TabsTrigger>
            </TabsList>
            <TabsContent value="dictionary" className="mt-8">
              <SmartDictionary />
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
