import { getProducts, getCollections, ALL_SIZES, ALL_CATEGORIES, COLLECTIONS as LOCAL_COLLECTIONS } from './data.js'
import { getCart, addToCart, removeFromCart, updateQty, getCartCount, getCartTotal, renderCart, openCart, closeCart, showToast } from './cart.js'
import { getCurrentUser, getCachedUser, setCurrentUser, signUp, signIn, verifyUser, signOut } from './auth.js'
import { supabase, isSupabased } from './lib/supabase.js'
import './styles/style.css'

// Theme toggle
(function initTheme() {
  const saved = localStorage.getItem('kainos-theme')
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  const btn = document.getElementById('theme-toggle')
  if (btn) {
    const lightIcon = btn.querySelector('.theme-icon-light')
    const darkIcon = btn.querySelector('.theme-icon-dark')
    if (saved === 'dark') {
      lightIcon.style.display = 'none'
      darkIcon.style.display = 'block'
    }
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
      if (isDark) {
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('kainos-theme', 'light')
        lightIcon.style.display = 'block'
        darkIcon.style.display = 'none'
      } else {
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('kainos-theme', 'dark')
        lightIcon.style.display = 'none'
        darkIcon.style.display = 'block'
      }
    })
  }
})()

const EMAILJS_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY',
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_EMAILJS_TEMPLATE_ID',
}

function sendVerificationEmail(name, email, code) {
   if (typeof emailjs === 'undefined') {
     console.log('EmailJS not loaded — demo mode. Code:', code)
     showToast(`Demo: verification code sent to ${email} (${code})`)
     return Promise.resolve(false)
   }
   if (EMAILJS_CONFIG.publicKey.startsWith('YOUR_')) {
     console.log('EmailJS not configured — demo mode. Code:', code)
     showToast(`Demo: code ${code} sent to ${email}`)
     return Promise.resolve(false)
   }
   emailjs.init(EMAILJS_CONFIG.publicKey)
   return emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
     to_email: email,
     to_name: name,
     verification_code: code,
     from_name: 'Kainos Tees',
   }).then(() => {
     showToast(`Verification code sent to ${email}`)
     return true
   }).catch(err => {
     console.error('EmailJS error:', err)
     showToast(`Demo: code ${code} (email send failed — check EmailJS config)`)
     return false
   })
 }

// Form validation helpers
function setInputError(input, message) {
   const formGroup = input.closest('.chk-field') || input.parentElement
   // Remove existing error
   const existingError = formGroup.querySelector('.input-error')
   if (existingError) existingError.remove()
   
   // Add error message
   const errorElement = document.createElement('div')
   errorElement.className = 'input-error'
   errorElement.textContent = message
   errorElement.style.color = 'var(--color-text-error)'
   errorElement.style.fontSize = 'var(--color-font-size-xs)'
   errorElement.style.marginTop = '4px'
   input.style.borderColor = 'var(--color-text-error)'
   formGroup.appendChild(errorElement)
   input.setAttribute('aria-invalid', 'true')
   input.setAttribute('aria-describedby', errorElement.id || `${input.id}-error`)
   errorElement.id = `${input.id}-error`
}

function clearFormError(input) {
   const formGroup = input.closest('.chk-field') || input.parentElement
   const existingError = formGroup.querySelector('.input-error')
   if (existingError) existingError.remove()
   input.style.borderColor = ''
   input.removeAttribute('aria-invalid')
   input.removeAttribute('aria-describedby')
}

function clearFormErrorById(id) {
   const input = document.getElementById(id)
   if (input) clearFormError(input)
}

function clearFormErrorByName(name) {
   const inputs = document.getElementsByName(name)
   inputs.forEach(input => clearFormError(input))
}

function clearFormErrorByClass(className) {
   const inputs = document.getElementsByClassName(className)
   inputs.forEach(input => clearFormError(input))
}

function clearFormErrorBySelector(selector) {
   const inputs = document.querySelectorAll(selector)
   inputs.forEach(input => clearFormError(input))
}

function clearFormErrorByTag(tagName) {
   const inputs = document.getElementsByTagName(tagName)
   inputs.forEach(input => clearFormError(input))
}

function clearFormErrorByAttribute(attrName, attrValue) {
   const inputs = document.querySelectorAll(`[${attrName}="${attrValue}"]`)
   inputs.forEach(input => clearFormError(input))
}

function clearFormErrorByAttributes(attrs) {
   const selector = Object.entries(attrs).map(([key, value]) => `[${key}="${value}"]`).join('')
   const inputs = document.querySelectorAll(selector)
   inputs.forEach(input => clearFormError(input))
}

function clearFormInputs(inputs) {
   inputs.forEach(input => {
     input.value = ''
     clearFormError(input)
   })
}

function focusFirstError() {
   const firstError = document.querySelector('.input-error')
   if (firstError) {
     const inputId = firstError.id?.replace('-error', '')
     if (inputId) {
       const input = document.getElementById(inputId)
       if (input) input.focus()
     }
   }
}

// Form validation for account modal
function validateSignupForm() {
   const nameInput = document.getElementById('acct-name')
   const emailInput = document.getElementById('acct-email')
   const passInput = document.getElementById('acct-pass')
   
   clearFormError(nameInput)
   clearFormError(emailInput)
   clearFormError(passInput)
   
   let isValid = true
   
   if (!nameInput.value.trim()) {
     setInputError(nameInput, 'Full name is required')
     isValid = false
   }
   
   if (!emailInput.value.trim()) {
     setInputError(emailInput, 'Email is required')
     isValid = false
   } else if (!emailInput.value.includes('@')) {
     setInputError(emailInput, 'Please enter a valid email')
     isValid = false
   }
   
   if (!passInput.value) {
     setInputError(passInput, 'Password is required')
     isValid = false
   } else if (passInput.value.length < 6) {
     setInputError(passInput, 'Password must be at least 6 characters')
     isValid = false
   }
   
   return isValid
}

function validateSigninForm() {
   const emailInput = document.getElementById('acct-email-signin')
   const passInput = document.getElementById('acct-pass-signin')
   
   clearFormError(emailInput)
   clearFormError(passInput)
   
   let isValid = true
   
   if (!emailInput.value.trim()) {
     setInputError(emailInput, 'Email is required')
     isValid = false
   } else if (!emailInput.value.includes('@')) {
     setInputError(emailInput, 'Please enter a valid email')
     isValid = false
   }
   
   if (!passInput.value) {
     setInputError(passInput, 'Password is required')
     isValid = false
   }
   
   return isValid
}

function showLoadingSkeleton() {
   // Create skeleton loader for products
   const grid = document.getElementById('product-grid')
   if (grid) {
     grid.innerHTML = ''
     // Create 9 skeleton cards (3x3 grid)
     for (let i = 0; i < 9; i++) {
       const skeleton = document.createElement('div')
       skeleton.className = 'skeleton-card'
       skeleton.innerHTML = `
         <div class="skeleton-header">
           <div class="skeleton-img"></div>
           <div class="skeleton-tag"></div>
         </div>
         <div class="skeleton-body">
           <div class="skeleton-line"></div>
           <div class="skeleton-line"></div>
           <div class="skeleton-line short"></div>
           <div class="skeleton-rating"></div>
           <div class="skeleton-swatches"></div>
           <div class="skeleton-sizes"></div>
           <div class="skeleton-btn"></div>
         </div>
       `
       grid.appendChild(skeleton)
     }
   }
   
   // Also show skeleton for collections section if needed
   const collectionsSec = document.getElementById('collections-section')
   if (collectionsSec) {
     collectionsSec.innerHTML = ''
     for (let i = 0; i < 3; i++) {
       const skeleton = document.createElement('div')
       skeleton.className = 'skeleton-col-card'
       skeleton.innerHTML = `
         <div class="skeleton-col-bg"></div>
         <div class="skeleton-col-txt">
           <div class="skeleton-line"></div>
           <div class="skeleton-line short"></div>
           <div class="skeleton-btn"></div>
         </div>
       `
       collectionsSec.appendChild(skeleton)
     }
   }
}

const PER_PAGE = 9
let allProducts = []
const state = {
  view: 'shop',
  categories: ['All Tees'],
  sizes: [], colors: [], priceRanges: [],
  sort: 'Featured', search: '', page: 1,
  collection: null,
}

const $ = id => document.getElementById(id)
const grid = $('product-grid')
const countEl = $('product-count')
const pagesEl = $('pagination')
const sortEl = $('sort-select')
const searchEl = $('search-input')
const searchToggle = $('search-toggle')
const searchBar = $('search-bar')
const cartBtn = $('cart-btn')
const cartCount = $('cart-count')
const pageTitle = $('page-title')
const pageDesc = $('page-desc')
const breadcrumb = $('breadcrumb')
const sidebar = document.querySelector('.sidebar')
const collectionsSec = $('collections-section')
const shopBar = document.querySelector('.shop-bar')

searchToggle?.addEventListener('click', () => searchBar?.classList.toggle('open'))
cartBtn?.addEventListener('click', openCart)
searchEl?.addEventListener('input', e => { state.search = e.target.value.toLowerCase(); state.page = 1; render() })
sortEl?.addEventListener('change', e => { state.sort = e.target.value; state.page = 1; render() })

document.querySelectorAll('.nav-link').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); switchView(el.dataset.view) })
})

document.querySelectorAll('.mobile-nav-link').forEach(el => {
  el.addEventListener('click', e => { e.preventDefault(); switchView(el.dataset.view); closeMobileNav() })
})

document.querySelector('.bread-link')?.addEventListener('click', e => { e.preventDefault(); switchView('shop') })

function switchView(view) {
  state.view = view
  state.collection = null
  state.categories = ['All Tees']
  state.sizes = []; state.colors = []; state.priceRanges = []
  state.sort = 'Featured'; state.search = ''; state.page = 1
  resetFilters()
  if (searchEl) searchEl.value = ''
  render()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

window.switchView = switchView

function resetFilters() {
  document.querySelectorAll('.filter-cat input').forEach(c => c.checked = c.value === 'All Tees')
  document.querySelectorAll('.size-pill').forEach(s => s.classList.remove('sel'))
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('sel'))
  document.querySelectorAll('.filter-price input').forEach(p => p.checked = false)
}

document.querySelector('.hamburger')?.addEventListener('click', () => {
  document.querySelector('.mobile-nav')?.classList.toggle('open')
})

function closeMobileNav() {
  document.querySelector('.mobile-nav')?.classList.remove('open')
}

document.querySelector('.mobile-nav-close')?.addEventListener('click', closeMobileNav)

function getFiltered() {
  let result = [...allProducts]

  if (state.view === 'new-arrivals') {
    result = result.filter(p => p.isNew)
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('act', l.dataset.view === 'new-arrivals'))
  } else if (state.view === 'sale') {
    result = result.filter(p => p.oldPrice != null || (p.tag && p.tag.startsWith('-')))
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('act', l.dataset.view === 'sale'))
  } else if (state.view === 'collection' && state.collection) {
    result = result.filter(p => p.collection === state.collection)
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('act', l.dataset.view === 'collection'))
  } else {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('act', l.dataset.view === 'shop'))
  }

  if (state.view === 'shop' || state.view === 'collection') {
    if (!state.categories.includes('All Tees') && state.categories.length) {
      result = result.filter(p => state.categories.includes(p.category))
    }
    if (state.sizes.length) result = result.filter(p => state.sizes.some(s => p.sizes.includes(s)))
    if (state.colors.length) result = result.filter(p => p.colors.some(c => state.colors.includes(c.h)))
    if (state.priceRanges.length) {
      result = result.filter(p => state.priceRanges.some(r => {
        if (r === 'under25') return p.price < 25
        if (r === '25to40') return p.price >= 25 && p.price <= 40
        if (r === '40to55') return p.price > 40 && p.price <= 55
        if (r === 'over55') return p.price > 55
        return false
      }))
    }
  }

  if (state.search) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(state.search) || p.category.toLowerCase().includes(state.search)
    )
  }

  switch (state.sort) {
    case 'Newest': result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.id - a.id); break
    case 'Price: Low to High': result.sort((a, b) => a.price - b.price); break
    case 'Price: High to Low': result.sort((a, b) => b.price - a.price); break
    default: result.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.id - b.id); break
  }
  return result
}

const VIEW_META = {
  'shop': { title: 'T-Shirts', desc: 'Premium fabrics. Every fit. Designed for life.', bread: 'Shop All' },
  'new-arrivals': { title: 'New Arrivals', desc: 'Fresh drops every Friday. Limited quantities.', bread: 'New Arrivals' },
  'sale': { title: 'We Made Too Much', desc: 'Limited stock. Unlimited savings.', bread: 'Sale' },
  'collection': { title: 'Collection', desc: 'Curated by vibe. Designed for life.', bread: 'Collection' },
}

async function render() {
  const meta = VIEW_META[state.view === 'collection' && state.collection ? 'collection' : state.view] || VIEW_META.shop
  if (pageTitle) pageTitle.textContent = meta.title
  if (pageDesc) pageDesc.textContent = meta.desc
  if (breadcrumb) breadcrumb.innerHTML = `<a href="#" class="bread-link">Home</a> / ${meta.bread}`

  if (state.view === 'collections') {
    sidebar?.classList.add('hidden')
    shopBar?.classList.add('hidden')
    collectionsSec?.classList.remove('hidden')
    grid.innerHTML = ''; pagesEl.innerHTML = ''
    if (countEl) countEl.textContent = `${allProducts.length} Products`
    renderCollections()
    return
  }

  sidebar?.classList.remove('hidden')
  shopBar?.classList.remove('hidden')
  collectionsSec?.classList.add('hidden')

  if (state.view === 'new-arrivals' || state.view === 'sale') {
    sidebar?.classList.add('hidden')
  }

  const filtered = getFiltered()
  const total = filtered.length
  const totalPages = Math.ceil(total / PER_PAGE) || 1
  if (state.page > totalPages) state.page = totalPages
  const start = (state.page - 1) * PER_PAGE
  const pageItems = filtered.slice(start, start + PER_PAGE)

  countEl.textContent = `${total} Product${total !== 1 ? 's' : ''}`

   if (!pageItems.length) {
     grid.innerHTML = `
       <div class="empty-state">
         <div class="empty-illustration">🔍</div>
         <p>No products match your current filters.</p>
         <p>Try adjusting your search or filters to see our collection.</p>
       </div>`
     pagesEl.innerHTML = ''
     return
   }

  grid.className = 'grid scene-3d'

  grid.innerHTML = pageItems.map(p => {
    const isSale = p.oldPrice != null || (p.tag && p.tag.startsWith('-'))
    const floatClass = p.isNew ? 'is-new' : p.featured ? 'is-featured' : ''
    return `<div class="card ${floatClass}" data-id="${p.id}">
      <div class="card-inner">
        <div class="card-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${p.tag ? `<span class="tag ${isSale ? 'sale' : p.tag === 'New' ? 'new' : 'best'}">${p.tag}</span>` : ''}
          <div class="card-quickview">Quick View</div>
        </div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-cat">${p.category}</div>
          <div class="card-price">${isSale ? `<span class="sale">$${p.price}</span> <span class="old">$${p.oldPrice}</span>` : `$${p.price}`}</div>
          <div class="card-rating">${'★'.repeat(Math.floor(p.rating || 4))}${(p.rating % 1 >= 0.5) ? '½' : ''} <span>(${p.reviews || 0})</span></div>
          <div class="card-swatches">${p.colors.map(c => `<span class="c-dot" style="background:${c.h}" title="${c.n}"></span>`).join('')}</div>
          <div class="card-sizes">${p.sizes.map(s => `<span class="c-size">${s}</span>`).join('')}</div>
          <button class="add-btn" data-id="${p.id}" data-size="${p.sizes[0]}" data-color='${JSON.stringify(p.colors[0])}'>+</button>
        </div>
      </div>
    </div>`
  }).join('')

  renderPages(totalPages)
  bindCardClicks()
  bindProductInteractions()
  initScrollReveal()
}

function bindCardClicks() {
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.add-btn') || e.target.closest('.c-dot') || e.target.closest('.c-size')) return
      const id = +card.dataset.id
      const prod = allProducts.find(p => p.id === id)
      if (prod) openProductModal(prod)
    })
  })
  grid.querySelectorAll('.card-quickview').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation()
      const card = el.closest('.card')
      const prod = allProducts.find(p => p.id === +card.dataset.id)
      if (prod) openProductModal(prod)
    })
  })
  initTilt3D()
}

function initTilt3D() {
  const cards = grid.querySelectorAll('.card')
  let ticking = false

  cards.forEach(card => {
    let rect = card.getBoundingClientRect()

    /* Shine overlay */
    let shine = card.querySelector('.card-shine')
    if (!shine) {
      shine = document.createElement('div')
      shine.className = 'card-shine'
      card.appendChild(shine)
    }

    const updateRect = () => rect = card.getBoundingClientRect()

    card.addEventListener('mouseenter', updateRect)

    card.addEventListener('mousemove', e => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -2
        const rotateY = x * 8
        const rotateX = y * 8
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`

        const mx = ((e.clientX - rect.left) / rect.width) * 100
        const my = ((e.clientY - rect.top) / rect.height) * 100
        shine.style.setProperty('--mx', mx + '%')
        shine.style.setProperty('--my', my + '%')

        ticking = false
      })
    })

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
    })
  })
}

function initScrollReveal() {
  const cards = grid.querySelectorAll('.card')
  if (!cards.length) return

  const obs = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = Array.from(cards).indexOf(entry.target) * 60
        entry.target.style.transitionDelay = delay + 'ms'
        entry.target.classList.add('revealed')
        obs.unobserve(entry.target)
      }
    })
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' })

  cards.forEach(card => {
    card.setAttribute('data-reveal', '')
    obs.observe(card)
  })
}

function initBgParticles() {
  if (document.querySelector('.bg-particles')) return
  const container = document.createElement('div')
  container.className = 'bg-particles'
  document.body.appendChild(container)

  const shapes = ['50%', '40% 60%', '30% 70% 30%', '60% 40% 60% 40% / 60% 30% 70% 40%']
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div')
    p.className = 'bg-particle'
    const size = 20 + Math.random() * 60
    p.style.width = size + 'px'
    p.style.height = size + 'px'
    p.style.left = Math.random() * 100 + '%'
    p.style.top = Math.random() * 100 + '%'
    p.style.borderRadius = shapes[i % shapes.length]
    p.style.background = i % 2 === 0 ? '#111' : '#e84747'
    p.style.animation = `particleFloat ${8 + Math.random() * 10}s ease-in-out infinite`
    p.style.animationDelay = -(Math.random() * 12) + 's'
    container.appendChild(p)

    requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('vis')))
  }
}

function bindProductInteractions() {
  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const prod = allProducts.find(p => p.id === +btn.dataset.id)
      if (!prod) return
      const user = getCachedUser()
      if (!user) {
        openAccountModal(() => addToCart(prod, btn.dataset.size, JSON.parse(btn.dataset.color)))
        return
      }
      addToCart(prod, btn.dataset.size, JSON.parse(btn.dataset.color))
    })
  })
  grid.querySelectorAll('.c-size').forEach(el => {
    el.addEventListener('click', function () {
      const card = this.closest('.card'); const btn = card.querySelector('.add-btn')
      btn.dataset.size = this.textContent
      card.querySelectorAll('.c-size').forEach(s => s.classList.remove('sel'))
      this.classList.add('sel')
    })
  })
  grid.querySelectorAll('.c-dot').forEach(el => {
    el.addEventListener('click', function () {
      const card = this.closest('.card'); const btn = card.querySelector('.add-btn')
      btn.dataset.color = JSON.stringify({ n: this.title, h: this.style.background })
      card.querySelectorAll('.c-dot').forEach(d => d.classList.remove('sel'))
      this.classList.add('sel')
    })
  })
}

function renderPages(total) {
  if (total <= 1) { pagesEl.innerHTML = ''; return }
  let html = ''
  for (let i = 1; i <= total; i++) {
    html += `<span class="pg ${i === state.page ? 'act' : ''}" data-page="${i}">${i}</span>`
  }
  pagesEl.innerHTML = html
  pagesEl.querySelectorAll('.pg').forEach(el => {
    el.addEventListener('click', () => {
      state.page = +el.dataset.page; render()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
}

function renderCollections() {
  if (!collectionsSec) return
  collectionsSec.classList.remove('hidden')
  collectionsSec.innerHTML = `<div class="page-head"><div class="breadcrumb"><a href="#" class="bread-link">Home</a> / Collections</div><h1>Collections</h1><p>Curated by vibe. Designed for life.</p></div>
  <div class="col-grid">${LOCAL_COLLECTIONS.map(c => {
    const prodCount = allProducts.filter(p => p.collection === c.id).length
    return `<div class="col-card" data-collection="${c.id}"><div class="col-bg" style="background:${c.bg};color:${c.text}">${c.icon}</div><div class="col-ov"></div><div class="col-txt"><h3>${c.name}</h3><p>${prodCount} designs.</p><span class="col-btn">Shop Now</span></div></div>`
  }).join('')}</div>`
  collectionsSec.querySelectorAll('.col-card').forEach(el => {
    el.addEventListener('click', () => {
      state.view = 'collection'; state.collection = el.dataset.collection
      state.categories = ['All Tees']; state.page = 1
      resetFilters(); render()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  })
}

document.querySelectorAll('.filter-cat input').forEach(cb => {
  cb.addEventListener('change', function () {
    const val = this.value
    if (val === 'All Tees') {
      document.querySelectorAll('.filter-cat input').forEach(c => c.checked = c === this)
      state.categories = this.checked ? ['All Tees'] : []
    } else {
      const allCb = document.querySelector('.filter-cat input[value="All Tees"]')
      if (allCb) allCb.checked = false
      state.categories = state.categories.filter(c => c !== 'All Tees')
      if (this.checked) state.categories.push(val)
      else state.categories = state.categories.filter(c => c !== val)
      if (!state.categories.length) { if (allCb) allCb.checked = true; state.categories = ['All Tees'] }
    }
    state.page = 1; render()
  })
})

document.querySelectorAll('.size-pill').forEach(el => {
  el.addEventListener('click', function () {
    this.classList.toggle('sel')
    state.sizes = [...document.querySelectorAll('.size-pill.sel')].map(s => s.textContent)
    state.page = 1; render()
  })
})

document.querySelectorAll('.swatch').forEach(el => {
  el.addEventListener('click', function () {
    this.classList.toggle('sel')
    state.colors = [...document.querySelectorAll('.swatch.sel')].map(s => s.style.background)
    state.page = 1; render()
  })
})

document.querySelectorAll('.filter-price input').forEach(cb => {
  cb.addEventListener('change', function () {
    if (this.checked) state.priceRanges.push(this.value)
    else state.priceRanges = state.priceRanges.filter(r => r !== this.value)
    state.page = 1; render()
  })
})

function openProductModal(p) {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay'
  const modal = document.createElement('div'); modal.className = 'product-modal'
  const isSale = p.oldPrice != null || (p.tag && p.tag.startsWith('-'))
  const stars = '★'.repeat(Math.floor(p.rating || 4)) + ((p.rating % 1 >= 0.5) ? '½' : '')

  modal.innerHTML = `<button class="modal-close">\u2715</button>
    <div class="modal-inner">
      <div class="modal-img"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>
      <div class="modal-info">
        <div class="modal-cat">${p.category}</div>
        <h2>${p.name}</h2>
        <div class="modal-rating">${stars} <span>${p.reviews || 0} reviews</span></div>
        <div class="modal-price">${isSale ? `<span class="sale">$${p.price}</span> <span class="old">$${p.oldPrice}</span>` : `$${p.price}`}</div>
        <p class="modal-desc">Premium quality t-shirt crafted from ${p.category === 'Organic Cotton' ? '100% organic cotton' : 'high-quality combed ring-spun cotton'}. ${p.isNew ? 'Part of our latest drop — limited quantities available.' : ''} Machine washable. Pre-shrunk fabric.</p>
        <div class="modal-section"><h4>Size</h4><div class="size-group">${p.sizes.map(s => `<span class="size-pill">${s}</span>`).join('')}</div></div>
        <div class="modal-section"><h4>Color</h4><div class="swatch-group">${p.colors.map(c => `<span class="swatch" style="background:${c.h}" title="${c.n}"></span>`).join('')}</div></div>
        <button class="modal-add-btn" data-id="${p.id}" data-size="${p.sizes[0]}" data-color='${JSON.stringify(p.colors[0])}'>Add to Bag — $${p.price}</button>
      </div>
    </div>`

  document.body.appendChild(overlay); document.body.appendChild(modal)
  requestAnimationFrame(() => { overlay.classList.add('open'); modal.classList.add('open') })
  document.body.style.overflow = 'hidden'

  const close = () => {
    overlay.classList.remove('open'); modal.classList.remove('open')
    setTimeout(() => { overlay.remove(); modal.remove(); document.body.style.overflow = '' }, 300)
  }
  modal.querySelector('.modal-close').addEventListener('click', close)
  overlay.addEventListener('click', close)
  modal.querySelectorAll('.size-pill').forEach(el => {
    el.addEventListener('click', function () {
      modal.querySelectorAll('.size-pill').forEach(s => s.classList.remove('sel'))
      this.classList.add('sel')
      const btn = modal.querySelector('.modal-add-btn')
      btn.dataset.size = this.textContent
    })
  })
  modal.querySelectorAll('.swatch').forEach(el => {
    el.addEventListener('click', function () {
      modal.querySelectorAll('.swatch').forEach(s => s.classList.remove('sel'))
      this.classList.add('sel')
      const btn = modal.querySelector('.modal-add-btn')
      btn.dataset.color = JSON.stringify({ n: this.title, h: this.style.background })
    })
  })
  modal.querySelector('.modal-add-btn').addEventListener('click', function () {
    const prod = allProducts.find(x => x.id === +this.dataset.id)
    if (!prod) return
    const user = getCachedUser()
    if (!user) { close(); openAccountModal(() => addToCart(prod, this.dataset.size, JSON.parse(this.dataset.color))); return }
    addToCart(prod, this.dataset.size, JSON.parse(this.dataset.color)); close()
  })
}

let checkoutOpen = false

function openAccountModal(onSuccess) {
  const items = getCart()
  const user = getCachedUser()
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay'
  const modal = document.createElement('div'); modal.className = 'acct-modal'
  const tab = user ? 'signin' : 'signup'

  modal.innerHTML = `<button class="modal-close">\u2715</button>
    <div class="acct-logo">kainos<span>.</span></div>
    <h2>${user ? 'Welcome back' : 'Create your account'}</h2>
    <p class="acct-sub">${user ? 'Sign in to continue your order.' : 'Save your details for faster checkout.'}</p>

    <div class="acct-tabs${user ? '' : ' act'}" id="acct-tabs">
      <button class="acct-tab ${tab === 'signup' ? 'act' : ''}" data-tab="signup">Sign Up</button>
      <button class="acct-tab ${tab === 'signin' ? 'act' : ''}" data-tab="signin">Sign In</button>
    </div>

    <div class="acct-form ${tab === 'signup' ? 'act' : ''}" id="acct-form-signup">
      <input type="text" class="chk-inp" placeholder="Full name" id="acct-name">
      <input type="email" class="chk-inp" placeholder="Email address" id="acct-email">
      <input type="password" class="chk-inp" placeholder="Password" id="acct-pass">
      <button class="acct-btn" id="acct-signup-btn">Create Account & Continue</button>
    </div>

    <div class="acct-form ${tab === 'signup' ? '' : 'act'}" id="acct-form-signin">
      <input type="email" class="chk-inp" placeholder="Email address" id="acct-email-signin" value="${user ? user.email : ''}">
      <input type="password" class="chk-inp" placeholder="Password" id="acct-pass-signin">
      <button class="acct-btn" id="acct-signin-btn">Sign In & Continue</button>
    </div>

    <p class="acct-skip" style="display:none"></p>`

  document.body.appendChild(overlay); document.body.appendChild(modal)
  requestAnimationFrame(() => { overlay.classList.add('open'); modal.classList.add('open') })
  document.body.style.overflow = 'hidden'

  const close = () => {
    overlay.classList.remove('open'); modal.classList.remove('open')
    setTimeout(() => { overlay.remove(); modal.remove(); document.body.style.overflow = '' }, 300)
  }
  modal.querySelector('.modal-close').addEventListener('click', close)
  overlay.addEventListener('click', close)

  modal.querySelectorAll('.acct-tab').forEach(t => {
    t.addEventListener('click', function () {
      modal.querySelectorAll('.acct-tab').forEach(x => x.classList.remove('act'))
      this.classList.add('act')
      modal.querySelectorAll('.acct-form').forEach(f => f.classList.remove('act'))
      const form = modal.querySelector('#acct-form-' + this.dataset.tab)
      if (form) form.classList.add('act')
    })
  })

modal.querySelector('#acct-signup-btn').addEventListener('click', async function () {
     if (!validateSignupForm()) {
       focusFirstError()
       return
     }
     
     const name = modal.querySelector('#acct-name').value.trim()
     const email = modal.querySelector('#acct-email').value.trim()
     const pass = modal.querySelector('#acct-pass').value
     this.textContent = 'Creating account...'; this.disabled = true

    try {
      await signUp(name, email, pass)
      if (isSupabased()) {
        setCurrentUser({ name, email, verified: false })
        showToast(`Account created! Welcome, ${name}!`)
        close()
        if (onSuccess) setTimeout(onSuccess, 350)
      } else {
        const code = String(Math.floor(100000 + Math.random() * 900000))
        sendVerificationEmail(name, email, code).then(() => {
          this.textContent = 'Create Account & Continue'; this.disabled = false
          close()
          setTimeout(() => openVerifyModal(name, email, code, onSuccess), 350)
        })
      }
    } catch (err) {
      showToast(err.message)
      this.textContent = 'Create Account & Continue'; this.disabled = false
    }
  })

modal.querySelector('#acct-signin-btn').addEventListener('click', async function () {
     if (!validateSigninForm()) {
       focusFirstError()
       return
     }
     
     const email = modal.querySelector('#acct-email-signin').value.trim()
     const pass = modal.querySelector('#acct-pass-signin').value
     this.textContent = 'Signing in...'; this.disabled = true

    try {
      const user = await signIn(email, pass)
      setCurrentUser(user)
      showToast(`Welcome back, ${user.name}!`)
      close()
      if (onSuccess) setTimeout(onSuccess, 350)
      else setTimeout(openCheckoutModal, 350)
    } catch (err) {
      showToast(err.message)
      this.textContent = 'Sign In & Continue'; this.disabled = false
    }
  })
}

function openVerifyModal(name, email, code, onSuccess) {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay'
  const modal = document.createElement('div'); modal.className = 'verify-modal'

  modal.innerHTML = `<button class="modal-close">\u2715</button>
    <div class="verify-icon">\u2709</div>
    <h2>Verify your email</h2>
    <p class="verify-sub">We sent a 6-digit code to <strong>${email}</strong></p>
    <div class="verify-code-wrap">
      <input type="text" class="verify-code" id="vc-1" maxlength="1" autofocus>
      <input type="text" class="verify-code" id="vc-2" maxlength="1">
      <input type="text" class="verify-code" id="vc-3" maxlength="1">
      <span class="verify-dash">—</span>
      <input type="text" class="verify-code" id="vc-4" maxlength="1">
      <input type="text" class="verify-code" id="vc-5" maxlength="1">
      <input type="text" class="verify-code" id="vc-6" maxlength="1">
    </div>
    <p class="verify-hint">Demo code: <strong>${code}</strong></p>
    <button class="acct-btn" id="verify-btn">Verify & Continue</button>
    <p class="acct-skip"><a href="#" id="verify-skip">Skip verification</a></p>`

  document.body.appendChild(overlay); document.body.appendChild(modal)
  requestAnimationFrame(() => { overlay.classList.add('open'); modal.classList.add('open') })
  document.body.style.overflow = 'hidden'

  const close = () => {
    overlay.classList.remove('open'); modal.classList.remove('open')
    setTimeout(() => { overlay.remove(); modal.remove(); document.body.style.overflow = '' }, 300)
  }
  modal.querySelector('.modal-close').addEventListener('click', close)
  overlay.addEventListener('click', close)

  modal.querySelectorAll('.verify-code').forEach((inp, i, arr) => {
    inp.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').slice(0, 1)
      if (this.value && i < arr.length - 1) arr[i + 1].focus()
    })
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && i > 0) arr[i - 1].focus()
    })
  })

  modal.querySelector('#verify-btn').addEventListener('click', async function () {
    const entered = [...document.querySelectorAll('.verify-code')].map(i => i.value).join('')
    if (entered.length !== 6) { showToast('Please enter the full 6-digit code.'); return }
    const user = await verifyUser(name, email, code, entered)
    setCurrentUser(user)
    if (entered === code) {
      showToast(`Email verified! Welcome, ${name}!`)
    } else {
      showToast('Code invalid. Try again.', 2500)
      return
    }
    close()
    if (onSuccess) setTimeout(onSuccess, 350)
    else setTimeout(openCheckoutModal, 350)
  })

  modal.querySelector('#verify-skip').addEventListener('click', e => {
    e.preventDefault()
    const user = verifyUser(name, email, code, '')
    setCurrentUser(user)
    close()
    if (onSuccess) setTimeout(onSuccess, 350)
    else setTimeout(openCheckoutModal, 350)
  })
}

addEventListener('checkout:open', () => {
  const user = getCachedUser()
  if (!user) { openAccountModal(openCheckoutModal); return }
  openCheckoutModal()
})

function detectCard(num) {
  const c = num.replace(/\s/g, '')
  if (/^4/.test(c)) return { name: 'Visa', color: '#1a1f71', pattern: [4,4,4,4], cvc: 3 }
  if (/^5[1-5]/.test(c)) return { name: 'Mastercard', color: '#eb001b', pattern: [4,4,4,4], cvc: 3 }
  if (/^3[47]/.test(c)) return { name: 'Amex', color: '#2e77bc', pattern: [4,6,5], cvc: 4 }
  if (/^6011|^65|^64[4-9]/.test(c)) return { name: 'Discover', color: '#ff6000', pattern: [4,4,4,4], cvc: 3 }
  return null
}

function fmtCard(val) {
  const brand = detectCard(val)
  const p = brand ? brand.pattern : [4,4,4,4]
  let d = val.replace(/\D/g, '').slice(0, p.reduce((a,b) => a+b, 0))
  let r = '', i = 0
  for (const seg of p) { if (i >= d.length) break; r += (r ? ' ' : '') + d.slice(i, i+seg); i += seg }
  return r
}

async function openCheckoutModal() {
  const items = getCart()
  if (!items.length) return
  checkoutOpen = true
  const total = getCartTotal()
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay'
  const modal = document.createElement('div'); modal.className = 'checkout-modal'
  const user = getCachedUser()

  modal.innerHTML = `<button class="modal-close">\u2715</button>
    <div class="checkout-layout">
      <div class="checkout-main">
        <h2>Checkout</h2>

        <div class="checkout-sec">
          <h3>Contact</h3>
          <input type="email" class="chk-inp" placeholder="Email address" id="chk-email" value="${user ? user.email : ''}">
        </div>

        <div class="checkout-sec">
          <h3>Delivery</h3>
          <div class="chk-row"><input type="text" class="chk-inp" placeholder="First name" id="chk-first" value="${user && user.name ? user.name.split(' ')[0] : ''}"><input type="text" class="chk-inp" placeholder="Last name" id="chk-last" value="${user && user.name && user.name.split(' ').length > 1 ? user.name.split(' ').slice(1).join(' ') : ''}"></div>
          <input type="text" class="chk-inp" placeholder="Address" id="chk-addr">
          <div class="chk-row"><input type="text" class="chk-inp" placeholder="City" id="chk-city"><input type="text" class="chk-inp" placeholder="ZIP code" id="chk-zip" style="max-width:140px"></div>
        </div>

        <div class="checkout-sec">
          <h3>Payment</h3>
          <div class="pay-methods">
            <button class="pay-method act" data-method="card"><span class="pay-icon">C</span> Credit Card</button>
            <button class="pay-method" data-method="paypal"><span class="pay-icon">P</span> PayPal</button>
            <button class="pay-method" data-method="apple"><span class="pay-icon">A</span> Apple Pay</button>
          </div>

          <div class="pay-form" id="pay-form-card">
            <div class="card-preview" id="card-preview">
              <div class="card-chip"></div>
              <div class="card-number" id="card-display">\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022</div>
              <div class="card-bottom"><span id="card-expiry">MM/YY</span><span id="card-brand-name">Card</span></div>
            </div>
            <div class="chk-field"><label>Card number</label><input type="text" class="chk-inp" id="chk-card" placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number"><span class="card-badge" id="card-badge"></span></div>
            <div class="chk-row">
              <div class="chk-field"><label>Expiry (MM/YY)</label><input type="text" class="chk-inp" id="chk-exp" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp"></div>
              <div class="chk-field"><label>CVC</label><input type="text" class="chk-inp" id="chk-cvc" placeholder="123" maxlength="4" autocomplete="cc-csc"></div>
            </div>
            <div class="chk-field"><label>Cardholder name</label><input type="text" class="chk-inp" id="chk-name" placeholder="Name on card"></div>
          </div>

          <div class="pay-form hidden" id="pay-form-paypal">
            <div class="pay-alt"><span class="pay-alt-icon">P</span><p>You'll be redirected to PayPal to complete your purchase securely.</p></div>
          </div>

          <div class="pay-form hidden" id="pay-form-apple">
            <div class="pay-alt"><span class="pay-alt-icon">A</span><p>Pay with Apple Pay on your compatible devices.</p></div>
          </div>
        </div>

        <div class="chk-errors" id="chk-errors"></div>
        <button class="checkout-btn" id="chk-submit">Pay $${total.toFixed(2)}</button>
      </div>

      <div class="checkout-side">
        <h3>Order Summary</h3>
        ${items.map(i => `<div class="chk-side-item"><img src="${i.image}" alt="" loading="lazy"><div><div class="chk-side-name">${i.name}</div><div class="chk-side-meta">${i.size} / ${i.color.n} \u00d7 ${i.qty}</div><div class="chk-side-price">$${(i.price * i.qty).toFixed(2)}</div></div></div>`).join('')}
        <div class="chk-side-total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      </div>
    </div>`

  document.body.appendChild(overlay); document.body.appendChild(modal)
  requestAnimationFrame(() => { overlay.classList.add('open'); modal.classList.add('open') })
  document.body.style.overflow = 'hidden'

  const close = () => {
    overlay.classList.remove('open'); modal.classList.remove('open')
    setTimeout(() => { overlay.remove(); modal.remove(); document.body.style.overflow = ''; checkoutOpen = false }, 300)
  }
  modal.querySelector('.modal-close').addEventListener('click', close)
  overlay.addEventListener('click', close)

  const cardInput = modal.querySelector('#chk-card')
  const expInput = modal.querySelector('#chk-exp')
  const cvcInput = modal.querySelector('#chk-cvc')
  const cardDisplay = modal.querySelector('#card-display')
  const cardPreview = modal.querySelector('#card-preview')
  const cardBadge = modal.querySelector('#card-badge')
  const brandName = modal.querySelector('#card-brand-name')

  cardInput.addEventListener('input', function () {
    const raw = this.value.replace(/\D/g, '')
    this.value = fmtCard(raw)
    const brand = detectCard(raw)
    if (brand) {
      cardBadge.textContent = brand.name; cardBadge.style.display = 'block'
      cardBadge.style.background = brand.color
      brandName.textContent = brand.name
      cardPreview.style.borderColor = brand.color
      cvcInput.maxLength = brand.cvc
      const last4 = raw.slice(-4)
      cardDisplay.textContent = brand.name === 'Amex' ? `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022\u2022\u2022 ${last4}` : `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${last4}`
    } else {
      cardBadge.style.display = 'none'
      brandName.textContent = 'Card'
      cardPreview.style.borderColor = '#ddd'
      cvcInput.maxLength = 3
      cardDisplay.textContent = raw ? fmtCard(raw) : '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022'
    }
  })

  expInput.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 4)
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
    this.value = v
    modal.querySelector('#card-expiry').textContent = v || 'MM/YY'
  })

  cvcInput.addEventListener('input', function () {
    const brand = detectCard(cardInput.value)
    this.value = this.value.replace(/\D/g, '').slice(0, brand ? brand.cvc : 3)
  })

  modal.querySelectorAll('.pay-method').forEach(btn => {
    btn.addEventListener('click', function () {
      modal.querySelectorAll('.pay-method').forEach(b => b.classList.remove('act'))
      this.classList.add('act')
      modal.querySelectorAll('.pay-form').forEach(f => f.classList.add('hidden'))
      const form = modal.querySelector('#pay-form-' + this.dataset.method)
      if (form) form.classList.remove('hidden')
    })
  })

  modal.querySelector('#chk-submit').addEventListener('click', async function () {
    const errs = []
    const email = modal.querySelector('#chk-email').value.trim()
    const first = modal.querySelector('#chk-first').value.trim()
    const last = modal.querySelector('#chk-last').value.trim()
    const addr = modal.querySelector('#chk-addr').value.trim()

    if (!email || !email.includes('@')) errs.push('Valid email is required')
    if (!first) errs.push('First name is required')
    if (!last) errs.push('Last name is required')
    if (!addr) errs.push('Address is required')

    const method = modal.querySelector('.pay-method.act')?.dataset.method
    if (method === 'card') {
      const raw = cardInput.value.replace(/\s/g, '')
      const exp = expInput.value.replace(/\D/g, '')
      const cvc = cvcInput.value
      const cname = modal.querySelector('#chk-name').value.trim()
      if (raw.length < 13 || !detectCard(raw)) errs.push('Valid card number is required')
      if (exp.length !== 4) errs.push('Valid expiry is required (MM/YY)')
      else {
        const m = +exp.slice(0,2), y = +exp.slice(2)
        if (m < 1 || m > 12) errs.push('Invalid expiry month')
      }
      if (!cvc || cvc.length < 3) errs.push('Valid CVC is required')
      if (!cname) errs.push('Cardholder name is required')
    }

    const el = modal.querySelector('#chk-errors')
    if (errs.length) {
      el.innerHTML = errs.map(e => `<div class="chk-err">${e}</div>`).join('')
      el.style.display = 'block'
      return
    }
    el.style.display = 'none'
    this.textContent = 'Processing...'; this.disabled = true

    try {
      if (isSupabased() && supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const orderId = 'ORD-' + Date.now().toString(36).toUpperCase()
          const orderPayload = {
            id: orderId,
            user_id: user.id,
            customer_name: first + ' ' + last,
            email,
            total,
            status: 'Confirmed',
            shipping_address: { addr, city: modal.querySelector('#chk-city').value.trim(), zip: modal.querySelector('#chk-zip').value.trim() },
          }
          const { error: orderError } = await supabase.from('orders').insert(orderPayload)
          if (!orderError) {
            const orderItems = items.map(i => ({
              order_id: orderId,
              product_id: i.id,
              name: i.name,
              price: i.price,
              size: i.size,
              color: i.color,
              quantity: i.qty,
              image: i.image,
            }))
            await supabase.from('order_items').insert(orderItems)
          }
        }
      }

      const order = {
        id: 'ORD-' + Date.now().toString(36).toUpperCase(),
        customer: first + ' ' + last,
        email,
        items: getCart(),
        total,
        status: 'Confirmed',
        date: new Date().toISOString(),
        shipping: { addr, city: modal.querySelector('#chk-city').value.trim(), zip: modal.querySelector('#chk-zip').value.trim() },
      }
      const orders = JSON.parse(localStorage.getItem('kainos_orders') || '[]')
      orders.unshift(order)
      localStorage.setItem('kainos_orders', JSON.stringify(orders))
      localStorage.removeItem('kainos_cart')
      dispatchEvent(new CustomEvent('cart:update'))
      close()
      showToast('Order placed! Confirmation sent to ' + order.email)
    } catch (err) {
      showToast('Something went wrong. Please try again.')
      this.textContent = 'Pay $' + total.toFixed(2); this.disabled = false
    }
  })
}

document.querySelector('.signup-form button')?.addEventListener('click', function () {
  const input = this.previousElementSibling
  if (input && input.value.includes('@')) {
    this.textContent = 'Subscribed!'
    setTimeout(() => { this.textContent = 'Subscribe'; input.value = '' }, 2000)
    showToast('Thanks for subscribing!')
  } else {
    showToast('Please enter a valid email.')
  }
})

addEventListener('cart:update', () => {
  if (cartCount) cartCount.textContent = getCartCount()
})

let deferredPrompt = null;
let notificationPermission = Notification.permission;

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Optionally, add a button or other UI to notify user that app can be installed
  showInstallPromotion();
});

function showInstallPromotion() {
  // You can customize this UI however you like
  const installBtn = document.createElement('button');
  installBtn.textContent = 'Install App';
  installBtn.style.position = 'fixed';
  installBtn.style.bottom = '20px';
  installBtn.style.right = '20px';
  installBtn.style.background = '#111';
  installBtn.style.color = '#fff';
  installBtn.style.border = 'none';
  installBtn.style.padding = '10px 20px';
  installBtn.style.borderRadius = '5px';
  installBtn.style.cursor = 'pointer';
  installBtn.style.zIndex = '1000';
  installBtn.addEventListener('click', async () => {
    installBtn.style.display = 'none';
    if (deferredPrompt) {
      // Show the prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      // Reset the deferred prompt variable, since
      // deferredPrompt can only be used once.
      deferredPrompt = null;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
    }
  });
  document.body.appendChild(installBtn);
}

// Handle app installed event
window.addEventListener('appinstalled', (evt) => {
  console.log('Kainos Tees was installed');
  // Hide the app-installer content
  const installBtn = document.querySelector('button[textContent="Install App"]');
  if (installBtn) installBtn.style.display = 'none';
});

// Notification permission handling
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.log('Notification permission denied');
    return false;
  }
  
  const permission = await Notification.requestPermission();
  notificationPermission = permission;
  return permission === 'granted';
}

function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported');
    return;
  }
  
  navigator.serviceWorker.ready
    .then(registration => {
      if (!('pushManager' in registration)) {
        console.log('Push manager not available');
        return;
      }
      
      return registration.pushManager.getSubscription()
        .then(async subscription => {
          if (subscription) {
            return subscription;
          }
          
          const response = await fetch('/vapidPublicKey'); // You'd need to implement this endpoint
          const vapidPublicKey = await response.text();
          
          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          });
        });
    })
    .then(subscription => {
      console.log('Subscribed to push notifications:', subscription);
      // Send subscription to your server
      return fetch('/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: {
          'Content-Type': 'application/json'
        }
      });
    })
    .catch(error => {
      console.error('Error subscribing to push notifications:', error);
    });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function init() {
   try {
     const user = await getCurrentUser()
     if (user) setCurrentUser(user)

     // Show loading skeleton
     showLoadingSkeleton()
     
     allProducts = await getProducts()
     render()

     initBgParticles()
     
     // Initialize ARIA states
     initARIAStates()
     
     // Initialize connection status indicator
     initConnectionStatus()
     
     // Check if we can show install prompt
     if (deferredPrompt) {
       showInstallPromotion();
     }
   } catch (e) {
     console.error('Init error:', e)
     // Fallback: render with empty products
     allProducts = []
     render()
     initARIAStates()
     initConnectionStatus()
   }
 }

function initConnectionStatus() {
   const statusEl = document.getElementById('connection-status')
   if (!statusEl) return
   
   // Set initial state
   updateConnectionStatus()
   
   // Listen for online/offline events
   window.addEventListener('online', updateConnectionStatus)
   window.addEventListener('offline', updateConnectionStatus)
}

function updateConnectionStatus() {
   const statusEl = document.getElementById('connection-status')
   if (!statusEl) return
   
   if (navigator.onLine) {
     statusEl.innerHTML = '<span class="status-dot"></span>'
     statusEl.className = 'online'
   } else {
     statusEl.innerHTML = '<span class="status-dot"></span>'
     statusEl.className = 'offline'
   }
}

function initARIAStates() {
   // Hamburger menu
   const hamburger = document.querySelector('.hamburger')
   const mobileNav = document.getElementById('mobile-nav')
   if (hamburger && mobileNav) {
     hamburger.addEventListener('click', () => {
       const isOpen = mobileNav.classList.toggle('open')
       hamburger.setAttribute('aria-expanded', isOpen)
       mobileNav.setAttribute('aria-hidden', !isOpen)
     })
   }
   
    // Search toggle
    const searchToggle = document.getElementById('search-toggle')
    const searchBar = document.getElementById('search-bar')
    if (searchToggle && searchBar) {
      searchToggle.addEventListener('click', () => {
        const isOpen = searchBar.classList.toggle('open')
        searchToggle.setAttribute('aria-expanded', isOpen)
        searchBar.setAttribute('aria-hidden', !isOpen)
      })
    }
    
    // Filter toggle (mobile)
    const filterToggle = document.getElementById('filter-toggle')
    const sidebar = document.getElementById('sidebar')
    if (filterToggle && sidebar) {
      filterToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('open')
        filterToggle.setAttribute('aria-expanded', isOpen)
      })
    }
   
   // Account button (placeholder)
   const accountBtn = document.getElementById('account-btn')
   if (accountBtn) {
     accountBtn.addEventListener('click', () => {
       // Toggle account modal or dropdown
       // This would be implemented based on your account UI
     })
   }
   
   // Close mobile nav when clicking outside or on links
   document.addEventListener('click', (e) => {
     if (mobileNav && mobileNav.classList.contains('open') && 
         !mobileNav.contains(e.target) && 
         !hamburger.contains(e.target)) {
       mobileNav.classList.remove('open')
       hamburger.setAttribute('aria-expanded', 'false')
       mobileNav.setAttribute('aria-hidden', 'true')
     }
   })
   
   // Close mobile nav on escape key
   document.addEventListener('keydown', (e) => {
     if (e.key === 'Escape' && mobileNav && mobileNav.classList.contains('open')) {
       mobileNav.classList.remove('open')
       hamburger.setAttribute('aria-expanded', 'false')
       mobileNav.setAttribute('aria-hidden', 'true')
       hamburger.focus() // Return focus to hamburger
     }
   })
}

init()

window.addToCart = addToCart
window.removeFromCart = removeFromCart
window.updateQty = updateQty
window.closeCart = closeCart
