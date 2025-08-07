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
    lessonType: z.enum(["Grammar", "Vocabulary", "Reading", "Writing", "Listening", "Conversation", "Phonics", "Punctuation"]).describe("The type of the lesson."),
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
    rule: z.string().describe("The name of the grammar rule (e.g., 'Present Simple', 'Definite Article The'). Use the exact name from the provided English Basics Index."),
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
  })).describe("An analysis of the grammar rules used in the lesson, based on the provided comprehensive index."),
  
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
    prompt: `You are an expert AI English teacher for Arabic-speaking students. Your task is to analyze the provided English lesson content and generate a complete, bilingual (English/Arabic) educational output based on the comprehensive index of English basics provided below.

---
**Comprehensive Index of English Language Basics (Your Knowledge Base)**

#### **Phonetics and Pronunciation Rules**
1.  Silent and Vowel Letters
2.  Syllables
3.  Stress
4.  Intonation
5.  Compound Sounds
6.  Pronunciation Rules by Spelling
7.  Dialectal Differences (American/British)

#### **Writing and Spelling Rules**
1.  Correct Spelling
2.  Spelling Rules
3.  Capitalization
4.  Acronyms and Abbreviations
5.  Writing Numbers and Letters
6.  Derivation (Prefixes and Suffixes)

#### **Punctuation**
1.  Period
2.  Comma
3.  Semicolon
4.  Colon
5.  Question Mark
6.  Exclamation Mark
7.  Quotation Marks
8.  Parentheses
9.  Dash
10. Ellipsis

#### **Nouns**
1.  Types of Nouns (Common/Proper)
2.  Plural (Formation Rules)
3.  Possessive
4.  Definite and Indefinite Articles
5.  Collective Nouns
6.  Demonstrative Nouns
7.  Compound Nouns

#### **Pronouns**
1.  Personal Pronouns
2.  Possessive Pronouns
3.  Reflexive Pronouns
4.  Relative Pronouns
5.  Interrogative Pronouns
6.  Demonstrative Pronouns
7.  Indefinite Pronouns

#### **Verbs**
1.  Auxiliary Verbs
2.  Modal Verbs (Auxiliary)
3.  Phrasal Verbs
4.  Transitive and Intransitive Verbs
5.  Absolute Verbs
6.  Reported Verbs
7.  Verb Conjugation
8.  Irregular Verbs
9.  Infinitives
10. Participles (Present/Past)

#### **Tenses**
1.  Present Simple
2.  Present Continuous
3.  Past Simple
4.  Past Continuous
5.  Future Simple
6.  Future Continuous
7.  Present Perfect
8.  Past Perfect
9.  Future Perfect
10. Perfect Continuous Tenses

#### **Adjectives**
1.  Attributive Adjectives
2.  Predicative Adjectives
3.  Degrees of Comparison (Superlative)
4.  Compound Adjectives
5.  Order of Adjectives
6.  Non-gradable Adjectives

#### **Adverbs**
1.  Adverbs of Time
2.  Adverbs of Place
3.  Adverbs of Manner
4.  Adverbs of Degree
5.  Adverbs of Frequency
6.  Comparison of Adverbs

#### **Prepositions**
1.  Prepositions of Time
2.  Prepositions of Place
3.  Prepositions of Direction
4.  Figurative Prepositions
5.  Fixed Structures with Prepositions

#### **Conjunctions and Connectors**
1.  Coordinating Conjunctions
2.  Subordinating Conjunctions
3.  Causal Conjunctions
4.  Temporal Conjunctions
5.  Conditional Conjunctions
6.  Conjunctions of Contrast

#### **Sentence Structure**
1.  Verbal Sentences
2.  Nominal Sentences
3.  Simple Sentences
4.  Compound Sentences
5.  Complex Sentences
6.  Conditional Sentences (all types)
7.  Direct and Indirect Speech

#### **Grammatical Styles**
1.  Active Voice
2.  Passive Voice
3.  Negation (all types)
4.  Interrogation (Question Formation)
5.  Contractions in Conversation
6.  Emphasis
7.  Exception
8.  Conditionals
9.  Wishes and Hopes

#### **Advanced Patterns**
1.  Unreal Conditionals
2.  Gerund and Infinitive Clauses
3.  Idiomatic Expressions
4.  Semantic Differences
5.  Academic Abbreviations
6.  Formal Writing Rules
7.  Common Errors

#### **Rhetorical Styles**
1.  Simile
2.  Metaphor
3.  Kenning
4.  Antithesis
5.  Alliteration

#### **Language Arts**
1.  Poetic Rules
2.  Wordplay
3.  Puns
4.  Creative Abbreviations
---

User's lesson content:
---
{{{lessonContent}}}
---

Follow these instructions precisely to generate the output object:

1.  **Comprehensive Analysis:**
    -   \`title\`: Extract the main topic of the lesson.
    -   \`lessonType\`: Classify the lesson using the categories from the index (e.g., Grammar, Phonics, Punctuation).
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
    -   Your primary task is to be an expert grammarian. Automatically detect and extract ALL grammar rules present in the text by **cross-referencing with the Comprehensive Index** above.
    -   For each detected rule:
        -   \`rule\`: Provide the precise, academic name of the rule **exactly as it appears in the index**.
        -   \`explanation\`: Provide a simple, clear, and direct explanation of the rule in ARABIC.
        -   **IF THE RULE IS A VERB TENSE** (any item under the "Tenses" category in the index), you MUST populate the \`tenseDetails\` object with the following:
            -   \`formula\`: The grammatical structure using symbols (e.g., Subject + verb(s/es) + Object).
            -   \`keywords\`: A list of common words indicating the tense (e.g., always, usually, yesterday, last year).
            -   \`usage\`: A clear Arabic explanation of when to use this tense.
            -   \`positiveExamples\`, \`negativeExamples\`, \`questionExamples\`: Provide at least two clear, distinct examples for each category, along with their Arabic translations. Show how to form questions, answers, and negations.
        -   **IF THE RULE IS NOT A VERB TENSE**, you must OMIT the \`tenseDetails\` field and instead provide a single, clear example in the \`generalExample\` field, extracting a real sentence from the lesson content that demonstrates the rule.

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
