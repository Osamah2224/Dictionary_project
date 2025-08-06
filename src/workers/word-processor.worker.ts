// This is a Web Worker for processing words in the background.

import { smartDictionary, type SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';

export type WordProcessorResult = SmartDictionaryOutput;

export type ProcessorWorkerMessage = 
  | { type: 'PROGRESS', payload: { progress: number; processed: number; total: number } }
  | { type: 'WORD_PROCESSED', payload: WordProcessorResult }
  | { type: 'DONE' }
  | { type: 'STOPPED' };

let isPaused = false;
let isStopped = false;

// This is the main processing function.
async function processWords() {
  isPaused = false;
  isStopped = false;

  try {
    const wordsToProcess: string[] = JSON.parse(localStorage.getItem('englishWords') || '[]');
    const processedDictionary: Record<string, WordProcessorResult> = JSON.parse(localStorage.getItem('processedWordsDictionary') || '{}');
    
    const unprocessedWords = wordsToProcess.filter(word => !processedDictionary[word.toLowerCase()]);
    
    if (unprocessedWords.length === 0) {
      self.postMessage({ type: 'PROGRESS', payload: { progress: 100, processed: 0, total: 0 } });
      self.postMessage({ type: 'DONE' });
      return;
    }

    const total = unprocessedWords.length;
    let processedCount = 0;

    self.postMessage({ type: 'PROGRESS', payload: { progress: 0, processed: 0, total } });

    for (const word of unprocessedWords) {
      while (isPaused) {
        if (isStopped) break;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait if paused
      }
      if (isStopped) {
        console.log("Processing stopped by user.");
        self.postMessage({ type: 'STOPPED' });
        return;
      }
      
      try {
        const result = await smartDictionary({ query: word });
        
        const currentData = localStorage.getItem('processedWordsDictionary');
        const currentDictionary = currentData ? JSON.parse(currentData) : {};
        currentDictionary[word.toLowerCase()] = result;
        localStorage.setItem('processedWordsDictionary', JSON.stringify(currentDictionary));

        self.postMessage({ type: 'WORD_PROCESSED', payload: result });

      } catch (error) {
        console.error(`Failed to process word: ${word}`, error);
        // Optional: Notify main thread of the error for this specific word
      } finally {
         processedCount++;
         const progress = total > 0 ? (processedCount / total) * 100 : 100;
         self.postMessage({ type: 'PROGRESS', payload: { progress, processed: processedCount, total } });
      }
    }
    
    if (!isStopped) {
       self.postMessage({ type: 'DONE' });
    }

  } catch (error) {
    console.error('Word processor worker error:', error);
  }
}


self.onmessage = async (event: MessageEvent<{ command: 'start' | 'pause' | 'stop' }>) => {
  const { command } = event.data;

  switch (command) {
    case 'start':
      if (isPaused) {
        isPaused = false; // Just resume
      } else {
        processWords(); // Start a new job
      }
      break;
    case 'pause':
      isPaused = true;
      break;
    case 'stop':
      isStopped = true;
      isPaused = false;
      break;
  }
};
