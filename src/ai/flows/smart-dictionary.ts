// A Genkit Flow that implements the SmartDictionary story.

'use server';

/**
 * @fileOverview Provides a smart dictionary flow that translates words and phrases and provides contextually relevant example usage.
 *
 * - smartDictionary - A function that handles the translation and definition process.
 * - SmartDictionaryInput - The input type for the smartDictionary function.
 * - SmartDictionaryOutput - The return type for the smartDictionary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartDictionaryInputSchema = z.object({
  query: z.string().describe('The word or phrase to translate and define.'),
  targetLanguage: z.string().describe('The target language for translation.'),
});
export type SmartDictionaryInput = z.infer<typeof SmartDictionaryInputSchema>;

const SmartDictionaryOutputSchema = z.object({
  translatedDefinition: z.string().describe('The translated definition of the word or phrase.'),
  exampleUsage: z.string().describe('An example of the word or phrase used in context.'),
});
export type SmartDictionaryOutput = z.infer<typeof SmartDictionaryOutputSchema>;

export async function smartDictionary(input: SmartDictionaryInput): Promise<SmartDictionaryOutput> {
  return smartDictionaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartDictionaryPrompt',
  input: {schema: SmartDictionaryInputSchema},
  output: {schema: SmartDictionaryOutputSchema},
  prompt: `You are a smart dictionary that translates words and phrases and provides contextually relevant example usage in the target language.

Translate and define the following word or phrase: {{{query}}}

Target Language: {{{targetLanguage}}}

Provide a translated definition and an example of the word or phrase used in context.

Definition:
{{translatedDefinition}}

Example Usage:
{{exampleUsage}}`,
});

const smartDictionaryFlow = ai.defineFlow(
  {
    name: 'smartDictionaryFlow',
    inputSchema: SmartDictionaryInputSchema,
    outputSchema: SmartDictionaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
