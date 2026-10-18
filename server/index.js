// Must be first: loads .env into process.env before anything reads it.
import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";

import { askAI, friendlyError, streamAI } from "./ai.js";
import {
  SYSTEM_PROMPT,
  summaryPrompt,
  quizPrompt,
  QUIZ_SCHEMA,
  tutorSystemPrompt,
} from "./prompts.js";
import { loadHistory, saveToHistory } from "./history.js";

const app = express();
const PORT = process.env.PORT || 3001;
const MAX_NOTES = 30000;

// Middleware: parse JSON request bodies into req.body.
// Without this line, req.body is undefined on every POST.
app.use(express.json({ limit: "1mb" }));

// Returns clean notes, or sends a 400 error and returns null.
function readNotes(req, res) {
  const notes = String(req.body.notes || "").trim();
  if (notes.length < 50) {
    res.status(400).json({ error: "Paste a few lines of notes first (at least 50 characters)." });
    return null;
  }
  if (notes.length > MAX_NOTES) {
    res.status(400).json({ error: `Notes are too long. Keep them under ${MAX_NOTES} characters.` });
    return null;
  }
  return notes;
}

// Keep only valid chat turns, the last 20, starting with a user turn.
function cleanMessages(list) {
  const messages = (Array.isArray(list) ? list : [])
    .filter((m) => ["user", "assistant"].includes(m?.role))
    .filter((m) => typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content })) // drop extra keys
    .slice(-20); // cap cost + context
  while (messages.length && messages[0].role !== "user") messages.shift();
  return messages;
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/summary", async (req, res) => {
  const notes = readNotes(req, res);
  if (!notes) return; // readNotes already sent the 400

  try {
    const summary = await askAI({
      system: SYSTEM_PROMPT,
      prompt: summaryPrompt(notes),
    });
    await saveToHistory({ notes, summary });
    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: friendlyError(err) });
  }
});

app.post("/api/quiz", async (req, res) => {
  const notes = readNotes(req, res);
  if (!notes) return;

  // Never interpolate raw user input into a prompt without checking it.
  // Anything not in the allow-list becomes "medium".
  const difficulty = ["easy", "medium", "hard"].includes(req.body.difficulty)
    ? req.body.difficulty
    : "medium";

  try {
    const json = await askAI({
      system: SYSTEM_PROMPT,
      prompt: quizPrompt(notes, difficulty),
      schema: QUIZ_SCHEMA,
    });
    res.json(JSON.parse(json));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: friendlyError(err) });
  }
});

app.post("/api/chat", async (req, res) => {
  const notes = readNotes(req, res);
  if (!notes) return;

  const messages = cleanMessages(req.body.messages);
  if (messages.at(-1)?.role !== "user") {
    return res.status(400).json({ error: "Type a question first." });
  }

  // Send the answer as plain text chunks, as soon as each chunk arrives.
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");
  try {
    await streamAI({
      system: tutorSystemPrompt(notes),
      messages,
      onText: (text) => res.write(text), // push each chunk down the open socket
    });
  } catch (err) {
    console.error(err);
    res.write(`\n\n⚠ ${friendlyError(err)}`); // headers are already sent
  }
  res.end(); // closes the response
});

app.get("/api/history", async (req, res) => {
  res.json(await loadHistory());
});

// In production, Express also serves the built React app (client/dist).
const clientDist = fileURLToPath(new URL("../client/dist", import.meta.url));

app.use(express.static(clientDist)); // real files: JS, CSS, images

// Anything else that isn't an API route gets index.html,
// so client-side routing and page refreshes work.
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api")) return next();
  res.sendFile("index.html", { root: clientDist }, (err) => err && next());
});

app.listen(PORT, () => {
  console.log(`✅ StudyBuddy API running at http://localhost:${PORT}`);
});
