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

const smartTranslationFlow = ai.defineFlow(
  {
    name: 'smartTranslationFlow',
    inputSchema: SmartTranslationInputSchema,
    outputSchema: SmartTranslationOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `You are a professional translator. Your task is to translate text accurately between Arabic and English.
The user will provide text and a target language. Provide the most accurate and natural-sounding translation.

Translate the following text into ${input.targetLanguage}:

Text: ${input.text}`,
      output: {
        schema: SmartTranslationOutputSchema,
      },
    });

    return llmResponse.output() as SmartTranslationOutput;
  }
);
