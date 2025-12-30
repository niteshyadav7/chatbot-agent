const fs = require("fs").promises;
const path = require("path");
const Tesseract = require("tesseract.js");

/**
 * CONFIGURATION
 */
const CONFIG = {
  inputFile: process.argv[2] || path.join(__dirname, "inputs", "sample.png"),
  outputFile: process.argv[3] || path.join(__dirname, "outputs", "ocr_output.txt"),
  // Language code (eng = English, fra = French, spa = Spanish, etc.)
  language: "eng", 
};

/**
 * PURE FUNCTION: Cleans OCR artifacts
 * OCR often confuses similar looking characters (e.g., '1' vs 'l', '0' vs 'O').
 */
function cleanOcrText(rawText) {
  if (!rawText) return "";

  return rawText
    // 1. Normalize Unicode
    .normalize("NFC")

    // 2. Fix common OCR glitch patterns
    // Example: "fi le" -> "file" (OCR sometimes inserts spaces in tight kerning)
    .replace(/([a-z])\s([a-z])/g, "$1$2") 
    
    // 3. Remove "pipe" artifacts often found in table scans
    .replace(/\|/g, " ") 

    // 4. Standardize whitespace (OCR is notoriously bad with tabs)
    .replace(/[ \t]+/g, " ")

    // 5. Paragraph management (Max 2 newlines)
    .replace(/\n\s*\n/g, "\n\n")

    .trim();
}

/**
 * MAIN EXECUTION
 */
async function run() {
  console.time("OCR Processing Time");

  try {
    // A. Validate Input
    try {
      await fs.access(CONFIG.inputFile);
    } catch {
      throw new Error(`Input file not found at: ${CONFIG.inputFile}`);
    }

    console.log(`📷 Reading Image: ${CONFIG.inputFile}`);
    const imageBuffer = await fs.readFile(CONFIG.inputFile);

    // B. Initialize Worker
    console.log("⚙️  Initializing Tesseract Engine...");
    const worker = await Tesseract.createWorker(CONFIG.language);
    
    // C. Recognize Text
    console.log("🔄 Extracting Text (This may take a moment)...");
    const { data: { text } } = await worker.recognize(imageBuffer);
    
    // Terminate worker to free up memory
    await worker.terminate();

    // D. Clean Data
    const cleanedText = cleanOcrText(text);

    // E. Write Output
    const outputDir = path.dirname(CONFIG.outputFile);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(CONFIG.outputFile, cleanedText, "utf-8");

    console.log(`✅ Success! Extracted ${cleanedText.length} chars.`);
    console.log(`Output: file:///${CONFIG.outputFile.replace(/\\/g, "/")}`);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  } finally {
    console.timeEnd("OCR Processing Time");
  }
}

run();
