const fs = require('fs/promises');
const path = require('path');

// 1. Clean Text Function
// Flattens text into a single line per page (Great for RAG embeddings)
function cleanText(text) {
    if (!text) return "";
    return text
        .replace(/(\r\n|\n|\r)/gm, " ")    // Replace newlines with space
        .replace(/\s+/g, " ")             // Collapse multiple spaces
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove weird binary characters
        .trim();
}

async function processPdfForRAG(filePath) {
    try {
        // 2. Dynamic Import (Crucial for CommonJS)
        // We import 'unpdf' here because we cannot use 'require()' for it.
        const { extractText, getDocumentProxy } = await import('unpdf');

        const buffer = await fs.readFile(filePath);
        
        // 3. Load PDF
        // unpdf needs a Uint8Array, not a Node Buffer.
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        
        // 4. Extract Text
        // mergePages: false gives us an Array of strings (one per page)
        const { totalPages, text } = await extractText(pdf, { mergePages: false });

        // 5. Map to Structured Object
        const pages = text.map((pageContent, index) => ({
            pageNumber: index + 1,
            content: cleanText(pageContent),
            source: path.basename(filePath)
        }));

        return {
            totalPages,
            pages,
            // Join pages with double newlines to denote page breaks in the text file
            fullText: pages.map(p => `[PAGE ${p.pageNumber}] ${p.content}`).join("\n\n")
        };

    } catch (error) {
        console.error("Extraction failed:", error.message);
        throw error;
    }
}

async function main() {
    // Uses absolute paths to prevent "File not found" errors
    const inputFilename = path.join(__dirname, 'inputs', 'sample.pdf');
    const outputFilename = path.join(__dirname, 'outputs', 'output.txt');
    
    console.log(`🚀 Starting extraction for: ${inputFilename}`);

    try {
        // Ensure output folder exists
        await fs.mkdir(path.dirname(outputFilename), { recursive: true });

        const doc = await processPdfForRAG(inputFilename);
        
        // Write to file
        await fs.writeFile(outputFilename, doc.fullText, 'utf8');
        
        console.log("✅ Extraction Success!");
        console.log(`📄 Total Pages: ${doc.totalPages}`);
        console.log(`💾 Saved to: ${outputFilename}`);
        
        if (doc.pages.length > 0) {
            console.log(`\n📖 Page 1 Preview:\n${doc.pages[0].content.substring(0, 150)}...`);
        }

    } catch (err) {
        console.error("❌ Critical Error:", err.message);
    }
}

main();
