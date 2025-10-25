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
    console.log('📱 API Request:', { 
      method: req.method, 
      type, 
      id,
      body: req.body 
    });

    // Build URL untuk Google Apps Script
    let url = GOOGLE_SCRIPT_URL;
    const params = new URLSearchParams();
    params.append('type', type);
    
    // Handle different HTTP methods
    if (req.method === 'DELETE') {
      params.append('method', 'DELETE');
      if (id) params.append('id', id);
    } else if (req.method === 'POST') {
      params.append('method', 'POST');
    }

    // Untuk GET requests (membaca data), tambahkan parameter ke URL
    if (req.method === 'GET') {
      if (id) {
        params.append('id', id);
      }
      url += '?' + params.toString();
    }

    const options = {
      method: req.method === 'GET' ? 'GET' : 'POST',
      redirect: 'follow'
    };

    // Untuk POST requests, kirim data sebagai form data
    if (req.method === 'POST' && req.body) {
      const formData = new URLSearchParams();
      
      // Tambahkan semua field dari body ke formData
      for (const key in req.body) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          formData.append(key, req.body[key].toString());
        }
      }
      
      // Juga tambahkan parameter type dan method
      formData.append('type', type);
      formData.append('method', 'POST');
      
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      options.body = formData.toString();
      
      console.log('📤 Sending POST data:', options.body);
    } else {
      // Untuk GET dan DELETE, gunakan URL parameters
      url += '?' + params.toString();
    }

    console.log('🔗 Calling Google Sheets:', url);
    console.log('⚙️ Request options:', options);

    // Timeout setelah 15 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log('📄 Response text:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON response from Google Sheets: ' + text);
    }

    console.log('✅ Google Sheets response:', { 
      success: result.success,
      message: result.message,
      dataLength: result.data ? (Array.isArray(result.data) ? result.data.length : 'string') : 0
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ API Error:', {
      message: error.message,
      name: error.name,
      type,
      method: req.method
    });

    // Fallback untuk GET requests
    if (req.method === 'GET') {
      if (type === 'transactions') {
        console.log('🔄 Using fallback: empty transactions');
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      if (type === 'notes') {
        console.log('🔄 Using fallback: default notes');
        return res.status(200).json({
          success: true,
          data: "Selamat datang di Fyeliaa! 💰\nCatat semua transaksi keuangan Alfye & Aulia di sini."
        });
      }
    }

    // Error response
    return res.status(500).json({
      success: false,
      message: error.name === 'AbortError' 
        ? 'Request timeout. Server terlalu lama merespons.' 
        : 'Gagal terhubung ke server. Coba lagi dalam beberapa saat.',
      error: error.message
    });
  }
}
