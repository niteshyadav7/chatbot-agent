import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEYX = "AIzaSyCePvrWlu2w0Cwhqbfz - y_OqboVxEdDX9w";
const apiKey = process.env.GEMINI_API_KEY;

export const geminiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEYX });
