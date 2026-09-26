import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, update, remove, push, get } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const loginScreen = document.querySelector('#loginScreen');
const adminApp = document.querySelector('#adminApp');
const categoryList = document.querySelector('#categoryList');
const productAdminList = document.querySelector('#productAdminList');
const adminEmpty = document.querySelector('#adminEmpty');
const productEditor = document.querySelector('#productEditor');
const categoryEditor = document.querySelector('#categoryEditor');
const emptyDbNotice = document.querySelector('#emptyDbNotice');
const toastEl = document.querySelector('#toast');

let categories = [];
let activeCategory = null;
let menuUnsubscribe = null;

const initialMenu = {
  'kahveler': {name:'Kahveler',order:1,active:true,products:{
    'espresso':{name:'Espresso',description:'Yoğun aromalı klasik espresso.',price:90,image:'espresso.jpg',active:true,order:1},
    'americano':{name:'Americano',description:'Espresso ve sıcak su ile yalın bir lezzet.',price:110,image:'americano.jpg',active:true,order:2},
    'caffe-latte':{name:'Caffè Latte',description:'Espresso ve ipeksi süt köpüğü.',price:130,image:'caffe-latte.jpg',active:true,order:3},
    'caramel-macchiato':{name:'Caramel Macchiato',description:'Karamel, espresso ve süt uyumu.',price:145,image:'caramel-macchiato.jpg',active:true,order:4}}},
  'soguk-kahveler': {name:'Soğuk Kahveler',order:2,active:true,products:{
    'iced-americano':{name:'Iced Americano',description:'Buz üzerinde ferah espresso.',price:120,image:'iced-americano.jpg',active:true,order:1},
    'iced-latte':{name:'Iced Latte',description:'Soğuk süt, espresso ve buz.',price:140,image:'iced-latte.jpg',active:true,order:2},
    'cold-brew':{name:'Cold Brew',description:'Uzun demleme, yumuşak içim.',price:150,image:'cold-brew.jpg',active:true,order:3},
    'iced-mocha':{name:'Iced Mocha',description:'Çikolata, espresso ve soğuk süt.',price:155,image:'iced-mocha.jpg',active:true,order:4}}},
  'kahvalti': {name:'Kahvaltı',order:3,active:true,products:{
    'hermos-kahvalti':{name:'Hermos Kahvaltı',description:'Peynir çeşitleri, zeytin, yumurta, reçel ve sıcak ekmek.',price:390,image:'hermos-kahvalti.jpg',active:true,order:1},
    'avokadolu-tost':{name:'Avokadolu Tost',description:'Ekşi mayalı ekmek, avokado ve poşe yumurta.',price:240,image:'avokadolu-tost.jpg',active:true,order:2},
    'sicak-kruvasan':{name:'Sıcak Kruvasan',description:'Tereyağlı kruvasan, reçel ve tereyağı.',price:160,image:'sicak-kruvasan.jpg',active:true,order:3}}},
  'ana-yemekler': {name:'Ana Yemekler',order:4,active:true,products:{
    'hermos-burger':{name:'Hermos Burger',description:'Dana burger, karamelize soğan, özel sos ve patates.',price:310,image:'hermos-burger.jpg',active:true,order:1},
    'tavuklu-penne':{name:'Tavuklu Penne',description:'Kremalı sos, mantar ve ızgara tavuk.',price:275,image:'tavuklu-penne.jpg',active:true,order:2},
    'izgara-tavuk':{name:'Izgara Tavuk',description:'Mevsim sebzeleri ve özel baharatlarla.',price:290,image:'izgara-tavuk.jpg',active:true,order:3}}},
  'tatlilar': {name:'Tatlılar',order:5,active:true,products:{
    'san-sebastian':{name:'San Sebastian',description:'Akışkan dokulu fırınlanmış cheesecake.',price:190,image:'san-sebastian.jpg',active:true,order:1},
    'magnolia':{name:'Magnolia',description:'Muz, bisküvi ve vanilyalı krema.',price:160,image:'magnolia.jpg',active:true,order:2},
    'cikolatali-sufle':{name:'Çikolatalı Sufle',description:'Sıcak çikolatalı kek ve dondurma.',price:195,image:'cikolatali-sufle.jpg',active:true,order:3}}},
  'icecekler': {name:'Soğuk İçecekler',order:6,active:true,products:{
    'ev-yapimi-limonata':{name:'Ev Yapımı Limonata',description:'Taze limon ve nane.',price:100,image:'ev-yapimi-limonata.jpg',active:true,order:1},
    'cilekli-frozen':{name:'Çilekli Frozen',description:'Çilek, buz ve meyve püresi.',price:135,image:'cilekli-frozen.jpg',active:true,order:2},
    'maden-suyu':{name:'Maden Suyu',description:'Sade maden suyu.',price:50,image:'maden-suyu.jpg',active:true,order:3}}}
};

function slugify(text){return text.toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || `kategori-${Date.now()}`}
function fmt(price){return new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:2}).format(Number(price||0))}
function imgPath(file){return file && !/[\\/]/.test(file) ? `image/${file}` : 'image/urun-fotografi.jpg'}
function toast(message){toastEl.textContent=message;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),2200)}
function getActive(){return categories.find(c=>c.id===activeCategory)}

function normalize(raw){return Object.entries(raw||{}).map(([id,c])=>({id,name:c.name||'Kategori',order:Number(c.order??9999),active:c.active!==false,products:Object.entries(c.products||{}).map(([pid,p])=>({id:pid,...p,order:Number(p.order??9999),active:p.active!==false})).sort((a,b)=>a.order-b.order)})).sort((a,b)=>a.order-b.order)}

function startMenuListener(){
  if(menuUnsubscribe) menuUnsubscribe();
  menuUnsubscribe=onValue(ref(db,'menu/categories'),snap=>{
    categories=normalize(snap.val());
    emptyDbNotice.hidden=categories.length>0;
    if(!activeCategory || !categories.some(c=>c.id===activeCategory)) activeCategory=categories[0]?.id||null;
    renderCategories();renderProducts();fillCategorySelect();
  });
}

function renderCategories(){
  categoryList.innerHTML='';
  categories.forEach((c,index)=>{
    const row=document.createElement('div');
    row.className=`cat-admin-row${c.id===activeCategory?' active':''}`;
    row.innerHTML=`<button class="cat-admin-btn" type="button"><span></span><small></small></button><div class="cat-tools"><button type="button" data-dir="up" title="Kategoriyi yukarı taşı">↑</button><button type="button" data-dir="down" title="Kategoriyi aşağı taşı">↓</button><button type="button" data-edit title="Kategoriyi düzenle">✎</button></div>`;
    const main=row.querySelector('.cat-admin-btn');
    main.querySelector('span').textContent=c.name;
    main.querySelector('small').textContent=`${c.products.length}${c.active?'':' · pasif'}`;
    main.onclick=()=>{activeCategory=c.id;renderCategories();renderProducts()};
    row.querySelector('[data-dir="up"]').disabled=index===0;
    row.querySelector('[data-dir="down"]').disabled=index===categories.length-1;
    row.querySelector('[data-dir="up"]').onclick=()=>moveCategory(c,-1);
    row.querySelector('[data-dir="down"]').onclick=()=>moveCategory(c,1);
    row.querySelector('[data-edit]').onclick=()=>openCategoryEditor(c);
    categoryList.appendChild(row);
  });
}
function renderProducts(){const c=getActive();document.querySelector('#adminCategoryTitle').textContent=c?.name||'Kategori seç';productAdminList.innerHTML='';adminEmpty.style.display=c&&c.products.length?'none':'block';if(c&&!c.products.length)adminEmpty.textContent='Bu kategoride henüz ürün yok.';if(!c){adminEmpty.textContent='Soldan bir kategori seç veya yeni kategori oluştur.';return}c.products.forEach((p,index)=>{const row=document.createElement('article');row.className='admin-product';row.innerHTML=`<img alt=""><div><h3></h3><p></p></div><span class="price"></span><span class="status"></span><div class="order-buttons"><button type="button" data-dir="up" title="Yukarı">↑</button><button type="button" data-dir="down" title="Aşağı">↓</button></div><button class="edit-btn" type="button">Düzenle</button>`;const im=row.querySelector('img');im.src=imgPath(p.image);im.onerror=()=>im.src='image/urun-fotografi.jpg';im.alt=p.name;row.querySelector('h3').textContent=p.name;row.querySelector('p').textContent=p.description||'';row.querySelector('.price').textContent=fmt(p.price);const st=row.querySelector('.status');st.textContent=p.active?'AKTİF':'PASİF';st.classList.toggle('off',!p.active);row.querySelector('[data-dir="up"]').disabled=index===0;row.querySelector('[data-dir="down"]').disabled=index===c.products.length-1;row.querySelector('[data-dir="up"]').onclick=()=>moveProduct(c,p,-1);row.querySelector('[data-dir="down"]').onclick=()=>moveProduct(c,p,1);row.querySelector('.edit-btn').onclick=()=>openEditor(p);productAdminList.appendChild(row)})}
function fillCategorySelect(){const select=document.querySelector('#productCategory');select.innerHTML='';categories.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.name;select.appendChild(o)})}

async function moveCategory(category,delta){
  const list=[...categories];
  const index=list.findIndex(c=>c.id===category.id);
  const swap=index+delta;
  if(swap<0||swap>=list.length)return;
  const a=list[index],b=list[swap];
  const ao=Number(a.order||index+1),bo=Number(b.order||swap+1);
  await update(ref(db,'menu/categories'),{[a.id]:{order:bo},[b.id]:{order:ao}});
  toast('Kategori sırası güncellendi');
}
function openCategoryEditor(category=null){
  document.querySelector('#categoryEditorTitle').textContent=category?'Kategoriyi düzenle':'Yeni kategori';
  document.querySelector('#editingCategoryId').value=category?.id||'';
  document.querySelector('#categoryName').value=category?.name||'';
  document.querySelector('#categoryActive').checked=category?.active!==false;
  document.querySelector('#categoryActiveRow').hidden=!category;
  document.querySelector('#deleteCategoryBtn').hidden=!category;
  document.querySelector('#saveCategoryBtn').textContent=category?'Kaydet':'Oluştur';
  categoryEditor.showModal();
}

async function moveProduct(category,product,delta){const list=[...category.products];const index=list.findIndex(p=>p.id===product.id);const swap=index+delta;if(swap<0||swap>=list.length)return;const a=list[index],b=list[swap];const ao=Number(a.order||index+1),bo=Number(b.order||swap+1);await update(ref(db,`menu/categories/${category.id}/products`),{[a.id]:{...a,order:bo},[b.id]:{...b,order:ao}});toast('Ürün sırası güncellendi')}
function openEditor(product=null){if(!categories.length){toast('Önce kategori oluştur');return}document.querySelector('#editorTitle').textContent=product?'Ürünü düzenle':'Ürün ekle';document.querySelector('#editingProductId').value=product?.id||'';document.querySelector('#productCategory').value=activeCategory||categories[0].id;document.querySelector('#productName').value=product?.name||'';document.querySelector('#productDescription').value=product?.description||'';document.querySelector('#productPrice').value=product?.price??'';document.querySelector('#productImage').value=product?.image||'';document.querySelector('#productActive').checked=product?.active!==false;document.querySelector('#deleteProductBtn').hidden=!product;productEditor.showModal()}

onAuthStateChanged(auth,user=>{if(user){loginScreen.style.display='none';adminApp.hidden=false;startMenuListener()}else{loginScreen.style.display='grid';adminApp.hidden=true;if(menuUnsubscribe){menuUnsubscribe();menuUnsubscribe=null}}});
document.querySelector('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const err=document.querySelector('#loginError');err.textContent='';try{await signInWithEmailAndPassword(auth,document.querySelector('#email').value.trim(),document.querySelector('#password').value)}catch(error){err.textContent='E-posta veya şifre hatalı. Firebase Authentication ayarını kontrol et.';console.error(error)}});
document.querySelector('#logoutBtn').onclick=()=>signOut(auth);
document.querySelector('#newProductBtn').onclick=()=>openEditor();
document.querySelector('#addCategoryBtn').onclick=()=>openCategoryEditor();
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.querySelector(`#${b.dataset.close}`).close());

document.querySelector('#categoryForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const name=document.querySelector('#categoryName').value.trim();
  const editingId=document.querySelector('#editingCategoryId').value;
  if(!name)return;
  if(editingId){
    await update(ref(db,`menu/categories/${editingId}`),{name,active:document.querySelector('#categoryActive').checked});
    activeCategory=editingId;
    categoryEditor.close();
    toast('Kategori güncellendi');
    return;
  }
  let id=slugify(name);
  if(categories.some(c=>c.id===id))id+=`-${Date.now().toString().slice(-4)}`;
  const nextOrder=categories.length?Math.max(...categories.map(c=>Number(c.order||0)))+1:1;
  await set(ref(db,`menu/categories/${id}`),{name,order:nextOrder,active:true,products:{}});
  activeCategory=id;
  document.querySelector('#categoryName').value='';
  categoryEditor.close();
  toast('Kategori oluşturuldu');
});

document.querySelector('#deleteCategoryBtn').onclick=async()=>{
  const id=document.querySelector('#editingCategoryId').value;
  const category=categories.find(c=>c.id===id);
  if(!category)return;
  const detail=category.products.length?` Bu kategoride ${category.products.length} ürün var ve hepsi silinecek.`:'';
  if(!confirm(`“${category.name}” kategorisini tamamen silmek istiyor musun?${detail}`))return;
  await remove(ref(db,`menu/categories/${id}`));
  if(activeCategory===id)activeCategory=null;
  categoryEditor.close();
  toast('Kategori silindi');
};

document.querySelector('#productForm').addEventListener('submit',async e=>{e.preventDefault();const categoryId=document.querySelector('#productCategory').value;const editingId=document.querySelector('#editingProductId').value;const sourceCat=getActive();const original=editingId?categories.flatMap(c=>c.products.map(p=>({...p,categoryId:c.id}))).find(p=>p.id===editingId&&p.categoryId===sourceCat?.id):null;const targetCat=categories.find(c=>c.id===categoryId);const data={name:document.querySelector('#productName').value.trim(),description:document.querySelector('#productDescription').value.trim(),price:Number(document.querySelector('#productPrice').value),image:document.querySelector('#productImage').value.trim()||'urun-fotografi.jpg',active:document.querySelector('#productActive').checked,order:original?.order??((targetCat?.products.length||0)+1)};if(editingId){if(sourceCat.id!==categoryId){await remove(ref(db,`menu/categories/${sourceCat.id}/products/${editingId}`));await set(ref(db,`menu/categories/${categoryId}/products/${editingId}`),data)}else await set(ref(db,`menu/categories/${categoryId}/products/${editingId}`),data)}else{const newRef=push(ref(db,`menu/categories/${categoryId}/products`));await set(newRef,data)}activeCategory=categoryId;productEditor.close();toast('Ürün kaydedildi')});

document.querySelector('#deleteProductBtn').onclick=async()=>{const id=document.querySelector('#editingProductId').value;if(!id||!activeCategory)return;if(!confirm('Bu ürünü tamamen silmek istiyor musun?'))return;await remove(ref(db,`menu/categories/${activeCategory}/products/${id}`));productEditor.close();toast('Ürün silindi')};

document.querySelector('#importInitialBtn').onclick=async()=>{const snap=await get(ref(db,'menu/categories'));if(snap.exists()){toast('Firebase boş değil; mevcut veriye dokunulmadı.');return}if(!confirm('Mevcut örnek Hermos menüsü Firebase’e aktarılsın mı?'))return;await set(ref(db,'menu/categories'),initialMenu);toast('İlk menü Firebase’e aktarıldı')};
