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
    // Details specific to verb tenses
    tenseDetails: z.object({
      formula: z.string().describe("The grammatical formula for the tense (e.g., Subject + V2 + Object)."),
      keywords: z.array(z.string()).describe("A list of keywords or time indicators for this tense (e.g., 'yesterday', 'always')."),
      usage: z.string().describe("An explanation of when and why to use this tense, in Arabic."),
      positiveExamples: z.array(z.object({
        example: z.string().describe("An example of a positive sentence."),
        translation: z.string().describe("The Arabic translation of the example.")
      })).describe("Multiple examples of positive sentences."),
      negativeExamples: z.array(z.object({
        example: z.string().describe("An example of a negative sentence."),
        translation: z.string().describe("The Arabic translation of the example.")
      })).describe("Multiple examples of negative sentences."),
      questionExamples: z.array(z.object({
        example: z.string().describe("An example of a question."),
        translation: z.string().describe("The Arabic translation of the example.")
      })).describe("Multiple examples of questions and answers."),
    }).optional().describe("Detailed breakdown if the rule is a verb tense. If not a tense, this field is omitted."),
    // General example for non-tense rules
    generalExample: z.object({
       example: z.string().describe("An actual example sentence from the lesson that uses this rule."),
       exampleTranslation: z.string().describe("The Arabic translation of the example sentence."),
    }).optional().describe("An example for non-tense rules."),
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
    -   \`lessonType\`: Classify the lesson.
    -   \`studentLevel\`: Determine the appropriate level.
    -   \`summary\`: Write a simple summary of the lesson in ARABIC.

2.  **Lesson with Translation:**
    -   Break down the original lesson into individual sentences.
    -   For each sentence, provide the original \`english\` text and its \`arabic\` translation.

3.  **New Words:**
    -   Extract important new vocabulary words and display them in a table.

4.  **Verb Conjugations:**
    -   Identify important verbs and create a conjugation table.

5.  **Synonyms and Antonyms:**
    -   For key words, provide synonyms, antonyms, and an example.

6.  **Smarter Grammar Rules Analysis:**
    -   Your primary task is to be an expert grammarian. Automatically detect and extract ALL grammar rules present in the text.
    -   For each detected rule:
        -   \`rule\`: Provide the precise, academic name of the rule (e.g., 'Present Simple', 'Definite Article The').
        -   \`explanation\`: Provide a simple, clear, and direct explanation of the rule in ARABIC.
        -   **IF THE RULE IS A VERB TENSE** (like Present Simple, Past Perfect, etc.), you MUST populate the \`tenseDetails\` object with the following:
            -   \`formula\`: The grammatical structure using symbols (e.g., Subject + verb(s/es) + Object).
            -   \`keywords\`: A list of common words indicating the tense (e.g., always, usually, yesterday, last year).
            -   \`usage\`: A clear Arabic explanation of when to use this tense.
            -   \`positiveExamples\`, \`negativeExamples\`, \`questionExamples\`: Provide at least two clear, distinct examples for each category, along with their Arabic translations. Show how to form questions, answers, and negations.
        -   **IF THE RULE IS NOT A VERB TENSE** (like articles, prepositions, etc.), you must OMIT the \`tenseDetails\` field and instead provide a single, clear example in the \`generalExample\` field, extracting a real sentence from the lesson content that demonstrates the rule.

7.  **Common Expressions:**
    -   Extract common phrases, idioms, or language chunks.

8.  **Interactive Exercises:**
    -   Generate a variety of exercises based on the lesson content.

9.  **Final Tips:**
    -   Provide a final summary, key points to memorize, and common mistakes for Arab students.

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
