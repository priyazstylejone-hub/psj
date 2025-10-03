// Admin Panel JavaScript
let currentProducts = [];
let colorCounter = 0;

// Load admin panel on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentProducts();
    setupEventListeners();
    loadSavedSettings();
});

// Setup event listeners
function setupEventListeners() {
    // New product form submission
    document.getElementById('new-product-form').addEventListener('submit', handleNewProduct);
    
    // Logo upload drag and drop
    const dropzone = document.querySelector('.upload-dropzone');
    dropzone.addEventListener('dragover', handleDragOver);
    dropzone.addEventListener('dragleave', handleDragLeave);
    dropzone.addEventListener('drop', handleLogoDrop);
}

// Load and display current products
async function loadCurrentProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        currentProducts = await response.json();
        displayCurrentProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-list').innerHTML = `
            <div class="alert alert-danger">Failed to load products. Please refresh the page.</div>
        `;
    }
}

// Display current products in admin list
function displayCurrentProducts() {
    const productsList = document.getElementById('products-list');
    
    if (currentProducts.length === 0) {
        productsList.innerHTML = `
            <div class="alert alert-info">No products found. Add your first product using the form above.</div>
        `;
        return;
    }
    
    const productsHTML = `
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
                    ${currentProducts.map(product => `
                        <tr>
                            <td>${product.id}</td>
                            <td>
                                <img src="${product.images ? product.images[0] : product.image}" 
                                     alt="${product.name}" 
                                     class="img-thumbnail" 
                                     style="width: 50px; height: 50px; object-fit: cover;">
                            </td>
                            <td>${product.name}</td>
                            <td><span class="badge bg-secondary">${product.category}</span></td>
                            <td>₹${product.price.toFixed(2)}</td>
                            <td>
                                ${product.colors ? product.colors.map(color => `
                                    <span class="color-dot me-1" 
                                          style="background-color: ${color.hex}; width: 16px; height: 16px; display: inline-block; border-radius: 50%; border: 1px solid #ddd;" 
                                          title="${color.name}"></span>
                                `).join('') : 'N/A'}
                            </td>
                            <td>${product.sizes ? product.sizes.join(', ') : 'N/A'}</td>
                            <td>
                                <span class="badge ${product.featured ? 'bg-success' : 'bg-secondary'}">
                                    ${product.featured ? 'Yes' : 'No'}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editProduct(${product.id})">Edit</button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.id})">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    productsList.innerHTML = productsHTML;
}

// Handle new product form submission
function handleNewProduct(event) {
    event.preventDefault();
    
    // Get form data
    const formData = new FormData(event.target);
    const selectedSizes = [];
    const sizeCheckboxes = document.querySelectorAll('input[type="checkbox"][value]');
    sizeCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedSizes.push(checkbox.value);
        }
    });
    
    // Get color options
    const colors = getColorOptions();
    
    // Create new product object
    const newProduct = {
        id: currentProducts.length > 0 ? Math.max(...currentProducts.map(p => p.id)) + 1 : 1,
        name: document.getElementById('product-name').value,
        price: parseFloat(document.getElementById('product-price').value),
        description: document.getElementById('product-description').value,
        category: document.getElementById('product-category').value,
        images: [], // Will be populated with uploaded images
        colors: colors,
        sizes: selectedSizes,
        inStock: true,
        featured: document.getElementById('product-featured').value === 'true'
    };
    
    // Handle image uploads (placeholder - in real implementation, you'd upload to server)
    const imageFiles = document.getElementById('product-images').files;
    if (imageFiles.length > 0) {
        // For demo purposes, use placeholder images
        newProduct.images = [\n            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center',\n            'https://images.unsplash.com/photo-1583743814966-8936f37f4ec2?w=600&h=600&fit=crop&crop=center',\n            'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&h=600&fit=crop&crop=center',\n            'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=600&fit=crop&crop=center'\n        ];
        \n        // Show success message about image upload\n        showMessage('Product added successfully! Note: In a production environment, images would be properly uploaded to your server.', 'success');
    } else {
        // Use default placeholder image
        newProduct.images = ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center'];
    }
    
    // Add to products array (in real implementation, this would save to server)
    currentProducts.push(newProduct);
    
    // Update the display
    displayCurrentProducts();
    
    // Show success message
    showMessage('Product added successfully! Note: This is a demo - in production, changes would be saved to your server.', 'success');
    
    // Reset form
    event.target.reset();
    clearColorOptions();
    
    // Update the live products.json display (for demo purposes)
    updateProductsJsonDisplay();
}

// Add color option
function addColorOption() {
    colorCounter++;
    const container = document.getElementById('color-options-container');
    
    const colorDiv = document.createElement('div');
    colorDiv.className = 'color-option-item mb-2 p-2 border rounded';
    colorDiv.innerHTML = `
        <div class="row g-2">
            <div class="col-md-4">
                <input type="text" class="form-control form-control-sm" placeholder="Color name" id="color-name-${colorCounter}">
            </div>
            <div class="col-md-3">
                <input type="color" class="form-control form-control-color form-control-sm" id="color-hex-${colorCounter}" value="#000000">
            </div>
            <div class="col-md-3">
                <input type="file" class="form-control form-control-sm" accept=".png,.jpg,.jpeg" id="color-image-${colorCounter}">
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeColorOption(this)">Remove</button>
            </div>
        </div>
    `;
    
    container.appendChild(colorDiv);
}

// Remove color option
function removeColorOption(button) {
    button.closest('.color-option-item').remove();
}

// Get color options from form
function getColorOptions() {
    const colors = [];
    const colorItems = document.querySelectorAll('.color-option-item');
    
    colorItems.forEach((item, index) => {
        const nameInput = item.querySelector('input[type="text"]');
        const hexInput = item.querySelector('input[type="color"]');
        const imageInput = item.querySelector('input[type="file"]');
        
        if (nameInput.value && hexInput.value) {
            colors.push({
                name: nameInput.value,
                hex: hexInput.value,
                image: imageInput.files.length > 0 ? 
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&crop=center' : // Placeholder
                    null
            });
        }
    });
    
    return colors;
}

// Clear color options
function clearColorOptions() {
    document.getElementById('color-options-container').innerHTML = '';
    colorCounter = 0;
}

// Edit product (placeholder)
function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (product) {
        alert(`Edit functionality for "${product.name}" would be implemented here in a full system.`);
    }
}

// Delete product (placeholder)
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        currentProducts = currentProducts.filter(p => p.id !== productId);
        displayCurrentProducts();
        showMessage('Product deleted successfully!', 'success');
        updateProductsJsonDisplay();
    }
}

// Update WhatsApp number
function updateWhatsAppNumber() {
    const number = document.getElementById('whatsapp-number').value;
    if (number) {
        localStorage.setItem('whatsappNumber', number);
        showMessage('WhatsApp number updated successfully! This number will now be used for all customer orders.', 'success');
    }
}

// Load saved WhatsApp number on page load
function loadSavedSettings() {
    const savedNumber = localStorage.getItem('whatsappNumber');
    if (savedNumber) {
        document.getElementById('whatsapp-number').value = savedNumber;
    }
}

// Handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update current logo display
            document.getElementById('current-logo').src = e.target.result;
            showMessage('Logo uploaded successfully! Note: In production, this would be saved to your server.', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Drag and drop handlers for logo
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleLogoDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('current-logo').src = e.target.result;
            showMessage('Logo uploaded successfully!', 'success');
        };
        reader.readAsDataURL(files[0]);
    }
}

// Show message to user
function showMessage(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of main content
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstElementChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Update products.json display (for demo purposes)
function updateProductsJsonDisplay() {
    // This would typically save to server in a real implementation
    console.log('Updated products.json:', JSON.stringify(currentProducts, null, 2));
}