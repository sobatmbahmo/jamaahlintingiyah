// 1. KONFIGURASI UTAMA
const SUPABASE_URL = 'https://enwngiuiqcnbonhinctl.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9qtNidZ7beAGgAMuMmW2ZA_i9Cl-tE9'; 
const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos'; 
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
            <div class="card">
                <h3>${p.name}</h3>
                <p style="color: #bbb; font-size: 0.9em;">${p.description}</p>
                <p>Harga: <b>Rp${p.price.toLocaleString('id-ID')}</b></p>
                <button onclick="pilihProduk('${p.name}', ${p.price}, ${p.weight_grams})">PILIH PRODUK</button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = "Gagal memuat database.";
    }
}

// 3. PILIH PRODUK
window.pilihProduk = function(name, price, weight) {
    selectedProduct = { name, price, weight };
    document.getElementById('form-pesanan').style.display = 'block';
    document.getElementById('selected-product-info').innerHTML = `📦 <b>Pesanan:</b> ${name} (${weight}g)`;
    document.getElementById('form-pesanan').scrollIntoView({ behavior: 'smooth' });
};

// 4. CEK ONGKIR (DENGAN PERBAIKAN DESTINATION NAME)
async function handleCekOngkir() {
    const inputArea = document.getElementById('destination-area');
    const areaTujuan = inputArea ? inputArea.value : "";
    const resDiv = document.getElementById('shipping-options');

    if (!areaTujuan || areaTujuan.length < 3) return alert("Masukkan Nama Kecamatan & Kota!");
    if (!selectedProduct) return alert("Pilih produk dulu!");

    resDiv.innerHTML = "🔍 Menghitung ongkir...";

    try {
        const payload = {
            origin_id: ORIGIN_ID,
            destination_name: areaTujuan, // Mengambil nilai dari input
            items: [{
                name: selectedProduct.name.substring(0, 40),
                value: parseInt(selectedProduct.price),
                weight: parseInt(selectedProduct.weight) || 100,
                quantity: 1
            }]
        };

        const response = await fetch('https://api.biteship.com/v1/rates/couriers', {
            method: 'POST',
            headers: { 
                'Authorization': BITESHIP_API_KEY, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (data.success && data.pricing.length > 0) {
            resDiv.innerHTML = data.pricing.map(s => `
                <div class="shipping-item" onclick="setFinal('${s.courier_name}', '${s.courier_service}', ${s.price})">
                    <b>${s.courier_name.toUpperCase()}</b> - ${s.courier_service}<br>
                    Harga: Rp${s.price.toLocaleString('id-ID')} | Estimasi: ${s.duration}
                </div>
            `).join('');
        } else {
            resDiv.innerHTML = `<p style="color:orange;">Biteship: ${data.message || "Lokasi tidak ditemukan."}</p>`;
        }
    } catch (err) {
        resDiv.innerHTML = "Terjadi kesalahan koneksi.";
    }
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



