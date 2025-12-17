import { geminiClient } from "../config/gemini.js";

export async function embedText(text) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    taskType: "RETRIEVAL_DOCUMENT", // best for RAG
    outputDimensionality: 768, // recommended
  });

  return response.embeddings[0].values;
}


// Key Concepts:
// Embeddings: Convert text to numerical vectors for meaning comparison.
// LLMs: Generate human-like text based on input.
// Gemini-embedding-001: Specialized model for creating text embeddings.
// Task Type: Defines the purpose of the embedding (e.g., retrieval).
// Output Dimensionality: Size of the embedding vector, affecting detail level.
// Usage: Essential for RAG systems to link user queries with relevant documents.
