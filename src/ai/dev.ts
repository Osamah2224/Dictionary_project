'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/smart-dictionary.ts';
import '@/ai/flows/smart-translation.ts';
import '@/ai/flows/smart-teacher.ts';
import '@/ai/flows/extract-text.ts';
