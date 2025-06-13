/**
 * Google Gemini AI configuration module
 * Initializes the Gemini AI client for movie recommendations
 * @file gemini.js
 * @module config/gemini
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

/**
 * Google Generative AI client instance
 * Configured with API key from environment variables
 * @constant {GoogleGenerativeAI}
 */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default genAI; 