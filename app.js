// 1. KUNCI KONEKSI (Data dari catatan Anda)
const SUPABASE_URL = 'https://enwngiuiqcnbonhinctl.supabase.co; // Sesuaikan dengan URL Supabase Anda
const SUPABASE_KEY = 'sb_publishable_9qtNidZ7beAGgAMuMmW2ZA_i9Cl-tE9; // Gunakan API Key (Anon Key) dari catatan
const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos

; // API Key Biteship Live Anda

// Inisialisasi Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. VARIABEL GLOBAL
let selectedProduct = null;
let originID = null;

// 3. FUNGSI MENCARI LOCATION ID SURABAYA SECARA OTOMATIS
async function fetchOriginID() {
    const response = await fetch('https://api.biteship.com/v1/maps/origins', {
        headers: { 'Authorization': BITESHIP_API_KEY }
    });
    const data = await response.json();
    if (data.success && data.origins.length > 0) {
        originID = data.origins[0].id;
        console.log("Origin ID Berhasil Dimuat:", originID);
    }
}

// 4. FUNGSI AMBIL PRODUK DARI SUPABASE
async function loadProducts() {
    const { data: products, error } = await _supabase.from('products').select('*');
    const list = document.getElementById('product-list');
    if (error) return list.innerHTML = "Gagal memuat produk.";
    
    list.innerHTML = products.map(p => `
        <div class="card">
            <h4>${p.name}</h4>
            <p>Harga: Rp${p.price.toLocaleString()}</p>
            <button onclick="pilihProduk('${p.name}', ${p.price}, ${p.weight_grams})">Pilih & Cek Ongkir</button>
        </div>
    `).join('');
}

// 5. FUNGSI CEK ONGKIR KE BITESHIP
async function handleCekOngkir() {
    const area = document.getElementById('destination-area').value;
    const resultsDiv = document.getElementById('shipping-options');
    resultsDiv.innerHTML = "Mencari ongkir terbaik...";

    // Logika API Biteship untuk cek tarif (Rates)
    const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
        method: 'POST',
        headers: { 'Authorization': BITESHIP_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            origin_id: originID,
            destination_name: area,
            items: [{ name: selectedProduct.name, quantity: 1, value: selectedProduct.price, weight: selectedProduct.weight }]
        })
    });
    
    const data = await response.json();
    if (data.success) {
        resultsDiv.innerHTML = data.pricing.map(s => `
            <div class="shipping-item" onclick="setFinal('${s.courier_name}', '${s.courier_service}', ${s.price})">
                ${s.courier_name} (${s.courier_service}) - Rp${s.price.toLocaleString()}
            </div>
        `).join('');
    }
}

// Fungsi pembantu lainnya untuk WhatsApp
function pilihProduk(name, price, weight) {
    selectedProduct = { name, price, weight };
    document.getElementById('form-pesanan').style.display = 'block';
    document.getElementById('selected-product-info').innerText = "Produk: " + name;
}

function kirimKeWhatsApp() {
    const wa = "6285700800278";
    const text = `Halo Jamaah Lintingiyah, saya mau pesan ${selectedProduct.name}. Total harga + ongkir sudah saya cek di website.`;
    window.open(`https://wa.me/${wa}?text=${encodeURIComponent(text)}`);
}

// Jalankan saat awal
fetchOriginID();
loadProducts();

