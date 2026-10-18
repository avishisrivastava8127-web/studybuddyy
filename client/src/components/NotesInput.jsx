import { useRef, useState } from "react";
import { extractText } from "unpdf";
import { SAMPLE_NOTES } from "../sampleNotes.js";
import { MAX_NOTES, MIN_NOTES } from "../constants.js";

const TEMPLATES = {
  outline: `# Subject: [Enter Subject Name]
## Chapter / Topic: [Enter Topic]

### 1. Key Concepts
- Concept A: [Explanation]
- Concept B: [Explanation]

### 2. Must-Remember Definitions
- Term 1: [Definition]
- Term 2: [Definition]

### 3. Exam Focus / Summary
- Important points to remember for the exam...`,
  formula: `# Subject: [Physics / Math / Chemistry / CS]
## Formulas & Core Theorems

1. [Formula / Law Name]:
   - Formula: [e.g. E = mc²]
   - Variables: [Definition of each symbol]
   - Application: [When to use]

2. [Formula / Law Name 2]:
   - Formula: [e.g. F = ma]
   - Variables: [...]`,
};

export default function NotesInput({ notes, setNotes }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState("");
  const [feedback, setFeedback] = useState("");

  function showFeedback(msg) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 4500);
  }

  async function handlePdfExtract(file) {
    setIsExtractingPdf(true);
    showFeedback(`Reading PDF: "${file.name}"...`);
    try {
      const buffer = await file.arrayBuffer();
      const result = await extractText(buffer, { mergePages: true });
      const rawText = (typeof result.text === "string" ? result.text : (result.text || []).join("\n\n")).trim();

      if (!rawText) {
        showFeedback("This PDF appears to contain scanned images or no selectable text.");
        return;
      }

      setNotes(rawText);
      const pageCount = result.totalPages || 1;
      setLoadedFileName(`${file.name} (${pageCount} page${pageCount > 1 ? "s" : ""}, ${Math.round(file.size / 1024) || 1} KB)`);
      showFeedback(`Extracted text from ${pageCount} page${pageCount > 1 ? "s" : ""} of "${file.name}"!`);
    } catch (err) {
      console.error("PDF parse error:", err);
      showFeedback(`Could not parse PDF: ${err?.message || "Invalid or encrypted PDF"}`);
    } finally {
      setIsExtractingPdf(false);
    }
  }

  function handleFileRead(file) {
    if (!file) return;

    // Check for PDF
    if (file.name.match(/\.pdf$/i) || file.type === "application/pdf") {
      handlePdfExtract(file);
      return;
    }

    // Check for text/markdown
    if (!file.name.match(/\.(txt|md|text|json|csv)$/i)) {
      showFeedback("Please select a PDF or text file (.pdf, .txt, .md).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result || "";
      setNotes(content);
      setLoadedFileName(`${file.name} (${Math.round(file.size / 1024) || 1} KB)`);
      showFeedback(`Loaded "${file.name}"`);
    };
    reader.onerror = () => {
      showFeedback("Failed to read the file.");
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileRead(file);
    } else {
      const text = e.dataTransfer.getData("text");
      if (text) {
        setNotes(text);
        setLoadedFileName("");
        showFeedback("Pasted dropped text");
      }
    }
  }

  async function handlePasteClipboard() {
    try {
      if (!navigator.clipboard?.readText) {
        showFeedback("Clipboard access not supported by browser. Use Ctrl+V.");
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showFeedback("Clipboard is empty.");
        return;
      }
      setNotes(text);
      setLoadedFileName("");
      showFeedback("Pasted from clipboard!");
    } catch {
      showFeedback("Clipboard permission denied. Please paste using Ctrl+V.");
    }
  }

  function handleClear() {
    setNotes("");
    setLoadedFileName("");
  }

  function applyTemplate(type) {
    if (TEMPLATES[type]) {
      setNotes(TEMPLATES[type]);
      setLoadedFileName("");
      showFeedback("Applied note template!");
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <div>
          <h2>Your notes</h2>
          <span className="sub-title">Type, paste, upload PDF / text notes, or start with a template</span>
        </div>

        <div className="action-toolbar">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.txt,.md,.text"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />

          <button
            type="button"
            className="ghost"
            title="Upload PDF or text file (.pdf, .txt, .md)"
            disabled={isExtractingPdf}
            onClick={() => fileInputRef.current?.click()}
          >
            {isExtractingPdf ? "⏳ Extracting..." : "📁 Upload PDF / File"}
          </button>

          <button
            type="button"
            className="ghost"
            title="Paste from clipboard"
            disabled={isExtractingPdf}
            onClick={handlePasteClipboard}
          >
            📋 Paste
          </button>

          <button
            type="button"
            className="ghost"
            disabled={isExtractingPdf}
            onClick={() => {
              setNotes(SAMPLE_NOTES);
              setLoadedFileName("DBMS Normalization Sample");
            }}
          >
            Sample
          </button>

          {notes && (
            <button
              type="button"
              className="ghost danger-text"
              title="Clear all notes"
              disabled={isExtractingPdf}
              onClick={handleClear}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Templates / Starters */}
      <div className="templates-bar">
        <span className="templates-label">Templates:</span>
        <button
          type="button"
          className="pill-btn"
          disabled={isExtractingPdf}
          onClick={() => applyTemplate("outline")}
        >
          📝 Study Outline
        </button>
        <button
          type="button"
          className="pill-btn"
          disabled={isExtractingPdf}
          onClick={() => applyTemplate("formula")}
        >
          📐 Formulas / Laws
        </button>
      </div>

      {/* Loaded file indicator, feedback banner, or PDF progress */}
      {(loadedFileName || feedback || isExtractingPdf) && (
        <div className={`file-info-badge ${isExtractingPdf ? "extracting" : ""}`}>
          {isExtractingPdf ? (
            <span className="feedback-msg extracting-text">
              <span className="spinner">⏳</span> Extracting text from PDF pages...
            </span>
          ) : feedback ? (
            <span className="feedback-msg">ℹ {feedback}</span>
          ) : (
            <span className="file-name-label">
              📄 Loaded: <strong>{loadedFileName}</strong>
            </span>
          )}
          {loadedFileName && !isExtractingPdf && (
            <button
              type="button"
              className="badge-close-btn"
              onClick={() => setLoadedFileName("")}
              title="Dismiss file tag"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Drag & Drop Container around Textarea */}
      <div
        className={`textarea-wrapper ${isDragging ? "drag-active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <textarea
          id="notes"
          value={notes}
          disabled={isExtractingPdf}
          onChange={(e) => {
            setNotes(e.target.value);
            if (loadedFileName) setLoadedFileName("");
          }}
          placeholder={
            isExtractingPdf
              ? "Extracting PDF text..."
              : "Type or paste lecture notes here, or drag & drop a PDF / text file (.pdf, .txt, .md)..."
          }
          rows={17}
        />
        {isDragging && (
          <div className="drag-overlay">
            <span>📥 Drop your PDF or notes file here (.pdf, .txt, .md)</span>
          </div>
        )}
      </div>

      <div className="notes-footer">
        <p className="hint">
          {notes.trim().length > 0 && notes.trim().length < MIN_NOTES
            ? `⚠️ ${MIN_NOTES - notes.trim().length} more characters needed to summarise`
            : `${notes.length.toLocaleString()} / ${MAX_NOTES.toLocaleString()} characters`}
        </p>
      </div>
    </div>
  );
}
