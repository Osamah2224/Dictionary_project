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
  input: {schema: SmartTranslationInputSchema},
  output: {schema: SmartTranslationOutputSchema},
  prompt: `You are a professional translator. Translate the following text into {{{targetLanguage}}}, taking into account the context and nuances of the language to provide an accurate and effective translation:

Text: {{{text}}}`,
});

const smartTranslationFlow = ai.defineFlow(
  {
    name: 'smartTranslationFlow',
    inputSchema: SmartTranslationInputSchema,
    outputSchema: SmartTranslationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
