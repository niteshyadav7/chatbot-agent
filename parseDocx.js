const fs = require("fs").promises;
const path = require("path");
const mammoth = require("mammoth");

/**
 * CONFIGURATION
 */
const CONFIG = {
  inputFile: process.argv[2] || path.join(__dirname, "inputs", "sample.docx"),
  outputFile: process.argv[3] || path.join(__dirname, "outputs", "docx_output.txt"),
};

/**
 * PURE FUNCTION: Cleans Word Doc artifacts.
 */
function cleanDocxText(rawText) {
  if (!rawText) return "";

  return rawText
    // 1. Normalize Unicode (Fixes weird accents)
    .normalize("NFC")

    // 2. Replace "Smart Quotes" (Curly quotes) with straight quotes
    // RAG models often prefer standard ASCII quotes.
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')

    // 3. Remove non-printable control characters
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")

    // 4. Standardize whitespace
    // (Mammoth usually handles newlines well, but we ensure max 2 newlines)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * MAIN EXECUTION
 */
async function run() {
  console.time("DOCX Processing Time");

  try {
    // A. Validate Input
    try {
      await fs.access(CONFIG.inputFile);
    } catch {
      throw new Error(`Input file not found at: ${CONFIG.inputFile}`);
    }

    console.log(`📖 Reading DOCX: ${CONFIG.inputFile}`);
    const buffer = await fs.readFile(CONFIG.inputFile);

    // B. Parse DOCX
    // extractRawText is perfect for RAG. It ignores images/styles and just grabs content.
    const result = await mammoth.extractRawText({ buffer: buffer });
    
    // Mammoth returns 'messages' if there were warnings (e.g., image skipped)
    if (result.messages.length > 0) {
        console.log("⚠️ Parser Warnings:", result.messages);
    }

    // C. Clean Data
    const cleanedText = cleanDocxText(result.value);

    // D. Ensure Output Directory Exists
    const outputDir = path.dirname(CONFIG.outputFile);
    await fs.mkdir(outputDir, { recursive: true });

    // E. Write File
    await fs.writeFile(CONFIG.outputFile, cleanedText, "utf-8");

    console.log(`✅ Success! Extracted ${cleanedText.length} characters.`);
    console.log(`Output: file:///${CONFIG.outputFile.replace(/\\/g, "/")}`);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  } finally {
    console.timeEnd("DOCX Processing Time");
  }
}

run();
