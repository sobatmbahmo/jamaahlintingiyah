// 1. KONFIGURASI UTAMA
// Masukkan URL dan Key anon dari dashboard Supabase Anda
const SUPABASE_URL = 'https://enwngiuiqcnbonhinctl.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9qtNidZ7beAGgAMuMmW2ZA_i9Cl-tE9'; 
const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos'; 

// ID Lokasi Rusunawa Gunungsari yang baru saja ditemukan
const ORIGIN_ID = "679c6d59f303c70012920216"; 

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedProduct = null;
let finalShipping = null;

// 2. AMBIL PRODUK DARI SUPABASE
async function loadProducts() {
    const list = document.getElementById('product-list');
    list.innerHTML = "<p>Sedang memuat produk...</p>";

    try {
        const { data: products, error } = await _supabase
            .from('products')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        list.innerHTML = products.map(p => `
            <div class="card">
                <h4>${p.name}</h4>
                <p style="font-size: 0.85em; color: #bbb;">${p.description}</p>
                <p><strong>Rp${p.price.toLocaleString('id-ID')}</strong></p>
                <button onclick="pilihProduk('${p.name}', ${p.price}, ${p.weight_grams})">Pilih & Cek Ongkir</button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        list.innerHTML = "<p>Gagal memuat produk. Pastikan RLS Supabase sudah 'Enable read access'.</p>";
    }
}

// 3. FUNGSI PILIH PRODUK
function pilihProduk(name, price, weight) {
    selectedProduct = { name, price, weight };
    
    // Tampilkan form pesanan dan scroll otomatis
    const formSection = document.getElementById('form-pesanan');
    formSection.style.display = 'block';
    document.getElementById('selected-product-info').innerHTML = `
        <strong>Produk:</strong> ${name} | <strong>Berat:</strong> ${weight} gram
    `;
    
    formSection.scrollIntoView({ behavior: 'smooth' });
}

// 4. CEK ONGKIR KE BITESHIP
async function handleCekOngkir() {
    const destination = document.getElementById('destination-area').value;
    const resultDiv = document.getElementById('shipping-options');

    if (!destination || destination.length < 3) return alert("Ketik nama kecamatan tujuan dengan lengkap!");
    if (!selectedProduct) return alert("Pilih produk terlebih dahulu!");

    resultDiv.innerHTML = "🔍 Sedang menghitung ongkir...";

    try {
        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: { 
                'Authorization': BITESHIP_API_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                origin_id: ORIGIN_ID,
                destination_name: destination,
                items: [{
                    name: selectedProduct.name,
                    quantity: 1,
                    value: selectedProduct.price,
                    weight: selectedProduct.weight
                }]
            })
        });

        const data = await response.json();
        
        if (data.success) {
            resultDiv.innerHTML = data.pricing.map(s => `
                <div class="shipping-item" onclick="setFinalShipping('${s.courier_name}', '${s.courier_service}', ${s.price})">
                    <input type="radio" name="kurir"> 
                    <strong>${s.courier_name.toUpperCase()}</strong> (${s.courier_service}) <br>
                    Harga: Rp${s.price.toLocaleString('id-ID')} | Estimasi: ${s.duration}
                </div>
            `).join('');
        } else {
            resultDiv.innerHTML = "<p style='color:orange;'>Kecamatan tidak ditemukan. Coba ketik lebih detail (Contoh: Wonokromo, Surabaya).</p>";
        }
    } catch (err) {
        resultDiv.innerHTML = "<p style='color:red;'>Gagal mengecek ongkir. Cek koneksi atau saldo Biteship.</p>";
    }
}

// 5. SET KURIR & TAMPILKAN TOTAL
function setFinalShipping(courier, service, price) {
    finalShipping = { courier, service, price };
    const total = selectedProduct.price + price;
    
    const summaryDiv = document.getElementById('final-summary');
    summaryDiv.style.display = 'block';
    document.getElementById('summary-text').innerHTML = `
        <p>Harga Produk: Rp${selectedProduct.price.toLocaleString('id-ID')}</p>
        <p>Ongkir (${courier} - ${service}): Rp${price.toLocaleString('id-ID')}</p>
        <hr>
        <h3>Total Bayar: Rp${total.toLocaleString('id-ID')}</h3>
    `;
}

// 6. KIRIM KE WHATSAPP ADMIN
function kirimKeWhatsApp() {
    const buyerName = document.getElementById('buyer-name').value;
    const destination = document.getElementById('destination-area').value;
    
    if (!buyerName) return alert("Masukkan nama lengkap Anda!");
    if (!finalShipping) return alert("Pilih layanan kurir terlebih dahulu!");

    const waAdmin = "6285700800278";
    const totalBayar = selectedProduct.price + finalShipping.price;
    
    const pesan = `Halo Jamaah Lintingiyah, saya ingin pesan:\n\n` +
                  `*Detail Pesanan:*\n` +
                  `- Produk: ${selectedProduct.name}\n` +
                  `- Berat: ${selectedProduct.weight} gram\n\n` +
                  `*Data Pembeli:*\n` +
                  `- Nama: ${buyerName}\n` +
                  `- Alamat/Kec: ${destination}\n\n` +
                  `*Pengiriman:*\n` +
                  `- Kurir: ${finalShipping.courier} (${finalShipping.service})\n` +
                  `- Ongkir: Rp${finalShipping.price.toLocaleString('id-ID')}\n\n` +
                  `*TOTAL PEMBAYARAN: Rp${totalBayar.toLocaleString('id-ID')}*\n\n` +
                  `Mohon info rekeningnya, terima kasih.`;

    window.open(`https://wa.me/${waAdmin}?text=${encodeURIComponent(pesan)}`);
}

// Jalankan pengambilan produk saat halaman dibuka
loadProducts();

