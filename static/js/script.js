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
    
    // Define fixed categories and images
    const fixedCategories = [
        { name: 'Tshirts (Unisex)', key: 'Tshirts', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&h=400&fit=crop' },
        { name: 'SweatShirts (Unisex)', key: 'SweatShirts', img: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=400&fit=crop' },
        { name: 'Hoodies (Unisex)', key: 'Hoodies', img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&h=400&fit=crop' },
        { name: 'Polos', key: 'Polos', img: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=400&fit=crop' },
        { name: 'Female Dresses', key: 'Female Dresses', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop' },
        { name: 'Ladies Blouses', key: 'Ladies Blouses', img: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=400&fit=crop' }
    ];

    // Helper: improved match for Polos and others
    function matchScore(productName, categoryKey) {
        if (!productName || !categoryKey) return 0;
        const name = productName.toLowerCase();
        const key = categoryKey.toLowerCase().replace(/\s|\(|\)/g, '');
        // Special case for Polos
        if (key === 'polos' && name.includes('polo')) return 1.0;
        let matchCount = 0;
        const keyWords = key.split(/\W+/).filter(w => w.length > 2);
        for (let word of keyWords) {
            if (name.includes(word)) matchCount++;
        }
        return keyWords.length ? (matchCount / keyWords.length) : 0;
    }

    // Assign each product to the best-matching category
    const categoryCount = {};
    const productCategoryMap = {};
    fixedCategories.forEach(cat => categoryCount[cat.name] = 0);
    products.forEach(product => {
        // Explicit mapping for known products
        const pname = product.name.toLowerCase();
        if (pname.includes('classic') && pname.includes('t-shirt')) {
            categoryCount['Tshirts (Unisex)']++;
            productCategoryMap[product.id] = 'Tshirts (Unisex)';
            return;
        }
        if (pname.includes('sweatshirt')) {
            categoryCount['SweatShirts (Unisex)']++;
            productCategoryMap[product.id] = 'SweatShirts (Unisex)';
            return;
        }
        if (pname.includes('blouse')) {
            categoryCount['Ladies Blouses']++;
            productCategoryMap[product.id] = 'Ladies Blouses';
            return;
        }
        // Fallback to best match
        let bestCat = null;
        let bestScore = 0.3; // minimum threshold
        for (const cat of fixedCategories) {
            const score = matchScore(product.name, cat.key);
            if (score > bestScore) {
                bestScore = score;
                bestCat = cat.name;
            }
        }
        if (bestCat) {
            categoryCount[bestCat]++;
            productCategoryMap[product.id] = bestCat;
        }
    });
    window.productCategoryMap = productCategoryMap;

    const categoriesHTML = fixedCategories.map(cat => {
        const count = categoryCount[cat.name];
        const imgSrc = cat.img;
        const catParam = encodeURIComponent(cat.name);
        // Icon for category
        // Badge color logic
        let badgeClass = 'bg-secondary';
        if (count > 1) badgeClass = 'bg-success';
        else if (count === 0) badgeClass = 'bg-secondary text-bg-secondary opacity-50';
        return `
        <div class="col-md-4 col-sm-6 mb-4">
            <a href="category.html?cat=${catParam}" class="text-decoration-none text-dark">
                <div class="card h-100 shadow-sm category-card-hover">
                    <img src="${imgSrc}" alt="${cat.name}" class="card-img-top" style="height:180px;object-fit:cover;">
                    <div class="card-body text-center">
                        <h5 class="card-title mb-2">${cat.name}</h5>
                        <span class="badge ${badgeClass} mb-2">${count} products</span>
                        <p class="card-text text-muted small">Browse ${cat.name.toLowerCase()}</p>
                    </div>
                </div>
            </a>
        </div>
        `;
    }).join('');

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
    

    const productsHTML = productsToRender.map(product => {
        // Determine the best image source
        let imgSrc = 'static/images/placeholder.jpg';
        
        // Try to get the main image first
        if (product.mainImage && product.mainImage.trim()) {
            imgSrc = product.mainImage;
        } 
        // Fallback to additional images if main image is not available
        else if (product.images) {
            if (typeof product.images === 'string' && product.images.trim()) {
                // If images is a comma-separated string
                const firstImage = product.images.split(',')[0].trim();
                if (firstImage) imgSrc = firstImage;
            } else if (Array.isArray(product.images) && product.images.length > 0) {
                // If images is an array
                const firstImage = product.images[0].trim();
                if (firstImage) imgSrc = firstImage;
            }
        }
        // Use mapped category label if available
        let categoryLabel = '';
        if (window.productCategoryMap && window.productCategoryMap[product.id]) {
            categoryLabel = window.productCategoryMap[product.id];
        } else if (product.category && product.category.primary && product.category.primary !== 'Clothing') {
            categoryLabel = product.category.primary;
        } else if (typeof product.category === 'string' && product.category !== 'Clothing') {
            categoryLabel = product.category;
        }
        // Add icon to category tag
        return `
        <div class="col-lg-3 col-md-6 mb-4">
            <div class="card product-card h-100">
                <img src="${imgSrc}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.onerror=null; this.src='static/images/placeholder.jpg';">
                <div class="card-body product-info d-flex flex-column">
                    ${categoryLabel ? `<span class=\"badge bg-secondary mb-2 align-self-start\">${categoryLabel}</span>` : ''}
                    <h5 class="product-title">${product.name}</h5>
                    <p class="product-price">${renderProductPrice(product)}</p>
                    <div class="mt-auto">
                        <button class="btn btn-primary btn-order w-100" onclick="viewProduct(${product.id})">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
// Update product detail page tag if present
document.addEventListener('DOMContentLoaded', function() {
    if (window.productCategoryMap && document.getElementById('product-category-badge')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        if (productId && window.productCategoryMap[productId]) {
            document.getElementById('product-category-badge').textContent = window.productCategoryMap[productId];
        }
    }
});
    
    productGrid.innerHTML = productsHTML;
}

// Helper to render price HTML for a product using actualPrice/salePrice
function renderProductPrice(product) {
    const actual = typeof product.actualPrice === 'number' ? product.actualPrice : (product.price || 0);
    const sale = typeof product.salePrice === 'number' ? product.salePrice : actual;
    const onSale = !!product.onSale || (sale < actual);
    if (onSale && sale < actual) {
        return `<span class="text-muted text-decoration-line-through">₹${actual.toFixed(0)}</span> <span class="text-danger fw-bold">₹${sale.toFixed(0)}</span>`;
    }
    return `₹${actual.toFixed(0)}`;
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