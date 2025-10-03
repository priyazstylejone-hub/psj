// Product Detail Page JavaScript
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

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
    document.getElementById('category-link').textContent = product.category;
    document.getElementById('category-link').href = `category.html?cat=${product.category}`;
    
    // Populate product information
    document.getElementById('product-category-badge').textContent = product.category;
    document.getElementById('product-name-detail').textContent = product.name;
    document.getElementById('product-price-detail').textContent = `₹${product.price.toFixed(2)}`;
    document.getElementById('product-description-detail').textContent = product.description;
    
    // Setup image gallery
    setupImageGallery(product.images);
    
    // Setup color selection
    setupColorSelection(product.colors);
    
    // Setup size selection
    setupSizeSelection(product.sizes);
    
    // Add fade-in animation
    document.getElementById('product-details').classList.add('fade-in');
}

// Setup image gallery with thumbnails
function setupImageGallery(images) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailContainer = document.getElementById('thumbnail-container');
    
    // Set first image as main
    if (images && images.length > 0) {
        mainImage.src = images[0];
        mainImage.alt = currentProduct.name;
    }
    
    // Create thumbnails
    if (images && images.length > 1) {
        thumbnailContainer.innerHTML = images.map((image, index) => `
            <div class="col-3">
                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" onclick="selectMainImage('${image}', ${index})">
                    <img src="${image}" alt="${currentProduct.name} - Image ${index + 1}" class="img-fluid">
                </div>
            </div>
        `).join('');
    } else {
        thumbnailContainer.innerHTML = '';
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
    
    if (colors && colors.length > 0) {
        colorContainer.innerHTML = colors.map((color, index) => `
            <div class="color-option" 
                 style="background-color: ${color.hex}" 
                 onclick="selectColor('${color.name}', '${color.hex}', '${color.image}', ${index})"
                 title="${color.name}">
                ${color.image ? `<img src="${color.image}" alt="${color.name}">` : ''}
            </div>
        `).join('');
    } else {
        colorContainer.innerHTML = '<p class="text-muted">No color options available</p>';
    }
}

// Select color
function selectColor(colorName, colorHex, colorImage, index) {
    selectedColor = { name: colorName, hex: colorHex, image: colorImage };
    
    // Update UI
    document.getElementById('selected-color').textContent = colorName;
    
    // Update active color option
    document.querySelectorAll('.color-option').forEach((option, i) => {
        option.classList.toggle('selected', i === index);
    });
    
    // Update main image if color has specific image
    if (colorImage) {
        document.getElementById('main-product-image').src = colorImage;
    }
    
    // Check if order button should be enabled
    updateOrderButton();
}

// Setup size selection
function setupSizeSelection(sizes) {
    const sizeContainer = document.getElementById('size-options');
    
    if (sizes && sizes.length > 0) {
        sizeContainer.innerHTML = sizes.map((size, index) => `
            <div class="size-option" onclick="selectSize('${size}', ${index})">
                ${size}
            </div>
        `).join('');
    } else {
        sizeContainer.innerHTML = '<p class="text-muted">No size options available</p>';
    }
}

// Select size
function selectSize(size, index) {
    selectedSize = size;
    
    // Update UI
    document.getElementById('selected-size').textContent = size;
    
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
    
    const orderDetails = `
🛍️ *New Order from PSJ Priya'z Style Jone*

📦 *Product:* ${currentProduct.name}
💰 *Price:* $${currentProduct.price.toFixed(2)}
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