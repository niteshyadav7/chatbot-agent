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
