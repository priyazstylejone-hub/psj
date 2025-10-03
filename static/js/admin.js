// Admin Panel JavaScript
let currentProducts = [];
let colorCounter = 0;
// Admin Panel JavaScript
let currentProducts = [];
let colorCounter = 0;

// Load admin panel on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentProducts();
    setupEventListeners();
    // Clean admin.js (replaced corrupted content)
    let currentProducts = [];
    let colorCounter = 0;

    document.addEventListener('DOMContentLoaded', function() {
      loadCurrentProducts();
      setupEventListeners();
      loadSavedSettings();
    });

    function setupEventListeners() {
      const form = document.getElementById('new-product-form');
      if (form) form.addEventListener('submit', handleNewProduct);

      const dropzone = document.querySelector('.upload-dropzone');
      if (dropzone) {
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('dragleave', handleDragLeave);
        dropzone.addEventListener('drop', handleLogoDrop);
      }
    }

    async function loadCurrentProducts() {
      try {
        const res = await fetch('products.json');
        if (!res.ok) throw new Error('Failed to fetch products.json');
        currentProducts = await res.json();
        displayCurrentProducts();
      } catch (err) {
        console.error(err);
        const productsList = document.getElementById('products-list');
        if (productsList) productsList.innerHTML = '<div class="alert alert-danger">Failed to load products. Check console.</div>';
        showMessage('Failed to load products. See console.', 'danger');
        currentProducts = [];
      }
    }

    function displayCurrentProducts() {
      const productsList = document.getElementById('products-list');
      if (!productsList) return;

      if (!currentProducts || currentProducts.length === 0) {
        productsList.innerHTML = '<div class="alert alert-info">No products found. Add your first product using the form above.</div>';
        return;
      }

      const rows = currentProducts.map(p => {
        const imageUrl = p.images && p.images.length ? p.images[0] : (p.image || '');
        const colorsHtml = (p.colors || []).map(c => {
          const hex = c.hex && String(c.hex).trim().startsWith('#') ? c.hex.trim() : ('#' + String(c.hex || '').trim());
          return `<span class="color-dot me-1" title="${escapeHtml(c.name || '')}" style="background-color:${hex};width:16px;height:16px;display:inline-block;border-radius:50%;border:1px solid #ddd"></span>`;
        }).join('') || 'N/A';
        const sizesText = p.sizes ? p.sizes.map(s => (typeof s === 'string' ? s : s.size)).join(', ') : 'N/A';
        const priceHtml = (typeof renderProductPrice === 'function') ? renderProductPrice(p) : (p.price || '');

        return `
          <tr>
            <td>${p.id}</td>
            <td><img src="${imageUrl}" alt="${escapeHtml(p.name||'')}" class="img-thumbnail" style="width:50px;height:50px;object-fit:cover"></td>
            <td>${escapeHtml(p.name||'')}</td>
            <td><span class="badge bg-secondary">${escapeHtml(p.category||'')}</span></td>
            <td>${priceHtml}</td>
            <td>${colorsHtml}</td>
            <td>${sizesText}</td>
            <td><span class="badge ${p.featured ? 'bg-success' : 'bg-secondary'}">${p.featured ? 'Yes' : 'No'}</span></td>
            <td>
              <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${p.id})">Edit</button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
          </tr>`;
      }).join('');

      productsList.innerHTML = `
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Colors</th>
                <th>Sizes</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>`;
    }

    function handleNewProduct(e) {
      e.preventDefault();
      const selectedSizes = [];
      document.querySelectorAll('input[type="checkbox"][value]').forEach(cb => { if (cb.checked) selectedSizes.push(cb.value); });
      const colors = getColorOptions();

      const newProduct = {
        id: currentProducts.length ? Math.max(...currentProducts.map(x => x.id)) + 1 : 1,
        name: (document.getElementById('product-name') || {}).value || '',
        actualPrice: parseFloat((document.getElementById('product-price') || {}).value || '0'),
        salePrice: parseFloat((document.getElementById('product-sale-price') || {}).value || '0'),
        description: (document.getElementById('product-description') || {}).value || '',
        category: (document.getElementById('product-category') || {}).value || '',
        mainImage: '',  // Will be set from uploaded images
        images: [],     // Additional images
        colors,
        sizes: selectedSizes,
        inStock: true,
        featured: (document.getElementById('product-featured') || {}).value === 'true',
        material: (document.getElementById('product-material') || {}).value || '',
        careInstructions: (document.getElementById('product-care') || {}).value || ''
      };

      const imageFiles = (document.getElementById('product-images') || {}).files || [];
      if (imageFiles.length > 0) {
        // In a real implementation, we would upload these files to a server
        // For demo purposes, we'll use placeholder URLs
        newProduct.mainImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center';
        newProduct.images = [
          'https://images.unsplash.com/photo-1583743814966-8936f37f4ec2?w=600&h=600&fit=crop&crop=center'
        ];
        showMessage('Product added with demo images. Note: In production, images would be uploaded to server.', 'success');
      } else {
        newProduct.mainImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center';
        newProduct.images = [];
      }

      currentProducts.push(newProduct);
      displayCurrentProducts();
      showMessage('Product added (demo).', 'success');
      if (e.target && typeof e.target.reset === 'function') e.target.reset();
      clearColorOptions();
      updateProductsJsonDisplay();
    }

    function addColorOption() {
      colorCounter++;
      const container = document.getElementById('color-options-container');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'color-option-item mb-2 p-2 border rounded';
      div.innerHTML = `
        <div class="row g-2">
          <div class="col-md-4"><input type="text" class="form-control form-control-sm" placeholder="Color name" id="color-name-${colorCounter}"></div>
          <div class="col-md-3"><input type="color" class="form-control form-control-color form-control-sm" id="color-hex-${colorCounter}" value="#000000"></div>
          <div class="col-md-3"><input type="file" class="form-control form-control-sm" accept=".png,.jpg,.jpeg" id="color-image-${colorCounter}"></div>
          <div class="col-md-2"><button type="button" class="btn btn-sm btn-outline-danger" onclick="removeColorOption(this)">Remove</button></div>
        </div>`;
      container.appendChild(div);
    }

    function removeColorOption(btn) { const el = btn.closest('.color-option-item'); if (el) el.remove(); }

    function getColorOptions() {
      const out = [];
      document.querySelectorAll('.color-option-item').forEach(item => {
        const name = (item.querySelector('input[type="text"]') || {}).value || '';
        const hex = (item.querySelector('input[type="color"]') || {}).value || '';
        const imgInput = item.querySelector('input[type="file"]');
        if (name && hex) out.push({ name: name.trim(), hex: hex.trim(), image: (imgInput && imgInput.files && imgInput.files.length > 0) ? 'placeholder' : null });
      });
      return out;
    }

    function clearColorOptions() { const c = document.getElementById('color-options-container'); if (c) c.innerHTML = ''; colorCounter = 0; }

    function editProduct(id) { alert('Edit not implemented in demo.'); }
    function deleteProduct(id) { if (confirm('Delete product?')) { currentProducts = currentProducts.filter(p => p.id !== id); displayCurrentProducts(); showMessage('Product deleted', 'success'); updateProductsJsonDisplay(); } }

    function updateWhatsAppNumber() { const el = document.getElementById('whatsapp-number'); if (el && el.value) { localStorage.setItem('whatsappNumber', el.value); showMessage('WhatsApp number saved', 'success'); } }
    function loadSavedSettings() { const n = localStorage.getItem('whatsappNumber'); if (n) { const el = document.getElementById('whatsapp-number'); if (el) el.value = n; } }

    function handleLogoUpload(e) { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = ev => { const img = document.getElementById('current-logo'); if (img) img.src = ev.target.result; showMessage('Logo loaded (demo)', 'success'); }; r.readAsDataURL(file); }
    function handleDragOver(e) { e.preventDefault(); if (e.currentTarget) e.currentTarget.classList.add('dragover'); }
    function handleDragLeave(e) { if (e.currentTarget) e.currentTarget.classList.remove('dragover'); }
    function handleLogoDrop(e) { e.preventDefault(); if (e.currentTarget) e.currentTarget.classList.remove('dragover'); const files = e.dataTransfer.files; if (files && files[0] && files[0].type.startsWith('image/')) { const r = new FileReader(); r.onload = ev => { const img = document.getElementById('current-logo'); if (img) img.src = ev.target.result; showMessage('Logo loaded (demo)', 'success'); }; r.readAsDataURL(files[0]); } }

    function showMessage(message, type = 'info') { const alertDiv = document.createElement('div'); alertDiv.className = `alert alert-${type} alert-dismissible fade show`; alertDiv.innerHTML = `${escapeHtml(message)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`; const container = document.querySelector('.container'); if (container) container.insertBefore(alertDiv, container.firstElementChild); setTimeout(() => { if (alertDiv.parentNode) alertDiv.remove(); }, 5000); }

    function updateProductsJsonDisplay() { console.log('Updated products (demo):', JSON.stringify(currentProducts, null, 2)); }

    function escapeHtml(str) { 
      if (!str) return ''; 
      return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#039;'); 
    }
