// All Products Page JS

document.addEventListener('DOMContentLoaded', async function() {
    const grid = document.getElementById('all-products-grid');
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to load products');
        const products = await response.json();
        if (!products.length) {
            grid.innerHTML = '<div class="col-12 text-center"><p class="lead">No products available.</p></div>';
            return;
        }
        grid.innerHTML = products.map(product => {
            let imgSrc = '';
            if (product.images) {
                if (product.images.primary) {
                    imgSrc = product.images.primary;
                } else if (Array.isArray(product.images.gallery) && product.images.gallery.length > 0) {
                    imgSrc = product.images.gallery[0];
                } else if (Array.isArray(product.images) && product.images.length > 0) {
                    imgSrc = product.images[0];
                }
            } else if (product.image) {
                imgSrc = product.image;
            }
            return `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="card product-card h-100">
                    <img src="${imgSrc}" alt="${product.name}" class="product-image">
                    <div class="card-body product-info d-flex flex-column">
                        <h5 class="product-title">${product.name}</h5>
                        <p class="product-price">₹${product.price ? product.price.toFixed(2) : (product.pricing?.salePrice/100).toFixed(2)}</p>
                        <div class="mt-auto">
                            <button class="btn btn-primary btn-order w-100" onclick="window.location.href='product-detail.html?id=${product.id}'">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } catch (error) {
        grid.innerHTML = '<div class="col-12 text-center"><p class="text-danger">Failed to load products.</p></div>';
    }
});
