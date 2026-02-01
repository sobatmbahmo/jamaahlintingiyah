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
async function handleCekOngkir() {
    const destination = document.getElementById('destination-area').value;
    const resultDiv = document.getElementById('shipping-options');

    // 1. Validasi Input
    if (!destination || destination.length < 3) return alert("Ketik nama kecamatan tujuan dengan lengkap!");
    if (!selectedProduct) return alert("Pilih produk terlebih dahulu!");

    resultDiv.innerHTML = "🔍 Sedang menghitung ongkir...";

    try {
        // 2. Persiapkan data kirim (Pastikan semua angka adalah Integer)
        const requestBody = {
            origin_id: ORIGIN_ID,
            destination_name: destination,
            items: [{
                name: String(selectedProduct.name),
                description: "Produk Jamaah Lintingiyah",
                value: parseInt(selectedProduct.price), // Harus angka bulat
                weight: parseInt(selectedProduct.weight) || 100, // Minimal 100g jika data kosong
                quantity: 1
            }]
        };

        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: { 
                'Authorization': BITESHIP_API_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.success && data.pricing && data.pricing.length > 0) {
            resultDiv.innerHTML = data.pricing.map(s => `
                <div class="shipping-item" style="border:1px solid #d4af37; padding:10px; margin-bottom:5px; cursor:pointer;" 
                     onclick="setFinalShipping('${s.courier_name}', '${s.courier_service}', ${s.price})">
                    <strong>${s.courier_name.toUpperCase()}</strong> - ${s.courier_service}<br>
                    Harga: Rp${s.price.toLocaleString('id-ID')} | Estimasi: ${s.duration}
                </div>
            `).join('');
        } else {
            // Tampilkan alasan error dari Biteship jika ada
            const errorMsg = data.error || data.message || "Kecamatan tidak ditemukan.";
            resultDiv.innerHTML = `<p style='color:orange;'>Gagal: ${errorMsg}. Coba ketik nama Kecamatan dan Kota.</p>`;
        }
    } catch (err) {
        console.error("Detail Error:", err);
        resultDiv.innerHTML = "<p style='color:red;'>Terjadi kesalahan teknis. Cek koneksi internet.</p>";
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

    // 1. Validasi Input Dasar
    if (!destination || destination.length < 3) return alert("Ketik nama kecamatan tujuan dengan lengkap!");
    if (!selectedProduct) return alert("Silakan klik tombol 'Pilih Produk' pada salah satu barang terlebih dahulu!");

    resultDiv.innerHTML = "🔍 Sedang menghitung ongkir...";

    try {
        // 2. Pembersihan Data (Data Cleaning)
        // Memastikan tidak ada data undefined atau null yang terkirim
        const itemName = selectedProduct.name || "Produk Jamaah Lintingiyah";
        const itemPrice = parseInt(selectedProduct.price) || 0;
        const itemWeight = parseInt(selectedProduct.weight) || 100; // Default 100g jika data nol

        const requestBody = {
            origin_id: ORIGIN_ID,
            destination_name: destination,
            items: [{
                name: itemName.substring(0, 49), // Nama produk maksimal 50 karakter sesuai aturan Biteship
                description: "Produk Tobacco",
                value: itemPrice,
                weight: itemWeight,
                quantity: 1
            }]
        };

        console.log("Data dikirim ke Biteship:", requestBody); // Untuk cek di Inspect Console

        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: { 
                'Authorization': BITESHIP_API_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (data.success && data.pricing) {
            if (data.pricing.length === 0) {
                resultDiv.innerHTML = "<p style='color:orange;'>Kurir tidak tersedia untuk wilayah ini. Coba ketik: Nama Kecamatan, Nama Kota.</p>";
                return;
            }

            resultDiv.innerHTML = data.pricing.map(s => `
                <div class="shipping-item" style="border: 1px solid #d4af37; padding: 10px; margin: 10px 0; cursor: pointer; border-radius: 8px;" 
                     onclick="setFinalShipping('${s.courier_name}', '${s.courier_service}', ${s.price})">
                    <input type="radio" name="kurir_pilihan">
                    <strong>${s.courier_name.toUpperCase()}</strong> (${s.courier_service}) <br>
                    Harga: Rp${s.price.toLocaleString('id-ID')} | Estimasi: ${s.duration}
                </div>
            `).join('');
        } else {
            // Tampilkan pesan error spesifik dari Biteship
            const pesanError = data.error || data.message || "Kecamatan tidak dikenali.";
            resultDiv.innerHTML = `<p style='color:red;'>Biteship Error: ${pesanError}</p>`;
        }
    } catch (err) {
        console.error("Technical Error:", err);
        resultDiv.innerHTML = "<p style='color:red;'>Gagal terhubung ke Biteship. Pastikan koneksi internet lancar.</p>";
    }
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



