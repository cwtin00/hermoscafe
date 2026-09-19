const menuData=[
  {id:'kahveler',name:'Kahveler',products:[['Espresso','Yoğun aromalı klasik espresso.','₺90'],['Americano','Espresso ve sıcak su ile yalın bir lezzet.','₺110'],['Caffè Latte','Espresso ve ipeksi süt köpüğü.','₺130'],['Caramel Macchiato','Karamel, espresso ve süt uyumu.','₺145']]},
  {id:'soguk-kahveler',name:'Soğuk Kahveler',products:[['Iced Americano','Buz üzerinde ferah espresso.','₺120'],['Iced Latte','Soğuk süt, espresso ve buz.','₺140'],['Cold Brew','Uzun demleme, yumuşak içim.','₺150'],['Iced Mocha','Çikolata, espresso ve soğuk süt.','₺155']]},
  {id:'tatlilar',name:'Tatlılar',products:[['San Sebastian','Akışkan dokulu fırınlanmış cheesecake.','₺190'],['Magnolia','Muz, bisküvi ve vanilyalı krema.','₺160'],['Çikolatalı Sufle','Sıcak çikolatalı kek ve dondurma.','₺195']]},
  {id:'icecekler',name:'Soğuk İçecekler',products:[['Ev Yapımı Limonata','Taze limon ve nane.','₺100'],['Çilekli Frozen','Çilek, buz ve meyve püresi.','₺135'],['Maden Suyu','Sade maden suyu.','₺50']]}
];

const nav=document.querySelector('#categoryNav');
const list=document.querySelector('#productList');
const empty=document.querySelector('#emptyState');
const title=document.querySelector('#activeCategoryTitle');
const count=document.querySelector('#productCount');
const searchInput=document.querySelector('#searchInput');
const modal=document.querySelector('#productModal');
let activeCategory=menuData[0].id;

function activeData(){return menuData.find(category=>category.id===activeCategory)}

function renderProducts(){
  const category=activeData();
  const term=searchInput.value.toLocaleLowerCase('tr').trim();
  const products=category.products.filter(([name,description])=>`${name} ${description}`.toLocaleLowerCase('tr').includes(term));
  title.textContent=category.name;
  count.textContent=`${products.length} ürün`;
  list.innerHTML='';
  products.forEach(([name,description,price])=>{
    const card=document.createElement('button');
    card.type='button';
    card.className='product-card';
    card.innerHTML=`<h3>${name}</h3><span class="price">${price}</span><p>${description}</p>`;
    card.addEventListener('click',()=>openProduct(category.name,name,description,price));
    list.appendChild(card);
  });
  empty.style.display=products.length?'none':'block';
}

menuData.forEach((category,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.className=`category-button${index===0?' active':''}`;
  button.innerHTML=`<span>${String(index+1).padStart(2,'0')}</span><strong>${category.name}</strong>`;
  button.dataset.category=category.id;
  button.addEventListener('click',()=>{
    activeCategory=category.id;
    searchInput.value='';
    document.querySelectorAll('.category-button').forEach(item=>item.classList.toggle('active',item===button));
    renderProducts();
    document.querySelector('.menu-shell').scrollIntoView({behavior:'smooth',block:'start'});
  });
  nav.appendChild(button);
});

function openProduct(category,name,description,price){
  document.querySelector('#modalCategory').textContent=category;
  document.querySelector('#modalName').textContent=name;
  document.querySelector('#modalDescription').textContent=description;
  document.querySelector('#modalPrice').textContent=price;
  modal.showModal();
}

document.querySelector('#modalClose').addEventListener('click',()=>modal.close());
modal.addEventListener('click',event=>{if(event.target===modal)modal.close()});
document.querySelector('#searchToggle').addEventListener('click',event=>{
  const panel=document.querySelector('#searchPanel');
  const isOpen=panel.classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded',String(isOpen));
  if(isOpen)setTimeout(()=>searchInput.focus(),150);
});
searchInput.addEventListener('input',renderProducts);
renderProducts();
