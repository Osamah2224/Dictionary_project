'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useActivityLog, type ActivityLogItem } from '@/hooks/use-activity-log';
import { Download, GraduationCap, Languages, BookMarked, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';
import { SmartTeacherOutput } from '@/ai/flows/smart-teacher';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

// #region --- Printable Dictionary Component ---
const PrintableDictionaryLog = ({ activities }: { activities: ActivityLogItem[] }) => {
  const dictionaryLogs = activities
    .filter(a => a.tool === 'القاموس الذكي')
    .map(a => a.payload as SmartDictionaryOutput);

  if (dictionaryLogs.length === 0) return <div className="p-4 text-center">لا توجد بيانات في القاموس الذكي لتصديرها.</div>;
  
  const BilingualTitle = ({ en, ar, icon, className = '' }: { en: string; ar: string; icon: React.ReactNode; className?: string }) => (
    <CardTitle className={`flex items-center gap-3 text-xl font-bold text-primary ${className}`}>
      {icon}
      <span>{en} <span className="text-gray-500 text-lg font-normal">/ {ar}</span></span>
    </CardTitle>
  );

  return (
    <div className="p-8 bg-white text-black font-body">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">سجل القاموس الذكي</h1>
      {dictionaryLogs.map((result, idx) => (
        <div key={idx} className="mb-12 page-break-before">
          <div className="text-center relative mb-4">
              <h2 className="text-5xl font-bold text-primary tracking-wider">{result.word}</h2>
              <p className="text-2xl text-gray-500 mt-2">{result.arabicMeaning}</p>
          </div>
          <Separator className="my-6" />
          <div className="grid grid-cols-2 gap-8">
              <div className="space-y-8">
                  <Card><CardHeader><BilingualTitle en="Definition" ar="التعريف" icon={<BookMarked />} /></CardHeader><CardContent><p className="text-lg leading-relaxed">{result.definition}</p></CardContent></Card>
                  <Card><CardHeader><BilingualTitle en="Part of Speech" ar="نوع الكلمة" icon={<BookMarked />} /></CardHeader><CardContent><p className="text-lg font-semibold">{result.partOfSpeech}</p></CardContent></Card>
                  {result.derivatives?.length > 0 && (
                    <Card><CardHeader><BilingualTitle en="Derivatives" ar="المشتقات" icon={<BookMarked />} /></CardHeader><CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Word</TableHead><TableHead>Type</TableHead><TableHead>Arabic Meaning</TableHead></TableRow></TableHeader>
                        <TableBody>{result.derivatives.map((item, index) => (<TableRow key={index}><TableCell>{item.word}</TableCell><TableCell>{item.partOfSpeech}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </CardContent></Card>
                  )}
              </div>
              <div className="space-y-8">
                  {result.conjugation?.length > 0 && (
                    <Card><CardHeader><BilingualTitle en="Conjugation" ar="تصريف الفعل" icon={<BookMarked />} /></CardHeader><CardContent>
                      <Table>
                        <TableHeader><TableRow><TableHead>Tense</TableHead><TableHead>Form</TableHead><TableHead>Arabic Meaning</TableHead></TableRow></TableHeader>
                        <TableBody>{result.conjugation.map((item, index) => (<TableRow key={index}><TableCell>{item.tense}</TableCell><TableCell>{item.form}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </CardContent></Card>
                  )}
                  {(result.synonyms?.length > 0 || result.antonyms?.length > 0) && (
                    <Card><CardHeader><BilingualTitle en="Synonyms & Antonyms" ar="المرادفات والتضاد" icon={<BookMarked />} /></CardHeader><CardContent>
                       <div className="grid grid-cols-1 gap-4">
                          {result.synonyms?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-lg mb-2 text-green-600">Synonyms</h4>
                                <Table>
                                  <TableHeader><TableRow><TableHead>Word</TableHead><TableHead>Meaning</TableHead></TableRow></TableHeader>
                                  <TableBody>{result.synonyms.map((item, index) => (<TableRow key={index}><TableCell>{item.word}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>))}</TableBody>
                                </Table>
                            </div>
                          )}
                          {result.antonyms?.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-lg mb-2 text-red-600">Antonyms</h4>
                                <Table>
                                  <TableHeader><TableRow><TableHead>Word</TableHead><TableHead>Meaning</TableHead></TableRow></TableHeader>
                                  <TableBody>{result.antonyms.map((item, index) => (<TableRow key={index}><TableCell>{item.word}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>))}</TableBody>
                                </Table>
                            </div>
                          )}
                      </div>
                    </CardContent></Card>
                  )}
              </div>
          </div>
        </div>
      ))}
    </div>
  );
};
// #endregion

// #region --- Printable Translation Component ---
const PrintableTranslationLog = ({ activities }: { activities: ActivityLogItem[] }) => {
    const translationLogs = activities
        .filter(a => a.tool === 'الترجمة الذكية')
        .map(a => ({ original: a.query, translation: (a.payload as { translation: string }).translation }));

    if (translationLogs.length === 0) return <div className="p-4 text-center">لا توجد بيانات في الترجمة الذكية لتصديرها.</div>;

    return (
        <div className="p-8 bg-white text-black font-body" dir="rtl">
            <h1 className="text-4xl font-bold mb-8 text-center text-primary">سجل الترجمة الذكية</h1>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">النص الأصلي</TableHead>
                        <TableHead className="w-1/2">النص المترجم</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {translationLogs.map((log, index) => (
                        <TableRow key={index}>
                            <TableCell className="text-lg">{log.original}</TableCell>
                            <TableCell className="text-lg">{log.translation}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
// #endregion

// #region --- Printable Teacher Component ---
const PrintableTeacherLog = ({ activities }: { activities: ActivityLogItem[] }) => {
  const teacherLogs = activities
      .filter(a => a.tool === 'المعلم الذكي')
      .map(a => a.payload as SmartTeacherOutput);

  if (teacherLogs.length === 0) return <div className="p-4 text-center">لا توجد بيانات في المعلم الذكي لتصديرها.</div>;
  
  const ResultCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <Card className="w-full border-gray-300 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
          {icon} <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <div className="p-8 bg-white text-black font-body">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">سجل المعلم الذكي</h1>
      {teacherLogs.map((result, idx) => (
        <div key={idx} className="mt-8 space-y-8 page-break-before">
          <ResultCard icon={<GraduationCap />} title="تحليل شامل للدرس">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{result.analysis.title}</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="secondary">النوع: {result.analysis.lessonType}</Badge>
                <Badge variant="secondary">المستوى: {result.analysis.studentLevel}</Badge>
              </div>
              <p className="text-gray-600 leading-relaxed text-lg">{result.analysis.summary}</p>
            </div>
          </ResultCard>

          <ResultCard icon={<BookMarked />} title="محتوى الدرس مع الترجمة">
            <div className="space-y-6">{result.lessonWithTranslation.map((item, index) => (<div key={index}><p className="text-lg font-semibold">{item.english}</p><p>{item.arabic}</p></div>))}</div>
          </ResultCard>
          
          <ResultCard icon={<BookMarked />} title="الكلمات الجديدة">
            <Table>
                <TableHeader><TableRow><TableHead>الكلمة</TableHead><TableHead>نمط الكلام</TableHead><TableHead>النوع</TableHead><TableHead>المعنى</TableHead></TableRow></TableHeader>
                <TableBody>{result.newWords.map((item, index) => (<TableRow key={index}><TableCell>{item.word}</TableCell><TableCell>{item.partOfSpeech}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.meaning}</TableCell></TableRow>))}</TableBody>
            </Table>
          </ResultCard>

          {result.grammarRules.length > 0 && (
            <ResultCard icon={<BookMarked />} title="تحليل القواعد النحوية">
              <div className="space-y-4">
                {result.grammarRules.map((item, index) => (
                   <div key={index} className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-primary">{item.rule}</h3>
                      <p className="leading-relaxed">{item.explanation}</p>
                   </div>
                ))}
              </div>
            </ResultCard>
          )}

          {result.exercises.length > 0 && (
            <ResultCard icon={<BookMarked />} title="تمارين ذاتية">
              {result.exercises.map((item, index) => (
                  <div key={index} className="pt-4 border-t">
                      <p className="font-semibold">{index + 1}. {item.question}</p>
                      <p className="text-green-700">الجواب: {item.answer}</p>
                  </div>
              ))}
            </ResultCard>
          )}
        </div>
      ))}
    </div>
  );
};
// #endregion


type ExportType = 'dictionary' | 'translation' | 'teacher';

export function ExportHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportType | null>(null);
  const { toast } = useToast();
  const { activities } = useActivityLog();

  const handleExportRequest = (exportType: ExportType) => {
    // Check if there is data for the requested export type
    const hasData = activities.some(a => a.tool === {
        'dictionary': 'القاموس الذكي',
        'translation': 'الترجمة الذكية',
        'teacher': 'المعلم الذكي'
    }[exportType]);

    if (!hasData) {
        toast({ title: `لا توجد بيانات في ${exportType === 'dictionary' ? 'القاموس' : exportType === 'translation' ? 'الترجمة' : 'المعلم'} الذكي للتصدير`, variant: 'destructive' });
        return;
    }

    setIsOpen(false);
    setIsExporting(exportType);
    toast({ title: 'جاري تحضير الملف للتصدير...' });
  };
  
  useEffect(() => {
    if (!isExporting) return;

    const processExport = async () => {
        const printableElement = document.getElementById(`printable-${isExporting}-log`);
        if (!printableElement) {
          console.error("Printable element not found!");
          setIsExporting(null);
          return;
        }

        try {
            const canvas = await html2canvas(printableElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: printableElement.scrollWidth,
                windowHeight: printableElement.scrollHeight,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgWidth / pdfWidth;
            const scaledHeight = imgHeight / ratio;

            let heightLeft = scaledHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - scaledHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`${isExporting}_sijil_${new Date().toISOString().split('T')[0]}.pdf`);
            toast({ title: 'تم تصدير الملف بنجاح!' });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast({ title: 'فشل تصدير الملف', variant: 'destructive' });
        } finally {
            setIsExporting(null);
        }
    };
    
    // A short timeout to ensure the DOM is updated before we try to capture it.
    const timer = setTimeout(processExport, 500);
    
    return () => clearTimeout(timer);
  }, [isExporting, toast]);


  const balloonClasses = "h-14 w-14 rounded-full text-primary-foreground shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out transform";

  return (
    <>
      <div className="fixed bottom-24 left-6 z-50">
        <div className="relative flex items-center justify-center">
           {isOpen && (
             <div className="absolute bottom-0 left-0 flex flex-col items-center gap-4 mb-20">
                <button
                    onClick={() => handleExportRequest('teacher')}
                    className={`${balloonClasses} bg-green-500 hover:bg-green-600`}
                    aria-label="تصدير سجل المعلم الذكي"
                    title="تصدير سجل المعلم الذكي"
                 >
                    <GraduationCap className="h-7 w-7" />
                 </button>
                 <button
                    onClick={() => handleExportRequest('translation')}
                    className={`${balloonClasses} bg-yellow-500 hover:bg-yellow-600 translate-y-2`}
                    aria-label="تصدير سجل الترجمة"
                    title="تصدير سجل الترجمة"
                 >
                    <Languages className="h-7 w-7" />
                 </button>
                 <button
                    onClick={() => handleExportRequest('dictionary')}
                    className={`${balloonClasses} bg-blue-500 hover:bg-blue-600 -translate-y-2`}
                    aria-label="تصدير سجل القاموس"
                    title="تصدير سجل القاموس"
                >
                    <BookMarked className="h-7 w-7" />
                </button>
             </div>
           )}
          <Button
            onClick={() => setIsOpen(!isOpen)}
            className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 ${isOpen ? 'rotate-45 bg-destructive' : 'bg-primary'}`}
            aria-label="تصدير السجلات"
            disabled={!!isExporting}
          >
            {isExporting ? <Loader2 className="h-8 w-8 animate-spin" /> : <Download className="h-8 w-8" />}
          </Button>
        </div>
      </div>
      
      {/* Hidden printable content */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '210mm' }}>
         {isExporting === 'dictionary' && <div id="printable-dictionary-log"><PrintableDictionaryLog activities={activities} /></div>}
         {isExporting === 'translation' && <div id="printable-translation-log"><PrintableTranslationLog activities={activities} /></div>}
         {isExporting === 'teacher' && <div id="printable-teacher-log"><PrintableTeacherLog activities={activities} /></div>}
      </div>
    </>
  );
}
