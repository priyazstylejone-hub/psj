// Product Detail Page JavaScript
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

// Small helper to escape HTML in generated strings
function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Get WhatsApp number from admin configuration or use default
function getWhatsAppNumber() {
    return localStorage.getItem('whatsappNumber') || "+1234567890";
}

// Load product details on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProductDetails();
});

// Load and display product details
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        showProductNotFound();
        return;
    }
    
    try {
        // Load products if not already loaded
        if (!window.products || window.products.length === 0) {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            window.products = await response.json();
        }
        
        const product = window.products.find(p => p.id === productId);
        
        if (!product) {
            showProductNotFound();
            return;
        }
        
        currentProduct = product;
        displayProductDetails(product);
        
    } catch (error) {
        console.error('Error loading product details:', error);
        showError('Failed to load product details. Please try again.');
    }
}

// Display product details
function displayProductDetails(product) {
    // Hide loading and show product details
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-details').style.display = 'block';
    
    // Update page title and breadcrumb
    document.title = `${product.name} - PSJ Priya'z Style Jone`;
    document.getElementById('product-breadcrumb').textContent = product.name;

    // Some products may not have a category; fall back gracefully
    const category = product.category || 'Uncategorized';
    const categoryLinkEl = document.getElementById('category-link');
    if (categoryLinkEl) {
        categoryLinkEl.textContent = category;
        categoryLinkEl.href = `category.html?cat=${encodeURIComponent(category)}`;
    }

    // Populate product information
    const badgeEl = document.getElementById('product-category-badge');
    if (badgeEl) badgeEl.textContent = category;
    document.getElementById('product-name-detail').textContent = product.name;

    // Price rendering: show sale price and strike-through actual if on sale
    const priceEl = document.getElementById('product-price-detail');
    if (priceEl) {
        const actual = typeof product.actualPrice === 'number' ? product.actualPrice : (product.price || 0);
        const sale = typeof product.salePrice === 'number' ? product.salePrice : actual;
        const onSale = !!product.onSale || (sale < actual);

        if (onSale && sale < actual) {
            priceEl.innerHTML = `<span class="text-muted text-decoration-line-through">₹${actual.toFixed(0)}</span> <span class="fs-5 text-danger fw-bold">₹${sale.toFixed(0)}</span>`;
        } else {
            priceEl.textContent = `₹${actual.toFixed(0)}`;
        }
    }

    document.getElementById('product-description-detail').textContent = product.description || '';
    
    // Setup image gallery with main image and additional images
    const allImages = [];
    if (product.mainImage) {
        allImages.push(product.mainImage);
    }
    if (product.images) {
        // Handle both string and array formats for backward compatibility
        const additionalImages = typeof product.images === 'string' 
            ? product.images.split(',').map(img => img.trim())
            : (Array.isArray(product.images) ? product.images : []);
        allImages.push(...additionalImages.filter(img => img && img.trim()));
    }
    setupImageGallery(allImages);
    
    // Setup color selection
    setupColorSelection(product.colors);
    
    // Setup size selection
    setupSizeSelection(product.sizes);
    
    // Update material and care instructions if available
    if (product.material) {
        const materialEl = document.getElementById('product-material');
        if (materialEl) materialEl.textContent = product.material;
    }
    if (product.careInstructions) {
        const careEl = document.getElementById('product-care');
        if (careEl) careEl.textContent = product.careInstructions;
    }
    
    // Add fade-in animation
    document.getElementById('product-details').classList.add('fade-in');
}

// Setup image gallery with thumbnails
function setupImageGallery(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    // Ensure images is always an array of valid URLs
    const imageArray = (Array.isArray(images) ? images : [])
        .map(img => typeof img === 'string' ? img.trim() : '')
        .filter(img => img);
    
    // Set first image as main if available
    if (imageArray.length > 0) {
        const firstImage = imageArray[0];
        mainImage.src = firstImage;
        mainImage.alt = currentProduct.name || 'Product Image';
        // Add error handling for main image
        mainImage.onerror = function() {
            this.onerror = null;
            this.src = 'static/images/placeholder.jpg';
        };
            mainImage.onerror = function() {
                this.src = 'static/images/placeholder.jpg';
                console.error(`Failed to load image: ${firstImage}`);
            };
        }
    }
    
    // Create thumbnails
    if (imageArray.length > 1) {
        const thumbnailsHtml = imageArray.map((image, index) => {
            if (!image || !image.trim()) return '';
            const safeImageUrl = encodeURI(image);
            return `
                <div class="col-3">
                    <div class="thumbnail-item ${index === 0 ? 'active' : ''}" 
                         onclick="selectMainImage('${escapeHtml(image)}', ${index})">
                        <img src="${escapeHtml(image)}" 
                             alt="${escapeHtml(currentProduct.name || 'Product')} - Image ${index + 1}" 
                             class="img-fluid"
                             onerror="this.onerror=null; this.src='static/images/placeholder.jpg';"
                             loading="lazy">
                    </div>
                </div>
            `;
        }).join('');
        thumbnailContainer.innerHTML = thumbnailsHtml;
    } else {
        thumbnailContainer.innerHTML = '';
    }
}
}

// Select main image from thumbnail
function selectMainImage(imageSrc, index) {
    const mainImage = document.getElementById('main-product-image');
    mainImage.src = imageSrc;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail-item').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Setup color selection
function setupColorSelection(colors) {
    const colorContainer = document.getElementById('color-options');
    
    // Parse colors if they're provided as a JSON string
    let colorArray = colors;
    if (typeof colors === 'string') {
        try {
            colorArray = JSON.parse(colors);
        } catch (e) {
            console.error('Failed to parse color options:', e);
            colorArray = [];
        }
    }
    
    if (colorArray && colorArray.length > 0) {
        colorContainer.innerHTML = colorArray.map((color, index) => {
            // Ensure hex has leading # when used in CSS
            const hex = color.hex ? (String(color.hex).trim().startsWith('#') ? color.hex.trim() : ('#' + color.hex.trim())) : 'transparent';
            const name = color.name || '';
            const image = color.image || '';
            
            return `
            <div class="color-option" 
                 style="background-color: ${hex};" 
                 onclick="selectColor('${escapeHtml(name)}', '${escapeHtml(hex)}', '${escapeHtml(image)}', ${index})"
                 title="${escapeHtml(name)}">
                ${image ? `<img src="${escapeHtml(image)}" 
                               alt="${escapeHtml(name)}"
                               onerror="this.style.display='none'; this.parentElement.style.backgroundColor='${hex}';">` : ''}
                <span class="color-name">${escapeHtml(name)}</span>
            </div>
        `}).join('');
    } else {
        colorContainer.innerHTML = '<p class="text-muted">No color options available</p>';
    }
}

// Select color
function selectColor(colorName, colorHex, colorImage, index) {
    selectedColor = { name: colorName, hex: colorHex, image: colorImage };

    // Update UI
    const selColorEl = document.getElementById('selected-color');
    if (selColorEl) selColorEl.textContent = colorName;

    // Update active color option
    document.querySelectorAll('.color-option').forEach((option, i) => {
        option.classList.toggle('selected', i === index);
    });

    // Update main image if color has specific image
    if (colorImage) {
        const mainImg = document.getElementById('main-product-image');
        if (mainImg) {
            mainImg.src = colorImage;
            mainImg.onerror = function() {
                this.onerror = null;
                this.src = 'static/images/placeholder.jpg';
            };
        }
    }

    // Check if order button should be enabled
    updateOrderButton();
}

// Setup size selection
function setupSizeSelection(sizes) {
    const sizeContainer = document.getElementById('size-options');

    if (sizes && sizes.length > 0) {
        sizeContainer.innerHTML = sizes.map((s, index) => {
            // s may be a string ("S") or an object { size: 'S', measurements: {...} }
            const label = (typeof s === 'string') ? s : (s.size || '');
            let measurements = '';
            if (typeof s === 'object' && s.measurements) {
                measurements = Object.entries(s.measurements).map(([k, v]) => `${k}: ${v}`).join(' | ');
            }
            // title attribute shows measurements on hover
            return `
            <div class="size-option" onclick="selectSize('${escapeHtml(label)}', ${index})" title="${escapeHtml(measurements)}">
                ${escapeHtml(label)}
            </div>
        `}).join('');
    } else {
        sizeContainer.innerHTML = '<p class="text-muted">No size options available</p>';
    }
}

// Select size
function selectSize(sizeLabel, index) {
    // Store the full size object if available on the current product
    if (currentProduct && Array.isArray(currentProduct.sizes) && currentProduct.sizes[index]) {
        selectedSize = currentProduct.sizes[index];
    } else {
        selectedSize = { size: sizeLabel };
    }

    // Update UI
    const selSizeEl = document.getElementById('selected-size');
    if (selSizeEl) selSizeEl.textContent = (selectedSize.size || sizeLabel);

    // Update active size option
    document.querySelectorAll('.size-option').forEach((option, i) => {
        option.classList.toggle('selected', i === index);
    });

    // Check if order button should be enabled
    updateOrderButton();
}

// Update order button state
function updateOrderButton() {
    const orderButton = document.getElementById('whatsapp-order-btn');
    const canOrder = selectedColor && selectedSize;
    
    orderButton.disabled = !canOrder;
    
    if (canOrder) {
        orderButton.onclick = () => orderViaWhatsApp();
    }
}

// Order via WhatsApp
function orderViaWhatsApp() {
    if (!currentProduct || !selectedColor || !selectedSize) {
        alert('Please select both color and size before ordering.');
        return;
    }
    
    // Determine displayed price (use salePrice if available)
    const actualPrice = typeof currentProduct.actualPrice === 'number' ? currentProduct.actualPrice : 0;
    const salePrice = typeof currentProduct.salePrice === 'number' ? currentProduct.salePrice : actualPrice;
    const displayPrice = (salePrice < actualPrice) ? salePrice : actualPrice;

    const orderDetails = `
🛍️ *New Order from PSJ Priya'z Style Jone*

📦 *Product:* ${currentProduct.name}
💰 *Price:* ₹${displayPrice.toFixed(0)}
🎨 *Color:* ${selectedColor.name}
📏 *Size:* ${selectedSize}
🏷️ *Category:* ${currentProduct.category}

📝 *Product Description:*
${currentProduct.description}

🔗 *Product Link:* ${window.location.href}

---
Please confirm this order and provide delivery details.
Thank you for choosing PSJ Priya'z Style Jone! 🌟
    `.trim();
    
    const encodedMessage = encodeURIComponent(orderDetails);
    const whatsappNumber = getWhatsAppNumber();
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
}

// Share product
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct.name,
            text: `Check out this ${currentProduct.name} from PSJ Priya'z Style Jone`,
            url: window.location.href
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('Product link copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Product link copied to clipboard!');
        });
    }
}

// Show product not found
function showProductNotFound() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-not-found').style.display = 'block';
}

// Show error message
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
    }
}