import { ChromaClient } from "chromadb";

export const chroma = new ChromaClient({
  path: "http://localhost:8000", // default local chroma
});

export async function getCollection() {
  return await chroma.getOrCreateCollection({
    name: "phase1-knowledge",
    metadata: {
      description: "Phase 1 RAG knowledge base",
      embeddingModel: "gemini-embedding-001",
      dimension: 768,
      distance: "cosine",
    },
  });
}
// Key Concepts:
// ChromaClient: Interface to interact with Chroma vector database.
// getOrCreateCollection: Retrieves or creates a collection in Chroma.
// Collection Metadata: Describes the collection's purpose and embedding details.
// Embedding Model: Specifies the model used for generating embeddings.
// Dimension: Size of the embedding vectors.
// Distance Metric: Method for measuring similarity between vectors (e.g., cosine).
// Usage: Essential for storing and retrieving vector embeddings in RAG systems.
