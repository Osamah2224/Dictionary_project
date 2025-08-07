import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SmartDictionary } from '@/components/smart-dictionary';
import { SmartTranslation } from '@/components/smart-translation';
import { SmartTeacher } from '@/components/smart-teacher';
import { ThemeToggle } from '@/components/theme-toggle';
import { Languages, GraduationCap, BookMarked } from 'lucide-react';
import Link from 'next/link';

interface HomeProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  initialDictionaryState?: any;
  initialTranslationState?: any;
  initialTeacherState?: any;
}


export default function Home({ 
  activeTab, 
  setActiveTab,
  initialDictionaryState,
  initialTranslationState,
  initialTeacherState,
}: HomeProps) {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 md:p-8 font-body">
      <div className="w-full max-w-6xl mx-auto">
        <header className="w-full flex justify-between items-center py-6 mb-8 border-b-2 border-primary/10">
          <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary">
            أ. أسامة العُمري
          </h1>
          <ThemeToggle />
        </header>
        <main>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="smart-dictionary" className="w-full">
            <TabsList className="flex justify-center w-full bg-transparent p-0 gap-4 mb-8">
              <TabsTrigger value="smart-dictionary" className="text-lg md:text-xl py-3 px-6 rounded-lg shadow-md border-2 border-transparent data-[state=active]:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <BookMarked className="ml-2 h-5 w-5" />
                القاموس الذكي
              </TabsTrigger>
              <TabsTrigger value="smart-translation" className="text-lg md:text-xl py-3 px-6 rounded-lg shadow-md border-2 border-transparent data-[state=active]:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <Languages className="ml-2 h-5 w-5" />
                الترجمة الذكية
              </TabsTrigger>
              <TabsTrigger value="smart-teacher" className="text-lg md:text-xl py-3 px-6 rounded-lg shadow-md border-2 border-transparent data-[state=active]:border-primary/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <GraduationCap className="ml-2 h-5 w-5" />
                المعلم الذكي
              </TabsTrigger>
            </TabsList>
            <TabsContent value="smart-dictionary" className="mt-8">
              <SmartDictionary initialState={initialDictionaryState} />
            </TabsContent>
            <TabsContent value="smart-translation" className="mt-8">
              <SmartTranslation initialState={initialTranslationState} />
            </TabsContent>
            <TabsContent value="smart-teacher" className="mt-8">
              <SmartTeacher initialState={initialTeacherState} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
