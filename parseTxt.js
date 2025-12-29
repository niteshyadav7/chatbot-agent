

const fs = require("fs/promises");
const path = require("path");

/**
 * CONFIGURATION
 * defaults to inputs/text.txt and outputs/txt_output.txt
 * but can be overridden via command line arguments.
 */
const CONFIG = {
  inputFile: process.argv[2] || path.join(__dirname, "inputs", "text.txt"),
  outputFile: process.argv[3] || path.join(__dirname, "outputs", "txt_output.txt"),
};

/**
 * PURE FUNCTION: Cleans and normalizes text.
 * @param {string} rawText 
 * @returns {string}
 */
function cleanText(rawText) {
  if (!rawText) return "";

  return rawText
    // 1. Unicode Normalization (NFC): Standardizes accents and characters for RAG
    .normalize("NFC")
    
    // 2. Standardize Line Breaks (Windows/Mac to Unix \n)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")

    // 3. Remove non-printable control characters (excluding newlines/tabs)
    // This removes weird artifacts often found in OCR or binary copy-pastes
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")

    // 4. Collapse multiple tabs/spaces into a single space
    .replace(/[ \t]+/g, " ")

    // 5. Fix common "broken" whitespace logic (3+ newlines become 2)
    .replace(/\n{3,}/g, "\n\n")

    // 6. Trim edges
    .trim();
}

/**
 * MAIN EXECUTION
 */
async function run() {
  console.time("Processing Time");

  try {
    // A. Validate Input
    try {
      await fs.access(CONFIG.inputFile);
    } catch {
      throw new Error(`Input file not found at: ${CONFIG.inputFile}`);
    }

    // B. Read File
    // Note: For files >500MB, use fs.createReadStream instead.
    console.log(`📖 Reading: ${CONFIG.inputFile}`);
    const rawData = await fs.readFile(CONFIG.inputFile, "utf-8");

    // C. Process Data
    const cleanedData = cleanText(rawData);

    // D. Ensure Output Directory Exists
    const outputDir = path.dirname(CONFIG.outputFile);
    await fs.mkdir(outputDir, { recursive: true });

    // E. Write File
    await fs.writeFile(CONFIG.outputFile, cleanedData, "utf-8");

    console.log(`✅ Success! Cleaned ${rawData.length} chars -> ${cleanedData.length} chars.`);
    console.log(`file:///${CONFIG.outputFile.replace(/\\/g, "/")}`);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1); // Exit with failure code for CI/CD pipelines
  } finally {
    console.timeEnd("Processing Time");
  }
}

run();
