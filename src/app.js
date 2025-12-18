import express from "express";
import dotenv from "dotenv";
import { getCollection } from "./vector/chromaClient.js";
import { embedText } from "./embedding/embedText.js";

dotenv.config();

const app = express();

const knowledgeBase = [
  "RAG stands for Retrieval Augmented Generation.",
  "Embeddings convert text into numerical vectors.",
  "Vector databases store embeddings for similarity search.",
];

async function ingestKnowledge() {
  const collection = await getCollection();

  // 1️⃣ Generate embeddings in batch (faster & cheaper)
  const embeddings = await Promise.all(
    knowledgeBase.map((text) => embedText(text, "RETRIEVAL_DOCUMENT"))
  );

  // 2️⃣ Add all data in ONE call (best practice)
  await collection.add({
    ids: knowledgeBase.map((_, i) => `doc-${i}`),
    documents: knowledgeBase,
    embeddings,
    metadatas: knowledgeBase.map((_, i) => ({
      source: "phase1",
      chunk: i,
    })),
  });

  console.log("✅ Knowledge ingested successfully");
}

await ingestKnowledge();

export default app;

// Key Concepts:
// Express.js: Web framework for Node.js applications.
// dotenv: Loads environment variables from a .env file.
// Knowledge Base: Collection of documents for RAG systems.
// Ingest Knowledge: Process of adding documents and their embeddings to the vector DB.
// Batch Embedding Generation: Efficiently creating embeddings for multiple texts.
// Single Call Data Addition: Best practice for adding multiple entries to a collection.
// Application Initialization: Setting up the app and ingesting knowledge on startup.
// Usage: Foundational setup for RAG applications using vector databases and embeddings.
// Install ChromaDB :pip install chromadb
// chroma run --host localhost --port 8000
