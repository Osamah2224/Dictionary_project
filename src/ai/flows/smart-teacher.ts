'use server';

/**
 * @fileOverview Provides a smart teacher flow that analyzes English lesson content
 * and generates a comprehensive, bilingual (English/Arabic) learning experience.
 *
 * - smartTeacher - A function that handles the lesson analysis process.
 * - SmartTeacherInput - The input type for the smartTeacher function.
 * - SmartTeacherOutput - The return type for the smartTeacher function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SmartTeacherInputSchema = z.object({
  lessonContent: z.string().describe('The full text content of the English lesson to be analyzed.'),
});
export type SmartTeacherInput = z.infer<typeof SmartTeacherInputSchema>;

const SmartTeacherOutputSchema = z.object({
  analysis: z.object({
    title: z.string().describe("The main title or topic of the lesson."),
    lessonType: z.enum(["Grammar", "Vocabulary", "Reading", "Writing", "Listening", "Conversation"]).describe("The type of the lesson."),
    studentLevel: z.enum(["Beginner", "Intermediate", "Advanced"]).describe("The appropriate student level for the lesson."),
    summary: z.string().describe("A general explanation of the lesson's topic in simple Arabic."),
  }).describe("A comprehensive analysis of the lesson."),
  
  lessonWithTranslation: z.array(z.object({
    english: z.string().describe("A single sentence from the original English lesson."),
    arabic: z.string().describe("The Arabic translation of the sentence."),
  })).describe("The lesson content, with each English sentence followed by its Arabic translation."),

  newWords: z.array(z.object({
    word: z.string().describe("The new vocabulary word."),
    partOfSpeech: z.string().describe("The part of speech (e.g., Noun, Verb, Adjective)."),
    type: z.string().describe("The type of the word (e.g., Singular/Plural, Regular/Irregular Verb)."),
    meaning: z.string().describe("The Arabic meaning of the word."),
  })).describe("A list of new vocabulary words found in the lesson."),
  
  verbConjugations: z.array(z.object({
    verb: z.string().describe("The verb."),
    meaning: z.string().describe("The Arabic meaning of the verb."),
    baseForm: z.string().describe("The base form of the verb."),
    past: z.string().describe("The past tense (2nd form)."),
    pastParticiple: z.string().describe("The past participle (3rd form)."),
    presentContinuous: z.string().describe("The present continuous form (verb+ing)."),
    future: z.string().describe("The future form (will + verb)."),
  })).describe("A table of important verb conjugations from the lesson."),
  
  synonymsAndAntonyms: z.array(z.object({
    word: z.string().describe("The key word."),
    synonym: z.string().describe("An English synonym for the word."),
    antonym: z.string().describe("An English antonym for the word (if one exists)."),
    translation: z.string().describe("The Arabic translation of the key word."),
    example: z.string().describe("An example sentence using the key word."),
    exampleTranslation: z.string().describe("The Arabic translation of the example sentence."),
  })).describe("A table of synonyms and antonyms for key words in the lesson."),

  grammarRules: z.array(z.object({
    rule: z.string().describe("The name of the grammar rule (e.g., 'Present Simple', 'Definite Article The')."),
    explanation: z.string().describe("A simple and clear explanation of the rule in Arabic."),
    example: z.string().describe("An actual example sentence from the lesson that uses this rule."),
    exampleTranslation: z.string().describe("The Arabic translation of the example sentence."),
  })).describe("An analysis of the grammar rules used in the lesson."),
  
  commonExpressions: z.array(z.object({
    expression: z.string().describe("A common phrase or language chunk from the lesson."),
    translation: z.string().describe("The Arabic translation of the expression."),
    usage: z.string().describe("An explanation of how and when to use this expression."),
  })).describe("A list of common expressions and language chunks."),
  
  exercises: z.array(z.object({
    question: z.string().describe("The question for the student."),
    type: z.enum(["Multiple Choice", "Fill in the Blank", "Correct the Mistake", "Translate", "Convert Sentence"]).describe("The type of the exercise."),
    options: z.array(z.string()).optional().describe("A list of options for multiple-choice questions."),
    answer: z.string().describe("The correct answer or correction."),
    answerTranslation: z.string().optional().describe("The Arabic translation of the answer or the corrected sentence."),
  })).describe("A set of interactive self-assessment exercises based on the lesson."),
  
  finalTips: z.object({
    summary: z.string().describe("A final summary of the lesson in simple Arabic."),
    keyPoints: z.array(z.string()).describe("The most important points the student should remember."),
    commonMistakes: z.array(z.string()).describe("A list of common mistakes for Arab students related to the lesson's topics."),
  }).describe("A final summary and tips for the Arab student."),
});

export type SmartTeacherOutput = z.infer<typeof SmartTeacherOutputSchema>;

export async function smartTeacher(input: SmartTeacherInput): Promise<SmartTeacherOutput> {
  return smartTeacherFlow(input);
}

const prompt = ai.definePrompt({
    name: 'smartTeacherPrompt',
    input: { schema: SmartTeacherInputSchema },
    output: { schema: SmartTeacherOutputSchema },
    prompt: `You are an expert AI English teacher for Arabic-speaking students. Your task is to analyze the provided English lesson content and generate a complete, bilingual (English/Arabic) educational output.

User's lesson content:
---
{{{lessonContent}}}
---

Follow these instructions precisely to generate the output object:

1.  **Comprehensive Analysis:**
    -   \`title\`: Extract the main topic of the lesson.
    -   \`lessonType\`: Classify the lesson as Grammar, Vocabulary, Reading, Writing, Listening, or Conversation.
    -   \`studentLevel\`: Determine the appropriate level: Beginner, Intermediate, or Advanced.
    -   \`summary\`: Write a simple summary of the lesson in ARABIC.

2.  **Lesson with Translation:**
    -   Break down the original lesson into individual sentences.
    -   For each sentence, provide the original \`english\` text and its \`arabic\` translation.

3.  **New Words:**
    -   Extract important new vocabulary words.
    -   For each word, provide \`partOfSpeech\`, \`type\` (e.g., singular, plural, regular verb), and its \`meaning\` in Arabic. Create a list.

4.  **Verb Conjugations:**
    -   Identify important verbs from the lesson.
    -   For each verb, create a table entry with \`verb\`, its Arabic \`meaning\`, \`baseForm\`, \`past\` (2nd form), \`pastParticiple\` (3rd form), \`presentContinuous\` (verb+ing), and \`future\` (will + verb).

5.  **Synonyms and Antonyms:**
    -   For key words, provide a \`synonym\`, an \`antonym\` (if applicable, otherwise leave empty), its Arabic \`translation\`, an \`example\` sentence from the lesson, and the \`exampleTranslation\` in Arabic.

6.  **Grammar Rules:**
    -   Automatically detect and extract all grammar rules present, not just tenses. This includes articles, pronouns, passive voice, questions, etc.
    -   For each rule, provide its name (\`rule\`), a simple ARABIC \`explanation\`, and a real \`example\` from the lesson with its \`exampleTranslation\`.

7.  **Common Expressions:**
    -   Extract common phrases, idioms, or language chunks.
    -   For each, provide the \`expression\`, its Arabic \`translation\`, and an explanation of its \`usage\` and context.

8.  **Interactive Exercises:**
    -   Generate a variety of exercises based on the lesson content.
    -   Types must include: "Multiple Choice", "Fill in the Blank", "Correct the Mistake", "Translate", or "Convert Sentence".
    -   For each exercise, provide the \`question\`, \`type\`, \`options\` (for multiple choice), the correct \`answer\`, and the \`answerTranslation\`.

9.  **Final Tips:**
    -   Provide a final \`summary\` of the lesson in ARABIC.
    -   List the most important \`keyPoints\` for the student to memorize.
    -   List some \`commonMistakes\` Arab students make related to the lesson's topics.

Ensure all Arabic translations are accurate and natural. The entire output must strictly follow the provided Zod schema.`,
});

const smartTeacherFlow = ai.defineFlow(
  {
    name: 'smartTeacherFlow',
    inputSchema: SmartTeacherInputSchema,
    outputSchema: SmartTeacherOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to analyze the lesson.');
    }
    return output;
  }
);
