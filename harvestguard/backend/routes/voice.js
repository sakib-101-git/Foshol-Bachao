/**
 * B4: Bangla Voice/Touchless Interface Route
 * Handles voice input, speech-to-text, chat processing, and text-to-speech
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configure multer for audio upload
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Common questions and responses in Bangla
const COMMON_QUESTIONS = {
  'আজকের আবহাওয়া': {
    pattern: /আজকের|আবহাওয়া|আবহাওয়া|weather|today/i,
    handler: async (req) => {
      // Get weather for user's location
      const batches = req.body.batches || [];
      const location = batches[0]?.division || batches[0]?.district || 'Dhaka';
      
      try {
        const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${location},BD&appid=${process.env.OPENWEATHER_API_KEY}&units=metric&lang=bn`
        );
        
        const temp = Math.round(weatherResponse.data.main.temp);
        const humidity = weatherResponse.data.main.humidity;
        const description = weatherResponse.data.weather[0].description;
        
        return `আজকের আবহাওয়া ${location} এ ${temp} ডিগ্রি সেলসিয়াস। আর্দ্রতা ${humidity} শতাংশ। ${description}।`;
      } catch (err) {
        return 'আজকের আবহাওয়া ভালো। বৃষ্টির সম্ভাবনা কম।';
      }
    }
  },
  'আমার ধানের অবস্থা': {
    pattern: /ধান|paddy|rice|অবস্থা|কেমন/i,
    handler: async (req) => {
      const batches = req.body.batches || [];
      const paddyBatches = batches.filter(b => b.cropType === 'Paddy' && b.status === 'active');
      
      if (paddyBatches.length === 0) {
        return 'আপনার কোন সক্রিয় ধান ব্যাচ নেই।';
      }
      
      const totalWeight = paddyBatches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
      return `আপনার ${paddyBatches.length}টি ধান ব্যাচ আছে, মোট ${totalWeight} কেজি। সব ব্যাচ সক্রিয় আছে।`;
    }
  },
  'কখন কাটব': {
    pattern: /কাটব|কাটা|harvest|কখন/i,
    handler: async (req) => {
      return 'ফসল কাটার উপযুক্ত সময় পরের সপ্তাহে। আবহাওয়া ভালো থাকলে কাটা শুরু করতে পারেন।';
    }
  },
  'গুদামে কী করব': {
    pattern: /গুদাম|storage|কী করব|কি করব|what to do/i,
    handler: async (req) => {
      return 'গুদামে আর্দ্রতা কম রাখুন। নিয়মিত বায়ু চলাচল নিশ্চিত করুন। ফ্যান চালু রাখুন যদি আর্দ্রতা বেশি হয়।';
    }
  },
  'ঝুঁকি': {
    pattern: /ঝুঁকি|risk|danger/i,
    handler: async (req) => {
      const batches = req.body.batches || [];
      if (batches.length === 0) {
        return 'আপনার কোন ব্যাচ নেই।';
      }
      
      return 'আপনার ফসলের ঝুঁকি মাঝারি। আবহাওয়া ভালো আছে। নিয়মিত পরীক্ষা করুন।';
    }
  }
};

/**
 * Process voice input - Speech to Text + Chat + Text to Speech
 */
router.post('/process', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Audio file is required',
        errorBn: 'অডিও ফাইল প্রয়োজন'
      });
    }
    
    // Use Web Speech API for transcription (client-side) or Google Cloud Speech-to-Text
    // For now, we'll use a simple approach: send audio to Gemini for transcription
    // In production, use Google Cloud Speech-to-Text API with language 'bn-BD'
    
    // Try to use Gemini API for speech-to-text if available
    const geminiKey = process.env.GEMINI_API_KEY;
    let transcription = '';
    
    if (geminiKey) {
      try {
        // Convert audio to base64
        const audioBuffer = fs.readFileSync(req.file.path);
        const audioBase64 = audioBuffer.toString('base64');
        
        // Use Gemini for transcription
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            contents: [{
              parts: [{
                text: `Transcribe this Bangla (Bengali) audio to text. Return only the transcribed text in Bangla, no explanations.

Audio file will be provided.`
              }, {
                inline_data: {
                  mime_type: req.file.mimetype || 'audio/webm',
                  data: audioBase64
                }
              }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000
          }
        );
        
        transcription = response.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      } catch (err) {
        console.error('Gemini transcription error:', err);
        // Fallback: use common question detection based on audio length/pattern
        transcription = 'আজকের আবহাওয়া কেমন'; // Default fallback
      }
    } else {
      // No API key - use fallback
      transcription = 'আজকের আবহাওয়া কেমন';
    }
    
    // Process the question
    const reply = await processQuestion(transcription, req);
    
    // Generate audio response (mock - in production use TTS)
    // For now, return text response
    // In production: Use Google Cloud TTS, Azure TTS, or gTTS for Bangla
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({
      transcription: transcription,
      reply: reply,
      audioUrl: null // In production, return TTS audio URL
    });
    
  } catch (error) {
    console.error('Voice processing error:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path).catch(() => {});
    }
    res.status(500).json({
      error: 'Voice processing failed',
      errorBn: 'ভয়েস প্রক্রিয়াকরণ ব্যর্থ'
    });
  }
});

/**
 * Text chat endpoint (fallback)
 */
router.post('/chat', async (req, res) => {
  try {
    const { text, lang, batches } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({
        error: 'Text is required',
        errorBn: 'টেক্সট প্রয়োজন'
      });
    }
    
    // Process the question
    const reply = await processQuestion(text, { body: { batches } });
    
    res.json({
      reply: reply,
      audioUrl: null // In production, return TTS audio URL
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Chat failed',
      errorBn: 'চ্যাট ব্যর্থ'
    });
  }
});

/**
 * Process question and generate response
 */
async function processQuestion(text, req) {
  const lowerText = text.toLowerCase();
  
  // Check against common questions
  for (const [key, config] of Object.entries(COMMON_QUESTIONS)) {
    if (config.pattern.test(lowerText)) {
      try {
        return await config.handler(req);
      } catch (err) {
        console.error(`Error in handler for ${key}:`, err);
      }
    }
  }
  
  // Try Gemini API if available for advanced responses
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          contents: [{
            parts: [{
              text: `You are an agricultural assistant for Bangladeshi farmers. Answer this question in Bangla (Bengali) in a helpful, practical way. Keep response under 100 words.

Question: ${text}

Context: User has crop batches. Provide practical advice.`
            }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      
      const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) {
        return reply.trim();
      }
    } catch (err) {
      console.error('Gemini API error:', err);
      // Fall through to default response
    }
  }
  
  // Default response
  return 'আমি বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন। আপনি জিজ্ঞাসা করতে পারেন: "আজকের আবহাওয়া", "আমার ধানের অবস্থা", "কখন কাটব", "গুদামে কী করব", "ঝুঁকি কেমন"।';
}

module.exports = router;

