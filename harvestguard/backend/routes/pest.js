/**
 * B3: Pest Identification Route - Gemini Visual RAG
 * Uses Gemini API with Google Search Grounding for pest identification
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');

// Gemini API endpoint - Use v1 API which is more stable
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1';

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
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o';
    
    console.log('=== PEST IDENTIFICATION REQUEST ===');
    console.log('API Key present:', !!apiKey);
    console.log('Image data length:', imageBase64 ? imageBase64.length : 0);
    console.log('Crop type:', cropType);
    console.log('Location:', location);
    
    if (!apiKey || apiKey === 'your_gemini_key_here') {
      return res.status(400).json({
        error: 'Gemini API key not configured',
        errorBn: 'Gemini API কী সেটআপ করা নেই। অনুগ্রহ করে GEMINI_API_KEY এনভায়রনমেন্ট ভেরিয়েবল সেট করুন।'
      });
    }
    
    // Generate unique request ID to prevent caching
    const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Prepare prompt for Gemini with Google Search grounding
    const prompt = `[Request ID: ${requestId}] Analyze this agricultural image RIGHT NOW. Look at the ACTUAL image and describe what you SEE.

CRITICAL: This is a NEW image. Analyze it from scratch. Do NOT use previous responses.

What do you SEE in this image?
1. Color: Is it GREEN (healthy), YELLOW (disease), BROWN (dead), or has SPOTS?
2. Condition: Is it FRESH, DISEASED, DAMAGED, or PEST-INFESTED?
3. Details: Describe specific symptoms, pests, or damage visible

Based on what you ACTUALLY see in this image, provide:

Crop: ${cropType || 'Unknown'}
Location: ${location || 'Bangladesh'}
Request Time: ${new Date().toISOString()}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "pestName": "Specific identification based on image",
  "pestNameBn": "বাংলা নাম",
  "riskLevel": "Low/Medium/High",
  "riskLevelBn": "কম/মাঝারি/উচ্চ",
  "description": "What you actually see in the image (in Bangla)",
  "treatmentPlan": {
    "immediateBn": ["action 1", "action 2", "action 3"],
    "preventiveBn": ["prevention 1", "prevention 2", "prevention 3"]
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
    console.log('Image data preview (first 100 chars):', imageData.substring(0, 100));
    
    const requestPayload = {
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
        }
      }],
      generationConfig: {
        temperature: 0.7, // Higher temperature for more varied responses
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };
    
    console.log('Request payload prepared, calling Gemini API...');
    
    // Try multiple models in order - prioritize image-capable models
    // gemini-1.5-pro supports images, gemini-pro does not
    const modelsToTry = [
      'gemini-1.5-pro',      // Best for image analysis
      'gemini-1.5-flash',    // Faster alternative
      'gemini-pro'           // Fallback (no image support, will fail)
    ];
    
    let response;
    let lastError;
    let modelUsed = null;
    
    for (const model of modelsToTry) {
      try {
        const apiUrl = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
        
        console.log(`Trying model: ${model}...`);
        
        // For gemini-pro, remove tools and image (not supported)
        let payload;
        if (model === 'gemini-pro') {
          // gemini-pro doesn't support images or tools
          payload = {
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: requestPayload.generationConfig
          };
        } else {
          // gemini-1.5-pro and gemini-1.5-flash support images
          payload = requestPayload;
        }
        
        response = await axios.post(
          apiUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
        
        modelUsed = model;
        console.log(`✅ Success with model: ${model}, status:`, response.status);
        break;
      } catch (apiError) {
        lastError = apiError;
        const errorMsg = apiError.response?.data?.error?.message || apiError.message;
        const errorCode = apiError.response?.data?.error?.code;
        console.log(`❌ Model ${model} failed:`, apiError.response?.status, errorMsg);
        if (apiError.response?.status === 404 || errorCode === 404) {
          console.log('   → This model does not exist, trying next...');
        }
        continue;
      }
    }
    
    if (!response) {
      const errorDetails = lastError?.response?.data || { message: lastError?.message || 'Unknown error' };
      console.error('All models failed. Last error:', JSON.stringify(errorDetails, null, 2));
      return res.status(500).json({
        error: 'Gemini API failed',
        errorBn: 'Gemini API ব্যর্থ হয়েছে',
        details: errorDetails.error?.message || errorDetails.message,
        hint: 'Check if API key is valid and models are available'
      });
    }
    
    // Extract response text
    const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!responseText) {
      console.error('Empty response from Gemini API');
      console.error('Full response data:', JSON.stringify(response.data, null, 2));
      throw new Error('No response from Gemini API');
    }
    
    console.log('=== GEMINI API RESPONSE ===');
    console.log('Response length:', responseText.length);
    console.log('Full response:', responseText);
    console.log('===========================');
    
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
    
    // Return result with source indicator and debug info
    const finalResult = {
      ...result,
      source: 'gemini-live',
      model: modelUsed,
      analyzedAt: new Date().toISOString(),
      imageAnalyzed: true,
      apiResponseLength: responseText.length,
      // Include raw response for debugging (only in development)
      rawResponse: process.env.NODE_ENV !== 'production' ? responseText.substring(0, 1000) : undefined
    };
    
    console.log('=== FINAL RESULT ===');
    console.log('Model Used:', modelUsed);
    console.log('Pest Name:', finalResult.pestName);
    console.log('Risk Level:', finalResult.riskLevel);
    console.log('Source:', finalResult.source);
    console.log('===================');
    
    res.json(finalResult);
    
  } catch (error) {
    console.error('Pest identification error:', error);
    res.status(500).json({
      error: 'Failed to identify pest',
      errorBn: 'পোকা শনাক্ত করতে ব্যর্থ',
      details: error.message
    });
  }
});

/**
 * Test endpoint to verify Gemini API is working
 */
router.get('/test', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBRV82g6JvBOinQUJiN1iXMwuxLb5bqL2o';
    
    // Try multiple models - use v1 API
    const modelsToTry = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro'
    ];
    
    let response;
    let modelUsed = null;
    let lastError;
    
    for (const model of modelsToTry) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
        response = await axios.post(
          apiUrl,
          {
            contents: [{
              parts: [{
                text: 'Say "API is working" if you can read this.'
              }]
            }]
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        modelUsed = model;
        break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    
    if (!response) {
      throw lastError || new Error('All models failed');
    }
    
    const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    
    res.json({
      status: 'success',
      apiKey: apiKey ? 'Present' : 'Missing',
      model: modelUsed,
      response: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      details: error.response?.data || 'No details'
    });
  }
});

module.exports = router;

