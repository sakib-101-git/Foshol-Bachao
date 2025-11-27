// Crop Scanner routes - Proxy for Hugging Face API to avoid CORS
const express = require('express');
const axios = require('axios');
const { authMiddleware } = require('../utils/jwt');

// Hugging Face API configuration
const HF_API_URL = "https://api-inference.huggingface.co/models/nateraw/vit-base-beans";
const HF_TOKEN = process.env.HF_TOKEN || process.env.VITE_HF_TOKEN;

module.exports = function(db) {
  console.log('📷 Scanner routes module loaded');
  
  // Create router inside the function to avoid sharing issues
  const router = express.Router();
  
  /**
   * GET /api/scanner/health
   * Health check for scanner service
   */
  router.get('/health', (req, res) => {
    console.log('✅ Health check endpoint hit - /api/scanner/health');
    res.json({ 
      status: 'ok', 
      hasToken: !!HF_TOKEN,
      tokenLength: HF_TOKEN ? HF_TOKEN.length : 0,
      message: 'Scanner service is running'
    });
  });
  
  // Test route to verify router is working
  router.get('/test', (req, res) => {
    res.json({ message: 'Scanner router is working' });
  });
  
  console.log('📷 Scanner router created with routes: /health, /test, /analyze');
  
  /**
   * POST /api/scanner/analyze
   * Proxy request to Hugging Face API for crop disease detection
   */
  router.post('/analyze', authMiddleware, async (req, res) => {
    try {
      console.log('Scanner analyze request received');
      console.log('Request body type:', typeof req.body);
      console.log('Request body keys:', req.body && typeof req.body === 'object' ? Object.keys(req.body) : 'not an object');
      
      if (!HF_TOKEN) {
        console.error('HF_TOKEN not configured');
        return res.status(500).json({ 
          error: 'Hugging Face token not configured on server' 
        });
      }

      // Get image buffer from request
      let imageBuffer;
      
      if (req.body && typeof req.body === 'object' && req.body.image) {
        // JSON request with base64 image
        console.log('Processing base64 image from JSON body');
        const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else if (Buffer.isBuffer(req.body)) {
        // Raw binary data (octet-stream)
        console.log('Processing raw binary buffer');
        imageBuffer = req.body;
      } else {
        console.error('Invalid request body format:', {
          type: typeof req.body,
          isObject: typeof req.body === 'object',
          hasImage: req.body && req.body.image ? true : false,
          isBuffer: Buffer.isBuffer(req.body)
        });
        return res.status(400).json({ 
          error: 'Invalid image data format',
          received: typeof req.body,
          expected: 'object with image property or Buffer'
        });
      }

      if (!imageBuffer || imageBuffer.length === 0) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      console.log('Proxying request to Hugging Face API...');
      console.log('Image size:', imageBuffer.length, 'bytes');

      try {
        // Forward request to Hugging Face API using axios
        const response = await axios.post(HF_API_URL, imageBuffer, {
          headers: {
            'Authorization': `Bearer ${HF_TOKEN}`,
            'Content-Type': 'application/octet-stream'
          },
          responseType: 'json',
          validateStatus: (status) => status < 600 // Don't throw on any status
        });

        // Handle different response statuses
        if (response.status === 503) {
          const data = response.data;
          return res.status(503).json({
            error: 'Model is loading',
            estimated_time: data.estimated_time || 30
          });
        }

        if (response.status !== 200) {
          console.error('HF API Error:', response.status, response.data);
          return res.status(response.status).json({
            error: `API error: ${response.status}`,
            details: response.data
          });
        }

        const results = response.data;
        
        // Check for error in response
        if (results.error) {
          return res.status(500).json({
            error: results.error
          });
        }

        console.log('Analysis successful, results:', results);
        res.json({ results });
        
      } catch (axiosError) {
        console.error('Axios error:', axiosError.message);
        if (axiosError.response) {
          // Request made but server responded with error
          return res.status(axiosError.response.status).json({
            error: `API error: ${axiosError.response.status}`,
            details: axiosError.response.data
          });
        } else if (axiosError.request) {
          // Request made but no response
          return res.status(500).json({
            error: 'No response from Hugging Face API',
            message: 'Check your internet connection or API token'
          });
        } else {
          // Something else happened
          return res.status(500).json({
            error: 'Failed to process request',
            message: axiosError.message
          });
        }
      }

    } catch (err) {
      console.error('Scanner proxy error:', err);
      res.status(500).json({ 
        error: 'Failed to analyze image',
        message: err.message 
      });
    }
  });

  return router;
};

