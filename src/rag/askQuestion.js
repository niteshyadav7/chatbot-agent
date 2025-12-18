import { geminiClient } from "../config/gemini.js";
import { embedText } from "../embedding/embedText.js";
import { getCollection } from "../vector/chromaClient.js";

export async function askQuestion(question) {
  const collection = await getCollection();

  // 1. Embed user question
  const queryEmbedding = await embedText(question);

  // 2. Retrieve relevant chunks
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 2,
  });

  const context = results.documents.flat().join("\n");

  if (!context) {
    return "I don't have enough information to answer that.";
  }

  // 3. Strict grounded prompt
  const prompt = `
You are a strict AI assistant.
Answer ONLY using the context below.
If the answer is not in the context, say "I don't know".

Context:
${context}

Question:
${question}
`;

  // 4. Generate grounded answer
  const response = await geminiClient.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}
