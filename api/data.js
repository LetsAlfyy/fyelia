// api/data.js - WORKING VERSION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8gFsR10kWY6tEuD40YaQ_Ja0qSnV8pH7Vw2RhbBKsyve5DFmQP3QZVt-YMZP7LrcT/exec';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    const formData = new URLSearchParams();
    formData.append('type', type);

    if (req.method === 'POST') {
      formData.append('method', 'POST');
      if (req.body) {
        for (const [key, value] of Object.entries(req.body)) {
          if (value != null) formData.append(key, value.toString());
        }
      }
    } else if (req.method === 'DELETE') {
      formData.append('method', 'DELETE');
      formData.append('id', id);
    }

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const text = await response.text();
    const result = JSON.parse(text);
    
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
}
