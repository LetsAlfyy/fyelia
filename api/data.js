// api/data.js
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzk-86sVOXV9ZJf1ihV15pe0YHEvxmq9yQE00ZO762KM6DwotMTDL84uPh1h-19hB1/exec';

export default async function handler(req, res) {
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

    let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
    
    if (req.method === 'DELETE') {
      url += `&method=DELETE`;
    }
    
    if (id) {
      url += `&id=${encodeURIComponent(id)}`;
    }

    console.log('🔗 Calling Google Sheets:', url);

    const options = {
      method: req.method === 'DELETE' ? 'GET' : req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow'
    };

    if (req.method === 'POST' && req.body) {
      options.body = JSON.stringify(req.body);
      console.log('📤 Sending body:', options.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    console.log('📥 Response content-type:', contentType);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const text = await response.text();
      console.log('📄 Response text:', text);
      
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid JSON response from Google Sheets: ' + text);
      }
    }

    console.log('✅ Google Sheets response:', { 
      status: response.status,
      ok: response.ok,
      success: result.success,
      dataLength: result.data ? (Array.isArray(result.data) ? result.data.length : 'string') : 0
    });

    return res.status(response.ok ? 200 : 500).json(result);

  } catch (error) {
    console.error('❌ API Error:', {
      message: error.message,
      name: error.name,
      type,
      method: req.method
    });

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

    return res.status(500).json({
      success: false,
      message: error.name === 'AbortError' 
        ? 'Request timeout. Server terlalu lama merespons.' 
        : 'Gagal terhubung ke server. Coba lagi dalam beberapa saat.',
      error: error.message
    });
  }
}
