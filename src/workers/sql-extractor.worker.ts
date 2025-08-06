// This is a Web Worker, which runs in a separate thread.
// It is used to process large files without freezing the main UI thread.

const sqlKeywords = new Set([
  'select', 'insert', 'update', 'delete', 'from', 'where', 'and', 'or', 
  'into', 'values', 'set', 'create', 'table', 'database', 'index', 
  'view', 'as', 'is', 'null', 'not', 'like', 'in', 'between', 
  'by', 'group', 'order', 'asc', 'desc', 'having', 'distinct', 
  'join', 'inner', 'outer', 'left', 'right', 'on', 'union', 
  'all', 'any', 'exists', 'case', 'when', 'then', 'else', 'end', 
  'primary', 'key', 'foreign', 'constraint', 'default', 'check', 
  'alter', 'drop', 'truncate', 'commit', 'rollback', 'grant', 
  'revoke', 'begin', 'transaction', 'exec', 'procedure', 'function',
  'if', 'else', 'while', 'of', 'for', 'true', 'false', 'varchar',
  'char', 'int', 'integer', 'bigint', 'smallint', 'tinyint', 'decimal',
  'numeric', 'float', 'real', 'date', 'time', 'datetime', 'timestamp',
  'year', 'text', 'blob', 'longtext', 'mediumtext', 'binary', 'varbinary',
  'bit', 'enum', 'double', 'unsigned', 'zerofill', 'auto_increment',
  'engine', 'charset', 'collate', 'default', 'current_timestamp',
  'on', 'update', 'cascade', 'restrict', 'no', 'action', 'set', 'null',
  'use', 'show', 'tables', 'columns', 'describe', 'explain'
]);

const extractWordsFromSQL = (sqlContent: string): string[] => {
    // Regex to find potential words: starts with a letter or underscore, followed by letters, numbers, or underscores.
    // Minimum length of 3 to avoid short common variables like 'id'.
    const wordRegex = /\b[a-zA-Z_][a-zA-Z0-9_]{2,}\b/g;
    const matches = sqlContent.match(wordRegex) || [];
    const uniqueWords = new Set<string>();
    
    for (const word of matches) {
        const lowerWord = word.toLowerCase();
        // Check if it's not a number and not a SQL keyword
        if (isNaN(Number(word)) && !sqlKeywords.has(lowerWord)) {
            uniqueWords.add(word);
        }
    }
    return Array.from(uniqueWords).sort();
}

export type WorkerMessage = 
  | { type: 'PROGRESS', payload: { progress: number, message: string } }
  | { type: 'RESULT', payload: { words: string[], stats: { totalWords: number, uniqueWords: number, processingTime: number } } }
  | { type: 'ERROR', payload: { message: string } };

self.onmessage = async (event: MessageEvent<{ file: File }>) => {
  const { file } = event.data;
  
  try {
    self.postMessage({ type: 'PROGRESS', payload: { progress: 10, message: 'جاري قراءة الملف...' } });
    
    const content = await file.text();
    
    self.postMessage({ type: 'PROGRESS', payload: { progress: 50, message: 'جاري معالجة الملف واستخراج الكلمات...' } });
    const startTime = performance.now();

    const words = extractWordsFromSQL(content);
    
    const endTime = performance.now();
    const processingTime = parseFloat(((endTime - startTime) / 1000).toFixed(2));

    const stats = {
      totalWords: words.length,
      uniqueWords: words.length,
      processingTime
    };

    self.postMessage({ type: 'RESULT', payload: { words, stats } });

  } catch (error) {
    console.error('Worker error:', error);
    self.postMessage({ type: 'ERROR', payload: { message: 'حدث خطأ أثناء معالجة الملف.' } });
  }
};
