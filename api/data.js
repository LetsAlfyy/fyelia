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
      id
    });

    let url = GOOGLE_SCRIPT_URL;
    let options = {
      redirect: 'follow'
    };

    if (req.method === 'GET') {
      // GET request - simple URL parameters
      const params = new URLSearchParams();
      params.append('type', type);
      if (id) params.append('id', id);
      
      url += '?' + params.toString();
      options.method = 'GET';
      
      console.log('🔗 GET URL:', url);
      
    } else if (req.method === 'POST') {
      // POST request - send as form data
      const formData = new URLSearchParams();
      formData.append('type', type);
      formData.append('method', 'POST');
      
      // Add all body data
      if (req.body) {
        for (const key in req.body) {
          if (req.body[key] !== undefined && req.body[key] !== null) {
            formData.append(key, req.body[key].toString());
          }
        }
      }
      
      options.method = 'POST';
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      options.body = formData.toString();
      
      console.log('📤 POST Data:', options.body);
      
    } else if (req.method === 'DELETE') {
      // DELETE request
      const formData = new URLSearchParams();
      formData.append('type', type);
      formData.append('method', 'DELETE');
      formData.append('id', id);
      
      options.method = 'POST';
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      options.body = formData.toString();
      
      console.log('🗑️ DELETE Data:', options.body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    console.log('📄 Response:', text);
    
    const result = JSON.parse(text);
    console.log('✅ Parsed result:', result.success ? 'SUCCESS' : 'FAILED');
    
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Fallback untuk development
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
      message: 'Gagal terhubung ke server',
      error: error.message 
    });
  }
}
