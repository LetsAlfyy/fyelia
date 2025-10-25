// api/data.js - WORKAROUND: Use GET with encoded data
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
    console.log('📱 Request:', { method: req.method, type, id });

    let url = `${GOOGLE_SCRIPT_URL}?type=${type}`;
    let fetchMethod = 'GET';

    // DELETE: send as GET with method parameter
    if (req.method === 'DELETE') {
      url += `&method=DELETE&id=${encodeURIComponent(id)}`;
    }
    // POST: encode data in URL as workaround
    else if (req.method === 'POST' && req.body) {
      url += `&method=POST`;
      // Encode each field as URL parameter
      const body = req.body;
      if (body.tanggal) url += `&tanggal=${encodeURIComponent(body.tanggal)}`;
      if (body.tanggalAsli) url += `&tanggalAsli=${encodeURIComponent(body.tanggalAsli)}`;
      if (body.nama) url += `&nama=${encodeURIComponent(body.nama)}`;
      if (body.jenis) url += `&jenis=${encodeURIComponent(body.jenis)}`;
      if (body.nominal) url += `&nominal=${encodeURIComponent(body.nominal)}`;
      if (body.keterangan) url += `&keterangan=${encodeURIComponent(body.keterangan)}`;
      if (body.notes) url += `&notes=${encodeURIComponent(body.notes)}`;
      
      console.log('📤 POST data encoded in URL');
    }
    // GET with id
    else if (id) {
      url += `&id=${encodeURIComponent(id)}`;
    }

    console.log('🔗 URL:', url.substring(0, 150) + '...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(url, {
      method: fetchMethod,
      headers: { 'Content-Type': 'text/plain' },
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    console.log('📥 Response length:', text.length);
    console.log('📥 First 200 chars:', text.substring(0, 200));

    let result;
    try {
      result = JSON.parse(text);
      console.log('✅ JSON parsed successfully');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('Response text:', text);
      throw new Error('Invalid JSON: ' + text.substring(0, 100));
    }

    console.log('✅ Result:', { 
      success: result.success,
      message: result.message,
      dataLength: result.data ? (Array.isArray(result.data) ? result.data.length : 'string') : 0
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ API Error:', {
      name: error.name,
      message: error.message
    });

    // Fallback for GET
    if (req.method === 'GET') {
      if (type === 'transactions') {
        return res.status(200).json({ success: true, data: [] });
      }
      if (type === 'notes') {
        return res.status(200).json({ 
          success: true, 
          data: "Selamat datang di Fyeliaa! 💰" 
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal terhubung ke server: ' + error.message
    });
  }
}

