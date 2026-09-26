import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const nav = document.querySelector('#categoryNav');
const list = document.querySelector('#productList');
const empty = document.querySelector('#emptyState');
const errorBox = document.querySelector('#databaseError');
const title = document.querySelector('#activeCategoryTitle');
const count = document.querySelector('#productCount');
const searchInput = document.querySelector('#searchInput');
const modal = document.querySelector('#productModal');
const loader = document.querySelector('#pageLoader');

let menuData = [];
let activeCategory = null;

function normalizeMenu(raw) {
  if (!raw) return [];
  return Object.entries(raw)
    .map(([id, category]) => ({
      id,
      name: category.name || 'Kategori',
      order: Number(category.order ?? 9999),
      active: category.active !== false,
      products: Object.entries(category.products || {})
        .map(([productId, product]) => ({
          id: productId,
          name: product.name || 'Ürün',
          description: product.description || '',
          price: Number(product.price || 0),
          image: product.image || 'urun-fotografi.jpg',
          active: product.active !== false,
          order: Number(product.order ?? 9999)
        }))
        .filter(product => product.active)
        .sort((a, b) => a.order - b.order)
    }))
    .filter(category => category.active)
    .sort((a, b) => a.order - b.order);
}

function safeImage(filename) {
  if (!filename || /[\\/]/.test(filename)) return 'image/urun-fotografi.jpg';
  return `image/${filename}`;
}

function formatPrice(price) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(price);
}

function activeData() {
  return menuData.find(category => category.id === activeCategory);
}

function renderNav() {
  nav.innerHTML = '';
  menuData.forEach((category, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `category-button${category.id === activeCategory ? ' active' : ''}`;
    button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong></strong>`;
    button.querySelector('strong').textContent = category.name;
    button.addEventListener('click', () => {
      activeCategory = category.id;
      searchInput.value = '';
      renderNav();
      renderProducts();
      document.querySelector('.menu-shell').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    nav.appendChild(button);
  });
}

function renderProducts() {
  const category = activeData();
  list.innerHTML = '';

  if (!category) {
    title.textContent = 'Menü';
    count.textContent = '0 ürün';
    empty.style.display = 'block';
    return;
  }

  const term = searchInput.value.toLocaleLowerCase('tr').trim();
  const products = category.products.filter(product => `${product.name} ${product.description}`.toLocaleLowerCase('tr').includes(term));
  title.textContent = category.name;
  count.textContent = `${products.length} ürün`;

  products.forEach((product, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'product-card';
    card.style.setProperty('--delay', `${Math.min(index * 55, 440)}ms`);

    const img = document.createElement('img');
    img.className = 'product-image';
    img.src = safeImage(product.image);
    img.alt = product.name;
    img.loading = 'lazy';
    img.onerror = () => { img.src = 'image/urun-fotografi.jpg'; };

    const info = document.createElement('div');
    info.className = 'product-info';
    const h3 = document.createElement('h3');
    h3.textContent = product.name;
    const p = document.createElement('p');
    p.textContent = product.description;
    info.append(h3, p);

    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = formatPrice(product.price);

    const arrow = document.createElement('span');
    arrow.className = 'card-arrow';
    arrow.textContent = '↗';

    card.append(img, info, price, arrow);
    card.addEventListener('click', () => openProduct(category.name, product));
    list.appendChild(card);
  });

  empty.style.display = products.length ? 'none' : 'block';
}

function openProduct(categoryName, product) {
  const modalImage = document.querySelector('#modalImage');
  modalImage.src = safeImage(product.image);
  modalImage.alt = product.name;
  modalImage.onerror = () => { modalImage.src = 'image/urun-fotografi.jpg'; };
  document.querySelector('#modalCategory').textContent = categoryName;
  document.querySelector('#modalName').textContent = product.name;
  document.querySelector('#modalDescription').textContent = product.description;
  document.querySelector('#modalPrice').textContent = formatPrice(product.price);
  modal.showModal();
}

onValue(ref(db, 'menu/categories'), snapshot => {
  menuData = normalizeMenu(snapshot.val());
  errorBox.hidden = true;
  if (!activeCategory || !menuData.some(category => category.id === activeCategory)) {
    activeCategory = menuData[0]?.id || null;
  }
  renderNav();
  renderProducts();
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 450);
}, error => {
  console.error(error);
  nav.innerHTML = '';
  list.innerHTML = '';
  empty.style.display = 'none';
  errorBox.hidden = false;
  loader.classList.add('done');
});

document.querySelector('#modalClose').addEventListener('click', () => modal.close());
modal.addEventListener('click', event => { if (event.target === modal) modal.close(); });
document.querySelector('#searchToggle').addEventListener('click', event => {
  const panel = document.querySelector('#searchPanel');
  const isOpen = panel.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) setTimeout(() => searchInput.focus(), 150);
});
searchInput.addEventListener('input', renderProducts);

let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', event => {
  if (event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchmove', event => {
  if (event.touches.length !== 1 || event.target.closest('.category-nav')) return;
  const distanceX = event.touches[0].clientX - touchStartX;
  const distanceY = event.touches[0].clientY - touchStartY;
  if (Math.abs(distanceX) > Math.abs(distanceY) && Math.abs(distanceX) > 8) event.preventDefault();
}, { passive: false });
