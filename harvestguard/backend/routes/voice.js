/**
 * B4: Bangla Voice/Touchless Interface Route
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1/models';

function buildPrompt(text, batches = []) {
  const ctx = batches.length > 0
    ? `কৃষকের ${batches.length}টি ফসল ব্যাচ আছে: ${batches.map(b => `${b.cropType || 'অজানা'} (${b.estimatedWeightKg || 0}কেজি)`).join(', ')}`
    : 'কৃষকের কোন সক্রিয় ব্যাচ নেই';

  return `আপনি বাংলাদেশের কৃষকদের জন্য একজন বিশেষজ্ঞ কৃষি সহকারী। নিচের প্রশ্নের উত্তর সম্পূর্ণ বাংলায় দিন।

কৃষকের প্রশ্ন: ${text}
প্রেক্ষাপট: ${ctx}
অবস্থান: বাংলাদেশ

নির্দেশনা:
- সম্পূর্ণ বাংলায় উত্তর দিন
- ব্যবহারিক ও সংক্ষিপ্ত (১৫০ শব্দের মধ্যে)
- বাংলাদেশের কৃষি পরিবেশ অনুযায়ী পরামর্শ দিন`;
}

/**
 * POST /api/voice/chat/stream  — Server-Sent Events streaming
 */
router.post('/chat/stream', async (req, res) => {
  const { text, lang, batches } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  try {
    const response = await axios.post(
      `${GEMINI_BASE}/gemini-2.0-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
      {
        contents: [{ parts: [{ text: buildPrompt(text.trim(), batches || []) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
      },
      { responseType: 'stream', timeout: 30000 }
    );

    let buffer = '';
    response.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw || raw === '[DONE]') continue;
        try {
          const json = JSON.parse(raw);
          const part = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (part) {
            res.write(`data: ${JSON.stringify({ chunk: part })}\n\n`);
          }
        } catch (_) {}
      }
    });

    response.data.on('end', () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    response.data.on('error', (err) => {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

  } catch (err) {
    console.error('Streaming error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'Gemini streaming failed' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/voice/chat  — non-streaming fallback
 */
router.post('/chat', async (req, res) => {
  const { text, lang, batches } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required', errorBn: 'টেক্সট প্রয়োজন' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  }

  try {
    const response = await axios.post(
      `${GEMINI_BASE}/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [{ parts: [{ text: buildPrompt(text.trim(), batches || []) }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      || 'আমি বুঝতে পারিনি। অনুগ্রহ করে আবার জিজ্ঞাসা করুন।';

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'Chat failed', errorBn: 'চ্যাট ব্যর্থ হয়েছে' });
  }
});

module.exports = router;
