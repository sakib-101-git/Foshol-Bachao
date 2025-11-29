/**
 * B3: Pest Identification Route - Gemini Visual RAG
 * Uses Gemini API with Google Search Grounding for pest identification
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Gemini API endpoint
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Identify pest from uploaded image using Gemini Visual RAG
 */
router.post('/identify', async (req, res) => {
  try {
    const { imageBase64, cropType, location } = req.body;
    
    if (!imageBase64) {
      return res.status(400).json({ 
        error: 'Image is required',
        errorBn: 'ছবি প্রয়োজন'
      });
    }
    
    // Get Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: 'Gemini API key not configured',
        errorBn: 'Gemini API কী সেটআপ করা নেই। অনুগ্রহ করে GEMINI_API_KEY এনভায়রনমেন্ট ভেরিয়েবল সেট করুন।'
      });
    }
    
    // Prepare prompt for Gemini with Google Search grounding
    const prompt = `You are an agricultural expert helping Bangladeshi farmers. Analyze this crop pest/damage image and provide accurate identification and treatment advice.

REQUIREMENTS:
1. Identify the pest or disease accurately
2. Provide name in English and Bangla (বাংলা)
3. Assess risk level (High/Medium/Low)
4. Give practical treatment plan suitable for Bangladesh

Crop Type: ${cropType || 'Unknown'}
Location: ${location || 'Bangladesh'}

Respond ONLY in valid JSON format (no markdown, no code blocks):
{
  "pestName": "English name",
  "pestNameBn": "বাংলা নাম",
  "riskLevel": "High",
  "riskLevelBn": "উচ্চ",
  "description": "Brief description in Bangla",
  "treatmentPlan": {
    "immediateBn": ["action 1 in Bangla", "action 2 in Bangla"],
    "preventiveBn": ["prevention 1 in Bangla", "prevention 2 in Bangla"]
  }
}`;

    // Call Gemini API with image and Google Search grounding
    const imageData = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: imageData
              }
            }
          ]
        }],
        tools: [{
          googleSearchRetrieval: {} // Google Search grounding tool
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    // Extract response text
    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!responseText) {
      throw new Error('No response from Gemini API');
    }
    
    // Try to parse JSON from response
    let result;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
      
      // Validate required fields
      if (!result.pestName || !result.pestNameBn) {
        throw new Error('Missing required fields in response');
      }
      
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', parseError);
      console.error('Response text:', responseText.substring(0, 500));
      
      // Return error instead of mock data
      return res.status(500).json({
        error: 'Failed to parse AI response',
        errorBn: 'AI প্রতিক্রিয়া পার্স করতে ব্যর্থ',
        details: parseError.message,
        rawResponse: responseText.substring(0, 200)
      });
    }
    
    res.json({
      ...result,
      source: 'gemini',
      rawResponse: responseText.substring(0, 500) // Include first 500 chars for debugging
    });
    
  } catch (error) {
    console.error('Pest identification error:', error);
    res.status(500).json({
      error: 'Failed to identify pest',
      errorBn: 'পোকা শনাক্ত করতে ব্যর্থ',
      details: error.message
    });
  }
});

module.exports = router;

