// api/data.js - FIXED VERSION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8gFsR10kWY6tEuD40YaQ_Ja0qSnV8pH7Vw2RhbBKsyve5DFmQP3QZVt-YMZP7LrcT/exec';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('=== 📱 VERCEL API REQUEST ===');
    console.log('Method:', req.method);
    console.log('Type:', type);
    console.log('ID:', id);
    console.log('Body:', JSON.stringify(req.body, null, 2));

    // SELALU gunakan POST untuk Google Apps Script
    const formData = new URLSearchParams();
    formData.append('type', type);

    if (req.method === 'POST') {
      formData.append('method', 'POST');
      // Copy semua data dari body ke formData
      if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
          if (value !== undefined && value !== null) {
            formData.append(key, value.toString());
          }
        }
      }
    } 
    else if (req.method === 'DELETE') {
      formData.append('method', 'DELETE');
      formData.append('id', id);
    }

    console.log('📤 Form data to Google:', formData.toString());

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      redirect: 'follow'
    });

    console.log('📄 Google Response Status:', response.status);
    
    const text = await response.text();
    console.log('📄 Google Response Text:', text);

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON from Google: ' + text);
    }

    console.log('✅ Google Response:', result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ VERCEL API ERROR:', error.message);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error: ' + error.message
    });
  }
}
