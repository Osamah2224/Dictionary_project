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

const SmartDictionaryOutputSchema = z.object({
  word: z.string().describe("The English word that was looked up."),
  arabicMeaning: z.string().describe("The Arabic translation of the word."),
  definition: z.string().describe("A clear and concise definition of the word in English."),
  partOfSpeech: z.string().describe("The grammatical category of the word (e.g., Noun, Verb, Adjective)."),
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

const SmartDictionaryInputSchema = z.object({
  query: z.string().describe('The word or phrase to translate and define.'),
  targetLanguage: z.string().describe('The target language for translation (this will typically be English to get the details).'),
});
export type SmartDictionaryInput = z.infer<typeof SmartDictionaryInputSchema>;


export async function smartDictionary(input: SmartDictionaryInput): Promise<SmartDictionaryOutput> {
  return smartDictionaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartDictionaryPrompt',
  input: {schema: SmartDictionaryInputSchema},
  output: {schema: SmartDictionaryOutputSchema},
  prompt: `You are a powerful linguistic analysis tool. For the given English word, provide a comprehensive breakdown.
The user wants to understand the word '{{{query}}}' fully.

Provide the following details:
1.  **word**: The word itself, correctly capitalized.
2.  **arabicMeaning**: The most common and accurate Arabic translation.
3.  **definition**: A clear, concise English definition.
4.  **partOfSpeech**: The primary grammatical category (e.g., Verb, Noun, Adjective).
5.  **derivatives**: A list of related words (e.g., if the word is 'decide', a derivative is 'decision'). Include their part of speech and Arabic meaning.
6.  **conjugation**: If the word is a verb, provide its main conjugations: Infinitive, Past Tense, and Past Participle, along with their Arabic meanings. If it's not a verb, return an empty array.
7.  **synonyms**: A list of at least 2-3 common synonyms with their Arabic meanings.
8.  **antonyms**: A list of at least 2-3 common antonyms with their Arabic meanings.
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

    