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
let currentWordIndex = 0;
let wordsQueue: string[] = [];

// This is the main processing function.
async function processWords() {
  isPaused = false; 

  const total = wordsQueue.length;
  let processedSinceStart = 0;
  
  // Initial progress update
  self.postMessage({ type: 'PROGRESS', payload: { progress: total > 0 ? (currentWordIndex / total) * 100 : 0, processed: currentWordIndex, total } });

  while (currentWordIndex < wordsQueue.length) {
    if (isPaused) {
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
      console.log("Processing stopped by user.");
      self.postMessage({ type: 'STOPPED' });
      return;
    }
    
    const word = wordsQueue[currentWordIndex];
    
    try {
      const result = await smartDictionary({ query: word });
      // Send the processed word back to the main thread to handle storage
      self.postMessage({ type: 'WORD_PROCESSED', payload: result });
    } catch (error) {
      console.error(`Failed to process word: ${word}`, error);
      // Optional: Notify main thread of the error for this specific word
    } finally {
       currentWordIndex++;
       processedSinceStart++;
       const progress = total > 0 ? (currentWordIndex / total) * 100 : 100;
       self.postMessage({ type: 'PROGRESS', payload: { progress, processed: currentWordIndex, total } });
       // Optional delay between API calls to avoid rate limiting
       await new Promise(resolve => setTimeout(resolve, 200)); 
    }
  }
    
  if (!isStopped) {
     self.postMessage({ type: 'DONE' });
  }
}

self.onmessage = async (event: MessageEvent<WorkerCommand>) => {
  const { command } = event.data;

  switch (command) {
    case 'start':
      isStopped = false;
      isPaused = false;
      const { wordsToProcess, processedDictionary } = event.data;
      // Filter out words that are already processed.
      wordsQueue = wordsToProcess.filter(word => !processedDictionary[word.toLowerCase()]);
      currentWordIndex = 0;
      processWords(); // Start the job
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
