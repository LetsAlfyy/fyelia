// api/data.js
// GANTI URL INI DENGAN URL DEPLOYMENT BARU YANG SUDAH BERHASIL RETURN JSON!
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzk-86sVOXV9ZJf1ihV15pe0YHEvxmq9yQE00ZO762KM6DwotMTDL84uPh1h-19hB1/exec';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { type, id } = req.query;

  try {
    console.log('📱 Vercel API called:', { 
      method: req.method, 
      type, 
      id 
    });

    // Build Google Apps Script URL
    let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
    
    if (req.method === 'DELETE') {
      url += `&method=DELETE`;
    }
    
    if (id) {
      url += `&id=${encodeURIComponent(id)}`;
    }

    console.log('🔗 Calling:', url);

    // Prepare fetch options
    const options = {
      method: req.method === 'DELETE' ? 'GET' : req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow'
    };

    // Add body for POST
    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
      console.log('📤 Body:', options.body);
    }

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    // Get response text first
    const text = await response.text();
    console.log('📥 Response (first 200 chars):', text.substring(0, 200));

    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('Response text:', text);
      throw new Error('Invalid JSON from Google Sheets: ' + text.substring(0, 100));
    }

    console.log('✅ Parsed result:', { 
      success: result.success,
      dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
      dataLength: Array.isArray(result.data) ? result.data.length : '-'
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Vercel API Error:', {
      name: error.name,
      message: error.message,
      type,
      method: req.method
    });

    // Fallback for GET requests
    if (req.method === 'GET') {
      if (type === 'transactions') {
        console.log('🔄 Fallback: empty transactions');
        return res.status(200).json({ success: true, data: [] });
      }
      
      if (type === 'notes') {
        console.log('🔄 Fallback: default notes');
        return res.status(200).json({ 
          success: true, 
          data: "Selamat datang di Fyeliaa! 💰" 
        });
      }
    }

    // Error response
    return res.status(500).json({
      success: false,
      message: error.name === 'AbortError' 
        ? 'Request timeout' 
        : 'Gagal terhubung ke server: ' + error.message
    });
  }
}
