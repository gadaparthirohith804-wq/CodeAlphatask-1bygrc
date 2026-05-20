/* ==========================================================================
   AETHERIA - Frontend JS Application Engine (SPA Hash Router)
   ========================================================================== */

// Global Application State
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('aetheria_cart')) || [],
  user: JSON.parse(localStorage.getItem('aetheria_user')) || null,
  token: localStorage.getItem('aetheria_token') || null,
  currentCategory: 'all',
  currentSort: 'default',
  currentSearch: '',
  priceMin: null,
  priceMax: null,
  activeSlideIndex: 0,
  activeCheckoutStep: 1,
  selectedCheckoutAddressId: null,
  selectedCheckoutPayment: 'credit-card',
  shippingEstimate: null,
  activeMapInstance: null,
  activeTrackingTimer: null
};

// --- Location Currency Formatting Helper ---
function getActiveCountry() {
  if (state.shippingEstimate && state.shippingEstimate.country) {
    return state.shippingEstimate.country;
  }
  if (state.token && state.user && state.user.addresses && state.selectedCheckoutAddressId) {
    const addr = state.user.addresses.find(a => a.id === state.selectedCheckoutAddressId);
    if (addr && addr.country) return addr.country;
  }
  if (state.token && state.user && state.user.addresses && state.user.addresses.length > 0) {
    return state.user.addresses[0].country;
  }
  return 'United States';
}

function formatAmount(usdAmount, customCountry = null) {
  const country = customCountry || getActiveCountry();
  if (country && country.toLowerCase() === 'india') {
    return '₹' + (usdAmount * 80).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (country && country.toLowerCase() === 'japan') {
    return '¥' + Math.round(usdAmount * 150).toLocaleString('ja-JP');
  } else {
    return '$' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

// --- Dynamic Variation Suffix Title Helper ---
function getDynamicTitle(product, selected) {
  let title = product.name;
  
  if (selected && Object.keys(selected).length > 0) {
    const parenRegex = /\(([^)]+)\)$/;
    const match = title.match(parenRegex);
    
    if (match) {
      const baseTitle = title.replace(parenRegex, '').trim();
      const parts = match[1].split(',').map(s => s.trim());
      
      const newParts = parts.map(part => {
        if (selected.storage && (part.toLowerCase().includes('gb') || part.toLowerCase().includes('tb'))) {
          return selected.storage;
        }
        if (selected.ram && part.toLowerCase().includes('ram')) {
          return selected.ram + ' RAM';
        }
        if (selected.size && (part.toLowerCase().includes('mm') || part.toLowerCase().includes('inch'))) {
          return selected.size;
        }
        if (selected.colors) {
          const isStorage = part.toLowerCase().includes('gb') || part.toLowerCase().includes('tb') || part.toLowerCase().includes('ram');
          const isSize = part.toLowerCase().includes('mm') || part.toLowerCase().includes('inch') || part.toLowerCase().includes('oystersteel');
          if (!isStorage && !isSize) {
            return selected.colors;
          }
        }
        return part;
      });
      
      if (selected.colors && !newParts.some(p => p.toLowerCase() === selected.colors.toLowerCase())) {
        let replaced = false;
        for (let i = 0; i < newParts.length; i++) {
          const p = newParts[i];
          if (!p.toLowerCase().includes('gb') && !p.toLowerCase().includes('tb') && !p.toLowerCase().includes('ram') && !p.toLowerCase().includes('mm') && !p.toLowerCase().includes('inch')) {
            newParts[i] = selected.colors;
            replaced = true;
            break;
          }
        }
        if (!replaced) {
          newParts.push(selected.colors);
        }
      }
      
      return `${baseTitle} (${newParts.join(', ')})`;
    } else {
      if (selected.colors && title.toLowerCase().startsWith('white ') && selected.colors.toLowerCase() !== 'white') {
        title = title.replace(/^white /i, selected.colors + ' ');
      } else if (selected.colors && title.toLowerCase().startsWith('black ') && selected.colors.toLowerCase() !== 'black') {
        title = title.replace(/^black /i, selected.colors + ' ');
      } else if (selected.colors) {
        title = `${title} (${selected.colors})`;
      }
    }
  }
  return title;
}

function getFilterStyleForColor(color) {
  const col = color.toLowerCase();
  if (col.includes('blue')) {
    return 'filter: hue-rotate(190deg) saturate(1.4) brightness(0.95);';
  } else if (col.includes('green')) {
    return 'filter: hue-rotate(90deg) saturate(1.3) brightness(0.9);';
  } else if (col.includes('red') || col.includes('rose') || col.includes('pink') || col.includes('coral')) {
    return 'filter: hue-rotate(-40deg) saturate(1.8) brightness(1.0);';
  } else if (col.includes('yellow') || col.includes('gold') || col.includes('cream')) {
    return 'filter: sepia(0.6) hue-rotate(-10deg) saturate(1.6) brightness(1.05);';
  } else if (col.includes('black') || col.includes('graphite') || col.includes('dark') || col.includes('charcoal')) {
    return 'filter: grayscale(100%) brightness(0.5) contrast(1.2);';
  } else if (col.includes('silver') || col.includes('white') || col.includes('platinum')) {
    return 'filter: grayscale(100%) brightness(1.25) contrast(0.95);';
  } else if (col.includes('purple') || col.includes('violet') || col.includes('plum')) {
    return 'filter: hue-rotate(270deg) saturate(1.4) brightness(0.9);';
  }
  return '';
}

function applyColorFilterToImage(img, color) {
  if (!img) return;
  const style = getFilterStyleForColor(color);
  if (style) {
    const filterVal = style.replace('filter:', '').replace(';', '').trim();
    img.style.filter = filterVal;
  } else {
    img.style.filter = 'none';
  }
}

// --- Toast Notification Helper ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '<i class="fa-solid fa-circle-info"></i>';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
  if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
  
  toast.innerHTML = `${icon} <span>${message}</span>`;
  container.appendChild(toast);
  
  // Slide out and remove toast after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, 4000);
}

// --- API Helper ---
async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API execution error');
    }
    return data;
  } catch (error) {
    console.error(`API Call failed [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// --- LocalStorage Cart Sync ---
function updateCartStorage() {
  localStorage.setItem('aetheria_cart', JSON.stringify(state.cart));
  updateNavbarBadge();
}

function addToCart(product, quantity = 1, selectedVariations = null) {
  const cartItemId = selectedVariations && Object.keys(selectedVariations).length > 0
    ? `${product.id}-${Object.values(selectedVariations).join('-')}`
    : `${product.id}`;
    
  const existingItemIndex = state.cart.findIndex(item => item.cartItemId === cartItemId || (!item.cartItemId && item.id === product.id && !selectedVariations));
  
  if (existingItemIndex > -1) {
    const newQty = state.cart[existingItemIndex].quantity + quantity;
    if (newQty > product.stock) {
      showToast(`Insufficient inventory. Max stock is ${product.stock}.`, 'error');
      return;
    }
    state.cart[existingItemIndex].quantity = newQty;
  } else {
    if (quantity > product.stock) {
      showToast(`Insufficient inventory. Max stock is ${product.stock}.`, 'error');
      return;
    }
    const displayName = getDynamicTitle(product, selectedVariations);
    state.cart.push({
      cartItemId,
      id: product.id,
      name: displayName,
      price: product.price,
      image: product.image,
      stock: product.stock,
      quantity,
      selectedVariations
    });
  }
  
  updateCartStorage();
  showToast(`Added ${product.name} to cart`, 'success');
}

function updateCartQuantity(cartItemId, delta) {
  const itemIndex = state.cart.findIndex(item => item.cartItemId === cartItemId || (!item.cartItemId && item.id === cartItemId));
  if (itemIndex === -1) return;
  
  const item = state.cart[itemIndex];
  const newQty = item.quantity + delta;
  
  if (newQty <= 0) {
    state.cart.splice(itemIndex, 1);
    showToast(`Removed ${item.name} from cart`);
  } else if (newQty > item.stock) {
    showToast(`Insufficient stock available (Max: ${item.stock})`, 'error');
    return;
  } else {
    item.quantity = newQty;
  }
  
  updateCartStorage();
  renderCartView();
}

function removeFromCart(cartItemId) {
  const itemIndex = state.cart.findIndex(item => item.cartItemId === cartItemId || (!item.cartItemId && item.id === cartItemId));
  if (itemIndex === -1) return;
  
  const name = state.cart[itemIndex].name;
  state.cart.splice(itemIndex, 1);
  updateCartStorage();
  showToast(`Removed ${name} from cart`);
  renderCartView();
}

function clearCart() {
  state.cart = [];
  updateCartStorage();
}

function updateNavbarBadge() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cart-count').textContent = count;
}

// --- Authentication UI Sync ---
function updateAuthUI() {
  const loginBtn = document.getElementById('login-trigger-btn');
  const userSection = document.getElementById('user-nav-section');
  const usernameDisplay = document.getElementById('username-display');
  
  if (state.token && state.user) {
    loginBtn.classList.add('hidden');
    userSection.classList.remove('hidden');
    usernameDisplay.textContent = state.user.name;
    
    // Set checkout login indicators
    document.getElementById('checkout-user-summary').textContent = state.user.name;
    document.getElementById('checkout-user-fullname').textContent = state.user.name;
    document.getElementById('checkout-user-email').textContent = state.user.email;
    document.querySelector('.auth-required-panel').classList.add('hidden');
    document.querySelector('.auth-verified-panel').classList.remove('hidden');
    
    // Set navbar deliver locations
    document.getElementById('nav-addr-user').textContent = `Deliver to ${state.user.name}`;
    const defaultAddr = state.user.addresses && state.user.addresses[0];
    document.getElementById('nav-addr-details').textContent = defaultAddr ? `${defaultAddr.city}, ${defaultAddr.zip} (${defaultAddr.country})` : 'Select Location';
  } else {
    loginBtn.classList.remove('hidden');
    userSection.classList.add('hidden');
    usernameDisplay.textContent = '';
    
    // Set checkout default panels
    document.getElementById('checkout-user-summary').textContent = 'Guest User';
    document.querySelector('.auth-required-panel').classList.remove('hidden');
    document.querySelector('.auth-verified-panel').classList.add('hidden');
    
    // Reset navbar deliver locations
    document.getElementById('nav-addr-user').textContent = 'Deliver to Guest';
    document.getElementById('nav-addr-details').textContent = 'Select Location';
  }
}

async function verifyToken() {
  if (!state.token) return;
  try {
    const userProfile = await apiCall('/api/auth/me');
    state.user = userProfile;
    // Get full user addresses
    const addrs = await apiCall('/api/addresses');
    state.user.addresses = addrs;
    localStorage.setItem('aetheria_user', JSON.stringify(state.user));
    updateAuthUI();
  } catch (error) {
    logout();
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('aetheria_token');
  localStorage.removeItem('aetheria_user');
  updateAuthUI();
  showToast('Signed out successfully');
  window.location.hash = '#/';
}

// --- Home / Catalog Rendering ---
async function fetchProducts() {
  try {
    let url = '/api/products?';
    if (state.currentCategory !== 'all') url += `category=${state.currentCategory}&`;
    if (state.currentSort !== 'default') url += `sort=${state.currentSort}&`;
    if (state.currentSearch) url += `q=${encodeURIComponent(state.currentSearch)}&`;
    
    const products = await apiCall(url);
    
    // Client-side Price refinement
    state.products = products.filter(p => {
      if (state.priceMin && p.price < state.priceMin) return false;
      if (state.priceMax && p.price > state.priceMax) return false;
      return true;
    });

    renderProductsGrid();
    renderDealOfTheDay();
  } catch (err) {
    showToast('Failed to retrieve products catalog', 'error');
  }
}

function renderProductsGrid() {
  const grid = document.getElementById('products-grid');
  const countSpan = document.getElementById('results-count');
  
  if (state.products.length === 0) {
    grid.innerHTML = `<div class="loading-spinner"><p>No items match your active search or filters.</p></div>`;
    countSpan.textContent = 'Showing 0 products';
    return;
  }
  
  countSpan.textContent = `Showing ${state.products.length} products`;
  grid.innerHTML = state.products.map(p => {
    const stars = renderStarRating(p.rating);
    const originalPrice = p.originalPrice || (p.price * 1.15);
    const discountPct = Math.round(((originalPrice - p.price) / originalPrice) * 100);
    const assuredTag = p.assured ? `<span class="assured-badge"><img src="/images/assured_badge.png" onerror="this.outerHTML='Assured'" alt="Assured"></span>` : '';
    
    return `
      <div class="product-card" onclick="window.location.hash = '#/product/${p.id}'">
        ${p.assured ? `<span class="product-badge assured-label"><i class="fa-solid fa-circle-check"></i> Assured</span>` : '<span class="product-badge">NEW</span>'}
        <div class="product-card-image-box">
          <img src="${p.image}" alt="${p.name}">
        </div>
        <div class="product-card-info">
          <div class="product-card-brand">${p.brand || 'Premium Brand'}</div>
          <h3 class="product-card-title">${p.name}</h3>
          <div class="rating-row">
            <span class="rating-stars">${stars}</span>
            <span class="rating-count">(${p.ratingsCount || Math.floor(Math.random() * 1000 + 50)})</span>
            ${assuredTag}
          </div>
          <div class="product-card-price-row">
            <div class="price-container">
              <span class="product-price">${formatAmount(p.price)}</span>
              <span class="original-price">${formatAmount(originalPrice)}</span>
              <span class="discount-percent">${discountPct}% off</span>
            </div>
            <button class="btn btn-outline btn-sm buy-btn" onclick="event.stopPropagation(); buyProductDirectly(${p.id})">
              <i class="fa-solid fa-cart-plus"></i> Add
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function buyProductDirectly(id) {
  const prod = state.products.find(p => p.id === id);
  if (prod) {
    addToCart(prod, 1);
  }
}

function renderStarRating(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.4;
  
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars += '<i class="fa-solid fa-star"></i>';
    } else if (i === fullStars + 1 && halfStar) {
      stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    } else {
      stars += '<i class="fa-regular fa-star"></i>';
    }
  }
  return stars;
}

function renderDealOfTheDay() {
  const panel = document.getElementById('special-deal-product');
  if (state.products.length === 0) return;
  
  const p = state.products[0];
  const originalPrice = p.originalPrice || (p.price * 1.15);
  const saveAmount = originalPrice - p.price;
  const discountPct = Math.round((saveAmount / originalPrice) * 100);
  
  panel.innerHTML = `
    <img src="${p.image}" alt="${p.name}" class="deal-image">
    <div class="deal-info">
      <span class="deal-tag">⚡ DEAL OF THE DAY</span>
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      <div class="deal-price-row">
        <span class="product-price">${formatAmount(p.price)}</span>
        <span class="original-price" style="margin-left:8px; text-decoration:line-through; color:var(--color-text-muted); font-size:0.95rem;">${formatAmount(originalPrice)}</span>
        <span class="deal-save-badge">Save ${discountPct}% (${formatAmount(saveAmount)})</span>
        <button class="btn btn-primary btn-sm btn-glow" onclick="window.location.hash = '#/product/${p.id}'">Check Deal</button>
      </div>
    </div>
  `;
}

// --- Autocomplete Suggestions ---
function setupAutocomplete() {
  const input = document.getElementById('search-input');
  const suggestionsBox = document.getElementById('search-suggestions');
  
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      suggestionsBox.classList.add('hidden');
      return;
    }
    
    // Filter locally if products are cached, or query all
    const matches = state.products.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 5);
    
    if (matches.length === 0) {
      suggestionsBox.classList.add('hidden');
      return;
    }
    
    suggestionsBox.innerHTML = matches.map(p => `
      <div class="suggestion-item" data-id="${p.id}">
        <span>${p.name}</span>
        <span class="suggestion-category">${p.category}</span>
      </div>
    `).join('');
    
    suggestionsBox.classList.remove('hidden');
  });
  
  suggestionsBox.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (item) {
      const id = item.dataset.id;
      input.value = '';
      suggestionsBox.classList.add('hidden');
      window.location.hash = `#/product/${id}`;
    }
  });

  // Hide on blur
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search-wrapper')) {
      suggestionsBox.classList.add('hidden');
    }
  });
}

// --- Banner Slider Carousel Carousel ---
function setupSliderCarousel() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dotsContainer = document.getElementById('carousel-dots-container');
  if (slides.length === 0) return;
  
  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
    dot.dataset.index = idx;
    dotsContainer.appendChild(dot);
  });
  
  const showSlide = (idx) => {
    slides.forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.carousel-dot').forEach(d => d.classList.remove('active'));
    
    state.activeSlideIndex = idx;
    slides[idx].classList.add('active');
    document.querySelector(`.carousel-dot[data-index="${idx}"]`).classList.add('active');
  };
  
  document.getElementById('carousel-prev-btn').onclick = () => {
    let prev = state.activeSlideIndex - 1;
    if (prev < 0) prev = slides.length - 1;
    showSlide(prev);
  };
  
  document.getElementById('carousel-next-btn').onclick = () => {
    let next = (state.activeSlideIndex + 1) % slides.length;
    showSlide(next);
  };
  
  dotsContainer.onclick = (e) => {
    const dot = e.target.closest('.carousel-dot');
    if (dot) {
      showSlide(parseInt(dot.dataset.index));
    }
  };
  
  // Auto loop
  setInterval(() => {
    let next = (state.activeSlideIndex + 1) % slides.length;
    showSlide(next);
  }, 6000);
}

// --- Product Details Rendering ---
async function loadProductDetails(id) {
  const container = document.getElementById('product-detail-content');
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Querying item specifications...</p></div>`;
  
  try {
    const product = await apiCall(`/api/products/${id}`);
    const reviews = await apiCall(`/api/products/${id}/reviews`);
    
    const specsList = product.specs.map(s => `<li>${s}</li>`).join('');
    const originalPrice = product.originalPrice || (product.price * 1.15);
    const discountPct = Math.round(((originalPrice - product.price) / originalPrice) * 100);
    
    // Reviews calculations
    const avgScore = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : product.rating;
    const starDistribution = calculateReviewBars(reviews);

    // Variations HTML
    let variationsHTML = '';
    const defaultSelected = {};
    if (product.variations && Object.keys(product.variations).length > 0) {
      variationsHTML = `<div class="product-variations-container">`;
      for (const [key, values] of Object.entries(product.variations)) {
        defaultSelected[key] = values[0];
        const titleKey = key.charAt(0).toUpperCase() + key.slice(1);
        variationsHTML += `
          <div class="variation-group" data-variation-name="${key}">
            <label class="variation-label"><strong>Select ${titleKey}: <span class="selected-variation-value" id="selected-val-${key}">${values[0]}</span></strong></label>
            <div class="variation-chips">
              ${values.map((val, idx) => `
                <button class="variation-chip ${idx === 0 ? 'selected' : ''}" data-value="${val}">${val}</button>
              `).join('')}
            </div>
          </div>
        `;
      }
      variationsHTML += `</div>`;
    }

    const initialTitle = getDynamicTitle(product, defaultSelected);

    container.innerHTML = `
      <!-- Column 1: Image Zoom box -->
      <div class="detail-image-box" id="zoom-image-container">
        <img src="${product.image}" id="detail-main-img" alt="${initialTitle}">
      </div>
      
      <!-- Column 2: Buy & Specs Panel -->
      <div class="detail-info-box">
        <span class="detail-category">${product.category}</span>
        <div class="detail-brand-badge">${product.brand || 'Premium Brand'}</div>
        <h2 class="detail-title" id="detail-product-title">${initialTitle}</h2>
        <div class="rating-stars">
          ${renderStarRating(parseFloat(avgScore))} 
          <span class="rating-count">${avgScore} out of 5 (${reviews.length} reviews)</span>
          ${product.assured ? `<span class="assured-badge-detail"><i class="fa-solid fa-circle-check"></i> Assured</span>` : ''}
        </div>
        
        <div class="detail-price-box">
          <span class="product-price" style="font-size:2rem;">${formatAmount(product.price)}</span>
          <span class="original-price" style="font-size:1.1rem; margin-left:10px; text-decoration:line-through; color:var(--color-text-muted);">${formatAmount(originalPrice)}</span>
          <span class="discount-percent-detail">${discountPct}% off</span>
          <div class="detail-stock text-success" style="margin-top:10px;">
            <i class="fa-solid fa-boxes-stacked"></i> Stock: ${product.stock} items left
          </div>
        </div>

        <p class="product-description">${product.description}</p>
        
        ${variationsHTML}
        
        <!-- Pincode Checker panel -->
        <div class="pincode-checker-card">
          <label><strong>Delivery & Weather Logistics Check</strong></label>
          <div class="pincode-inputs">
            <input type="text" id="pincode-input" class="form-input" placeholder="Enter PIN/Zip Code" value="${state.shippingEstimate ? state.shippingEstimate.zip : ''}">
            <button class="btn btn-outline btn-sm" id="pincode-check-btn">Check</button>
          </div>
          <div class="pincode-result" id="pincode-result-panel">
            ${state.shippingEstimate ? renderShippingEstimateHTML(state.shippingEstimate) : 'Enter Zip Code to estimate delivery route and transit weather.'}
          </div>
        </div>

        <div class="detail-specs">
          <h4>Technical Specifications</h4>
          <ul>${specsList}</ul>
        </div>
        
        <div class="detail-actions">
          <button class="btn btn-outline add-to-cart-detail-btn">
            <i class="fa-solid fa-cart-shopping"></i> Add to Cart
          </button>
          <button class="btn btn-primary btn-glow" id="detail-buy-now-btn">
            Buy Now
          </button>
        </div>
      </div>

      <!-- Bottom Panel: Reviews & Form -->
      <div class="reviews-section-panel">
        <div class="reviews-summary-card">
          <h3>Customer Reviews</h3>
          <div style="display:flex; align-items:baseline; gap:15px; margin-bottom:15px;">
            <span class="avg-rating-huge">${avgScore}</span>
            <span>out of 5</span>
          </div>
          <div class="rating-stars">${renderStarRating(parseFloat(avgScore))}</div>
          
          <div class="rating-bars">
            ${starDistribution.map(row => `
              <div class="rating-bar-row">
                <span>${row.stars} star</span>
                <div class="bar-track">
                  <div class="bar-fill" style="width: ${row.percentage}%"></div>
                </div>
                <span>${row.percentage}%</span>
              </div>
            `).join('')}
          </div>

          <!-- Add Review Form -->
          <div class="review-form-box">
            <h4>Submit a Product Review</h4>
            <form id="submit-review-form" style="margin-top:10px;">
              <div class="form-field">
                <label>Select Rating</label>
                <div class="star-selector" id="rating-star-selector">
                  <i class="fa-solid fa-star active" data-rating="1"></i>
                  <i class="fa-solid fa-star active" data-rating="2"></i>
                  <i class="fa-solid fa-star active" data-rating="3"></i>
                  <i class="fa-solid fa-star active" data-rating="4"></i>
                  <i class="fa-solid fa-star active" data-rating="5"></i>
                </div>
                <input type="hidden" id="form-review-stars-val" value="5">
              </div>
              <div class="form-field">
                <label for="review-comment">Review Description</label>
                <textarea id="review-comment" class="form-input" placeholder="Share your experience with this tech..." rows="3" required></textarea>
              </div>
              <button type="submit" class="btn btn-outline btn-sm btn-block">Submit Feedback</button>
            </form>
          </div>
        </div>

        <div class="reviews-list-box">
          <h3>Top Reviews</h3>
          <hr class="summary-divider">
          <div class="reviews-list-container" id="detail-reviews-list">
            ${reviews.length === 0 ? '<p>No reviews written for this product yet. Be the first to share your opinion!</p>' : reviews.map(r => `
              <div class="review-card">
                <div class="review-card-header">
                  <span class="reviewer-name">${r.name}</span>
                  <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="rating-stars" style="margin:5px 0;">${renderStarRating(r.rating)}</div>
                <p class="review-comment">${r.comment}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Apply initial image filter if there's a default color
    if (defaultSelected.colors || defaultSelected.color) {
      const mainImg = document.getElementById('detail-main-img');
      applyColorFilterToImage(mainImg, defaultSelected.colors || defaultSelected.color);
    }

    const getSelectedVariations = () => {
      const selected = {};
      const groups = container.querySelectorAll('.variation-group');
      groups.forEach(group => {
        const name = group.dataset.variationName;
        const activeChip = group.querySelector('.variation-chip.selected');
        if (activeChip) {
          selected[name] = activeChip.dataset.value;
        }
      });
      return selected;
    };

    // Chip selection handler
    const chips = container.querySelectorAll('.variation-chip');
    chips.forEach(chip => {
      chip.onclick = () => {
        const group = chip.closest('.variation-group');
        group.querySelectorAll('.variation-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');

        // Update label value text
        const groupName = group.dataset.variationName;
        const valSpan = document.getElementById(`selected-val-${groupName}`);
        if (valSpan) {
          valSpan.textContent = chip.dataset.value;
        }

        // Update dynamic product title on the details sheet
        const selected = getSelectedVariations();
        const titleEl = document.getElementById('detail-product-title');
        if (titleEl) {
          titleEl.textContent = getDynamicTitle(product, selected);
        }

        // Update product image color filter
        if (groupName === 'colors' || groupName === 'color') {
          const mainImg = document.getElementById('detail-main-img');
          applyColorFilterToImage(mainImg, chip.dataset.value);
        }
      };
    });

    // Event listeners
    container.querySelector('.add-to-cart-detail-btn').onclick = () => {
      const selected = getSelectedVariations();
      addToCart(product, 1, selected);
    };

    document.getElementById('detail-buy-now-btn').onclick = () => {
      const selected = getSelectedVariations();
      addToCart(product, 1, selected);
      window.location.hash = '#/cart';
    };

    // Zoom magnifier effect
    setupImageZoom();

    // Pincode verify trigger
    document.getElementById('pincode-check-btn').onclick = () => checkPincodeShipping();

    // Review stars selector
    setupStarsSelector();

    // Submit review form
    document.getElementById('submit-review-form').onsubmit = (e) => submitReview(e, product.id);

  } catch (err) {
    container.innerHTML = `<p class="text-danger">Failed to fetch product ledger profile. Details: ${err.message}</p>`;
  }
}

function calculateReviewBars(reviews) {
  const totals = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (totals[r.rating] !== undefined) totals[r.rating]++;
  });
  
  const totalCount = reviews.length || 1;
  return [5, 4, 3, 2, 1].map(stars => ({
    stars,
    percentage: Math.round(((totals[stars] || 0) / totalCount) * 100)
  }));
}

function setupImageZoom() {
  const container = document.getElementById('zoom-image-container');
  const img = document.getElementById('detail-main-img');
  
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const pctX = (x / rect.width) * 100;
    const pctY = (y / rect.height) * 100;
    
    img.style.transformOrigin = `${pctX}% ${pctY}%`;
    img.style.transform = 'scale(1.8)';
  });
  
  container.addEventListener('mouseleave', () => {
    img.style.transformOrigin = 'center center';
    img.style.transform = 'scale(1)';
  });
}

async function checkPincodeShipping() {
  const pin = document.getElementById('pincode-input').value.trim();
  const resPanel = document.getElementById('pincode-result-panel');
  if (!pin) {
    showToast('Please enter a zip code', 'error');
    return;
  }
  
  resPanel.innerHTML = '<span class="neon-text">Calculating transit route distance & weather conditions...</span>';
  try {
    const estimate = await apiCall('/api/shipping/estimate', 'POST', {
      zip: pin,
      city: 'Local Region',
      country: pin.startsWith('507') ? 'India' : 'Japan'
    });
    // Add zip and country to estimate for input caching
    estimate.zip = pin;
    estimate.country = pin.startsWith('507') ? 'India' : 'Japan';
    state.shippingEstimate = estimate;
    resPanel.innerHTML = renderShippingEstimateHTML(estimate);
    showToast('Shipping estimates successfully calculated!');
    
    // Re-render product details to sync the prices to local currency
    const activeProductId = parseInt(window.location.hash.replace('#/product/', ''));
    if (activeProductId) {
      loadProductDetails(activeProductId);
    }
  } catch (err) {
    resPanel.innerHTML = '<span class="text-danger">Failed to calculate shipping logistics.</span>';
  }
}

function renderShippingEstimateHTML(est) {
  const dateStr = new Date(est.estimatedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const delayAlert = est.weather.delayHours > 0 ? `
    <div class="checkout-delivery-estimate-box" style="margin-top:8px;">
      <i class="fa-solid fa-triangle-exclamation"></i> 
      <span>Logistic Alert: Heavy weather (${est.weather.condition}) added ${est.weather.delayHours} hrs shipping delay.</span>
    </div>
  ` : '';
  
  return `
    <div>Delivery estimated by: <strong>${dateStr}</strong> (Takes ${est.estimatedDays} days)</div>
    <div>Shipping Distance: <strong>${est.distanceKm} km</strong> | Delivery Charge: <strong>${formatAmount(est.shippingCharge)}</strong></div>
    <div>Current Weather: <strong>${est.weather.temp}, ${est.weather.condition}</strong></div>
    ${delayAlert}
  `;
}

function setupStarsSelector() {
  const stars = document.querySelectorAll('#rating-star-selector i');
  const input = document.getElementById('form-review-stars-val');
  
  stars.forEach(s => {
    s.onclick = () => {
      const activeRating = parseInt(s.dataset.rating);
      input.value = activeRating;
      
      stars.forEach(star => {
        const rating = parseInt(star.dataset.rating);
        if (rating <= activeRating) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
      });
    };
  });
}

async function submitReview(e, productId) {
  e.preventDefault();
  if (!state.token) {
    showToast('Please sign in to submit a review', 'error');
    openAuthModal();
    return;
  }
  
  const rating = document.getElementById('form-review-stars-val').value;
  const comment = document.getElementById('review-comment').value.trim();
  
  try {
    await apiCall(`/api/products/${productId}/reviews`, 'POST', { rating, comment });
    showToast('Review submitted successfully!', 'success');
    loadProductDetails(productId); // Reload page details
  } catch (err) {
    showToast('Failed to save review', 'error');
  }
}

function renderCartView() {
  const container = document.getElementById('cart-items-list-container');
  const card = document.getElementById('cart-pricing-details-card');
  
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 40px 0;">
        <i class="fa-solid fa-cart-shopping" style="font-size: 3rem; color:var(--color-text-muted); margin-bottom:15px;"></i>
        <p>Your shopping cart is empty.</p>
        <button class="btn btn-outline" onclick="window.location.hash = '#/'" style="margin-top:15px;">Explore Catalog</button>
      </div>
    `;
    card.classList.add('hidden');
    return;
  }
  
  card.classList.remove('hidden');
  
  // Render items
  container.innerHTML = state.cart.map(item => {
    const variationsText = item.selectedVariations && Object.keys(item.selectedVariations).length > 0
      ? `<div class="cart-item-variations" style="font-size: 0.85rem; color: var(--color-text-muted); margin-top: 4px;">
           ${Object.entries(item.selectedVariations).map(([k, v]) => `<strong>${k.charAt(0).toUpperCase() + k.slice(1)}:</strong> ${v}`).join(' | ')}
         </div>`
      : '';
      
    const itemKey = item.cartItemId || item.id;
    const colorVal = item.selectedVariations && (item.selectedVariations.colors || item.selectedVariations.color);
    const filterStyle = colorVal ? getFilterStyleForColor(colorVal) : '';
    return `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img" style="${filterStyle}">
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          ${variationsText}
          <span class="cart-item-meta" style="margin-top:4px; display:inline-block;">Unit Price: ${formatAmount(item.price)}</span>
          <div class="cart-qty-controls">
            <button class="qty-btn" onclick="updateCartQuantity('${itemKey}', -1)"><i class="fa-solid fa-minus"></i></button>
            <span>${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQuantity('${itemKey}', 1)"><i class="fa-solid fa-plus"></i></button>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end;">
          <strong class="neon-text">${formatAmount(item.price * item.quantity)}</strong>
          <button class="btn btn-link btn-sm" onclick="removeFromCart('${itemKey}')" style="margin-top:10px; color:var(--color-text-danger);">
            <i class="fa-solid fa-trash-can"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  // Calculate pricing
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal > 150 ? subtotal * 0.1 : 0.00; // Promo savings if > $150
  const delivery = state.shippingEstimate ? state.shippingEstimate.shippingCharge : 0.00;
  const total = subtotal - discount + delivery;
  
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('pricing-item-count').textContent = count;
  document.getElementById('pricing-subtotal').textContent = formatAmount(subtotal);
  document.getElementById('pricing-discount').textContent = `-${formatAmount(discount)}`;
  document.getElementById('pricing-delivery').textContent = delivery > 0 ? formatAmount(delivery) : 'FREE';
  document.getElementById('pricing-total').textContent = formatAmount(total);
}

// --- Flipkart-Style Checkout Accordion ---
function setupCheckoutAccordion() {
  const steps = [1, 2, 3, 4];
  
  // Header clicks
  steps.forEach(stepNum => {
    const header = document.querySelector(`#checkout-step-panel-${stepNum} .step-header`);
    header.onclick = () => {
      // Allowed if previous steps are verified/completed
      if (canOpenCheckoutStep(stepNum)) {
        openCheckoutStepPanel(stepNum);
      }
    };
  });
  
  // Step button actions
  document.getElementById('checkout-login-trigger').onclick = () => openAuthModal();
  
  document.getElementById('checkout-step-1-next-btn').onclick = () => {
    openCheckoutStepPanel(2);
  };
  
  document.getElementById('checkout-step-2-next-btn').onclick = () => {
    if (!state.selectedCheckoutAddressId) {
      showToast('Please select a delivery address', 'error');
      return;
    }
    openCheckoutStepPanel(3);
  };
  
  document.getElementById('checkout-step-3-next-btn').onclick = () => {
    openCheckoutStepPanel(4);
  };
  
  // New address form
  document.getElementById('checkout-show-add-address-btn').onclick = () => {
    document.getElementById('checkout-new-address-form').classList.remove('hidden');
    document.getElementById('checkout-show-add-address-btn').classList.add('hidden');
  };
  document.getElementById('new-addr-cancel-btn').onclick = () => {
    document.getElementById('checkout-new-address-form').classList.add('hidden');
    document.getElementById('checkout-show-add-address-btn').classList.remove('hidden');
  };
  
  document.getElementById('checkout-new-address-form').onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('new-addr-title').value.trim() || 'Home';
    const name = document.getElementById('new-addr-name').value.trim();
    const phone = document.getElementById('new-addr-phone').value.trim();
    const address = document.getElementById('new-addr-street').value.trim();
    const city = document.getElementById('new-addr-city').value.trim();
    const zip = document.getElementById('new-addr-zip').value.trim();
    const country = document.getElementById('new-addr-country').value.trim() || 'India';
    
    try {
      const newAddress = await apiCall('/api/addresses', 'POST', { title, name, phone, address, city, zip, country });
      showToast('Address added successfully!', 'success');
      
      // Reload addresses
      await verifyToken(); 
      renderCheckoutAddresses();
      
      // Clear and hide form
      document.getElementById('checkout-new-address-form').reset();
      document.getElementById('checkout-new-address-form').classList.add('hidden');
      document.getElementById('checkout-show-add-address-btn').classList.remove('hidden');
      
      // Select new address
      selectCheckoutAddress(newAddress.id);
    } catch (err) {
      showToast('Failed to save address details', 'error');
    }
  };

  // Payment radio selectors
  const payRadios = document.getElementsByName('checkout-payment-method');
  payRadios.forEach(radio => {
    radio.onchange = () => {
      state.selectedCheckoutPayment = radio.value;
      
      // Toggle panels
      if (radio.value === 'credit-card') {
        document.getElementById('card-panel-details').classList.remove('hidden');
        document.getElementById('upi-panel-details').classList.add('hidden');
        document.getElementById('checkout-payment-summary').textContent = 'Credit Card';
      } else if (radio.value === 'upi') {
        document.getElementById('card-panel-details').classList.add('hidden');
        document.getElementById('upi-panel-details').classList.remove('hidden');
        document.getElementById('checkout-payment-summary').textContent = 'UPI';
      } else {
        document.getElementById('card-panel-details').classList.add('hidden');
        document.getElementById('upi-panel-details').classList.add('hidden');
        document.getElementById('checkout-payment-summary').textContent = radio.value.toUpperCase();
      }
    };
  });
  
  document.getElementById('generate-qr-btn').onclick = () => {
    const vpa = document.getElementById('checkout-vpa').value.trim();
    if (!vpa) {
      showToast('Please enter your VPA', 'error');
      return;
    }
    document.getElementById('payment-qr-holder').classList.remove('hidden');
  };

  // Place order final click
  document.getElementById('checkout-place-order-btn').onclick = () => submitCheckoutOrder();
}

function canOpenCheckoutStep(step) {
  if (step === 1) return true;
  if (step === 2) return !!state.token; // authenticated
  if (step === 3) return !!state.token && !!state.selectedCheckoutAddressId;
  if (step === 4) return !!state.token && !!state.selectedCheckoutAddressId && !!state.selectedCheckoutPayment;
  return false;
}

function openCheckoutStepPanel(step) {
  state.activeCheckoutStep = step;
  
  // Collapse all bodies
  for (let s = 1; s <= 4; s++) {
    const body = document.getElementById(`checkout-step-body-${s}`);
    const panel = document.getElementById(`checkout-step-panel-${s}`);
    if (s === step) {
      body.classList.remove('hidden');
      panel.classList.add('active');
    } else {
      body.classList.add('hidden');
      panel.classList.remove('active');
    }
  }
}

function renderCheckoutAddresses() {
  const container = document.getElementById('checkout-address-book');
  const addresses = (state.user && state.user.addresses) || [];
  
  if (addresses.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1;">No delivery addresses saved. Please add a new address to continue.</p>';
    document.getElementById('address-proceed-actions').classList.add('hidden');
    return;
  }
  
  container.innerHTML = addresses.map(addr => `
    <div class="address-card ${state.selectedCheckoutAddressId === addr.id ? 'selected' : ''}" onclick="selectCheckoutAddress('${addr.id}')">
      <button class="address-card-delete" onclick="event.stopPropagation(); deleteSavedAddress('${addr.id}')"><i class="fa-solid fa-trash-can"></i></button>
      <div class="address-card-title">${addr.title}</div>
      <div class="address-card-body">
        <strong>${addr.name}</strong><br>
        ${addr.address}<br>
        ${addr.city}, ${addr.zip}<br>
        ${addr.country}<br>
        Phone: ${addr.phone}
      </div>
    </div>
  `).join('');
  
  // Select first address if none active
  if (!state.selectedCheckoutAddressId && addresses.length > 0) {
    selectCheckoutAddress(addresses[0].id);
  }
}

function selectCheckoutAddress(id) {
  state.selectedCheckoutAddressId = id;
  
  // Re-highlight card
  document.querySelectorAll('.address-card').forEach(card => card.classList.remove('selected'));
  renderCheckoutAddresses();
  
  // Set address summary badge
  const addr = state.user.addresses.find(a => a.id === id);
  if (addr) {
    document.getElementById('checkout-address-summary').textContent = `${addr.city} (${addr.zip})`;
    
    // Estimate shipping route and coordinates on address change
    triggerAddressShippingEstimate(addr);
  }
  
  document.getElementById('address-proceed-actions').classList.remove('hidden');
}

async function deleteSavedAddress(id) {
  try {
    await apiCall(`/api/addresses/${id}`, 'DELETE');
    showToast('Address removed successfully');
    
    if (state.selectedCheckoutAddressId === id) {
      state.selectedCheckoutAddressId = null;
    }
    
    await verifyToken();
    renderCheckoutAddresses();
  } catch (err) {
    showToast('Failed to delete address', 'error');
  }
}

async function triggerAddressShippingEstimate(addr) {
  document.getElementById('checkout-summary-estimate-details').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Estimating route distance & weather delays...';
  try {
    const est = await apiCall('/api/shipping/estimate', 'POST', {
      zip: addr.zip,
      city: addr.city,
      country: addr.country
    });
    
    state.shippingEstimate = est;
    
    const dateStr = new Date(est.estimatedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    document.getElementById('checkout-summary-estimate-details').innerHTML = `
      <i class="fa-solid fa-truck-fast"></i> 
      <div>
        <strong>Arriving by ${dateStr}</strong><br>
        Distance: ${est.distanceKm} km | Transit Weather: ${est.weather.temp}, ${est.weather.condition}
      </div>
    `;
    
    // Update Checkout totals
    updateCheckoutPricing();
  } catch (err) {
    document.getElementById('checkout-summary-estimate-details').innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Transit estimation failed.';
  }
}

function updateCheckoutPricing() {
  if (state.cart.length === 0) return;
  
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal > 150 ? subtotal * 0.1 : 0.00;
  const delivery = state.shippingEstimate ? state.shippingEstimate.shippingCharge : 0.00;
  const total = subtotal - discount + delivery;
  
  document.getElementById('checkout-summary-subtotal').textContent = formatAmount(subtotal);
  document.getElementById('checkout-summary-discount').textContent = `-${formatAmount(discount)}`;
  document.getElementById('checkout-summary-delivery').textContent = delivery > 0 ? formatAmount(delivery) : 'FREE';
  document.getElementById('checkout-summary-total').textContent = formatAmount(total);
  document.getElementById('checkout-final-pay-total').textContent = formatAmount(total);
}

function renderCheckoutReviewItems() {
  const container = document.getElementById('checkout-review-items-container');
  container.innerHTML = state.cart.map(item => {
    const variationsText = item.selectedVariations && Object.keys(item.selectedVariations).length > 0
      ? `<div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px;">
           ${Object.entries(item.selectedVariations).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(', ')}
         </div>`
      : '';
    return `
      <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:0.9rem; border-bottom: 1px dashed var(--color-border); padding-bottom: 8px;">
        <div>
          <span>${item.name} <strong>x${item.quantity}</strong></span>
          ${variationsText}
        </div>
        <span>${formatAmount(item.price * item.quantity)}</span>
      </div>
    `;
  }).join('');
}

async function submitCheckoutOrder() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  
  const address = state.user.addresses.find(a => a.id === state.selectedCheckoutAddressId);
  if (!address) {
    showToast('Shipping address is missing', 'error');
    return;
  }
  
  const checkoutBtn = document.getElementById('checkout-place-order-btn');
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing payment gateway...';
  
  try {
    // 1. Process Stripe Mock/Real Charge
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const chargeRes = await apiCall('/api/payment/charge', 'POST', {
      amount: totalAmount,
      paymentMethod: state.selectedCheckoutPayment,
      token: 'tok_visa'
    });
    
    showToast(`Payment authorized: ID ${chargeRes.transactionId.substring(0, 10)}... (${chargeRes.gateway})`, 'success');
    
    // 2. Submit order to backend
    const orderRes = await apiCall('/api/orders', 'POST', {
      items: state.cart,
      shippingAddress: address,
      paymentMethod: state.selectedCheckoutPayment
    });
    
    showToast('Order placed successfully!', 'success');
    clearCart();
    
    // 3. Route user to Live order tracking page
    window.location.hash = `#/track/${orderRes.order.id}`;
  } catch (err) {
    showToast(`Transaction failed: ${err.message}`, 'error');
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = `Place Order <span id="checkout-final-pay-total">${formatAmount(0)}</span>`;
    updateCheckoutPricing();
  }
}

// --- Orders History Dashboard ---
async function loadOrdersDashboard() {
  const container = document.getElementById('orders-list');
  container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>Fetching transaction ledgers...</p></div>`;
  
  try {
    const orders = await apiCall('/api/orders');
    
    if (orders.length === 0) {
      container.innerHTML = '<p class="no-orders">No transactions found under this identity credential.</p>';
      return;
    }
    
    container.innerHTML = orders.map(order => {
      const itemsList = order.items.map(item => {
        const variationsText = item.selectedVariations && Object.keys(item.selectedVariations).length > 0
          ? `<div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 2px;">
               ${Object.entries(item.selectedVariations).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`).join(', ')}
             </div>`
          : '';
        return `
          <div class="order-item-detail-row" style="margin-bottom: 8px;">
            <div>
              <span>${item.name} (Qty: ${item.quantity})</span>
              ${variationsText}
            </div>
            <strong>${formatAmount(item.price * item.quantity, order.shippingAddress ? order.shippingAddress.country : null)}</strong>
          </div>
        `;
      }).join('');
      
      const dateStr = new Date(order.createdAt).toLocaleString();
      return `
        <div class="order-history-card">
          <div class="order-card-header">
            <div>Order ID: <strong>${order.id}</strong></div>
            <div>Date: ${dateStr}</div>
            <div>Status: <span class="step-summary-badge" style="color:var(--color-primary);">${order.status}</span></div>
          </div>
          <div class="order-card-body-items">
            ${itemsList}
          </div>
          <div class="order-card-footer">
            <div>Billing Total: <strong class="neon-text">${formatAmount(order.total, order.shippingAddress ? order.shippingAddress.country : null)}</strong></div>
            <button class="btn btn-primary btn-sm" onclick="window.location.hash = '#/track/${order.id}'">
              <i class="fa-solid fa-location-crosshairs"></i> Track Shipment
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-danger">Failed to load order history records.</p>`;
  }
}

// --- Live Order Tracking & Logistics Animation ---
async function loadOrderTracking(id) {
  // Clear any existing active loops
  if (state.activeTrackingTimer) {
    clearInterval(state.activeTrackingTimer);
  }
  
  try {
    const order = await apiCall(`/api/orders/${id}`);
    
    document.getElementById('tracking-order-id').textContent = order.id;
    document.getElementById('tracking-carrier-name').textContent = order.tracking.carrier;
    document.getElementById('tracking-number-val').textContent = order.tracking.trackingNumber;
    document.getElementById('tracking-active-hub').textContent = `Status: ${order.tracking.status} (${order.tracking.activeHub})`;
    
    // Set weather details
    const weather = order.tracking.weatherCondition;
    document.getElementById('tracking-weather-text').innerHTML = `
      Hub Temp: <strong>${weather.temp}</strong> | Atmospheric State: <strong>${weather.condition}</strong><br>
      Estimated logistic delay penalty: <strong>${weather.delayHours} hrs</strong>
    `;

    // Render timeline steps highlight classes
    updateTrackingTimelineUI(order.tracking.status, order.createdAt);
    
    // Render Leaflet Map animation route
    initializeTrackingMap(order.tracking);

    // Dynamic polling loop to simulate delivery progression every 5 seconds
    state.activeTrackingTimer = setInterval(async () => {
      try {
        const updatedOrder = await apiCall(`/api/orders/${id}`);
        updateTrackingTimelineUI(updatedOrder.tracking.status, updatedOrder.createdAt);
        document.getElementById('tracking-active-hub').textContent = `Status: ${updatedOrder.tracking.status} (${updatedOrder.tracking.activeHub})`;
        
        // Update vehicle coordinate marker on Leaflet map
        if (state.activeMapInstance && state.activeMapInstance.carrierMarker) {
          const loc = updatedOrder.tracking.currentLocation;
          state.activeMapInstance.carrierMarker.setLatLng(loc);
          state.activeMapInstance.map.panTo(loc);
        }
        
        if (updatedOrder.tracking.status === 'Delivered') {
          clearInterval(state.activeTrackingTimer);
        }
      } catch (e) {
        clearInterval(state.activeTrackingTimer);
      }
    }, 5000);

  } catch (err) {
    showToast('Failed to load live tracking details', 'error');
  }
}

function updateTrackingTimelineUI(status, createdAt) {
  const steps = ['Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const activeIdx = steps.indexOf(status);
  
  steps.forEach((stepName, idx) => {
    // ID conversion: Placed -> timeline-step-placed
    const id = stepName.toLowerCase().replace(/\s/g, '');
    const row = document.getElementById(`timeline-step-${id === 'outfordelivery' ? 'delivery' : id === 'delivered' ? 'completed' : id}`);
    if (!row) return;
    
    const timeSpan = row.querySelector('.timeline-time');
    
    if (idx < activeIdx) {
      row.className = 'timeline-step completed';
      timeSpan.textContent = 'Completed';
    } else if (idx === activeIdx) {
      row.className = 'timeline-step active';
      timeSpan.textContent = new Date().toLocaleTimeString();
    } else {
      row.className = 'timeline-step';
      timeSpan.textContent = 'Pending...';
    }
  });
  
  // Placed timestamp set
  document.getElementById('timeline-time-placed').textContent = new Date(createdAt).toLocaleString();
}

function initializeTrackingMap(tracking) {
  // Map is disabled/hidden per user request. No Leaflet initialization.
}

// --- View Router Controller ---
function router() {
  const hash = window.location.hash || '#/';
  
  // Hide all panels
  document.getElementById('home-view').classList.add('hidden');
  document.getElementById('product-detail-view').classList.add('hidden');
  document.getElementById('cart-view').classList.add('hidden');
  document.getElementById('checkout-view').classList.add('hidden');
  document.getElementById('orders-view').classList.add('hidden');
  document.getElementById('tracking-view').classList.add('hidden');
  
  // Close active loops
  if (state.activeTrackingTimer) {
    clearInterval(state.activeTrackingTimer);
    state.activeTrackingTimer = null;
  }

  // Home route
  if (hash === '#/' || hash === '') {
    document.getElementById('home-view').classList.remove('hidden');
    fetchProducts();
    setupSliderCarousel();
  }
  // Product Details route
  else if (hash.startsWith('#/product/')) {
    const id = parseInt(hash.replace('#/product/', ''));
    document.getElementById('product-detail-view').classList.remove('hidden');
    loadProductDetails(id);
  }
  // Cart route
  else if (hash === '#/cart') {
    document.getElementById('cart-view').classList.remove('hidden');
    renderCartView();
  }
  // Checkout route
  else if (hash === '#/checkout') {
    document.getElementById('checkout-view').classList.remove('hidden');
    openCheckoutStepPanel(1);
    
    if (state.token) {
      renderCheckoutAddresses();
      renderCheckoutReviewItems();
      updateCheckoutPricing();
    }
  }
  // Orders history dashboard route
  else if (hash === '#/orders') {
    if (!state.token) {
      showToast('Login required to access order dashboard', 'error');
      window.location.hash = '#/';
      openAuthModal();
      return;
    }
    document.getElementById('orders-view').classList.remove('hidden');
    loadOrdersDashboard();
  }
  // Order Live Tracking route
  else if (hash.startsWith('#/track/')) {
    const orderId = hash.replace('#/track/', '');
    document.getElementById('tracking-view').classList.remove('hidden');
    loadOrderTracking(orderId);
  }
  
  // Scroll to top
  window.scrollTo(0, 0);
}

// --- Common UI Modal & Events Binding ---
function openAuthModal() {
  document.getElementById('auth-modal').classList.remove('hidden');
}
function closeAuthModal() {
  document.getElementById('auth-modal').classList.add('hidden');
}

function setupAuthModal() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login-btn');
  const tabRegister = document.getElementById('tab-register-btn');
  
  tabLogin.onclick = () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  };
  
  tabRegister.onclick = () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  };
  
  document.getElementById('toggle-to-register').onclick = (e) => {
    e.preventDefault();
    tabRegister.click();
  };
  document.getElementById('toggle-to-login').onclick = (e) => {
    e.preventDefault();
    tabLogin.click();
  };

  document.getElementById('close-auth-modal-btn').onclick = () => closeAuthModal();

  // Submission handlers
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    try {
      const res = await apiCall('/api/auth/register'.replace('register', 'login'), 'POST', { email, password });
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem('aetheria_token', res.token);
      localStorage.setItem('aetheria_user', JSON.stringify(res.user));
      
      showToast('Authentication success!', 'success');
      closeAuthModal();
      await verifyToken();
      
      // If currently on checkout page, reload checkout details
      if (window.location.hash === '#/checkout') {
        renderCheckoutAddresses();
        renderCheckoutReviewItems();
        updateCheckoutPricing();
        openCheckoutStepPanel(2);
      } else {
        router(); // Refresh view state
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    }
  };

  registerForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    try {
      const res = await apiCall('/api/auth/register', 'POST', { name, email, password });
      state.token = res.token;
      state.user = res.user;
      localStorage.setItem('aetheria_token', res.token);
      localStorage.setItem('aetheria_user', JSON.stringify(res.user));
      
      showToast('Registration complete. Security profile created.', 'success');
      closeAuthModal();
      await verifyToken();
      
      if (window.location.hash === '#/checkout') {
        renderCheckoutAddresses();
        renderCheckoutReviewItems();
        updateCheckoutPricing();
        openCheckoutStepPanel(2);
      } else {
        router();
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };
}

function setupGlobalEvents() {
  // Brand Logo route to home
  document.getElementById('nav-logo').onclick = (e) => {
    e.preventDefault();
    state.currentCategory = 'all';
    state.currentSearch = '';
    document.getElementById('search-input').value = '';
    window.location.hash = '#/';
  };
  
  // Category Navigation bar
  document.querySelectorAll('.nav-sub-item').forEach(item => {
    item.onclick = () => {
      document.querySelectorAll('.nav-sub-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      state.currentCategory = item.dataset.category;
      
      // Update sidebar category active too
      document.querySelectorAll('#category-filter-list li').forEach(li => {
        if (li.dataset.category === item.dataset.category) {
          li.classList.add('active');
        } else {
          li.classList.remove('active');
        }
      });
      
      window.location.hash = '#/';
    };
  });

  // Sidebar Category Filter list
  document.querySelectorAll('#category-filter-list li').forEach(li => {
    li.onclick = () => {
      document.querySelectorAll('#category-filter-list li').forEach(i => i.classList.remove('active'));
      li.classList.add('active');
      state.currentCategory = li.dataset.category;
      
      // Update subnavbar category active too
      document.querySelectorAll('.nav-sub-item').forEach(sub => {
        if (sub.dataset.category === li.dataset.category) {
          sub.classList.add('active');
        } else {
          sub.classList.remove('active');
        }
      });

      fetchProducts();
    };
  });

  // Sort selectors
  document.getElementById('sort-select').onchange = (e) => {
    state.currentSort = e.target.value;
    fetchProducts();
  };

  // Price refinement filters
  document.getElementById('price-go-btn').onclick = () => {
    const minVal = parseFloat(document.getElementById('price-min').value);
    const maxVal = parseFloat(document.getElementById('price-max').value);
    state.priceMin = isNaN(minVal) ? null : minVal;
    state.priceMax = isNaN(maxVal) ? null : maxVal;
    fetchProducts();
  };

  // Search execution
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('nav-search-category');
  
  const triggerSearch = () => {
    state.currentSearch = searchInput.value.trim();
    state.currentCategory = categorySelect.value;
    
    // Sync subnavbar styling
    document.querySelectorAll('.nav-sub-item').forEach(i => {
      if (i.dataset.category === state.currentCategory) {
        i.classList.add('active');
      } else {
        i.classList.remove('active');
      }
    });

    window.location.hash = '#/';
  };

  document.getElementById('search-submit-btn').onclick = triggerSearch;
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      triggerSearch();
      document.getElementById('search-suggestions').classList.add('hidden');
    }
  });

  // Trigger Sign In click
  document.getElementById('login-trigger-btn').onclick = () => openAuthModal();

  // Cart click route
  document.getElementById('cart-trigger-btn').onclick = () => {
    window.location.hash = '#/cart';
  };
  document.getElementById('cart-checkout-trigger').onclick = () => {
    window.location.hash = '#/checkout';
  };

  // Address modal dropdown book click
  document.getElementById('manage-addresses-btn').onclick = (e) => {
    e.preventDefault();
    openAddressBookModal();
  };

  document.getElementById('close-address-modal-btn').onclick = () => {
    document.getElementById('address-book-modal').classList.add('hidden');
  };

  document.getElementById('modal-show-add-address-form-btn').onclick = () => {
    document.getElementById('address-book-modal').classList.add('hidden');
    window.location.hash = '#/checkout';
    setTimeout(() => {
      openCheckoutStepPanel(2);
      document.getElementById('checkout-new-address-form').classList.remove('hidden');
      document.getElementById('checkout-show-add-address-btn').classList.add('hidden');
    }, 100);
  };
  
  // Pin code header deliver trigger
  document.getElementById('nav-address-trigger').onclick = () => {
    if (!state.token) {
      openAuthModal();
    } else {
      openAddressBookModal();
    }
  };

  // Logout trigger
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  }

  // Setup Countdown Timer
  setupDealCountdown();
}

function openAddressBookModal() {
  const modal = document.getElementById('address-book-modal');
  modal.classList.remove('hidden');
  
  const container = document.getElementById('modal-address-book-list');
  const addresses = (state.user && state.user.addresses) || [];
  
  if (addresses.length === 0) {
    container.innerHTML = '<p>No saved addresses found. Add a delivery address in the checkout accordion panels.</p>';
    return;
  }
  
  container.innerHTML = addresses.map(addr => `
    <div class="address-card" style="cursor:default;">
      <button class="address-card-delete" onclick="deleteSavedAddressFromModal('${addr.id}')"><i class="fa-solid fa-trash-can"></i></button>
      <div class="address-card-title">${addr.title}</div>
      <div class="address-card-body">
        <strong>${addr.name}</strong><br>
        ${addr.address}<br>
        ${addr.city}, ${addr.zip}<br>
        ${addr.country}<br>
        Phone: ${addr.phone}
      </div>
    </div>
  `).join('');
}

async function deleteSavedAddressFromModal(id) {
  try {
    await apiCall(`/api/addresses/${id}`, 'DELETE');
    await verifyToken();
    openAddressBookModal();
    showToast('Address removed successfully');
  } catch (err) {
    showToast('Failed to delete address', 'error');
  }
}

function setupDealCountdown() {
  const timer = document.getElementById('deal-timer');
  let seconds = 15165; // ~4.2 hrs
  
  setInterval(() => {
    seconds--;
    if (seconds <= 0) seconds = 24 * 3600; // reset
    
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const pad = (n) => String(n).padStart(2, '0');
    timer.textContent = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }, 1000);
}

// --- App Initialization Entry ---
window.addEventListener('hashchange', router);

window.addEventListener('DOMContentLoaded', async () => {
  // Sync state initially
  updateNavbarBadge();
  setupAuthModal();
  setupAutocomplete();
  setupCheckoutAccordion();
  setupGlobalEvents();
  
  // Verify JWT session
  await verifyToken();
  
  // Run router initially
  router();
});
