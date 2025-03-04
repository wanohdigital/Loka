let currentSection = 'home';
let selectedProductId = null;
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fungsi untuk menangani active state footer
function showSection(section, element) {
    document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    
    $('#contentSection').html('');

    switch(section) {
        case 'home':
            showHomeSection();
            break;
        case 'transaction':
            showTransactionSection();
            break;
        case 'history':
            showHistorySection();
            break;
        case 'stock':
            showStockSection();
            break;
        case 'catalog':
            showCatalogSection();
            break;
    }
}

// 1. Section Beranda
function showHomeSection() {
    $('#contentSection').html(`
        <div class="card card-custom mb-4">
            <div class="card-body">
                <h3 class="text-center">Loka</h3>
                <p class="text-center">
                    Solusi digitalisasi warung modern untuk mengelola produk, stok, dan transaksi dengan mudah, <strong>gratis</strong> dan <strong>tanpa harus login</strong>. Cukup akses dan bisa langsung dipakai. Bisa diakses tanpa internet (<strong>Offline</strong>) juga!
                </p>
                <div class="row row-cols-1 row-cols-md-2 g-4">
                    <div class="col">
                        <div class="card h-100 card-custom">
                            <div class="card-body">
                                <h5><i class="fas fa-cash-register"></i> Transaksi</h5>
                                <p>Kelola penjualan dengan keranjang belanja digital.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="card h-100 card-custom">
                            <div class="card-body">
                                <h5><i class="fas fa-history"></i> Riwayat</h5>
                                <p>Lihat riwayat transaksi dan cetak struk.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="card h-100 card-custom">
                            <div class="card-body">
                                <h5><i class="fas fa-warehouse"></i> Cek Stok</h5>
                                <p>Pantau stok barang secara real-time dengan fitur pencarian.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="card h-100 card-custom">
                            <div class="card-body">
                                <h5><i class="fas fa-box"></i> Kelola Produk</h5>
                                <p>Tambah, edit, dan hapus produk dengan fitur drag-and-drop.</p>
                            </div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="card h-100 card-custom">
                            <div class="card-body">
                                <h5><i class="fas fa-box"></i> Backup/Kembalikan Data</h5>
                                <p>Download atau upload data untuk kepentingan pencegan bisa dilakukan <a href="javascript:void(0);" onclick="showBackupModal()">di sini</a>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
}

// 2. Section Transaksi
function showTransactionSection() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    
    $('#contentSection').html(`
        <div class="card card-custom mb-4">
            <div class="card-header">Transaksi Penjualan</div>
            <div class="card-body">
                <div>
                    <button class="btn btn-success w-100 mb-3" data-bs-toggle="modal" data-bs-target="#scanCartModal">
                        <i class="fas fa-barcode"></i> Scan ke Keranjang
                    </button>
                </div>
                <div class="separator">Atau Pilih Manual</div>
                <div>
                    <select id="transactionProduct" class="form-control select-product">
                        <option value="">-- Pilih Produk --</option>
                        ${products.map(p => `<option value="${p.id}">${p.name} (${p.barcode})</option>`).join('')}
                    </select>
                </div>
                <div class="mt-3 mb-3"><hr /></div>
                <div class="input-group mb-3">
                    <input type="number" id="transactionQuantity" class="form-control" placeholder="Jumlah" value="1">
                    <button class="btn btn-custom" onclick="addToCart()">
                        <i class="fas fa-plus"></i> Tambah
                    </button>
                </div>
                <div id="cartItems"></div>
            </div>
        </div>
    `);

    loadCart();

    $('#transactionProduct').select2({
        placeholder: "Pilih produk",
        allowClear: true
    });

    reloadSelect2();
}

// Reload Select2 options saat data produk berubah
function reloadSelect2() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    $('#transactionProduct').empty();
    products.forEach(p => {
        $('#transactionProduct').append(new Option(`${p.name} (${p.barcode})`, p.id));
    });
    $('#transactionProduct').trigger('change'); // Refresh Select2
}

// 3. Section Riwayat
function showHistorySection() {
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const today = new Date().toISOString().split('T')[0];
    
    // Hitung total omset hari ini
    const totalHariIni = transactions
        .filter(t => new Date(t.id).toISOString().split('T')[0] === today)
        .reduce((sum, t) => sum + t.total, 0);
    
    let html = `
        <div class="card card-custom mb-4">
            <div class="card-header">Total Omset Hari Ini</div>
            <div class="card-body text-center">
                <h3>${formatRupiah(totalHariIni)}</h3>
            </div>
        </div>
        <div class="card card-custom mb-4">
            <div class="card-header">Riwayat Transaksi</div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover table-custom">
                        <thead>
                            <tr>
                                <th>ID Transaksi</th>
                                <th>Total</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(t => `
                                <tr>
                                    <td>#${t.id}</td>
                                    <td>Rp${formatRupiah(t.total)}</td>
                                    <td>
                                        <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                        <button class="btn btn-primary btn-sm" onclick="printReceipt(${t.id})">
                                            <i class="fas fa-print"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    $('#contentSection').html(html);
}

// 4. Section Stok dengan Pencarian
function showStockSection() {
    $('#contentSection').html(`
        <div class="card card-custom mb-4">
            <div class="card-header">Cek Stok Barang</div>
            <div class="card-body">
                <div class="mb-3">
                    <input type="text" id="searchStock" class="form-control" 
                            placeholder="Cari barang..." 
                            oninput="searchStock()">
                </div>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>Nama Barang</th>
                                <th>Harga</th>
                                <th>Stok</th>
                            </tr>
                        </thead>
                        <tbody id="stockTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `);
    loadStockProducts();
}

// 5. Section Produk
function showCatalogSection() {
    $('#contentSection').html(`
        <div class="card card-custom mb-4">
            <div class="card-header">Kelola Produk</div>
            <div class="card-body">
                <div class="mb-3">
                    <button class="btn btn-success w-100 mt-2" data-bs-toggle="modal" data-bs-target="#scanProductModal">
                        <i class="fas fa-barcode"></i> Scan Barcode
                    </button>
                    <div class="separator">Atau</div>
                    <input type="text" id="barcode" class="form-control" placeholder="Barcode" required>
                </div>
                <div class="mt-5 mb-5"><hr /></div>
                <div class="mb-3">
                    <input type="text" id="productName" class="form-control" placeholder="Nama Barang">
                </div>
                <div class="row g-3">
                    <div class="col">
                        <input type="number" id="productPrice" class="form-control" placeholder="Harga">
                    </div>
                    <div class="col">
                        <input type="number" id="productStock" class="form-control" placeholder="Stok Awal">
                    </div>
                </div>
                <button class="btn btn-custom w-100 mt-3" onclick="saveProduct()">
                    <i class="fas fa-save"></i> Simpan Produk
                </button>
            </div>
            <div class="card-body" id="productList"></div>
        </div>
    `);
    loadProducts();
}

// Fungsi untuk mengelola produk
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    let html = `
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            ${products.map(p => `
                <div class="col">
                    <div class="card h-100 card-custom">
                        <div class="card-body">
                            <h5 class="card-title">${p.name}</h5>
                            <p class="card-text">
                                Harga: Rp${p.price}<br>
                                Stok: ${p.stock}
                            </p>
                            <div class="d-flex gap-2">
                                <button class="btn btn-warning btn-sm" onclick="editProduct(${products.indexOf(p)})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${products.indexOf(p)})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    $('#productList').html(html);
}

// Simpan produk dengan barcode
function saveProduct() {
    const barcode = $('#barcode').val();
    const name = $('#productName').val();
    const price = $('#productPrice').val();
    const stock = $('#productStock').val();
    
    if (!barcode || !name || !price || !stock) {
        return Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Lengkapi semua data!',
            confirmButtonText: 'OK'
        });
    }
    
    // Cek barcode duplikat saat tambah baru
    if (!selectedProductId) {
        const existingProduct = JSON.parse(localStorage.getItem('products')).find(p => p.barcode === barcode);
        if (existingProduct) {
            return Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Barcode sudah terdaftar!',
                confirmButtonText: 'OK'
            });
        }
    }

    const product = { 
        id: selectedProductId || Date.now(),
        barcode,
        name, 
        price, 
        stock: parseInt(stock) 
    };

    let products = JSON.parse(localStorage.getItem('products')) || [];
    if (selectedProductId) {
        products = products.map(p => p.id === selectedProductId ? product : p);
        selectedProductId = null;
    } else {
        products.push(product);
    }

    localStorage.setItem('products', JSON.stringify(products));
    clearForm();
    loadProducts();
}

// Edit produk tanpa mengubah barcode
function editProduct(index) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products[index];
    selectedProductId = product.id;
    
    $('#barcode').val(product.barcode); // Nonaktifkan input barcode
    $('#productName').val(product.name);
    $('#productPrice').val(product.price);
    $('#productStock').val(product.stock);
}

function deleteProduct(index) {
    if (!confirm('Hapus produk ini?')) return;
    
    let products = JSON.parse(localStorage.getItem('products')) || [];
    products.splice(index, 1);
    localStorage.setItem('products', JSON.stringify(products));
    loadProducts();
}

function clearForm() {
    $('#barcode').val('');
    $('#productName').val('');
    $('#productPrice').val('');
    $('#productStock').val('');
}

// Fungsi untuk pencarian stok
function searchStock() {
    const searchTerm = $('#searchStock').val().toLowerCase();
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm)
    );
    
    let html = '';
    filteredProducts.forEach(p => {
        html += `
            <tr>
                <td>${p.name}</td>
                <td>Rp${p.price}</td>
                <td>${p.stock}</td>
            </tr>
        `;
    });
    $('#stockTableBody').html(html);
}

// Fungsi untuk load stok produk
function loadStockProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    let html = '';
    products.forEach(p => {
        html += `
            <tr>
                <td>${p.name}</td>
                <td>Rp${p.price}</td>
                <td>${p.stock}</td>
            </tr>
        `;
    });
    $('#stockTableBody').html(html);
}

// Fungsi untuk keranjang belanja
function addToCart() {
    const productId = $('#transactionProduct').val();
    const quantity = parseInt($('#transactionQuantity').val()) || 0;
    
    if (!productId || quantity <= 0) {
        return Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Pastikan produk dan jumlah terisi!',
            confirmButtonText: 'OK'
        });
    }
    
    const product = JSON.parse(localStorage.getItem('products')).find(p => p.id == productId);
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

function loadCart() {
    let html = `
        <div class="table-responsive">
            <table class="table table-hover table-custom">
                <thead>
                    <tr>
                        <th>Produk</th>
                        <th>Jumlah</th>
                        <th>Total</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${cart.map((item, index) => `
                        <tr>
                            <td>${item.name}</td>
                            <td>
                                <div class="input-group input-group-sm">
                                    <button class="btn btn-outline-secondary" onclick="updateCartItem(${index}, ${item.quantity-1})">
                                        <i class="fas fa-minus"></i>
                                    </button>
                                    <input type="text" class="form-control text-center" 
                                            value="${item.quantity}" 
                                            onchange="updateCartItem(${index}, this.value)">
                                    <button class="btn btn-outline-secondary" onclick="updateCartItem(${index}, ${item.quantity+1})">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </td>
                            <td>Rp${item.price * item.quantity}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="deleteCartItem(${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <button class="btn btn-custom w-100 mt-3" onclick="completeTransaction()">
            <i class="fas fa-check-circle"></i> Selesai Transaksi
        </button>
    `;
    $('#cartItems').html(html);
}

function updateCartItem(index, value) {
    if (value > 0) {
        cart[index].quantity = parseInt(value);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}

function deleteCartItem(index) {
    if (confirm('Hapus item ini dari keranjang?')) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}

function completeTransaction() {
    if (cart.length === 0) {
        return Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Keranjang kosong!',
            confirmButtonText: 'OK'
        });
    }
    
    const transaction = {
        id: Date.now(),
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    const products = JSON.parse(localStorage.getItem('products'));
    cart.forEach(cartItem => {
        const product = products.find(p => p.id == cartItem.id);
        product.stock -= cartItem.quantity;
    });
    localStorage.setItem('products', JSON.stringify(products));
    
    cart = [];
    localStorage.removeItem('cart');
    loadCart();

    Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Transaki berhasil terekam!',
        confirmButtonText: 'OK'
    });
}

// Fungsi untuk cetak struk
function printReceipt(transactionId) {
    const transaction = JSON.parse(localStorage.getItem('transactions')).find(t => t.id == transactionId);
    
    let receipt = `
        <div class="receipt rounded-3 shadow p-4">
            <h5 class="text-center mb-3">Struk Pembelian</h5>
            <hr>
            <div class="text-muted">Tanggal: ${new Date(transaction.id).toLocaleString()}</div>
            <table class="table table-borderless">
                <tbody>
                    ${transaction.items.map(item => `
                        <tr>
                            <td>${item.name} x${item.quantity}</td>
                            <td class="text-end">Rp${item.price * item.quantity}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th>Total</th>
                        <th class="text-end">Rp${transaction.total}</th>
                    </tr>
                </tfoot>
            </table>
            <p class="text-center text-muted">Terima kasih telah berbelanja!</p>
        </div>
    `;

    const printWindow = window.open('', '', 'width=500,height=600');
    printWindow.document.write(`
        <html>
            <head>
                <style>
                    body { font-family: 'Poppins', sans-serif; max-width: 400px; margin: 0 auto; }
                    .receipt { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    table { width: 100%; }
                    th, td { text-align: left; }
                    tfoot th, tfoot td { font-weight: bold; }
                </style>
            </head>
            <body>${receipt}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Fungsi untuk hapus transaksi
function deleteTransaction(transactionId) {
    if (!confirm('Hapus transaksi ini?')) return;
    
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    transactions = transactions.filter(t => t.id != transactionId);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    showHistorySection();
}

// Jalankan section beranda saat pertama kali
$(function() {
    showTransactionSection();
    $('#transaction-section').addClass('active');
});

function backupData() {
    const data = {
        products: JSON.parse(localStorage.getItem('products')) || [],
        transactions: JSON.parse(localStorage.getItem('transactions')) || []
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = 'warungku-backup.json';
    link.href = url;
    link.click();
}

function restoreData() {
    const fileInput = document.getElementById('restoreFile');
    const file = fileInput.files[0];
    
    if (!file) {
        return Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Pilih file backup!',
            confirmButtonText: 'OK'
        });
    }
    
    const reader = new FileReader();
    reader.onload = function() {
        const data = JSON.parse(reader.result);
        localStorage.setItem('products', JSON.stringify(data.products));
        localStorage.setItem('transactions', JSON.stringify(data.transactions));
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: 'Data berhasil dikembalikan!',
            confirmButtonText: 'OK'
        });
        location.reload();
    };
    reader.readAsText(file);
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        $('#installModal').modal('show');
    }, 3000); // Munculkan modal setelah 3 detik
});

function installPWA() {
    $('#installModal').modal('hide');
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') {
            console.log('PWA installed');
        }
        deferredPrompt = null;
    });
}

function showBackupModal() {
    $('#backupModal').modal('show');
}

// Inisialisasi Quagga untuk Produk
function initProductScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.getElementById('scanner-product'),
            constraints: { 
                facingMode: "environment",
                width: { min: 640, ideal: 1920 },
                height: { min: 480, ideal: 1080 },
                aspectRatio: { // Paksa rasio 16:9
                    min: 1.777,
                    max: 1.778
                }
            }
        },
        decoder: { 
            readers: ["ean_reader", "code_128_reader", "upc_reader"],
            locator: {
                halfSample: false,
                patchSize: "large",
                debug: {
                    showCanvas: true,
                    showPatches: true,
                    showFoundPatches: true,
                    drawBoundingBox: true // Aktifkan overlay Quagga
                }
            }
        }
    }, err => {
        if (err) return console.error(err);
        Quagga.start();
    });
    
    // Tambahkan overlay Quagga
    Quagga.onProcessed(result => {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        if (result && result.boxes) {
            result.boxes.forEach(box => {
                drawingCtx.strokeStyle = "#fff";
                drawingCtx.lineWidth = 2;
                drawingCtx.strokeRect(
                    box[0], box[1], 
                    box[2] - box[0], box[3] - box[1]
                );
            });
        }
    });

    Quagga.onDetected(data => {
        const barcode = data.codeResult.code;
        document.getElementById('barcode').value = barcode;
        $('#scanProductModal').modal('hide');
        Quagga.stop();
        playBeep();
        $('#productName').focus(); // Auto-fokus ke nama produk
    });
}

// Inisialisasi Quagga untuk Keranjang
function initCartScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.getElementById('scanner-cart'),
            constraints: { 
                facingMode: "environment",
                width: { min: 640, ideal: 1920 },
                height: { min: 480, ideal: 1080 },
                aspectRatio: { // Paksa rasio 16:9
                    min: 1.777,
                    max: 1.778
                }
            }
        },
        decoder: { 
            readers: ["ean_reader", "code_128_reader", "upc_reader"],
            locator: {
                halfSample: false,
                patchSize: "large",
                debug: {
                    showCanvas: true,
                    showPatches: true,
                    showFoundPatches: true,
                    drawBoundingBox: true // Aktifkan overlay Quagga
                }
            }
        }
    }, err => {
        if (err) return console.error(err);
        Quagga.start();
    });
    
    // Tambahkan overlay Quagga
    Quagga.onProcessed(result => {
        const drawingCtx = Quagga.canvas.ctx.overlay;
        const drawingCanvas = Quagga.canvas.dom.overlay;
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        
        if (result && result.boxes) {
            result.boxes.forEach(box => {
                drawingCtx.strokeStyle = "#fff";
                drawingCtx.lineWidth = 2;
                drawingCtx.strokeRect(
                    box[0], box[1], 
                    box[2] - box[0], box[3] - box[1]
                );
            });
        }
    });

    Quagga.onDetected(data => {
        const barcode = data.codeResult.code;
        const product = JSON.parse(localStorage.getItem('products')).find(p => p.barcode === barcode);
        
        if (product) {
            // Auto-add dengan quantity 1
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ 
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            loadCart();
            $('#scanCartModal').modal('hide');
            Quagga.stop();
            playBeep();
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: `${product.name} ditambahkan ke keranjang!`,
                confirmButtonText: 'OK'
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Gagal!',
                text: 'Produk tidak ditemukan!',
                confirmButtonText: 'OK'
            });
            Quagga.stop();
        }
    });
}

// Tambah ke keranjang dari scan
function addToCartFromScan() {
    const quantity = parseInt($('#cartQuantity').val()) || 0;
    const product = window.currentScannedProduct;
    
    if (!product || quantity <= 0) {
        return Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: 'Pastikan produk dan jumlah terisi!',
            confirmButtonText: 'OK'
        });
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ 
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
    $('#scanCartModal').modal('hide');
    Quagga.stop();
}

// Handler modal
$('#scanProductModal').on('shown.bs.modal', initProductScanner);
$('#scanProductModal').on('hidden.bs.modal', () => {
    Quagga.stop();
    Quagga.offProcessed();
});

$('#scanCartModal').on('shown.bs.modal', initCartScanner);
$('#scanCartModal').on('hidden.bs.modal', () => {
    Quagga.stop();
    Quagga.offProcessed(); // Bersihkan event listener
    $('#productInfo').addClass('d-none');
    delete window.currentScannedProduct;
});

// Putar suara saat scan berhasil
function playBeep() {
    const beep = document.getElementById('beepSound');
    beep.play().catch(error => console.log('Autoplay blocked:', error));
}

// Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        minimumFractionDigits: 0 
    }).format(angka);
}