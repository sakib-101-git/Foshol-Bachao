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
      console.warn('GEMINI_API_KEY not set, using mock response');
      // Return mock response for testing
      return res.json({
        pestName: 'Brown Plant Hopper',
        pestNameBn: 'বাদামি পাতা হপার',
        riskLevel: 'High',
        riskLevelBn: 'উচ্চ',
        description: 'This pest causes significant damage to rice crops by sucking sap from plants.',
        descriptionBn: 'এই পোকা ধান গাছ থেকে রস চুষে নিয়ে উল্লেখযোগ্য ক্ষতি করে।',
        treatmentPlan: {
          immediate: [
            'Apply neem oil solution (2ml per liter of water)',
            'Remove heavily infested plants',
            'Increase water level in paddy field'
          ],
          immediateBn: [
            'নিম তেল দ্রবণ প্রয়োগ করুন (১ লিটার পানিতে ২ মিলি)',
            'অতিরিক্ত আক্রান্ত গাছ সরিয়ে ফেলুন',
            'ধান ক্ষেতে পানির স্তর বাড়ান'
          ],
          preventive: [
            'Use resistant rice varieties',
            'Maintain proper field hygiene',
            'Monitor regularly for early detection'
          ],
          preventiveBn: [
            'প্রতিরোধী ধান জাত ব্যবহার করুন',
            'ক্ষেতের পরিচ্ছন্নতা বজায় রাখুন',
            'নিয়মিত পর্যবেক্ষণ করুন'
          ]
        },
        source: 'mock'
      });
    }
    
    // Prepare prompt for Gemini with Google Search grounding
    const prompt = `You are an agricultural expert helping Bangladeshi farmers. Analyze this crop pest/damage image and provide:

1. Pest/Damage Name (in English and Bangla)
2. Risk Level (High/Medium/Low in English and Bangla)
3. Brief Description (in Bangla)
4. Treatment Plan in Bangla with:
   - Immediate actions (3-4 steps)
   - Preventive measures (3-4 steps)
   
Focus on practical, local methods suitable for Bangladesh. Use Google Search to find the most current and accurate information about this pest.

Crop Type: ${cropType || 'Unknown'}
Location: ${location || 'Bangladesh'}

Respond in JSON format:
{
  "pestName": "English name",
  "pestNameBn": "বাংলা নাম",
  "riskLevel": "High/Medium/Low",
  "riskLevelBn": "উচ্চ/মাঝারি/কম",
  "description": "Brief description in Bangla",
  "treatmentPlan": {
    "immediateBn": ["action 1", "action 2", ...],
    "preventiveBn": ["action 1", "action 2", ...]
  }
}`;

    // Call Gemini API with image and Google Search grounding
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
                data: imageBase64.replace(/^data:image\/\w+;base64,/, '')
              }
            }
          ]
        }],
        tools: [{
          googleSearchRetrieval: {} // Google Search grounding tool
        }]
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
    
    // Try to parse JSON from response
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, responseText];
      result = JSON.parse(jsonMatch[1] || responseText);
    } catch (parseError) {
      // If JSON parsing fails, create structured response from text
      console.warn('Failed to parse Gemini JSON response, using text extraction');
      result = {
        pestName: 'Unknown Pest',
        pestNameBn: 'অজানা পোকা',
        riskLevel: 'Medium',
        riskLevelBn: 'মাঝারি',
        description: responseText.substring(0, 200) || 'পোকা শনাক্ত করা হয়েছে।',
        treatmentPlan: {
          immediateBn: [
            'ক্ষেত পরিদর্শন করুন',
            'স্থানীয় কৃষি কর্মকর্তার সাথে যোগাযোগ করুন',
            'প্রয়োজনে কীটনাশক ব্যবহার করুন'
          ],
          preventiveBn: [
            'নিয়মিত ক্ষেত পরিদর্শন করুন',
            'সুস্থ বীজ ব্যবহার করুন',
            'ক্ষেতের পরিচ্ছন্নতা বজায় রাখুন'
          ]
        }
      };
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

