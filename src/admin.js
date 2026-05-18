import { getProducts, getCollections, COLLECTIONS, ALL_SIZES, ALL_CATEGORIES } from './data'
import { supabase, isSupabased } from './lib/supabase'
import { getCart, getCartCount, getCartTotal, showToast } from './cart'
import { getCurrentUser, getCachedUser, setCurrentUser, signOut } from './auth'
import './styles/admin.css'

const ADMIN_CRED = { user: 'admin', pass: 'admin123' }

document.getElementById('admin-login-btn')?.addEventListener('click', async () => {
  const u = document.getElementById('admin-user').value
  const p = document.getElementById('admin-pass').value

  if (isSupabased()) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role === 'admin') {
        document.getElementById('login-screen').style.display = 'none'
        document.getElementById('admin-dashboard').style.display = 'flex'
        initAdmin()
        return
      }
    }
    document.getElementById('admin-err').textContent = 'Unauthorized'
    document.getElementById('admin-err').style.display = 'block'
    return
  }

  if (u === ADMIN_CRED.user && p === ADMIN_CRED.pass) {
    document.getElementById('login-screen').style.display = 'none'
    document.getElementById('admin-dashboard').style.display = 'flex'
    initAdmin()
  } else {
    document.getElementById('admin-err').style.display = 'block'
  }
})

document.getElementById('admin-user')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('admin-login-btn')?.click() })
document.getElementById('admin-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('admin-login-btn')?.click() })

document.getElementById('admin-logout')?.addEventListener('click', e => { e.preventDefault(); location.reload() })

document.querySelectorAll('.admin-nav a').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault()
    document.querySelectorAll('.admin-nav a').forEach(x => x.classList.remove('act'))
    a.classList.add('act')
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('act'))
    const sec = document.getElementById('sec-' + a.dataset.section)
    if (sec) sec.classList.add('act')
    document.getElementById('section-title').textContent = a.querySelector('span:last-child').textContent
  })
})

function getUsers() {
  const u = localStorage.getItem('kainos_user')
  const arr = u ? [{ ...JSON.parse(u), joined: new Date().toISOString(), role: 'user' }] : []
  return arr
}

function getOrders() { try { return JSON.parse(localStorage.getItem('kainos_orders') || '[]') } catch { return [] } }

function getTickets() {
  let t = []
  try { t = JSON.parse(localStorage.getItem('kainos_tickets') || '[]') } catch {}
  if (!t.length) {
    t = [
      { id: 1, user: 'bryce@example.com', subject: 'Wrong size received', status: 'open', date: new Date(Date.now() - 86400000).toISOString(), msgs: [{ from: 'customer', text: 'I ordered a Large but received a Medium. Can I exchange it?', time: new Date(Date.now() - 86400000).toISOString() }] },
      { id: 2, user: 'alex@example.com', subject: 'Shipping delay inquiry', status: 'open', date: new Date(Date.now() - 172800000).toISOString(), msgs: [{ from: 'customer', text: 'My order has been stuck on "Confirmed" for 4 days. When will it ship?', time: new Date(Date.now() - 172800000).toISOString() }] },
    ]
    localStorage.setItem('kainos_tickets', JSON.stringify(t))
  }
  return t
}

function saveTickets(t) { localStorage.setItem('kainos_tickets', JSON.stringify(t)) }

let selectedTicket = null
let products = []

async function initAdmin() {
  products = await getProducts()

  document.getElementById('admin-time').textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  const orders = getOrders()
  const users = getUsers()
  const revenue = orders.reduce((s, o) => s + o.total, 0)
  const tickets = getTickets()

  document.getElementById('stats-grid').innerHTML = `
    <div class="admin-stat"><div class="admin-stat-label">Total Orders</div><div class="admin-stat-value">${orders.length}</div><div class="admin-stat-sub">${orders.filter(o => o.status === 'Delivered').length} delivered</div></div>
    <div class="admin-stat"><div class="admin-stat-label">Revenue</div><div class="admin-stat-value">$${revenue.toFixed(0)}</div><div class="admin-stat-sub">${orders.length ? '$' + (revenue / orders.length).toFixed(0) + '/order' : 'No orders'}</div></div>
    <div class="admin-stat"><div class="admin-stat-label">Users</div><div class="admin-stat-value">${users.length}</div><div class="admin-stat-sub">${users.filter(u => u.verified).length} verified</div></div>
    <div class="admin-stat"><div class="admin-stat-label">Open Tickets</div><div class="admin-stat-value">${tickets.filter(t => t.status === 'open').length}</div><div class="admin-stat-sub">${tickets.length} total</div></div>`

  const recentOrders = orders.slice(0, 5)
  document.getElementById('recent-orders-body').innerHTML = recentOrders.length
    ? recentOrders.map(o => `<tr><td>${o.id}</td><td>${o.customer || 'Guest'}</td><td>$${o.total.toFixed(2)}</td><td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td><td>${new Date(o.date).toLocaleDateString()}</td></tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:#bbb;padding:20px">No orders yet</td></tr>'

  renderUsers(users)
  renderOrders(orders)
  renderTickets(tickets)
  renderProducts()
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table-body')
  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#bbb;padding:20px">No users registered yet. Sign up on the store to see users here.</td></tr>'
    return
  }
  tbody.innerHTML = users.map(u => `<tr>
    <td><strong>${u.name || 'N/A'}</strong></td>
    <td>${u.email}</td>
    <td><span class="status ${u.verified ? 'verified' : 'unverified'}">${u.verified ? 'Verified' : 'Unverified'}</span></td>
    <td><span class="admin-badge admin">Admin</span></td>
    <td>${new Date(u.joined || Date.now()).toLocaleDateString()}</td>
    <td><button class="admin-btn outline" onclick="showToast('Support email sent to ${u.email}')">Contact</button></td>
  </tr>`).join('')
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-table-body')
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#bbb;padding:20px">No orders yet. Place an order on the store to see it here.</td></tr>'
    return
  }
  const statuses = ['Confirmed', 'Shipped', 'Delivered', 'Cancelled']
  tbody.innerHTML = orders.map(o => `<tr>
    <td><strong>${o.id}</strong></td>
    <td>${o.customer || 'Guest'}</td>
    <td>${o.items.length} item${o.items.length > 1 ? 's' : ''}</td>
    <td>$${o.total.toFixed(2)}</td>
    <td><span class="status ${o.status.toLowerCase()}">${o.status}</span></td>
    <td>${new Date(o.date).toLocaleDateString()}</td>
    <td><select onchange="updateOrderStatus('${o.id}', this.value)" style="padding:4px 8px;border:1px solid #ddd;border-radius:4px;font-size:11px;font-family:inherit">
      ${statuses.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
    </select></td>
  </tr>`).join('')
}

window.updateOrderStatus = function(id, status) {
  const orders = getOrders()
  const o = orders.find(x => x.id === id)
  if (o) { o.status = status; localStorage.setItem('kainos_orders', JSON.stringify(orders)); initAdmin(); showToast(`Order ${id} marked as ${status}`) }
}

function renderTickets(tickets) {
  const list = document.getElementById('ticket-list')
  if (!tickets.length) { list.innerHTML = '<p style="color:#bbb;font-size:13px;padding:12px">No tickets</p>'; return }
  list.innerHTML = tickets.map(t => `<div class="support-item ${selectedTicket === t.id ? 'act' : ''}" data-tid="${t.id}">
    <h4>${t.subject}</h4>
    <p>${t.msgs[t.msgs.length - 1].text}</p>
    <div class="sup-meta"><span>${t.user}</span><span>${new Date(t.date).toLocaleDateString()}</span></div>
  </div>`).join('')

  list.querySelectorAll('.support-item').forEach(el => {
    el.addEventListener('click', function () {
      selectedTicket = +this.dataset.tid
      document.querySelectorAll('.support-item').forEach(x => x.classList.remove('act'))
      this.classList.add('act')
      renderChat()
    })
  })
  if (!selectedTicket && tickets.length) { selectedTicket = tickets[0].id; document.querySelector('.support-item')?.classList.add('act'); renderChat() }
}

function renderChat() {
  const tickets = getTickets()
  const t = tickets.find(x => x.id === selectedTicket)
  const msgsEl = document.getElementById('chat-msgs')
  const header = document.getElementById('chat-header')
  if (!t) { header.textContent = 'Select a ticket'; msgsEl.innerHTML = ''; return }
  header.textContent = t.subject + ' — ' + t.user
  msgsEl.innerHTML = t.msgs.map(m => `<div class="sup-msg ${m.from === 'admin' ? 'admin' : 'customer'}">${m.text}<div class="sup-time">${new Date(m.time).toLocaleString()}</div></div>`).join('')
  msgsEl.scrollTop = msgsEl.scrollHeight
}

document.getElementById('chat-send')?.addEventListener('click', () => {
  const input = document.getElementById('chat-input')
  const text = input.value.trim()
  if (!text || !selectedTicket) return
  const tickets = getTickets()
  const t = tickets.find(x => x.id === selectedTicket)
  if (t) {
    t.msgs.push({ from: 'admin', text, time: new Date().toISOString() })
    saveTickets(tickets)
    input.value = ''
    renderChat()
  }
})

document.getElementById('chat-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('chat-send')?.click() })

function renderProducts() {
  const grid = document.getElementById('products-grid')
  if (!grid || !products.length) return
  grid.innerHTML = products.map(p => `<div class="admin-prod-card"><img src="${p.image}" alt="${p.name}" loading="lazy"><div class="admin-prod-body"><h4>${p.name}</h4><p>${p.category}</p><div class="price">$${p.price}</div></div></div>`).join('')
}

const toast = document.createElement('div')
toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:12px 24px;border-radius:8px;font-size:13px;z-index:999;opacity:0;transition:all .3s;pointer-events:none'
document.body.appendChild(toast)
window.showToast = function(msg) { toast.textContent = msg; toast.style.opacity = '1'; clearTimeout(toast._t); toast._t = setTimeout(() => toast.style.opacity = '0', 2200) }
