// 1. KONFIGURASI (Pastikan data ini sama dengan catatan Anda)
const SUPABASE_URL = 'https://enwngiuiqcnbonhinctl.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9qtNidZ7beAGgAMuMmW2ZA_i9Cl-tE9'; 
const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos'; 

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedProduct = null;
let originID = null;

// 2. AMBIL ORIGIN ID (LOKASI SURABAYA) OTOMATIS
async function fetchOrigin() {
    try {
        const response = await fetch('https://api.biteship.com/v1/maps/origins', {
            headers: { 'Authorization': BITESHIP_API_KEY }
        });
        const data = await response.json();
        if (data.success && data.origins.length > 0) {
            originID = data.origins[0].id; // Mengambil ID Rusunawa Gunungsari
            console.log("Origin ID Aktif:", originID);
        }
    } catch (err) {
        console.error("Gagal koneksi ke Biteship:", err);
    }
}

// 3. TAMPILKAN PRODUK DARI SUPABASE
async function loadProducts() {
    const list = document.getElementById('product-list');
    try {
        const { data: products, error } = await _supabase.from('products').select('*');
        
        if (error) throw error;
        if (products.length === 0) {
            list.innerHTML = "<p>Produk belum diinput di Supabase.</p>";
            return;
        }

        list.innerHTML = products.map(p => `
            <div class="card">
                <h4>${p.name}</h4>
                <p style="font-size: 0.8em; color: #666;">${p.description}</p>
                <p><strong>Rp${p.price.toLocaleString()}</strong></p>
                <button onclick="pilihProduk('${p.name}', ${p.price}, ${p.weight_grams})">Pilih Produk</button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = "<p>Gagal memuat database. Cek API Key Supabase Anda.</p>";
    }
}

// 4. PILIH PRODUK & TAMPILKAN FORM
function pilihProduk(name, price, weight) {
    selectedProduct = { name, price, weight };
    document.getElementById('form-pesanan').style.display = 'block';
    document.getElementById('selected-product-info').innerText = `Pesanan: ${name} (${weight}g)`;
    window.scrollTo({ top: document.getElementById('form-pesanan').offsetTop, behavior: 'smooth' });
}

// 5. CEK ONGKIR KE BITESHIP
async function handleCekOngkir() {
    const destination = document.getElementById('destination-area').value;
    const resultDiv = document.getElementById('shipping-options');

    if (!destination) return alert("Ketik kecamatan tujuan!");
    if (!originID) return alert("Lokasi pengirim belum siap. Tunggu sebentar.");

    resultDiv.innerHTML = "Sedang menghitung ongkir...";

    try {
        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: { 
                'Authorization': BITESHIP_API_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                origin_id: originID,
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
                <div class="shipping-item" onclick="setFinal('${s.courier_name}', '${s.courier_service}', ${s.price})">
                    <strong>${s.courier_name.toUpperCase()}</strong> - ${s.courier_service}<br>
                    Harga: Rp${s.price.toLocaleString()} (Estimasi: ${s.duration})
                </div>
            `).join('');
        } else {
            resultDiv.innerHTML = "Kecamatan tidak ditemukan. Coba ketik nama kecamatan saja.";
        }
    } catch (err) {
        resultDiv.innerHTML = "Gagal mengecek ongkir.";
    }
}

// 6. FINALISASI & WHATSAPP
let finalShipping = null;

function setFinal(courier, service, price) {
    finalShipping = { courier, service, price };
    document.getElementById('final-summary').style.display = 'block';
    document.getElementById('summary-text').innerHTML = `
        Total Produk: Rp${selectedProduct.price.toLocaleString()}<br>
        Ongkir (${courier}): Rp${price.toLocaleString()}<br>
        <strong>Total Bayar: Rp${(selectedProduct.price + price).toLocaleString()}</strong>
    `;
}

function kirimKeWhatsApp() {
    const buyerName = document.getElementById('buyer-name').value;
    const destination = document.getElementById('destination-area').value;
    
    if (!buyerName) return alert("Isi nama Anda!");

    const waNumber = "6285700800278";
    const pesan = `Halo Jamaah Lintingiyah, saya mau pesan:\n\n` +
                  `Produk: ${selectedProduct.name}\n` +
                  `Nama: ${buyerName}\n` +
                  `Tujuan: ${destination}\n` +
                  `Kurir: ${finalShipping.courier} (${finalShipping.service})\n` +
                  `Total: Rp${(selectedProduct.price + finalShipping.price).toLocaleString()}\n\n` +
                  `Mohon info rekening pembayarannya.`;

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(pesan)}`);
}

// Jalankan saat halaman dibuka
fetchOrigin();
loadProducts();
