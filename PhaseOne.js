// Build a minimal but correct RAG pipeline that:
// 1.Understands how LLMs + embeddings work together
// 2.Answers questions about a given context
// 3.Never hallucinates, and says "I don't know" when it doesn't know the answer.

// Data flow: Knowledge Base -> Chunking -> Embeddings -> Vector DB -> User Query -> Embeddings(questions) -> Similarity Search -> Retrieved Chunks -> LLM Prompting -> Answer

// Gemini-2.5 is for TALKING.
// text-embedding-004 is for VECTORS.

// We will use Gemini-2.5 for LLM and text-embedding-004 for embeddings.

//An embedding means:
// Convert text → numbers (array of numbers)
// so a computer can compare meanings of different texts.

// LLM means:
// Convert text → text
// so a computer can generate human-like text based on input.

// Step 1: Ingest Knowledge Base with embeddings into Vector DB (ChromaDB)
// Step 2: Ask a question, embed it, retrieve relevant chunks from Vector DB
// Step 3: Prompt Gemini-2.5 with retrieved chunks to get a grounded answer
// Key Concepts:
// RAG: Retrieval Augmented Generation, combining LLMs with external knowledge.
// Vector DB: Stores embeddings for similarity search (e.g., ChromaDB).
// Chunking: Breaking text into smaller pieces for better retrieval.
// Similarity Search: Finding closest embeddings to a query embedding.
// Grounded Answers: Responses based strictly on retrieved context to avoid hallucination.
// Usage: Foundation for building reliable AI assistants using LLMs and vector databases.
// Install ChromaDB :pip install chromadb
// chroma run --host localhost --port 8000

// step 0: Gemini Client Configuration
/**
 * import {GoogleGenAI} from "@google/genai"
 * export const geminiClient = new GoogleGenAI({
 *   apiKey: process.env.GOOGLE_API_KEY,
 * });
 *
 * Key Concepts:
 * GoogleGenAI: Client to interact with Google's Gemini models.
 * API Key: Authentication token for accessing Google GenAI services.
 * Usage: Essential for generating content and embeddings using Gemini models.
 */

// step 1: Knowledege Source
/**
 * const knowledgeBase = [
 *   "RAG stands for Retrieval Augmented Generation.",
 *   "Embeddings convert text into numerical vectors.",
 *  "Vector databases store embeddings for similarity search.",
 * ];
 *
 * Key Concepts:
 * this is your knowledge corpus
 * In real apps ->PDFs, Docs, Websites, etc.
 * Usage: Source of information for RAG systems to retrieve relevant data.
 */

// Step 2: Embedding function (documents side)
/**
 * export async function embedText(text) {
 *   const response = await geminiClient.models.embedContent({
 *     model: "gemini-embedding-001",
 *    contents: text,
 *    taskType: "RETRIEVAL_DOCUMENT", // best for RAG
 *   outputDimensionality: 768, // recommended
 * });
 * return response.embeddings[0].values;
 * }
 * // Key Concepts:
 * // Embeddings: Convert text to numerical vectors for meaning comparison.
 * // LLMs: Generate human-like text based on input.
 * // Gemini-embedding-001: Specialized model for creating text embeddings.
 * // Task Type: Defines the purpose of the embedding (e.g., retrieval).
 * // Output Dimensionality: Size of the embedding vector, affecting detail level.
 * // Usage: Essential for RAG systems to link user queries with relevant documents.
 */

// Step 3: Vector DB setup (ChromaDB)
/**
 * export const chroma =new ChromaClient({
 * path: "http://localhost:8000", // default local chroma
 * });
 * export async function getCollection() {
 * return await chroma.getOrCreateCollection({
 * name: "phase1-knowledge",
 * metadata: {
 * embeddingModel: "gemini-embedding-001",
 * dimension: 768,
 * distance: "cosine",
 * },
 * });
 * }
 *
 * // Key Concepts:
 * persistent semantic storage
 * Same collection reused for ingestion & retrieval
 * Embedding model & dimension must match those used during embedding generation
 * Usage: Essential for storing and retrieving vector embeddings in RAG systems.
 */

// Step 4: Ingestion Pipeline
/**
 * async function ingestKnowledge() {
 * const collection = await getCollection();
 * // 1️⃣ Generate embeddings in batch (faster & cheaper)
 * const embeddings = await Promise.all(
 * knowledgeBase.map((text) => embedText(text, "RETRIEVAL_DOCUMENT"))
 * );
 * // 2️⃣ Add all data in ONE call (best practice)
 * await collection.add({
 * ids: knowledgeBase.map((_, i) => `doc-${i}`),
 *  documents: knowledgeBase,
 * embeddings,
 * metadatas: knowledgeBase.map((_, i) => ({
 * source: "phase1",
 * chunk: i,
 * })),
 * });
 * 
 * console.log("✅ Knowledge ingested successfully");
 * }
 *
 * // Key Concepts:
 * Batch Embedding Generation: Efficiently creating embeddings for multiple texts.
 * Single Call Data Addition: Best practice for adding multiple entries to a collection.
 * Application Initialization: Setting up the app and ingesting knowledge on startup.
 * Usage: Foundational setup for RAG applications using vector databases and embeddings.
 * After this : ❌ documents are NEVER re-embedded again 
 * Documents are embedded at write-time, questions are embedded at read-time.
 */

// Step 5: User Question Entry

/**
 * export async function askQuestion(question) {
 * const collection = await getCollection();
 * // 1. Embed user question
 * const queryEmbedding = await embedText(question);
 * // 2. Retrieve relevant chunks 
 * const results = await collection.query({
 * queryEmbeddings: [queryEmbedding],
 * nResults: 2,
 * });
 * const context = results.documents.flat().join("\n");
 * if (!context) {
 * return "I don't have enough information to answer that.";
 * }
 * // 3. Strict grounded prompt
 * const prompt = `
 * You are a strict AI assistant. 
 * Answer ONLY using the context below.
 * If the answer is not in the context, say "I don't know".

 * Context:
 * ${context}
 * Question:
 * ${question}
 * `; 
 * // 4. Generate grounded answer
 * const response = await geminiClient.models.generateContent({
 * model: "gemini-2.5-flash",
 * contents: prompt,
 * });
 * return response.text;
 * }
 *
 * Key Concepts: 
 * Similarity Search: Finding closest embeddings to a query embedding.
 * Grounded Answers: Responses based strictly on retrieved context to avoid hallucination.
 * Usage: Enables users to ask questions and receive accurate answers based on stored knowledge.  
 */

// step 6: Query Embedding 
/**
 * const queryEmbedding = await embedText(question);
 *
 * Key Concepts:
 * Embeddings: Convert user questions into numerical vectors.
 * Usage: Facilitates similarity search in the vector database to find relevant documents.  
 */

// step 7: Similarity Search in Vector DB
/**
 * const results = await collection.query({
 * queryEmbeddings: [queryEmbedding],
 * nResults: 2,
 * });
 * Key Concepts:
 * Query Method: Searches the vector database using the query embedding.
 * nResults: Number of top similar documents to retrieve.
 * Usage: Critical for fetching relevant context to answer user queries in RAG systems.  
 */

// step 8: Grounded LLM Prompting
/**
 * const prompt = `
 * You are a strict AI assistant.
 * Answer ONLY using the context below.
 * If the answer is not in the context, say "I don't know". 
 * Context:
 * ${context}
 * Question:
 * ${question}
 * `;
 *  // Key Concepts:
 * Prompt Engineering: Crafting prompts to ensure LLMs provide accurate and relevant answers.
 * Strict Grounding: Instructing the LLM to rely solely on provided context.
 * Usage: Ensures that the LLM's responses are based on verified information, reducing hallucinations.  
 */ 

// step 9: Generate Answer with LLM
/**
 * const response = await geminiClient.models.generateContent({ 
 * model: "gemini-2.5-flash",
 * contents: prompt,
 * });  
 * return response.text;
 *
 * Key Concepts:    
 * Content Generation: Using LLMs to produce human-like text based on input prompts.
 * Response Handling: Extracting and returning the generated answer from the LLM's output.
 * Usage: Final step in the RAG pipeline to deliver answers to user queries.  
 */ 

// Final Note:
// This RAG pipeline ensures that the AI assistant provides accurate, context-based answers by effectively combining embeddings, vector databases, and LLMs.
// Remember to run ChromaDB locally before executing the application:
// Install ChromaDB :pip install chromadb
// chroma run --host localhost --port 8000
// Then run the server:
// node server.js
// Now, you can test the RAG pipeline by asking questions based on the ingested knowledge base. 
// Build a minimal but correct RAG pipeline that:
// 1.Understands how LLMs + embeddings work together
// 2.Answers questions about a given context
// 3.Never hallucinates, and says "I don't know" when it doesn't know the answer.