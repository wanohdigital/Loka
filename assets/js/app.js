// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Data Storage
let products = JSON.parse(localStorage.getItem('products')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let storeInfo = JSON.parse(localStorage.getItem('storeInfo')) || {
    name: 'LOKA WARUNG',
    address: 'Jl. Contoh No. 123, Kota'
};
let currentCart = [];
let editingProductIndex = -1;
let scannerInitialized = false;
let productScannerInitialized = false;

// Format currency
function formatCurrency(amount) {
    return 'Rp ' + parseInt(amount).toLocaleString('id-ID');
}

// Generate unique ID
function generateID() {
    return 'TRX' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

// Format date
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get today's date (start of day)
function getTodayStart() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.getTime();
}

// Find product by barcode
function findProductByBarcode(barcode) {
    return products.find(p => p.barcode === barcode);
}

// Update localStorage
function updateStorage() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('storeInfo', JSON.stringify(storeInfo));
}

// Show toast notification
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast';
    
    if (type) {
        toast.classList.add(type);
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize barcode scanner
function initBarcodeScanner(containerId, callback) {
    try {
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#' + containerId),
                constraints: {
                    width: 480,
                    height: 320,
                    facingMode: "environment"
                },
            },
            locator: {
                patchSize: "medium",
                halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10,
            decoder: {
                readers: [
                    "code_128_reader",
                    "ean_reader",
                    "ean_8_reader",
                    "code_39_reader",
                    "code_39_vin_reader",
                    "codabar_reader",
                    "upc_reader",
                    "upc_e_reader",
                    "i2of5_reader"
                ],
                debug: {
                    showCanvas: true,
                    showPatches: true,
                    showFoundPatches: true,
                    showSkeleton: true,
                    showLabels: true,
                    showPatchLabels: true,
                    showRemainingPatchLabels: true,
                    boxFromPatches: {
                        showTransformed: true,
                        showTransformedBox: true,
                        showBB: true
                    }
                }
            },
        }, function(err) {
            if (err) {
                console.error(err);
                showToast('Kamera tidak dapat diakses. Pastikan izin kamera diberikan.', 'error');
                return;
            }
            
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            const code = result.codeResult.code;
            Quagga.stop();
            callback(code);
        });
    } catch (error) {
        console.error('Error initializing scanner:', error);
        showToast('Terjadi kesalahan saat menginisialisasi scanner', 'error');
    }
}

// Render cart items
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    let totalAmount = 0;

    if (currentCart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <p>Belum ada produk ditambahkan</p>
            </div>
        `;
        document.getElementById('total-amount').textContent = formatCurrency(0);
        return;
    }

    let cartHTML = '';
    currentCart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        totalAmount += subtotal;

        cartHTML += `
            <div class="product-card">
                <div class="product-info">
                    <div class="product-name">${item.name}</div>
                    <div class="product-meta">
                        ${item.barcode} | ${item.quantity} x ${formatCurrency(item.price)}
                    </div>
                </div>
                <div class="product-price">${formatCurrency(subtotal)}</div>
                <div class="product-actions">
                    <button class="btn btn-small btn-danger remove-item ripple" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    cartContainer.innerHTML = cartHTML;
    document.getElementById('total-amount').textContent = formatCurrency(totalAmount);

    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            currentCart.splice(index, 1);
            renderCart();
            showToast('Produk dihapus dari keranjang');
        });
    });
}

// Render transaction history
function renderTransactionHistory() {
    const historyContainer = document.getElementById('transaction-history');
    const todayStart = getTodayStart();
    
    // Calculate today's sales and profit
    let todaySales = 0;
    let todayProfit = 0;
    
    transactions.forEach(transaction => {
        if (transaction.date >= todayStart) {
            todaySales += transaction.total;
            todayProfit += transaction.profit;
        }
    });
    
    document.getElementById('today-sales').textContent = formatCurrency(todaySales);
    document.getElementById('today-profit').textContent = formatCurrency(todayProfit);

    if (transactions.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>Belum ada riwayat transaksi</p>
            </div>
        `;
        return;
    }

    let historyHTML = '';
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => b.date - a.date);
    
    sortedTransactions.forEach((transaction, index) => {
        historyHTML += `
            <div class="product-card">
                <div class="product-info">
                    <div class="product-name">${transaction.id}</div>
                    <div class="product-meta">
                        ${formatDate(transaction.date)} | ${transaction.items.length} item
                    </div>
                </div>
                <div class="product-price">${formatCurrency(transaction.total)}</div>
                <div class="product-actions">
                    <button class="btn btn-small view-transaction ripple" data-index="${index}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-transaction ripple" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    historyContainer.innerHTML = historyHTML;

    // Add event listeners
    document.querySelectorAll('.delete-transaction').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (confirm('Hapus transaksi ini?')) {
                transactions.splice(index, 1);
                updateStorage();
                renderTransactionHistory();
                showToast('Transaksi berhasil dihapus', 'success');
            }
        });
    });

    document.querySelectorAll('.view-transaction').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            showReceipt(sortedTransactions[index]);
        });
    });
}

// Render stock list
function renderStockList(searchTerm = '') {
    const stockContainer = document.getElementById('stock-list');
    
    if (products.length === 0) {
        stockContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box"></i>
                <p>Belum ada produk tersedia</p>
            </div>
        `;
        return;
    }

    let filteredProducts = products;
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.barcode.includes(searchTerm)
        );
    }

    if (filteredProducts.length === 0) {
        stockContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Tidak ada produk yang sesuai dengan pencarian</p>
            </div>
        `;
        return;
    }

    let stockHTML = '';
    filteredProducts.forEach(product => {
        let stockBadge = '';
        if (product.stock <= 0) {
            stockBadge = `<span class="badge badge-danger">Habis</span>`;
        } else if (product.stock < 5) {
            stockBadge = `<span class="badge badge-warning">Sedikit</span>`;
        } else {
            stockBadge = `<span class="badge badge-success">Tersedia</span>`;
        }

        stockHTML += `
            <div class="product-card">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">
                        ${product.barcode}
                    </div>
                </div>
                <div class="product-price">
                    Stok: ${product.stock} ${stockBadge}
                </div>
            </div>
        `;
    });

    stockContainer.innerHTML = stockHTML;
}

// Render product list
function renderProductList(searchTerm = '') {
    const productContainer = document.getElementById('product-list');
    
    if (products.length === 0) {
        productContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>Belum ada produk tersedia</p>
            </div>
        `;
        return;
    }

    let filteredProducts = products;
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filteredProducts = products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.barcode.includes(searchTerm)
        );
    }

    if (filteredProducts.length === 0) {
        productContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>Tidak ada produk yang sesuai dengan pencarian</p>
            </div>
        `;
        return;
    }

    let productHTML = '';
    filteredProducts.forEach((product, index) => {
        const originalIndex = products.findIndex(p => p.barcode === product.barcode);
        
        productHTML += `
            <div class="product-card">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-meta">
                        ${product.barcode} | Stok: ${product.stock}
                    </div>
                    <div class="product-meta">
                        Jual: ${formatCurrency(product.price)} | Modal: ${formatCurrency(product.cost)}
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-small edit-product ripple" data-index="${originalIndex}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-danger delete-product ripple" data-index="${originalIndex}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    productContainer.innerHTML = productHTML;

    // Add event listeners
    document.querySelectorAll('.edit-product').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            openEditProductModal(index);
        });
    });

    document.querySelectorAll('.delete-product').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (confirm('Hapus produk ini?')) {
                products.splice(index, 1);
                updateStorage();
                renderProductList();
                renderStockList();
                showToast('Produk berhasil dihapus', 'success');
            }
        });
    });
}

// Open edit product modal
function openEditProductModal(index) {
    const product = products[index];
    editingProductIndex = index;
    
    document.getElementById('edit-product-barcode').value = product.barcode;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-cost').value = product.cost;
    document.getElementById('edit-product-stock').value = product.stock;
    
    const modal = document.getElementById('edit-product-modal');
    M.Modal.getInstance(modal).open();
}

// Show receipt
function showReceipt(transaction) {
    document.getElementById('receipt-store-name').textContent = storeInfo.name;
    document.getElementById('receipt-store-address').textContent = storeInfo.address;
    document.getElementById('receipt-date').textContent = formatDate(transaction.date);
    document.getElementById('receipt-id').textContent = `ID: ${transaction.id}`;
    
    let itemsHTML = '';
    transaction.items.forEach(item => {
        itemsHTML += `
            <div class="receipt-item">
                <div>${item.name} x${item.quantity}</div>
                <div>${formatCurrency(item.price * item.quantity)}</div>
            </div>
        `;
    });
    
    document.getElementById('receipt-items').innerHTML = itemsHTML;
    document.getElementById('receipt-total-amount').textContent = formatCurrency(transaction.total);
    
    const modal = document.getElementById('receipt-modal');
    M.Modal.getInstance(modal).open();
}

// Print receipt
function printReceipt() {
    const receiptElement = document.getElementById('receipt-container');
    
    html2canvas(receiptElement).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 200]
        });
        
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('struk-belanja.pdf');
        
        showToast('Struk berhasil dicetak', 'success');
    }).catch(error => {
        console.error('Error generating PDF:', error);
        showToast('Gagal mencetak struk', 'error');
    });
}

// Add product to cart
function addProductToCart() {
    const barcode = document.getElementById('barcode').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    if (!barcode) {
        showToast('Masukkan kode barcode produk', 'error');
        return;
    }
    
    const product = findProductByBarcode(barcode);
    if (!product) {
        showToast('Produk tidak ditemukan', 'error');
        return;
    }
    
    if (product.stock < quantity) {
        showToast('Stok tidak mencukupi', 'error');
        return;
    }
    
    // Check if product already in cart
    const existingItemIndex = currentCart.findIndex(item => item.barcode === barcode);
    if (existingItemIndex !== -1) {
        // Update quantity
        currentCart[existingItemIndex].quantity += quantity;
        showToast(`${product.name} ditambahkan ke keranjang (${quantity})`, 'success');
    } else {
        // Add new item
        currentCart.push({
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            cost: product.cost,
            quantity: quantity
        });
        showToast(`${product.name} ditambahkan ke keranjang`, 'success');
    }
    
    // Clear input
    document.getElementById('barcode').value = '';
    document.getElementById('quantity').value = '1';
    
    renderCart();
}

// Finish transaction
function finishTransaction(printReceipt = false) {
    if (currentCart.length === 0) {
        showToast('Belum ada produk ditambahkan', 'error');
        return;
    }
    
    let total = 0;
    let profit = 0;
    
    // Calculate total and profit
    currentCart.forEach(item => {
        total += item.price * item.quantity;
        profit += (item.price - item.cost) * item.quantity;
        
        // Update stock
        const product = findProductByBarcode(item.barcode);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Create transaction
    const transaction = {
        id: generateID(),
        date: Date.now(),
        items: [...currentCart],
        total: total,
        profit: profit
    };
    
    transactions.push(transaction);
    updateStorage();
    
    if (printReceipt) {
        showReceipt(transaction);
    } else {
        showToast('Transaksi berhasil disimpan', 'success');
    }
    
    // Clear cart
    currentCart = [];
    renderCart();
}

// Save product
function saveProduct() {
    const barcode = document.getElementById('product-barcode').value.trim();
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value) || 0;
    const cost = parseInt(document.getElementById('product-cost').value) || 0;
    const stock = parseInt(document.getElementById('product-stock').value) || 0;
    
    if (!barcode || !name || price <= 0 || cost <= 0) {
        showToast('Semua field harus diisi dengan benar', 'error');
        return;
    }
    
    // Check if barcode already exists
    const existingProduct = findProductByBarcode(barcode);
    if (existingProduct) {
        showToast('Produk dengan kode barcode ini sudah ada', 'error');
        return;
    }
    
    // Add new product
    products.push({
        barcode: barcode,
        name: name,
        price: price,
        cost: cost,
        stock: stock
    });
    
    updateStorage();
    
    // Clear form
    document.getElementById('product-barcode').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('product-cost').value = '';
    document.getElementById('product-stock').value = '0';
    
    renderProductList();
    renderStockList();
    
    showToast('Produk berhasil disimpan', 'success');
}

// Update product
function updateProduct() {
    if (editingProductIndex === -1) return;
    
    const barcode = document.getElementById('edit-product-barcode').value.trim();
    const name = document.getElementById('edit-product-name').value.trim();
    const price = parseInt(document.getElementById('edit-product-price').value) || 0;
    const cost = parseInt(document.getElementById('edit-product-cost').value) || 0;
    const stock = parseInt(document.getElementById('edit-product-stock').value) || 0;
    
    if (!name || price <= 0 || cost <= 0) {
        showToast('Semua field harus diisi dengan benar', 'error');
        return;
    }
    
    // Update product
    products[editingProductIndex] = {
        barcode: barcode,
        name: name,
        price: price,
        cost: cost,
        stock: stock
    };
    
    updateStorage();
    renderProductList();
    renderStockList();
    
    // Close modal
    const modal = document.getElementById('edit-product-modal');
    M.Modal.getInstance(modal).close();
    
    showToast('Produk berhasil diperbarui', 'success');
}

// Save store information
function saveStoreInfo() {
    const name = document.getElementById('store-name').value.trim();
    const address = document.getElementById('store-address').value.trim();
    
    if (!name) {
        showToast('Nama warung harus diisi', 'error');
        return;
    }
    
    storeInfo = {
        name: name,
        address: address
    };
    
    updateStorage();
    showToast('Informasi warung berhasil disimpan', 'success');
}

// Initialize app
function initApp() {
    // Initialize Materialize components
    M.Modal.init(document.querySelectorAll('.modal'), {
        dismissible: true,
        opacity: 0.5,
        inDuration: 300,
        outDuration: 200
    });
    
    // Load store info to form
    document.getElementById('store-name').value = storeInfo.name;
    document.getElementById('store-address').value = storeInfo.address;
    
    // Render initial data
    renderCart();
    renderTransactionHistory();
    renderStockList();
    renderProductList();
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            
            // Hide all pages
            document.querySelectorAll('.page').forEach(p => {
                p.classList.remove('active');
            });
            
            // Show selected page
            document.getElementById(page).classList.add('active');
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            this.classList.add('active');
            
            // Stop scanner if active
            if (scannerInitialized) {
                Quagga.stop();
                scannerInitialized = false;
                document.getElementById('start-scanner').innerHTML = '<i class="fas fa-barcode mr-1"></i> Scan Barcode';
            }
            
            if (productScannerInitialized) {
                Quagga.stop();
                productScannerInitialized = false;
                document.getElementById('start-product-scanner').innerHTML = '<i class="fas fa-barcode mr-1"></i> Scan Barcode';
            }
        });
    });
    
    // Start barcode scanner
    document.getElementById('start-scanner').addEventListener('click', function() {
        if (scannerInitialized) {
            Quagga.stop();
            scannerInitialized = false;
            this.innerHTML = '<i class="fas fa-barcode mr-1"></i> Scan Barcode';
            return;
        }
        
        this.innerHTML = '<i class="fas fa-stop mr-1"></i> Stop Scanning';
        scannerInitialized = true;
        
        initBarcodeScanner('barcode-scanner', function(code) {
            document.getElementById('barcode').value = code;
            document.getElementById('start-scanner').innerHTML = '<i class="fas fa-barcode mr-1"></i> Scan Barcode';
            scannerInitialized = false;
            
            // Auto add product if found
            const product = findProductByBarcode(code);
            if (product) {
                document.getElementById('quantity').value = '1';
                addProductToCart();
            } else {
                showToast('Produk dengan barcode ' + code + ' tidak ditemukan', 'error');
            }
        });
    });
    
    // Start product barcode scanner
    document.getElementById('start-product-scanner').addEventListener('click', function() {
        if (productScannerInitialized) {
            Quagga.stop();
            productScannerInitialized = false;
            this.innerHTML = '<i class="fas fa-barcode mr-1"></i> Scan Barcode';
            return;
        }
        
        this.innerHTML = '<i class="fas fa-stop mr-1"></i> Stop Scanning';
        productScannerInitialized = true;
        
        initBarcodeScanner('product-barcode-scanner', function(code) {
            document.getElementById('product-barcode').value = code;
            document.getElementById('start-product-scanner').innerHTML = '<i class="fas fa-barcode mr-1"></i> Scan Barcode';
            productScannerInitialized = false;
            
            // Check if product already exists
            const existingProduct = findProductByBarcode(code);
            if (existingProduct) {
                showToast('Produk dengan barcode ini sudah ada', 'warning');
            }
        });
    });
    
    // Quantity selector
    document.getElementById('decrease-qty').addEventListener('click', function() {
        const qtyInput = document.getElementById('quantity');
        let qty = parseInt(qtyInput.value) || 1;
        if (qty > 1) {
            qtyInput.value = qty - 1;
        }
    });
    
    document.getElementById('increase-qty').addEventListener('click', function() {
        const qtyInput = document.getElementById('quantity');
        let qty = parseInt(qtyInput.value) || 0;
        qtyInput.value = qty + 1;
    });
    
    // Add product to cart
    document.getElementById('add-product').addEventListener('click', addProductToCart);
    
    // Finish transaction
    document.getElementById('finish-transaction-no-print').addEventListener('click', () => {
        finishTransaction(false);
    });
    
    document.getElementById('finish-transaction-print').addEventListener('click', () => {
        finishTransaction(true);
    });
    
    // Print receipt
    document.getElementById('print-receipt').addEventListener('click', printReceipt);
    
    // Save product
    document.getElementById('save-product').addEventListener('click', saveProduct);
    
    // Update product
    document.getElementById('update-product').addEventListener('click', updateProduct);
    
    // Save store info
    document.getElementById('save-store-info').addEventListener('click', saveStoreInfo);
    
    // Search stock
    document.getElementById('search-stock').addEventListener('click', () => {
        const searchTerm = document.getElementById('stock-search').value.trim();
        renderStockList(searchTerm);
    });
    
    // Search product
    document.getElementById('search-product').addEventListener('click', () => {
        const searchTerm = document.getElementById('product-search').value.trim();
        renderProductList(searchTerm);
    });
    
    // Enter key in barcode field
    document.getElementById('barcode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addProductToCart();
        }
    });
    
    // Enter key in search fields
    document.getElementById('stock-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            renderStockList(searchTerm);
        }
    });
    
    document.getElementById('product-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const searchTerm = this.value.trim();
            renderProductList(searchTerm);
        }
    });

    setupInstallModal();
}

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// PWA Install Prompt
let deferredPrompt;

// Add this to your existing JavaScript, outside of any function
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show the install modal
    const installModal = document.getElementById('install-modal');
    const modalInstance = M.Modal.init(installModal, {
        dismissible: true,
        opacity: 0.5,
        inDuration: 300,
        outDuration: 200
    });
    modalInstance.open();
});

// Add this to your initApp() function
function setupInstallModal() {

    // Add click handler for install button
    document.getElementById('install-pwa-btn').addEventListener('click', () => {
        if (deferredPrompt) {
            // Close the modal first
            const installModal = document.getElementById('install-modal');
            const modalInstance = M.Modal.getInstance(installModal);
            if (modalInstance) {
                modalInstance.close();
            }
            
            // Then show the install prompt
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
            });
        }
    });
}