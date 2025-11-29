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
    const prompt = `You are an agricultural expert helping Bangladeshi farmers. You MUST analyze the ACTUAL image provided and give SPECIFIC results based on what you see.

CRITICAL INSTRUCTIONS:
- Look at the image carefully - is it a fresh healthy leaf, a diseased leaf, a dead/damaged leaf, or showing pests?
- If the leaf is FRESH and HEALTHY: Identify it as healthy, risk level LOW
- If the leaf shows DISEASE (spots, discoloration, lesions): Identify the specific disease visible
- If the leaf is DEAD/DAMAGED: Identify the cause (pest, disease, environmental)
- If PESTS are visible: Identify the specific pest species
- DO NOT give generic responses - analyze what is ACTUALLY in the image

REQUIREMENTS:
1. Examine the image carefully and describe what you ACTUALLY see
2. Identify the pest/disease/condition based on visible symptoms
3. Provide name in English and Bangla (বাংলা)
4. Assess risk level (High/Medium/Low) based on actual severity in image
5. Give practical, hyper-local treatment plan suitable for Bangladesh
6. Focus on local methods and available resources in Bangladesh

Crop Type: ${cropType || 'Unknown'}
Location: ${location || 'Bangladesh'}

Use Google Search grounding to find current, accurate information about what you identify in the image.

Respond ONLY in valid JSON format (no markdown, no code blocks, no explanations):
{
  "pestName": "Specific name based on what you see in image",
  "pestNameBn": "বাংলা নাম",
  "riskLevel": "High/Medium/Low based on actual image",
  "riskLevelBn": "উচ্চ/মাঝারি/কম",
  "description": "What you actually see in the image - describe in Bangla",
  "treatmentPlan": {
    "immediateBn": ["action 1 in Bangla", "action 2 in Bangla", "action 3 in Bangla"],
    "preventiveBn": ["prevention 1 in Bangla", "prevention 2 in Bangla", "prevention 3 in Bangla"]
  }
}`;

    // Call Gemini API with image and Google Search grounding
    // Remove data URL prefix if present
    let imageData = imageBase64;
    if (imageData.startsWith('data:')) {
      imageData = imageData.split(',')[1];
    }
    
    // Detect image MIME type
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:image/png')) {
      mimeType = 'image/png';
    } else if (imageBase64.startsWith('data:image/jpeg') || imageBase64.startsWith('data:image/jpg')) {
      mimeType = 'image/jpeg';
    }
    
    console.log('Sending image to Gemini API, size:', imageData.length, 'bytes, type:', mimeType);
    
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
                mime_type: mimeType,
                data: imageData
              }
            }
          ]
        }],
        tools: [{
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: "MODE_DYNAMIC",
              dynamicThreshold: 0.3
            }
          } // Google Search grounding tool - MANDATORY
        }],
        generationConfig: {
          temperature: 0.2, // Very low temperature for accurate, consistent analysis
          topK: 20,
          topP: 0.9,
          maxOutputTokens: 2048
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
      console.error('Empty response from Gemini API');
      throw new Error('No response from Gemini API');
    }
    
    console.log('Gemini API response received, length:', responseText.length);
    console.log('First 200 chars:', responseText.substring(0, 200));
    
    // Try to parse JSON from response
    let result;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/```/g, '');
      
      // Try to find JSON object (more flexible matching)
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Try to extract JSON from text that might have explanations
        const jsonStart = cleanedText.indexOf('{');
        const jsonEnd = cleanedText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          result = JSON.parse(cleanedText.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      // Validate required fields
      if (!result.pestName || !result.pestNameBn) {
        throw new Error('Missing required fields in response');
      }
      
      // Ensure all required fields exist
      if (!result.riskLevel) result.riskLevel = 'Medium';
      if (!result.riskLevelBn) result.riskLevelBn = 'মাঝারি';
      if (!result.description) result.description = 'ছবি বিশ্লেষণ করা হয়েছে।';
      if (!result.treatmentPlan) {
        result.treatmentPlan = {
          immediateBn: ['ক্ষেত পরিদর্শন করুন', 'স্থানীয় কৃষি কর্মকর্তার সাথে যোগাযোগ করুন'],
          preventiveBn: ['নিয়মিত ক্ষেত পরিদর্শন করুন', 'সুস্থ বীজ ব্যবহার করুন']
        };
      }
      
      console.log('Successfully parsed result:', {
        pestName: result.pestName,
        riskLevel: result.riskLevel
      });
      
    } catch (parseError) {
      console.error('Failed to parse Gemini JSON response:', parseError);
      console.error('Full response text:', responseText);
      
      // Return error instead of mock data
      return res.status(500).json({
        error: 'Failed to parse AI response',
        errorBn: 'AI প্রতিক্রিয়া পার্স করতে ব্যর্থ',
        details: parseError.message,
        rawResponse: responseText.substring(0, 500),
        hint: 'Check backend logs for full response'
      });
    }
    
    // Return result with source indicator
    res.json({
      ...result,
      source: 'gemini-live',
      analyzedAt: new Date().toISOString()
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

