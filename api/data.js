// api/data.js - SIMPLE AND DIRECT VERSION
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx8gFsR10kWY6tEuD40YaQ_Ja0qSnV8pH7Vw2RhbBKsyve5DFmQP3QZVt-YMZP7LrcT/exec';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('🔄 Processing request:', { method: req.method, type, id });

    // Build the URL with query parameters
    const urlParams = new URLSearchParams();
    urlParams.append('type', type);

    // Handle different methods
    if (req.method === 'GET') {
      // Simple GET request for reading data
      if (id) urlParams.append('id', id);
      
      const url = `${GOOGLE_SCRIPT_URL}?${urlParams.toString()}`;
      console.log('🔗 GET URL:', url);
      
      const response = await fetch(url, { 
        method: 'GET',
        redirect: 'follow'
      });
      
      return handleGoogleResponse(response, res);
      
    } else if (req.method === 'POST') {
      // POST request - send data as URL encoded form
      urlParams.append('method', 'POST');
      
      // Add all body data to the form
      if (req.body) {
        Object.keys(req.body).forEach(key => {
          if (req.body[key] !== undefined && req.body[key] !== null) {
            urlParams.append(key, req.body[key].toString());
          }
        });
      }
      
      const url = GOOGLE_SCRIPT_URL;
      console.log('📤 POST Data:', urlParams.toString());
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlParams.toString(),
        redirect: 'follow'
      });
      
      return handleGoogleResponse(response, res);
      
    } else if (req.method === 'DELETE') {
      // DELETE request - send as POST with method=DELETE
      urlParams.append('method', 'DELETE');
      urlParams.append('id', id);
      
      const url = GOOGLE_SCRIPT_URL;
      console.log('🗑️ DELETE Data:', urlParams.toString());
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlParams.toString(),
        redirect: 'follow'
      });
      
      return handleGoogleResponse(response, res);
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });

  } catch (error) {
    console.error('❌ Error in data.js:', error.message);
    
    // Return fallback data for GET requests
    if (req.method === 'GET') {
      if (type === 'transactions') {
        return res.status(200).json({ success: true, data: [] });
      }
      if (type === 'notes') {
        return res.status(200).json({ 
          success: true, 
          data: "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini." 
        });
      }
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message 
    });
  }
}

// Helper function to handle Google Apps Script response
async function handleGoogleResponse(response, res) {
  try {
    const text = await response.text();
    console.log('📄 Raw response:', text);
    
    // Parse JSON response
    const data = JSON.parse(text);
    console.log('✅ Parsed response:', { 
      success: data.success, 
      message: data.message,
      dataLength: data.data ? (Array.isArray(data.data) ? data.data.length : 1) : 0
    });
    
    return res.status(200).json(data);
  } catch (parseError) {
    console.error('❌ Parse error:', parseError.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Invalid response from server',
      error: parseError.message 
    });
  }
}
