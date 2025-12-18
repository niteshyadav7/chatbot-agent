import app from "./src/app.js";

import "./src/config/gemini.js";
import { askQuestion } from "./src/rag/askQuestion.js";

const PORT = process.env.PORT || 5000;
const runTest = async () => {
  const answer = await askQuestion("What is embeddings?");
  console.log("Answer:", answer);
};
runTest();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
