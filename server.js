import app from "./src/app.js";

import "./src/config/gemini.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
