'use server';

/**
 * @fileOverview Provides a smart dictionary flow that translates words and provides detailed contextual information.
 *
 * - smartDictionary - A function that handles the dictionary lookup process.
 * - SmartDictionaryInput - The input type for the smartDictionary function.
 * - SmartDictionaryOutput - The return type for the smartDictionary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartDictionaryInputSchema = z.object({
  query: z.string().describe('The word or phrase to translate and define.'),
});
export type SmartDictionaryInput = z.infer<typeof SmartDictionaryInputSchema>;


const SmartDictionaryOutputSchema = z.object({
  word: z.string().describe("The English word that was looked up."),
  arabicMeaning: z.string().describe("The Arabic translation of the word."),
  definition: z.string().describe("A clear and concise definition of the word in English."),
  partOfSpeech: z.string().describe("The grammatical category of the word (e.g., Noun, Verb, Adjective). Be very accurate."),
  derivatives: z.array(z.object({
    word: z.string().describe("A derived form of the original word."),
    partOfSpeech: z.string().describe("The part of speech of the derived word."),
    meaning: z.string().describe("The Arabic meaning of the derived word.")
  })).describe("A list of words derived from the original word, like noun or adverb forms."),
  conjugation: z.array(z.object({
    tense: z.string().describe("The verb tense (e.g., Infinitive, Past Tense, Past Participle)."),
    form: z.string().describe("The verb form for that tense."),
    meaning: z.string().describe("The Arabic meaning of that verb form.")
  })).describe("A list of verb conjugations if the word is a verb."),
  synonyms: z.array(z.object({
    word: z.string().describe("A word that has a similar meaning."),
    meaning: z.string().describe("The Arabic meaning of the synonym.")
  })).describe("A list of synonyms for the word."),
  antonyms: z.array(z.object({
    word: z.string().describe("A word that has the opposite meaning."),
    meaning: z.string().describe("The Arabic meaning of the antonym.")
  })).describe("A list of antonyms for the word."),
});
export type SmartDictionaryOutput = z.infer<typeof SmartDictionaryOutputSchema>;


export async function smartDictionary(input: SmartDictionaryInput): Promise<SmartDictionaryOutput> {
  return smartDictionaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartDictionaryPrompt',
  input: {schema: SmartDictionaryInputSchema},
  output: {schema: SmartDictionaryOutputSchema},
  prompt: `You are a powerful and intelligent bilingual linguistic analysis tool for English and Arabic.
Your task is to provide a comprehensive breakdown of the user's query: '{{{query}}}'.

First, determine if the query is in English or Arabic.

If the query is in English:
- The 'word' field in your output should be the English query.
- The 'arabicMeaning' field should be its most accurate Arabic translation.
- Then, fill out all the other fields (definition, partOfSpeech, derivatives, etc.) for the English word. Ensure the partOfSpeech is very accurate. For every derivative, conjugation, synonym, and antonym, you MUST provide its Arabic meaning in the 'meaning' field.

If the query is in Arabic:
- First, find the most common and direct English translation for the Arabic query.
- The 'word' field in your output MUST be this English translation.
- The 'arabicMeaning' field in your output MUST be the original Arabic query.
- Then, perform the full analysis for the translated ENGLISH word and fill out all the other fields (definition, partOfSpeech, derivatives, etc.). Ensure the partOfSpeech is very accurate. For every derivative, conjugation, synonym, and antonym, you MUST provide its Arabic meaning in the 'meaning' field.

Provide the following details for the English word:
1.  **word**: The English word, correctly capitalized.
2.  **arabicMeaning**: The Arabic translation.
3.  **definition**: A clear, concise English definition.
4.  **partOfSpeech**: The primary grammatical category (e.g., Verb, Noun, Adjective). Be very accurate.
5.  **derivatives**: A list of related words with their Arabic meanings. If none, return an empty array.
6.  **conjugation**: If the word is a verb, provide its main conjugations with their Arabic meanings. If it's not a verb, return an empty array.
7.  **synonyms**: A list of at least 2-3 common synonyms with their Arabic meanings. If none, return an empty array.
8.  **antonyms**: A list of at least 2-3 common antonyms with their Arabic meanings. If none, return an empty array.
`,
});

const smartDictionaryFlow = ai.defineFlow(
  {
    name: 'smartDictionaryFlow',
    inputSchema: SmartDictionaryInputSchema,
    outputSchema: SmartDictionaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a dictionary entry.");
    }
    return output;
  }
);
