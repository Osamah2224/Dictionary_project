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

self.onmessage = async (event: MessageEvent<{ command: 'start' | 'pause' | 'stop' }>) => {
  const { command } = event.data;

  if (command === 'pause') {
    isPaused = true;
    return;
  }
  
  if (command === 'stop') {
    isStopped = true;
    isPaused = false; // Ensure it doesn't stay paused
    self.postMessage({ type: 'STOPPED' });
    return;
  }

  if (command === 'start') {
    isPaused = false;
    isStopped = false;
  }

  // --- Main Processing Logic ---
  try {
    // 1. Load data from localStorage
    const wordsToProcess: string[] = JSON.parse(localStorage.getItem('englishWords') || '[]');
    const processedDictionary: Record<string, WordProcessorResult> = JSON.parse(localStorage.getItem('processedWordsDictionary') || '{}');
    
    const unprocessedWords = wordsToProcess.filter(word => !processedDictionary[word.toLowerCase()]);
    
    const total = unprocessedWords.length;
    let processedCount = 0;

    self.postMessage({ type: 'PROGRESS', payload: { progress: 0, processed: 0, total } });

    for (const word of unprocessedWords) {
      // Check for pause or stop commands before each word
      while (isPaused) {
        if (isStopped) break;
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait if paused
      }
      if (isStopped) {
        console.log("Processing stopped by user.");
        break;
      }
      
      try {
        // 2. Call the AI flow
        const result = await smartDictionary({ query: word, targetLanguage: 'English' });
        
        // 3. Save the result
        const currentData = localStorage.getItem('processedWordsDictionary');
        const currentDictionary = currentData ? JSON.parse(currentData) : {};
        currentDictionary[word.toLowerCase()] = result;
        localStorage.setItem('processedWordsDictionary', JSON.stringify(currentDictionary));

        // 4. Report progress for this word
        self.postMessage({ type: 'WORD_PROCESSED', payload: result });

      } catch (error) {
        console.error(`Failed to process word: ${word}`, error);
        // Optionally, send an error message to the main thread
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
    // Handle initialization error
  }
};

    