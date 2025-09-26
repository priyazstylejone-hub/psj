// Global variables
let products = [];

// Load products data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    
    // Check if we're on the old product detail page (redirect to new one)
    if (window.location.pathname.includes('product.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) {
            window.location.href = `product-detail.html?id=${productId}`;
        }
    }
});

// Load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        products = await response.json();
        
        // Only render on homepage
        if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
            renderCategories();
            renderProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Failed to load products. Please refresh the page.');
    }
}

// Render product categories
function renderCategories() {
    const categoriesContainer = document.getElementById('categories');
    if (!categoriesContainer) return;
    
    // Get unique categories and count products
    const categoryCount = {};
    products.forEach(product => {
        categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    });
    
    const categoriesHTML = Object.entries(categoryCount).map(([category, count]) => `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="category-card" onclick="filterByCategory('${category}')">
                <div class="category-count">${count}</div>
                <h5 class="mt-2">${category}</h5>
                <p class="text-muted mb-0">Browse ${category.toLowerCase()}</p>
            </div>
        </div>
    `).join('');
    
    categoriesContainer.innerHTML = categoriesHTML;
}

// Render products grid
function renderProducts(filteredProducts = null) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;
    
    const productsToRender = filteredProducts || products;
    
    if (productsToRender.length === 0) {
        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <p class="lead">No products found.</p>
            </div>
        `;
        return;
    }
    
    const productsHTML = productsToRender.map(product => `
        <div class="col-lg-3 col-md-6 mb-4">
            <div class="card product-card h-100">
                <img src="${product.images ? product.images[0] : product.image}" alt="${product.name}" class="product-image">
                <div class="card-body product-info d-flex flex-column">
                    <span class="badge bg-secondary mb-2 align-self-start">${product.category}</span>
                    <h5 class="product-title">${product.name}</h5>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <div class="mt-auto">
                        <button class="btn btn-primary btn-order w-100" onclick="viewProduct(${product.id})">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    productGrid.innerHTML = productsHTML;
}

// Filter products by category
function filterByCategory(category) {
    const filtered = products.filter(product => product.category === category);
    renderProducts(filtered);
    
    // Scroll to products section
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// View product details
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Load product details for product page
async function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        showProductNotFound();
        return;
    }
    
    try {
        // Load products if not already loaded
        if (products.length === 0) {
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error('Failed to load products');
            }
            products = await response.json();
        }
        
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            showProductNotFound();
            return;
        }
        
        // Hide loading and show product details
        document.getElementById('loading').style.display = 'none';
        document.getElementById('product-details').style.display = 'block';
        
        // Populate product details
        document.getElementById('product-image').src = product.image;
        document.getElementById('product-image').alt = product.name;
        document.getElementById('product-category').textContent = product.category;
        document.getElementById('product-name').textContent = product.name;
        document.getElementById('product-price').textContent = `$${product.price}`;
        document.getElementById('product-description').textContent = product.description;
        
        // Update page title
        document.title = `${product.name} - PSJ Priya'z Style Jone`;
        
    } catch (error) {
        console.error('Error loading product details:', error);
        showError('Failed to load product details. Please try again.');
    }
}

// Show product not found message
function showProductNotFound() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-not-found').style.display = 'block';
}

// Order Now functionality
function orderNow(productId = null) {
    let message = 'Thank you for your interest! ';
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            message += `You're ordering: ${product.name} ($${product.price}).\n\n`;
        }
    }
    
    message += 'This is a demo website. In a real store, this would redirect to checkout or open a contact form.';
    
    alert(message);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Insert at top of main content
    const main = document.querySelector('main') || document.body.firstElementChild;
    main.insertBefore(errorDiv, main.firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

// Search functionality (if needed in future)
function searchProducts(query) {
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

// Reset filters and show all products
function showAllProducts() {
    renderProducts();
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}