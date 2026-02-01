// 1. KONFIGURASI KUNCI (Ganti dengan catatan Anda)
const SUPABASE_URL = 'https://enw...supabase.co'; // Masukkan URL Supabase Anda
const SUPABASE_KEY = 'sb_pub...'; // Masukkan API Key Supabase (Anon Key)
const BITESHIP_API_KEY = 'biteship_live...'; // Masukkan API Key Biteship Anda

// Inisialisasi Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. FUNGSI OTOMATIS MENCARI LOCATION ID (ORIGIN)
async function getOriginID() {
    try {
        const response = await fetch('https://api.biteship.com/v1/maps/origins', {
            headers: { 'Authorization': BITESHIP_API_KEY }
        });
        const data = await response.json();
        if (data.success && data.origins.length > 0) {
            console.log("Location ID Ditemukan:", data.origins[0].id);
            return data.origins[0].id; // Mengambil ID alamat Surabaya Anda
        }
        console.error("Alamat tidak ditemukan di Biteship. Pastikan sudah isi alamat Pickup.");
    } catch (err) {
        console.error("Error Biteship:", err);
    }
}

// 3. FUNGSI MENAMPILKAN PRODUK DARI SUPABASE
async function displayProducts() {
    const { data: products, error } = await _supabase.from('products').select('*');
    const container = document.getElementById('product-list');
    
    if (error) {
        container.innerHTML = "<p>Gagal memuat produk.</p>";
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <h4>${p.name}</h4>
            <p>Harga: Rp${p.price.toLocaleString()}</p>
            <p>Berat: ${p.weight_grams}g</p>
            <button onclick="selectProduct('${p.id}', ${p.weight_grams})">Pilih Produk</button>
        </div>
    `).join('');
}

// Jalankan fungsi saat web dibuka
displayProducts();
getOriginID();