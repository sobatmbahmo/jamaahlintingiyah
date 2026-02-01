// 1. KONFIGURASI UTAMA
const SUPABASE_URL = 'https://enwngiuiqcnbonhinctl.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_9qtNidZ7beAGgAMuMmW2ZA_i9Cl-tE9'; 
const BITESHIP_API_KEY = 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSkFNQUFITElOVElOR0lZQUgiLCJ1c2VySWQiOiI2OTdlNjQ0Y2RmMTUwNDMwOWM0ZWI1YjMiLCJpYXQiOjE3Njk4OTE0OTh9.ko5L08aova8b2N8rJ1roFKIsKZeUpqMPdjJx7jZjjos'; 
const ORIGIN_ID = '679c6d59f303c70012920216'; 

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let selectedProduct = null;
let finalShipping = null;

// 2. AMBIL PRODUK DARI DATABASE
async function loadProducts() {
    const list = document.getElementById('product-list');
    if(!list) return;
    
    list.innerHTML = "<p>Sedang memuat katalog Jamaah...</p>";

    try {
        const { data: products, error } = await _supabase.from('products').select('*').order('name');
        if (error) throw error;

        list.innerHTML = products.map(p => `
            <div class="card" style="border:1px solid #d4af37; padding:15px; margin:10px; border-radius:8px; background:#2d2d2d; color:white;">
                <h4>${p.name}</h4>
                <p style="font-size:0.8em; color:#bbb;">${p.description}</p>
                <p><strong>Rp${p.price.toLocaleString('id-ID')}</strong></p>
                <button onclick="pilihProduk('${p.name}', ${p.price}, ${p.weight_grams})" style="background:#d4af37; color:black; border:none; padding:8px 15px; cursor:pointer; font-weight:bold; border-radius:5px;">PILIH PRODUK</button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = "<p>Gagal memuat produk. Cek API Key Supabase.</p>";
    }
}

// 3. FUNGSI PILIH PRODUK
window.pilihProduk = function(name, price, weight) {
    selectedProduct = { name, price, weight };
    const formSec = document.getElementById('form-pesanan');
    if(formSec) {
        formSec.style.display = 'block';
        document.getElementById('selected-product-info').innerHTML = `Terpilih: <b>${name}</b> (${weight} gram)`;
        formSec.scrollIntoView({ behavior: 'smooth' });
    }
};

// 4. CEK ONGKIR KE BITESHIP
async function handleCekOngkir() {
    // Mengambil teks alamat langsung dari input
    const inputAlamat = document.getElementById('destination-area');
    const alamatTujuan = inputAlamat ? inputAlamat.value : "";
    const resDiv = document.getElementById('shipping-options');

    if (!alamatTujuan || alamatTujuan.length < 3) {
        return alert("Harap ketik nama kecamatan tujuan!");
    }
    if (!selectedProduct) {
        return alert("Pilih produk terlebih dahulu!");
    }

    resDiv.innerHTML = "🔍 Sedang menghubungi Biteship...";

    try {
        const payload = {
            origin_id: ORIGIN_ID,
            destination_name: alamatTujuan, // Data ini yang tadi dianggap kosong
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
        
        if (data.success && data.pricing && data.pricing.length > 0) {
            resDiv.innerHTML = data.pricing.map(s => `
                <div class="shipping-item" onclick="setFinal('${s.courier_name}', '${s.courier_service}', ${s.price})" 
                     style="border:1px solid #d4af37; padding:10px; margin:5px 0; cursor:pointer; background:#333; border-radius:8px;">
                    <strong>${s.courier_name.toUpperCase()}</strong> - ${s.courier_service}<br>
                    Harga: Rp${s.price.toLocaleString('id-ID')}
                </div>
            `).join('');
        } else {
            // Jika masih error, tampilkan detail pesan dari Biteship
            const pesanError = data.error || data.message || "Lokasi tidak ditemukan";
            resDiv.innerHTML = `<p style="color:orange;">Gagal: ${pesanError}</p>`;
        }
    } catch (err) {
        resDiv.innerHTML = "<p style='color:red;'>Terjadi gangguan jaringan.</p>";
    }
}

// 5. SET FINAL & WHATSAPP
window.setFinal = function(courier, service, price) {
    finalShipping = { courier, service, price };
    const total = selectedProduct.price + price;
    document.getElementById('final-summary').style.display = 'block';
    document.getElementById('summary-text').innerHTML = `
        Total Produk: Rp${selectedProduct.price.toLocaleString('id-ID')}<br>
        Ongkir: Rp${price.toLocaleString('id-ID')}<br>
        <hr><h3>TOTAL: Rp${total.toLocaleString('id-ID')}</h3>
    `;
};

function kirimKeWhatsApp() {
    const nama = document.getElementById('buyer-name').value;
    if (!nama || !finalShipping) return alert("Lengkapi data!");

    const pesan = `Halo Jamaah Lintingiyah, saya mau pesan:\n\n` +
                  `Produk: ${selectedProduct.name}\n` +
                  `Nama: ${nama}\n` +
                  `Tujuan: ${document.getElementById('destination-area').value}\n` +
                  `Kurir: ${finalShipping.courier} (${finalShipping.service})\n` +
                  `Total: Rp${(selectedProduct.price + finalShipping.price).toLocaleString('id-ID')}`;

    window.open(`https://wa.me/6285700800278?text=${encodeURIComponent(pesan)}`);
}

// Jalankan
loadProducts();


