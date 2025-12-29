const fs = require("fs").promises;
const path = require("path");
const { marked } = require("marked");
const cheerio = require("cheerio");

/**
 * CONFIGURATION
 */
const CONFIG = {
  inputFile: process.argv[2] || path.join(__dirname, "inputs", "sample.md"),
  outputFile: process.argv[3] || path.join(__dirname, "outputs", "md_output.txt"),
};

/**
 * PURE FUNCTION: Converts MD to clean text
 */
async function parseMarkdown(rawMd) {
  if (!rawMd) return "";

  // 1. Convert Markdown to HTML
  // This handles structure (headers, lists, bolding) better than regex
  const html = await marked.parse(rawMd);

  // 2. Load into Cheerio
  const $ = cheerio.load(html);

  // 3. PRESERVE STRUCTURE
  // Inject newlines before block elements so they don't merge.
  // Example: <h1>Title</h1><p>Body</p> -> "Title\nBody" instead of "TitleBody"
  $('br').replaceWith('\n');
  $('h1, h2, h3, h4, h5, h6, p, ul, ol, li, blockquote, pre').after('\n');

  // 4. Extract Text & Clean
  return $('body')
    .text()
    .normalize("NFC")              // Fix unicode
    .replace(/[ \t]+/g, " ")       // Collapse spaces/tabs
    .replace(/\n\s*\n/g, "\n\n")   // Max 2 newlines (Paragraph breaks)
    .trim();
}

/**
 * MAIN EXECUTION
 */
async function run() {
  console.time("MD Processing Time");

  try {
    // A. Validate Input
    try {
      await fs.access(CONFIG.inputFile);
    } catch {
      throw new Error(`Input file not found at: ${CONFIG.inputFile}`);
    }

    console.log(`📖 Reading Markdown: ${CONFIG.inputFile}`);
    const rawMd = await fs.readFile(CONFIG.inputFile, "utf-8");

    // B. Parse
    const cleanedText = await parseMarkdown(rawMd);

    // C. Write Output
    const outputDir = path.dirname(CONFIG.outputFile);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(CONFIG.outputFile, cleanedText, "utf-8");

    console.log(`✅ Success! Extracted ${cleanedText.length} chars.`);
    console.log(`Output: file:///${CONFIG.outputFile.replace(/\\/g, "/")}`);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    process.exit(1);
  } finally {
    console.timeEnd("MD Processing Time");
  }
}

run();
