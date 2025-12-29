const fs = require("fs").promises;
const path = require("path");
const cheerio = require("cheerio");

async function parseHtml(filePath) {
  // 1. Read File
  const html = await fs.readFile(filePath, "utf-8");
  
  // 2. Load into Cheerio
  const $ = cheerio.load(html);

  // 3. NOISE REMOVAL
  // Remove non-content elements that confuse RAG (ads, scripts, menus)
  $("script, style, nav, footer, header, aside, iframe, noscript, svg").remove();

  // 4. PRESERVE STRUCTURE (Crucial for RAG)
  // Cheerio.text() joins text nodes directly. We must manually inject newlines
  // for block elements so "<h1>Title</h1><p>Body</p>" doesn't become "TitleBody".
  $('br').replaceWith('\n');
  $('p, div, h1, h2, h3, h4, h5, h6, li, tr').after('\n');

  // 5. Extract Text & Clean Whitespace
  return $("body")
    .text()
    .replace(/[ \t]+/g, " ")       // Collapse spaces/tabs to single space
    .replace(/\n\s*\n/g, "\n\n")   // Max 2 newlines
    .trim();
}

(async () => {
  const input = path.join(__dirname, "inputs", "sample.html");
  const output = path.join(__dirname, "outputs", "html_output.txt");

  try {
    // Ensure output dir exists
    await fs.mkdir(path.dirname(output), { recursive: true });

    console.log(`reading: ${input}`);
    const text = await parseHtml(input);
    
    await fs.writeFile(output, text, "utf-8");
    console.log("✅ HTML parsed → outputs/html_output.txt");
    
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
})();
