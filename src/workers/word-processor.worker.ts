// This is a Web Worker for processing words in the background.

import { smartDictionary, type SmartDictionaryOutput } from '@/ai/flows/smart-dictionary';

export type WordProcessorResult = SmartDictionaryOutput;

export type ProcessorWorkerMessage = 
  | { type: 'PROGRESS', payload: { progress: number; processed: number; total: number } }
  | { type: 'WORD_PROCESSED', payload: WordProcessorResult }
  | { type: 'DONE' }
  | { type: 'STOPPED' };

type WorkerCommand = 
  | { command: 'start', wordsToProcess: string[], processedDictionary: Record<string, WordProcessorResult> }
  | { command: 'pause' }
  | { command: 'stop' };

let isPaused = false;
let isStopped = false;
let wordsQueue: string[] = [];
let currentIndex = 0;

// This is the main processing function.
async function processWords() {
  const total = wordsQueue.length;
  
  self.postMessage({ type: 'PROGRESS', payload: { progress: total > 0 ? (currentIndex / total) * 100 : 0, processed: currentIndex, total } });

  while (currentIndex < wordsQueue.length) {
    if (isPaused) {
      // If paused, wait until unpaused or stopped
      await new Promise(resolve => {
        const interval = setInterval(() => {
          if (!isPaused || isStopped) {
            clearInterval(interval);
            resolve(null);
          }
        }, 200);
      });
    }

    if (isStopped) {
      self.postMessage({ type: 'STOPPED' });
      return;
    }
    
    const word = wordsQueue[currentIndex];
    
    try {
      // Call the AI flow to get the full dictionary entry
      const result = await smartDictionary({ query: word });
      // Send the processed word back to the main thread to handle storage
      self.postMessage({ type: 'WORD_PROCESSED', payload: result });
    } catch (error) {
      console.error(`Failed to process word: ${word}`, error);
      // Optional: Notify main thread of the error for this specific word
    }

    currentIndex++;
    const progress = total > 0 ? (currentIndex / total) * 100 : 100;
    self.postMessage({ type: 'PROGRESS', payload: { progress, processed: currentIndex, total } });
    
    // Optional delay between API calls to avoid rate limiting
    if(currentIndex < wordsQueue.length) {
       await new Promise(resolve => setTimeout(resolve, 500)); 
    }
  }
    
  if (!isStopped) {
     self.postMessage({ type: 'DONE' });
     isStopped = true; // Mark as stopped to prevent re-entry
  }
}

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const { command } = event.data;

  switch (command) {
    case 'start':
      if (isPaused) { // Resume logic
          isPaused = false;
          // processWords() will be unblocked and continue
      } else { // Start new job
          isStopped = false;
          isPaused = false;
          const { wordsToProcess, processedDictionary } = event.data;
          const processedKeys = Object.keys(processedDictionary).map(k => k.toLowerCase());
          wordsQueue = wordsToProcess.filter(word => !processedKeys.includes(word.toLowerCase())).sort();
          currentIndex = 0;
          processWords();
      }
      break;
    case 'pause':
      isPaused = true;
      break;
    case 'stop':
      isStopped = true;
      isPaused = false; // To unblock the waiting loop if it's paused.
      break;
  }
};

    