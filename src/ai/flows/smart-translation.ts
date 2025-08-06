'use server';

/**
 * @fileOverview Smart Translation AI agent.
 *
 * - smartTranslation - A function that handles the translation process.
 * - SmartTranslationInput - The input type for the smartTranslation function.
 * - SmartTranslationOutput - The return type for the smartTranslation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTranslationInputSchema = z.object({
  text: z.string().describe('The text to translate.'),
  targetLanguage: z.string().describe('The target language for the translation.'),
});
export type SmartTranslationInput = z.infer<typeof SmartTranslationInputSchema>;

const SmartTranslationOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
export type SmartTranslationOutput = z.infer<typeof SmartTranslationOutputSchema>;

export async function smartTranslation(input: SmartTranslationInput): Promise<SmartTranslationOutput> {
  return smartTranslationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTranslationPrompt',
  input: { schema: SmartTranslationInputSchema },
  output: { schema: SmartTranslationOutputSchema },
  prompt: `You are a professional translator. Your task is to translate text accurately between Arabic and English.
The user will provide text and a target language. Provide the most accurate and natural-sounding translation.

Translate the following text into {{{targetLanguage}}}:

Text: {{{text}}}

Return ONLY the translated text.`,
});


const smartTranslationFlow = ai.defineFlow(
  {
    name: 'smartTranslationFlow',
    inputSchema: SmartTranslationInputSchema,
    outputSchema: SmartTranslationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Translation failed: No output from AI model.');
    }
    return output;
  }
);
