'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

export function SqlExtractor() {
  const { toast } = useToast();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [extractedWords, setExtractedWords] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState({ text: 'الرجاء اختيار ملف SQL ثم الضغط على زر بدء العملية', type: 'info' });
  const [stats, setStats] = useState({ totalWords: 0, uniqueWords: 0, processingTime: 0 });
  const [savedWords, setSavedWords] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showMessage = useCallback((text: string, type: 'info' | 'success' | 'error') => {
    setMessage({ text, type });
  }, []);

  const loadSavedWords = useCallback(() => {
    try {
      const words = JSON.parse(localStorage.getItem('englishWords') || '[]');
      setSavedWords(words);
    } catch (error) {
      console.error('Error loading saved words:', error);
      showMessage('حدث خطأ أثناء تحميل الكلمات المحفوظة', 'error');
    }
  }, [showMessage]);

  useEffect(() => {
    loadSavedWords();
  }, [loadSavedWords]);

  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showMessage('حجم الملف كبير جدًا. الحد الأقصى المسموح به هو 10MB', 'error');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.sql')) {
      showMessage('الرجاء اختيار ملف بامتداد .sql فقط', 'error');
      return;
    }

    setCurrentFile(file);
    setFileName(file.name);
    const formattedSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    setFileSize(formattedSize(file.size));
    showMessage('تم اختيار الملف بنجاح. اضغط على زر الاستخراج لبدء العملية', 'success');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(event.target.files?.[0] || null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    event.currentTarget.style.borderColor = 'hsl(var(--primary))';
    handleFileChange(event.dataTransfer.files?.[0] || null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.15)';
    event.currentTarget.style.borderColor = 'hsl(var(--accent))';
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
    event.currentTarget.style.borderColor = 'hsl(var(--primary))';
  };
  
  const extractWordsFromSQL = (sqlContent: string): string[] => {
      const wordRegex = /\b[A-Za-z_][A-Za-z0-9_]{2,}\b/g;
      const matches = sqlContent.match(wordRegex) || [];
      const sqlKeywords = new Set([
          'select', 'insert', 'update', 'delete', 'from', 'where', 'and', 'or', 
          'into', 'values', 'set', 'create', 'table', 'database', 'index', 
          'view', 'as', 'is', 'null', 'not', 'like', 'in', 'between', 
          'by', 'group', 'order', 'asc', 'desc', 'having', 'distinct', 
          'join', 'inner', 'outer', 'left', 'right', 'on', 'union', 
          'all', 'any', 'exists', 'case', 'when', 'then', 'else', 'end', 
          'primary', 'key', 'foreign', 'constraint', 'default', 'check', 
          'alter', 'drop', 'truncate', 'commit', 'rollback', 'grant', 
          'revoke', 'begin', 'transaction', 'exec', 'procedure', 'function'
      ]);
      const uniqueWords = new Set<string>();
      for (const word of matches) {
          const lowerWord = word.toLowerCase();
          if (!sqlKeywords.has(lowerWord)) {
              uniqueWords.add(word);
          }
      }
      return Array.from(uniqueWords).sort();
  }


  const handleExtract = async () => {
    if (!currentFile) {
      showMessage('الرجاء اختيار ملف SQL', 'error');
      return;
    }

    setProcessing(true);
    setProgress(0);
    showMessage('جاري قراءة الملف...', 'info');

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 50);
        setProgress(percentLoaded);
      }
    };

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setProgress(50);
        showMessage('جاري معالجة الملف واستخراج الكلمات...', 'info');
        const startTime = performance.now();
        
        // Simulate processing time for large files
        setTimeout(() => {
          const words = extractWordsFromSQL(content);
          const endTime = performance.now();
          const processingTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));

          setExtractedWords(words);
          setStats({ totalWords: words.length, uniqueWords: words.length, processingTime });
          setProgress(100);
          showMessage(`تم استخراج ${words.length} كلمة إنجليزية بنجاح!`, 'success');
          setProcessing(false);
          
          setTimeout(() => setProgress(0), 2000);
        }, 500);

      } else {
        showMessage('فشل في قراءة محتوى الملف', 'error');
        setProcessing(false);
      }
    };

    reader.onerror = () => {
      showMessage('حدث خطأ أثناء قراءة الملف', 'error');
      setProcessing(false);
      setProgress(0);
    };

    reader.readAsText(currentFile);
  };

  const saveResults = () => {
    if (extractedWords.length === 0) {
      toast({ title: 'لا توجد كلمات لحفظها', variant: 'destructive' });
      return;
    }
    try {
      const currentSavedWords = JSON.parse(localStorage.getItem('englishWords') || '[]');
      const uniqueSavedWords = new Set([...currentSavedWords, ...extractedWords]);
      const updatedWords = Array.from(uniqueSavedWords).sort();
      localStorage.setItem('englishWords', JSON.stringify(updatedWords));
      loadSavedWords();
      toast({ title: `تم حفظ ${extractedWords.length} كلمة بنجاح` });
    } catch (e) {
      toast({ title: 'فشل حفظ الكلمات', variant: 'destructive' });
    }
  };

  const exportResults = () => {
    if (extractedWords.length === 0) {
      toast({ title: 'لا توجد كلمات لتصديرها', variant: 'destructive' });
      return;
    }
    const content = extractedWords.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'english_words.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'تم تصدير الكلمات بنجاح' });
  };

  const clearResults = () => {
    setExtractedWords([]);
    setCurrentFile(null);
    setFileName('');
    setFileSize('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStats({ totalWords: 0, uniqueWords: 0, processingTime: 0 });
    showMessage('تم مسح النتائج بنجاح', 'success');
  };

  const getMessageClasses = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-500/20 border-green-500';
      case 'error':
        return 'bg-red-500/20 border-red-500';
      default:
        return 'bg-blue-500/20 border-blue-500';
    }
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case 'success':
        return 'fa-check-circle';
      case 'error':
        return 'fa-exclamation-triangle';
      default:
        return 'fa-info-circle';
    }
  };

  return (
    <div className="space-y-8">
      <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
            <i className="fas fa-file-upload"></i>
            <span>رفع ملف SQL</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="relative flex flex-col items-center justify-center p-10 border-2 border-dashed border-primary rounded-lg text-center cursor-pointer transition-colors duration-300 hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <i className="fas fa-cloud-upload-alt text-5xl text-primary mb-4"></i>
            <h3 className="text-xl font-bold">انقر أو اسحب ملف SQL هنا</h3>
            <p className="text-muted-foreground">الحد الأقصى لحجم الملف: 10MB</p>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".sql" className="hidden" />
          </div>

          {fileName && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <i className="fas fa-file"></i>
                <span>{fileName}</span>
              </div>
              <span className="text-sm text-muted-foreground">{fileSize}</span>
            </div>
          )}

          <Button onClick={handleExtract} disabled={!currentFile || processing} className="w-full py-6 text-lg">
            {processing ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span>جاري المعالجة...</span>
              </>
            ) : (
              <>
                <i className="fas fa-cogs mr-2"></i>
                <span>بدء عملية الاستخراج</span>
              </>
            )}
          </Button>

          {processing && <Progress value={progress} className="w-full" />}
          
          <div className={`p-4 rounded-lg border-2 flex items-center justify-center gap-3 ${getMessageClasses()}`}>
            <i className={`fas ${getMessageIcon()}`}></i>
            {message.text}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">{stats.totalWords}</CardTitle>
                <p className="text-muted-foreground">عدد الكلمات المستخرجة</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">{stats.uniqueWords}</CardTitle>
                <p className="text-muted-foreground">الكلمات الفريدة</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-primary">{stats.processingTime}</CardTitle>
                <p className="text-muted-foreground">ثانية (وقت المعالجة)</p>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
            <i className="fas fa-file-alt"></i>
            <span>النتائج المستخرجة</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Button onClick={saveResults} disabled={extractedWords.length === 0} className="flex-1">
              <i className="fas fa-save mr-2"></i> حفظ النتائج
            </Button>
            <Button onClick={exportResults} disabled={extractedWords.length === 0} variant="secondary" className="flex-1">
              <i className="fas fa-file-export mr-2"></i> تصدير الكلمات
            </Button>
            <Button onClick={clearResults} variant="destructive" className="flex-1">
              <i className="fas fa-trash-alt mr-2"></i> مسح النتائج
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto p-4 border rounded-lg bg-muted/50">
            {extractedWords.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {extractedWords.map((word, index) => (
                  <div key={index} className="bg-background p-2 rounded text-center shadow">
                    {word}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لم يتم استخراج أي كلمات بعد.</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="w-full border-2 border-primary/20 shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-headline text-primary">
            <i className="fas fa-archive"></i>
            <span>الكلمات المحفوظة سابقاً</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-72 overflow-y-auto p-4 border rounded-lg bg-muted/50">
             {savedWords.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {savedWords.map((word, index) => (
                  <div key={index} className="bg-background p-2 rounded text-center shadow">
                    {word}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد كلمات محفوظة.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
