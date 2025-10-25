// api/data.js - SIMPLIFIED VERSION
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

    // Build base URL
    let url = GOOGLE_SCRIPT_URL;
    const params = new URLSearchParams();
    params.append('type', type);

    const options = {
      redirect: 'follow',
      headers: {}
    };

    // Handle different methods
    if (req.method === 'GET') {
      // Untuk GET requests (baca data)
      options.method = 'GET';
      if (id) params.append('id', id);
      url += '?' + params.toString();
      
    } else if (req.method === 'POST') {
      // Untuk POST requests (buat/simpan data)
      options.method = 'POST';
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      
      // Gabungkan query parameters dengan body data
      const formData = new URLSearchParams();
      formData.append('type', type);
      formData.append('method', 'POST');
      
      if (req.body) {
        for (const key in req.body) {
          if (req.body[key] !== undefined && req.body[key] !== null) {
            formData.append(key, req.body[key].toString());
          }
        }
      }
      
      options.body = formData.toString();
      console.log('📤 POST Data:', options.body);
      
    } else if (req.method === 'DELETE') {
      // Untuk DELETE requests
      options.method = 'POST'; // Google Apps Script perlu POST untuk DELETE
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      
      const formData = new URLSearchParams();
      formData.append('type', type);
      formData.append('method', 'DELETE');
      formData.append('id', id);
      
      options.body = formData.toString();
    }

    console.log('🔗 Final URL:', url);
    console.log('⚙️ Request options:', {
      method: options.method,
      headers: options.headers,
      body: options.body ? '[...]' : undefined
    });

    // Timeout setelah 10 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    // Handle redirects (Google Apps Script sering redirect)
    if (response.status === 302 || response.redirected) {
      const redirectUrl = response.headers.get('location') || response.url;
      console.log('🔄 Redirected to:', redirectUrl);
      
      // Follow redirect
      const redirectResponse = await fetch(redirectUrl, {
        method: options.method,
        headers: options.headers,
        body: options.body,
        redirect: 'follow'
      });
      
      return handleResponse(redirectResponse, res);
    }

    return handleResponse(response, res);

  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    // Fallback data untuk development
    if (req.method === 'GET') {
      if (type === 'transactions') {
        return res.status(200).json({
          success: true,
          data: []
        });
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
      message: error.name === 'AbortError' 
        ? 'Request timeout' 
        : 'Gagal terhubung ke server',
      error: error.message
    });
  }
}

// Helper function untuk handle response
async function handleResponse(response, res) {
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  console.log('📄 Response text:', text);
  
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error('Invalid JSON response: ' + text);
  }

  console.log('✅ Success:', result.success, 'Message:', result.message);
  return res.status(200).json(result);
}
