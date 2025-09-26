
// Category Page JavaScript
let allProducts = [];
let filteredProducts = [];
let currentCategory = '';

// Category descriptions (update as needed)
const categoryDescriptions = {
    'Tshirts (Unisex)': 'Comfortable and stylish unisex t-shirts perfect for everyday wear.',
    'SweatShirts (Unisex)': 'Cozy sweatshirts and hoodies for casual comfort.',
    'Hoodies (Unisex)': 'Trendy and warm hoodies for all genders.',
    'Polos': 'Premium polos for a smart and casual look.',
    'Female Dresses': 'Elegant dresses for women’s fashion.',
    'Ladies Blouses': 'Chic and stylish blouses for ladies.'
};

// Load category products on page load
document.addEventListener('DOMContentLoaded', function() {
    loadCategoryProducts();
    document.getElementById('sort-select').addEventListener('change', function() {
        sortProducts(this.value);
    });
});

// Helper: get mapped category for a product (same as homepage)
function getMappedCategory(product) {
    const pname = product.name.toLowerCase();
    if (pname.includes('classic') && pname.includes('t-shirt')) return 'Tshirts (Unisex)';
    if (pname.includes('sweatshirt')) return 'SweatShirts (Unisex)';
    if (pname.includes('blouse')) return 'Ladies Blouses';
    if (pname.includes('polo')) return 'Polos';
    if (pname.includes('hoodie')) return 'Hoodies (Unisex)';
    if (pname.includes('dress')) return 'Female Dresses';
    // Fallback: best match by keyword
    const keys = [
        {cat: 'Tshirts (Unisex)', key: 'tshirt'},
        {cat: 'SweatShirts (Unisex)', key: 'sweatshirt'},
        {cat: 'Hoodies (Unisex)', key: 'hoodie'},
        {cat: 'Polos', key: 'polo'},
        {cat: 'Female Dresses', key: 'dress'},
        {cat: 'Ladies Blouses', key: 'blouse'}
    ];
    for (const k of keys) {
        if (pname.includes(k.key)) return k.cat;
    }
    return null;
}

// Load and display category products
async function loadCategoryProducts() {
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('cat');
    if (!currentCategory) {
        showNoProducts();
        return;
    }
    try {
        // Load products
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to load products');
        allProducts = await response.json();
        // Filter products by mapped category
        filteredProducts = allProducts.filter(product => getMappedCategory(product) === currentCategory);
        if (filteredProducts.length === 0) {
            showNoProducts();
            return;
        }
        updatePageHeader();
        displayProducts();
    } catch (error) {
        console.error('Error loading category products:', error);
        showError('Failed to load products. Please try again.');
    }
}

// Update page header with category information
function updatePageHeader() {
    // Update page title
    document.title = `${currentCategory} - PSJ Priya'z Style Jone`;
    
    // Update breadcrumb
    document.getElementById('category-breadcrumb').textContent = currentCategory;
    
    // Update category title
    document.getElementById('category-title').textContent = currentCategory;
    
    // Update category description
    const description = categoryDescriptions[currentCategory] || 'Discover our collection of premium clothing';
    document.getElementById('category-description').textContent = description;
}

// Display products in grid
function displayProducts() {
    const productsGrid = document.getElementById('products-grid');
    const productCount = document.getElementById('product-count');
    
    // Hide loading and show products section
    document.getElementById('loading').style.display = 'none';
    document.getElementById('category-products').style.display = 'block';
    
    // Update product count
    productCount.textContent = `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`;
    
    // Generate products HTML
    const productsHTML = filteredProducts.map(product => `
        <div class="col-lg-3 col-md-6 mb-4">
            <div class="card product-card h-100">
                <img src="${product.images ? product.images[0] : product.image}" 
                     alt="${product.name}" 
                     class="product-image">
                <div class="card-body product-info d-flex flex-column">
                    <span class="badge bg-secondary mb-2 align-self-start">${product.category}</span>
                    <h5 class="product-title">${product.name}</h5>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    
                    <!-- Color indicators -->
                    ${product.colors && product.colors.length > 0 ? `
                        <div class="color-indicators mb-2">
                            ${product.colors.slice(0, 3).map(color => `
                                <span class="color-dot" 
                                      style="background-color: ${color.hex}" 
                                      title="${color.name}"></span>
                            `).join('')}
                            ${product.colors.length > 3 ? `<span class="text-muted">+${product.colors.length - 3} more</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <!-- Size indicators -->
                    ${product.sizes && product.sizes.length > 0 ? `
                        <div class="size-indicators mb-3">
                            <small class="text-muted">Sizes: ${product.sizes.join(', ')}</small>
                        </div>
                    ` : ''}
                    
                    <div class="mt-auto">
                        <button class="btn btn-primary btn-order w-100" onclick="viewProduct(${product.id})">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    productsGrid.innerHTML = productsHTML;
}

// Sort products
function sortProducts(sortBy) {
    switch (sortBy) {
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            // Assuming newer products have higher IDs
            filteredProducts.sort((a, b) => b.id - a.id);
            break;
    }
    
    displayProducts();
}

// View product details (reuse from main script)
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Show no products message (beautiful message)
function showNoProducts() {
    document.getElementById('loading').style.display = 'none';
    const noProductsSection = document.getElementById('no-products');
    noProductsSection.style.display = 'block';
    noProductsSection.innerHTML = `
        <div class="container py-5">
            <div class="d-flex flex-column align-items-center justify-content-center">
                <h2 class="mb-3 text-secondary">No Products Available</h2>
                <p class="lead mb-4">We couldn't find any products in this category for now.<br>But stay tuned, beautiful things are coming soon!</p>
                <a href="all-products.html" class="btn btn-primary mb-4">Browse All Products</a>
                <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=400&h=300&fit=crop" alt="Coming Soon" style="max-width:220px;opacity:0.85;" class="rounded shadow mt-2">
            </div>
        </div>
    `;
    if (currentCategory) {
        updatePageHeader();
    }
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