import { SqlExtractor } from '@/components/sql-extractor';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function SqlExtractorPage() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 md:p-8 font-body">
      <div className="w-full max-w-6xl mx-auto">
        <header className="w-full flex justify-between items-center py-6 mb-8 border-b-2 border-primary/20">
         <Link href="/" className="text-3xl md:text-4xl font-headline font-bold text-primary hover:opacity-80 transition-opacity">
            أ. أسامة العُمري
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon">
              <Link href="/" aria-label="العودة إلى الصفحة الرئيسية">
                <X className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </header>
        <main>
          <SqlExtractor />
        </main>
      </div>
      <footer className="text-center p-6 text-muted-foreground mt-auto w-full border-t border-border/20">
        تم تطوير هذا البرنامج باستخدام Next.js و Tailwind CSS &copy; 2024
      </footer>
    </div>
  );
}
