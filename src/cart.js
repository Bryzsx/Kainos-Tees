const STORAGE_KEY = 'kainos_cart'

export function getCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
}

export function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  dispatchEvent(new CustomEvent('cart:update'))
}

export function addToCart(product, size, color) {
  const cart = getCart()
  const key = `${product.id}-${size}-${color.h}`
  const existing = cart.find(i => i.key === key)
  if (existing) {
    existing.qty++
  } else {
    cart.push({ key, id: product.id, name: product.name, price: product.price, size, color, image: product.image, qty: 1 })
  }
  saveCart(cart)
  showToast(`${product.name} added to bag`)
}

export function removeFromCart(key) {
  const cart = getCart().filter(i => i.key !== key)
  saveCart(cart)
}

export function updateQty(key, delta) {
  const cart = getCart()
  const item = cart.find(i => i.key === key)
  if (item) {
    item.qty = Math.max(1, item.qty + delta)
    saveCart(cart)
  }
}

export function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0)
}

export function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0)
}

const cartOverlay = document.createElement('div')
cartOverlay.className = 'cart-overlay'

const cartDrawer = document.createElement('div')
cartDrawer.className = 'cart-drawer'

export function renderCart() {
  const items = getCart()
  if (!cartDrawer.parentNode) {
    document.body.appendChild(cartOverlay)
    document.body.appendChild(cartDrawer)
  }
  if (!items.length) {
    cartDrawer.innerHTML = `
      <div class="cart-header"><h3>Your Bag</h3><button class="cart-close" onclick="window.closeCart()">\u2715</button></div>
      <div class="cart-empty"><p>Your bag is empty.</p></div>`
    return
  }
  let html = `<div class="cart-header"><h3>Your Bag (${getCartCount()})</h3><button class="cart-close" onclick="window.closeCart()">\u2715</button></div>
    <div class="cart-items">`
  items.forEach(i => {
    html += `<div class="cart-item">
      <img src="${i.image}" alt="${i.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-meta">Size: ${i.size} &middot; Color: <span class="cart-dot" style="background:${i.color.h}"></span></div>
        <div class="cart-item-price">$${i.price}</div>
      </div>
      <div class="cart-item-qty">
        <button onclick="window.updateQty('${i.key}', -1)">\u2212</button>
        <span>${i.qty}</span>
        <button onclick="window.updateQty('${i.key}', 1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="window.removeFromCart('${i.key}')">\u2715</button>
    </div>`
  })
  html += `</div>
    <div class="cart-footer">
      <div class="cart-total"><span>Total</span><span>$${getCartTotal().toFixed(2)}</span></div>
      <button class="cart-checkout">Checkout</button>
    </div>`
  cartDrawer.innerHTML = html

  const btn = cartDrawer.querySelector('.cart-checkout')
  if (btn) {
    btn.onclick = () => dispatchEvent(new CustomEvent('checkout:open'))
  }
}

export function openCart() {
  renderCart()
  cartOverlay.classList.add('open')
  cartDrawer.classList.add('open')
  document.body.style.overflow = 'hidden'
}

export function closeCart() {
  cartOverlay.classList.remove('open')
  cartDrawer.classList.remove('open')
  document.body.style.overflow = ''
}

cartOverlay.addEventListener('click', closeCart)
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart() })

addEventListener('cart:update', () => {
  const el = document.getElementById('cart-count')
  if (el) el.textContent = getCartCount()
  renderCart()
})

const toast = document.createElement('div')
toast.className = 'toast'

export function showToast(msg, duration) {
  if (!toast.parentNode) document.body.appendChild(toast)
  toast.textContent = msg
  toast.classList.add('open')
  clearTimeout(toast._t)
  toast._t = setTimeout(() => toast.classList.remove('open'), duration || 2200)
}

window.addToCart = addToCart
window.removeFromCart = removeFromCart
window.updateQty = updateQty
window.closeCart = closeCart
