'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, GraduationCap, FileText, Sparkles, BookOpen, List, Repeat, ChevronsUpDown, Puzzle, VenetianMask, MessageSquareWarning, PencilRuler, CaseSensitive, Binary, Quote, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { smartTeacher, type SmartTeacherInput, type SmartTeacherOutput } from '@/ai/flows/smart-teacher';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { useActivityLog } from '@/hooks/use-activity-log';


interface SmartTeacherProps {
  initialState?: { query: string; result: SmartTeacherOutput } | null;
}

export function SmartTeacher({ initialState }: SmartTeacherProps) {
  const [lessonContent, setLessonContent] = useState('');
  const [analysisResult, setAnalysisResult] = useState<SmartTeacherOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  useEffect(() => {
    if (initialState) {
        // When restoring from activity log, the "query" is the lesson content itself.
        setLessonContent(initialState.query);
        setAnalysisResult(initialState.result);
    }
  }, [initialState]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonContent.trim()) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'الرجاء إدخال محتوى الدرس.',
      });
      return;
    }
    
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const input: SmartTeacherInput = { lessonContent };
      const result = await smartTeacher(input);
      setAnalysisResult(result);
      logActivity({ 
        tool: 'المعلم الذكي', 
        // For the log list, we show the title.
        query: result.analysis.title || 'تحليل درس', 
        // For the payload, we save the original content as the query to be able to restore it.
        payload: { ...result, query: lessonContent }
      });
    } catch (error) {
       console.error('Smart Teacher Error:', error);
       toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'فشل في تحليل الدرس. الرجاء المحاولة مرة أخرى.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  const ResultCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <Card className="w-full border-primary/10 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-primary">
          {icon}
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <>
      <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="text-center bg-primary/5 pb-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <GraduationCap className="h-16 w-16 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold text-primary">المعلم الذكي</CardTitle>
          <p className="text-muted-foreground text-lg pt-2">
            أدخل أي محتوى درس لغة إنجليزية واحصل على تحليل تعليمي متكامل وشامل. يعمل دون اتصال للدروس المحللة سابقاً عبر سجل النشاطات.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={lessonContent}
              onChange={(e) => setLessonContent(e.target.value)}
              placeholder="الصق محتوى الدرس هنا..."
              className="min-h-[250px] text-lg"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-7 text-xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
              {isLoading ? <Loader2 className="ml-2 h-6 w-6 animate-spin" /> : <Sparkles className="ml-2 h-6 w-6" />}
              <span>حلل الدرس</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center mt-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-xl text-muted-foreground ml-4">جاري تحليل الدرس، قد يستغرق هذا بعض الوقت...</p>
        </div>
      )}

      {analysisResult && (
        <div className="mt-8 space-y-8 animate-in fade-in duration-500">
          {/* Analysis Section */}
          <ResultCard icon={<FileText />} title="تحليل شامل للدرس">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{analysisResult.analysis.title}</h3>
              <div className="flex flex-wrap gap-4">
                <Badge variant="secondary" className="text-md">النوع: {analysisResult.analysis.lessonType}</Badge>
                <Badge variant="secondary" className="text-md">المستوى: {analysisResult.analysis.studentLevel}</Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{analysisResult.analysis.summary}</p>
            </div>
          </ResultCard>

          {/* Lesson with Translation */}
          <ResultCard icon={<BookOpen />} title="محتوى الدرس مع الترجمة">
            <div className="space-y-4">
              {analysisResult.lessonWithTranslation.map((item, index) => (
                <div key={index}>
                  <p className="text-lg font-semibold">{item.english}</p>
                  <p className="text-md text-muted-foreground">{item.arabic}</p>
                </div>
              ))}
            </div>
          </ResultCard>

          {/* New Words */}
          <ResultCard icon={<List />} title="الكلمات الجديدة">
            <Table>
                <TableHeader><TableRow>
                    <TableHead>الكلمة</TableHead>
                    <TableHead>نمط الكلام</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المعنى بالعربية</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                    {analysisResult.newWords.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.word}</TableCell>
                            <TableCell>{item.partOfSpeech}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.meaning}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </ResultCard>

          {/* Verb Conjugations */}
          {analysisResult.verbConjugations.length > 0 && (
            <ResultCard icon={<Repeat />} title="تصريفات الأفعال">
              <Table>
                  <TableHeader><TableRow>
                      <TableHead>الفعل</TableHead>
                      <TableHead>المصدر</TableHead>
                      <TableHead>الماضي</TableHead>
                      <TableHead>التصريف الثالث</TableHead>
                      <TableHead>المستمر</TableHead>
                      <TableHead>المستقبل</TableHead>
                      <TableHead>المعنى</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                      {analysisResult.verbConjugations.map((item, index) => (
                          <TableRow key={index}>
                              <TableCell>{item.verb}</TableCell>
                              <TableCell>{item.baseForm}</TableCell>
                              <TableCell>{item.past}</TableCell>
                              <TableCell>{item.pastParticiple}</TableCell>
                              <TableCell>{item.presentContinuous}</TableCell>
                              <TableCell>{item.future}</TableCell>
                              <TableCell>{item.meaning}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            </ResultCard>
          )}

          {/* Synonyms & Antonyms */}
           {analysisResult.synonymsAndAntonyms.length > 0 && (
            <ResultCard icon={<ChevronsUpDown />} title="المرادفات والأضداد">
              <Table>
                  <TableHeader><TableRow>
                      <TableHead>الكلمة</TableHead>
                      <TableHead>مرادف</TableHead>
                      <TableHead>ضد</TableHead>
                      <TableHead>مثال</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                      {analysisResult.synonymsAndAntonyms.map((item, index) => (
                          <TableRow key={index}>
                              <TableCell><span className="font-bold">{item.word}</span><br/><span className="text-sm text-muted-foreground">{item.translation}</span></TableCell>
                              <TableCell>{item.synonym}</TableCell>
                              <TableCell>{item.antonym || 'N/A'}</TableCell>
                              <TableCell>
                                  <p>{item.example}</p>
                                  <p className="text-sm text-muted-foreground">{item.exampleTranslation}</p>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
            </ResultCard>
           )}

          {/* Grammar Rules */}
          {analysisResult.grammarRules.length > 0 && (
            <ResultCard icon={<PencilRuler />} title="تحليل القواعد النحوية">
              <Accordion type="single" collapsible className="w-full">
                {analysisResult.grammarRules.map((item, index) => (
                   <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger className="text-lg font-semibold">{item.rule}</AccordionTrigger>
                      <AccordionContent className="space-y-6 px-2">
                        <p className="text-md leading-relaxed">{item.explanation}</p>
                        
                        {item.tenseDetails && (
                          <div className="space-y-4">
                            <Separator/>
                            <div>
                              <h4 className="font-bold text-md flex items-center gap-2 mb-2"><Binary size={16}/> الصيغة / Formula</h4>
                              <p dir="ltr" className="font-mono text-md bg-muted p-3 rounded-md text-center">{item.tenseDetails.formula}</p>
                            </div>
                             <div>
                              <h4 className="font-bold text-md flex items-center gap-2 mb-2"><CaseSensitive size={16}/> الكلمات الدالة / Keywords</h4>
                              <div className="flex flex-wrap gap-2">
                                {item.tenseDetails.keywords.map(kw => <Badge key={kw} variant="outline">{kw}</Badge>)}
                              </div>
                            </div>
                             <div>
                              <h4 className="font-bold text-md flex items-center gap-2 mb-2"><Quote size={16}/> الاستخدام / Usage</h4>
                              <p className="text-sm text-muted-foreground">{item.tenseDetails.usage}</p>
                            </div>
                            <Separator/>
                            <h4 className="font-bold text-md flex items-center gap-2"><Languages size={16}/> الأمثلة / Examples</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/3">الإثبات (+)</TableHead>
                                  <TableHead className="w-1/3">النفي (-)</TableHead>
                                  <TableHead className="w-1/3">السؤال (؟)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {[...Array(Math.max(item.tenseDetails.positiveExamples.length, item.tenseDetails.negativeExamples.length, item.tenseDetails.questionExamples.length))].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            {item.tenseDetails.positiveExamples[i] && <div><p>{item.tenseDetails.positiveExamples[i].example}</p><p className="text-xs text-muted-foreground">{item.tenseDetails.positiveExamples[i].translation}</p></div>}
                                        </TableCell>
                                        <TableCell>
                                            {item.tenseDetails.negativeExamples[i] && <div><p>{item.tenseDetails.negativeExamples[i].example}</p><p className="text-xs text-muted-foreground">{item.tenseDetails.negativeExamples[i].translation}</p></div>}
                                        </TableCell>
                                        <TableCell>
                                            {item.tenseDetails.questionExamples[i] && <div><p>{item.tenseDetails.questionExamples[i].example}</p><p className="text-xs text-muted-foreground">{item.tenseDetails.questionExamples[i].translation}</p></div>}
                                        </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {item.generalExample && (
                          <div className="bg-muted p-3 rounded-md mt-4">
                            <p className="font-mono text-md">"{item.generalExample.example}"</p>
                            <p className="text-sm text-muted-foreground">{item.generalExample.exampleTranslation}</p>
                          </div>
                        )}
                      </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ResultCard>
          )}

          {/* Common Expressions */}
          {analysisResult.commonExpressions.length > 0 && (
            <ResultCard icon={<VenetianMask />} title="التراكيب الشائعة">
                {analysisResult.commonExpressions.map((item, index) => (
                    <div key={index} className="p-4 border-b last:border-b-0">
                        <p className="text-lg font-bold">"{item.expression}"</p>
                        <p className="text-md text-muted-foreground">{item.translation}</p>
                        <p className="mt-2 text-sm">{item.usage}</p>
                    </div>
                ))}
            </ResultCard>
          )}
          
          {/* Exercises */}
          {analysisResult.exercises.length > 0 && (
            <ResultCard icon={<Puzzle />} title="تمارين ذاتية تفاعلية">
              <Accordion type="single" collapsible className="w-full">
                  {analysisResult.exercises.map((item, index) => (
                      <AccordionItem value={`exercise-${index}`} key={index}>
                          <AccordionTrigger className="text-lg">
                              <span className="font-semibold mr-2">{index + 1}.</span> {item.question} <Badge variant="outline" className="mr-auto">{item.type}</Badge>
                          </AccordionTrigger>
                          <AccordionContent className="px-2 pt-4">
                              <div className="bg-green-500/10 text-green-800 dark:text-green-300 p-4 rounded-md">
                                  <p className="font-bold text-lg">{item.answer}</p>
                                  {item.answerTranslation && <p className="text-sm">{item.answerTranslation}</p>}
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
            </ResultCard>
          )}

          {/* Final Tips */}
          <ResultCard icon={<MessageSquareWarning />} title="الشرح النهائي ونصائح">
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-xl mb-2">ملخص الدرس</h4>
                <p className="text-muted-foreground leading-relaxed">{analysisResult.finalTips.summary}</p>
              </div>
              <div>
                <h4 className="font-bold text-xl mb-2">أهم النقاط للحفظ</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {analysisResult.finalTips.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
                </ul>
              </div>
               <div>
                <h4 className="font-bold text-xl mb-2">أخطاء شائعة</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {analysisResult.finalTips.commonMistakes.map((mistake, index) => <li key={index}>{mistake}</li>)}
                </ul>
              </div>
            </div>
          </ResultCard>

        </div>
      )}
    </>
  );
}
