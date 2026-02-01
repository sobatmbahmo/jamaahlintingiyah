// 1. KONFIGURASI UTAMA
const SUPABASE_URL = 'https://enwngiuiqcnbonhinctl.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9qtNidZ7beAGgAMuMmW2ZA_i9Cl-tE9'; 
const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos'; 
const ORIGIN_ID = '679c6d59f303c70012920216'; 

// ID Lokasi Rusunawa Gunungsari Anda
const ORIGIN_ID = '679c6d59f303c70012920216'; 

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedProduct = null;
let finalShipping = null;

// 2. LOAD PRODUK
async function loadProducts() {
    const list = document.getElementById('product-list');
    try {
        const { data: products, error } = await _supabase.from('products').select('*').order('name');
        if (error) throw error;
        list.innerHTML = products.map(p => `
            <div class="card" style="border:1px solid #d4af37; padding:15px; margin-bottom:10px; border-radius:10px;">
                <h3>${p.name}</h3>
                <p>Harga: <b>Rp${p.price.toLocaleString('id-ID')}</b></p>
                <button onclick="pilihProduk('${p.name}', ${p.price}, ${p.weight_grams})" style="background:#d4af37; border:none; padding:10px; width:100%; font-weight:bold; cursor:pointer;">PILIH PRODUK</button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = "Gagal memuat produk.";
    }
}

// 3. PILIH PRODUK
window.pilihProduk = function(name, price, weight) {
    selectedProduct = { name, price, weight };
    document.getElementById('form-pesanan').style.display = 'block';
    document.getElementById('selected-product-info').innerHTML = `📦 <b>Pesanan:</b> ${name} (${weight}g)`;
    document.getElementById('form-pesanan').scrollIntoView({ behavior: 'smooth' });
};

// 4. CEK ONGKIR (DENGAN VALIDASI INPUT)
async function handleCekOngkir() {
    const inputArea = document.getElementById('destination-area');
    const areaTujuan = inputArea ? inputArea.value.trim() : "";
    const resDiv = document.getElementById('shipping-options');

    if (!areaTujuan || areaTujuan.length < 3) return alert("Masukkan Nama Kecamatan & Kota!");

    resDiv.innerHTML = "🔍 Menghubungkan ke Biteship...";

    // Jeda 500ms untuk memastikan input sudah terbaca sempurna oleh sistem
    setTimeout(async () => {
        try {
            const payload = {
                origin_id: "679c6d59f303c70012920216", // ID Rusunawa Gunungsari Anda
                destination_name: areaTujuan, 
                items: [{
                    name: selectedProduct.name.substring(0, 30),
                    value: parseInt(selectedProduct.price),
                    weight: parseInt(selectedProduct.weight) || 150,
                    quantity: 1
                }]
            };

            const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
                method: 'POST',
                headers: { 
                    'Authorization': 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos', 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            
            if (data.success && data.pricing && data.pricing.length > 0) {
                resDiv.innerHTML = data.pricing.map(s => `
                    <div class="shipping-item" onclick="setFinal('${s.courier_name}', '${s.courier_service}', ${s.price})" style="background:#333; padding:12px; border:1px solid #d4af37; margin:8px 0; cursor:pointer; border-radius:8px;">
                        <strong style="color:#d4af37;">${s.courier_name.toUpperCase()}</strong> - ${s.courier_service}<br>
                        Harga: Rp${s.price.toLocaleString('id-ID')}
                    </div>
                `).join('');
            } else {
                resDiv.innerHTML = `<p style="color:orange;">Biteship: ${data.message || "Lokasi tidak ditemukan. Gunakan format: Kecamatan, Kota"}</p>`;
            }
        } catch (err) {
            resDiv.innerHTML = "Gagal terhubung ke sistem pengiriman.";
        }
    }, 500);
}

// 5. SET KURIR & WHATSAPP
window.setFinal = function(courier, service, price) {
    finalShipping = { courier, service, price };
    const total = selectedProduct.price + price;
    document.getElementById('final-summary').style.display = 'block';
    document.getElementById('summary-text').innerHTML = `
        <p>Harga Barang: Rp${selectedProduct.price.toLocaleString('id-ID')}</p>
        <p>Ongkir (${courier}): Rp${price.toLocaleString('id-ID')}</p>
        <hr>
        <h3>TOTAL: Rp${total.toLocaleString('id-ID')}</h3>
    `;
};

window.kirimKeWhatsApp = function() {
    const nama = document.getElementById('buyer-name').value;
    const alamat = document.getElementById('destination-area').value;
    if (!nama || !finalShipping) return alert("Lengkapi nama dan pilih kurir!");

    const pesan = `Halo Admin Jamaah Lintingiyah,\n\nSaya ingin memesan:\n` +
                  `- Produk: ${selectedProduct.name}\n` +
                  `- Nama: ${nama}\n` +
                  `- Tujuan: ${alamat}\n` +
                  `- Kurir: ${finalShipping.courier} (${finalShipping.service})\n` +
                  `- Total: Rp${(selectedProduct.price + finalShipping.price).toLocaleString('id-ID')}`;

    window.open(`https://wa.me/6285700800278?text=${encodeURIComponent(pesan)}`);
};

// Start
loadProducts();





