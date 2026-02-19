// Cloud Sneakers - Loja (front-end)
// Produtos e Admin ficam salvos no localStorage

const LS_PRODUCTS = "cloud_products_v1";
const LS_CART = "cloud_cart_v1";
const LS_ADMIN_PASS = "cloud_admin_pass_v1";
const PLACEHOLDER_IMG = "assets/placeholder-product.svg";

// Preencha com as chaves do Supabase (URL e anon key). Mantém localStorage como fallback.
const SUPABASE_URL = window.SUPABASE_URL || "COLOQUE_SUA_SUPABASE_URL";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "COLOQUE_SUA_ANON_KEY";
const SUPABASE_TABLE = "products";
const supabaseClient = (typeof window !== "undefined" && window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes("COLOQUE"))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

let productsCache = [];
let isLoadingProducts = false;
let loadError = "";

const productGrid = document.getElementById("productGrid");
const bestGrid = document.getElementById("bestGrid");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");

const cartDrawer = document.getElementById("cartDrawer");
const cartBtn = document.getElementById("cartBtn");

const adminModal = document.getElementById("adminModal");
const adminBtn = document.getElementById("adminBtn");

const searchInput = document.getElementById("searchInput");
document.getElementById("year").textContent = new Date().getFullYear();

// Product detail modal
const productModal = document.getElementById("productModal");
const detailName = document.getElementById("detailName");
const detailImg = document.getElementById("detailImg");
const detailPrice = document.getElementById("detailPrice");
const detailOld = document.getElementById("detailOld");
const detailDiscount = document.getElementById("detailDiscount");
const detailDesc = document.getElementById("detailDesc");
const detailAddBtn = document.getElementById("detailAddBtn");
let detailProductId = null;

// ---------- Utils ----------
function moneyBR(v){
  return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}

function uid(){
  if(typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// URLs locais de disco (ex: C:\) não funcionam no deploy; valide imagens
function isValidImageSource(src){
  if(!src) return false;
  const lower = src.toLowerCase();
  const isHttp = lower.startsWith("http://") || lower.startsWith("https://");
  const isAsset = lower.startsWith("assets/") || lower.startsWith("./assets/") || lower.startsWith("/assets/");
  const isLocalDisk = /^[a-z]:\\/i.test(src) || lower.startsWith("file://");
  if(isLocalDisk) return false;
  return isHttp || isAsset;
}

// ---------- Default data ----------
function defaultProducts(){
  return [
    {
      id: uid(),
      name: "Tênis Cloud Street",
      category: "tenis",
      price: 499.90,
      oldPrice: 599.90,
      discount: "-17%",
      best: "yes",
      image: "assets/prod-tenis.svg",
      desc: "Tênis versátil para o dia a dia, cabedal leve e sola confortável."
    },
    {
      id: uid(),
      name: "Moletom Premium Cloud",
      category: "roupas",
      price: 299.90,
      oldPrice: "",
      discount: "",
      best: "yes",
      image: "assets/prod-moletom.svg",
      desc: "Moletom macio com modelagem confortável, ideal para meia-estação."
    },
    {
      id: uid(),
      name: "Camiseta Oversized Cloud",
      category: "roupas",
      price: 159.90,
      oldPrice: 199.90,
      discount: "-20%",
      best: "no",
      image: "assets/prod-camiseta.svg",
      desc: "Camiseta oversized com toque suave e caimento relaxado."
    }
  ];
}

function mapRowToProduct(row){
  return {
    id: row.id,
    name: row.name || "Produto",
    category: row.category || "tenis",
    price: Number(row.price) || 0,
    oldPrice: row.old_price ? Number(row.old_price) : "",
    discount: row.discount || "",
    best: row.best || "no",
    image: row.image_url || PLACEHOLDER_IMG,
    desc: row.description || ""
  };
}

function mapProductToRow(p){
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: Number(p.price) || 0,
    old_price: p.oldPrice ? Number(p.oldPrice) : null,
    discount: p.discount || null,
    best: p.best || "no",
    image_url: p.image || null,
    description: p.desc || null,
    updated_at: new Date().toISOString()
  };
}

function getProductsLocal(){
  const raw = localStorage.getItem(LS_PRODUCTS);
  if(!raw){
    const data = defaultProducts();
    setProductsLocal(data);
    return data;
  }

  try {
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed) || parsed.length === 0){
      const data = defaultProducts();
      setProductsLocal(data);
      return data;
    }
    return parsed;
  } catch {
    const data = defaultProducts();
    setProductsLocal(data);
    return data;
  }
}

function setProductsLocal(list){
  localStorage.setItem(LS_PRODUCTS, JSON.stringify(list));
}

function getProducts(){
  if(productsCache.length) return productsCache;
  productsCache = getProductsLocal();
  return productsCache;
}

function setProducts(list){
  productsCache = list;
  setProductsLocal(list);
}

async function fetchProductsFromSupabase(){
  if(!supabaseClient){
    productsCache = getProductsLocal();
    renderProducts();
    return;
  }

  isLoadingProducts = true;
  loadError = "";
  renderProducts();

  const { data, error } = await supabaseClient
    .from(SUPABASE_TABLE)
    .select("*")
    .order("updated_at", { ascending: false });

  if(error){
    console.error("Supabase fetch error", error);
    loadError = "Não foi possível carregar os produtos (Supabase).";
    productsCache = getProductsLocal();
  }else{
    productsCache = (data || []).map(mapRowToProduct);
    setProductsLocal(productsCache);
  }

  isLoadingProducts = false;
  renderProducts();
}

function getCart(){
  const raw = localStorage.getItem(LS_CART);
  if(!raw) return [];
  try { return JSON.parse(raw); }
  catch { return []; }
}

function setCart(list){
  localStorage.setItem(LS_CART, JSON.stringify(list));
}

function getAdminPass(){
  return localStorage.getItem(LS_ADMIN_PASS) || "admin123";
}
function setAdminPass(p){
  localStorage.setItem(LS_ADMIN_PASS, p);
}

// ---------- Render ----------
let activeFilter = "all";

function renderProducts(){
  if(isLoadingProducts){
    productGrid.innerHTML = `<p class="muted">Carregando produtos...</p>`;
    bestGrid.innerHTML = "";
    return;
  }

  if(loadError){
    productGrid.innerHTML = `<p class="muted">${loadError}</p>`;
    bestGrid.innerHTML = "";
    return;
  }

  const products = getProducts();
  const q = (searchInput.value || "").trim().toLowerCase();

  let filtered = products.filter(p => {
    const matchFilter = activeFilter === "all" ? true : p.category === activeFilter;
    const matchSearch = q ? p.name.toLowerCase().includes(q) : true;
    return matchFilter && matchSearch;
  });

  productGrid.innerHTML = filtered.map(cardHTML).join("");

  const best = products.filter(p => p.best === "yes");
  bestGrid.innerHTML = best.map(cardHTML).join("");

  attachCardEvents();
}

function cardHTML(p){
  const old = p.oldPrice ? `<span class="old">${moneyBR(Number(p.oldPrice))}</span>` : "";
  const disc = p.discount ? `<span class="discount">${p.discount}</span>` : "";

  return `
    <div class="card" data-id="${p.id}">
      <div class="card__img">
        <img src="${p.image || PLACEHOLDER_IMG}" alt="${p.name}" onerror="this.src='${PLACEHOLDER_IMG}'">
      </div>
      <div class="card__body">
        <p class="card__title">${p.name}</p>
        <div class="card__prices">
          <span class="price">${moneyBR(Number(p.price))}</span>
          ${old}
          ${disc}
        </div>
      </div>
      <div class="card__actions">
        <button class="small-btn" data-view="${p.id}">Ver</button>
        <button class="small-btn primary" data-add="${p.id}">Adicionar</button>
      </div>
    </div>
  `;
}

function attachCardEvents(){
  document.querySelectorAll("[data-add]").forEach(btn=>{
    btn.onclick = () => addToCart(btn.dataset.add);
  });
  document.querySelectorAll("[data-view]").forEach(btn=>{
    btn.onclick = () => openProductDetail(btn.dataset.view);
  });
}

// ---------- Product Detail ----------
function openProductDetail(id){
  const products = getProducts();
  const p = products.find(x=>x.id === id);
  if(!p) return;

  detailProductId = p.id;
  detailName.textContent = p.name;
  detailImg.src = p.image || PLACEHOLDER_IMG;
  detailImg.alt = p.name;

  detailPrice.textContent = moneyBR(Number(p.price));
  detailOld.textContent = p.oldPrice ? moneyBR(Number(p.oldPrice)) : "";
  detailDiscount.textContent = p.discount || "";

  const desc = (p.desc || "").trim();
  if(desc){
    detailDesc.textContent = desc;
    detailDesc.style.display = "block";
  }else{
    detailDesc.textContent = "";
    detailDesc.style.display = "none";
  }

  openDrawer(productModal);
}

if(detailAddBtn){
  detailAddBtn.onclick = () => {
    if(!detailProductId) return;
    addToCart(detailProductId);
    closeDrawer(productModal);
  };
}

// ---------- Cart ----------
function addToCart(id){
  const products = getProducts();
  const p = products.find(x=>x.id===id);
  if(!p) return;

  const cart = getCart();
  cart.push({id: uid(), productId: p.id});
  setCart(cart);

  updateCartUI();
  openDrawer(cartDrawer);
}

function removeFromCart(cartItemId){
  let cart = getCart();
  cart = cart.filter(x=>x.id !== cartItemId);
  setCart(cart);
  updateCartUI();
}

function updateCartUI(){
  const products = getProducts();
  const cart = getCart();

  cartCount.textContent = cart.length;

  if(cart.length === 0){
    cartItems.innerHTML = `<p class="muted">Seu carrinho está vazio.</p>`;
    cartTotal.textContent = "R$ 0,00";
    return;
  }

  let total = 0;

  cartItems.innerHTML = cart.map(item=>{
    const p = products.find(x=>x.id===item.productId);
    if(!p) return "";
    total += Number(p.price);

    return `
      <div class="cartItem">
        <img src="${p.image}" alt="${p.name}">
        <div>
          <h4>${p.name}</h4>
          <div class="row">
            <strong>${moneyBR(Number(p.price))}</strong>
            <button class="small-btn" data-remove="${item.id}">Remover</button>
          </div>
        </div>
      </div>
    `;
  }).join("");

  cartTotal.textContent = moneyBR(total);

  document.querySelectorAll("[data-remove]").forEach(btn=>{
    btn.onclick = () => removeFromCart(btn.dataset.remove);
  });
}

document.getElementById("checkoutBtn").onclick = () => {
  alert("Checkout real (pagamento) eu posso integrar depois com MercadoPago/PagSeguro.");
};

// ---------- Drawer / Modal ----------
function openDrawer(el){
  el.classList.add("is-open");
  el.setAttribute("aria-hidden","false");
}
function closeDrawer(el){
  el.classList.remove("is-open");
  el.setAttribute("aria-hidden","true");
}

cartBtn.onclick = () => openDrawer(cartDrawer);

document.querySelectorAll("[data-close]").forEach(el=>{
  el.onclick = () => {
    const t = el.dataset.close;
    if(t === "cart") closeDrawer(cartDrawer);
    if(t === "admin") closeDrawer(adminModal);
    if(t === "product") closeDrawer(productModal);
  };
});

// ---------- Navbar filter ----------
document.querySelectorAll(".nav__link[data-filter]").forEach(link=>{
  link.onclick = (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav__link").forEach(a=>a.classList.remove("is-active"));
    link.classList.add("is-active");
    activeFilter = link.dataset.filter;
    renderProducts();
  };
});

searchInput.oninput = () => renderProducts();

// ---------- Admin ----------
const tabs = document.querySelectorAll(".tab");
const panels = {
  login: document.getElementById("tab-login"),
  produtos: document.getElementById("tab-produtos"),
  config: document.getElementById("tab-config"),
};

let adminLogged = false;

function openAdmin(){
  openDrawer(adminModal);
  selectTab("login");
}

// Clique normal: fluxo de login comum (placeholder). Duplo clique ou clique com Shift/Alt abre Admin.
function handleUserIcon(event){
  if(event.shiftKey){
    openAdmin();
    return;
  }
  // Sem alerta para o clique simples; acesso do admin fica só com Shift ou duplo clique
}

if(adminBtn){
  adminBtn.addEventListener("click", handleUserIcon);
}

function selectTab(name){
  tabs.forEach(t=>t.classList.remove("is-active"));
  document.querySelector(`.tab[data-tab="${name}"]`).classList.add("is-active");

  Object.values(panels).forEach(p=>p.classList.remove("is-active"));
  panels[name].classList.add("is-active");

  if(name === "produtos") renderAdminList();
}

tabs.forEach(t=>{
  t.onclick = () => {
    const name = t.dataset.tab;
    if(name !== "login" && !adminLogged){
      alert("Faça login primeiro!");
      return;
    }
    selectTab(name);
  };
});

document.getElementById("adminLoginBtn").onclick = () => {
  const pass = document.getElementById("adminPass").value.trim();
  if(pass === getAdminPass()){
    adminLogged = true;
    alert("Login feito! Agora você pode adicionar produtos.");
    selectTab("produtos");
  }else{
    alert("Senha incorreta.");
  }
};

document.getElementById("savePassBtn").onclick = () => {
  if(!adminLogged) return alert("Faça login primeiro!");
  const np = document.getElementById("newPass").value.trim();
  if(np.length < 4) return alert("Senha muito curta.");
  setAdminPass(np);
  alert("Senha alterada com sucesso!");
  document.getElementById("newPass").value = "";
};

// ---------- Admin Products ----------
const adminList = document.getElementById("adminList");
const addProductBtn = document.getElementById("addProductBtn");

const editor = document.getElementById("adminEditor");
const editorTitle = document.getElementById("editorTitle");

const pName = document.getElementById("pName");
const pCategory = document.getElementById("pCategory");
const pPrice = document.getElementById("pPrice");
const pOldPrice = document.getElementById("pOldPrice");
const pDiscount = document.getElementById("pDiscount");
const pBest = document.getElementById("pBest");
const pImage = document.getElementById("pImage");
const pDesc = document.getElementById("pDesc");

let editingId = null;

function renderAdminList(){
  const products = getProducts();

  adminList.innerHTML = products.map(p=>{
    return `
      <div class="adminRow">
        <div>
          <strong>${p.name}</strong>
          <span>${p.category.toUpperCase()} • ${moneyBR(Number(p.price))}</span>
        </div>
        <div class="actions">
          <button class="small-btn" data-edit="${p.id}">Editar</button>
          <button class="small-btn" data-del="${p.id}">Excluir</button>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.onclick = () => openEditor(btn.dataset.edit);
  });

  document.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = () => deleteProduct(btn.dataset.del);
  });
}

function openEditor(id=null){
  editingId = id;

  if(id){
    editorTitle.textContent = "Editar produto";
    const p = getProducts().find(x=>x.id===id);
    if(!p) return;

    pName.value = p.name || "";
    pCategory.value = p.category || "tenis";
    pPrice.value = p.price || "";
    pOldPrice.value = p.oldPrice || "";
    pDiscount.value = p.discount || "";
    pBest.value = p.best || "no";
    pImage.value = p.image || "";
    pDesc.value = p.desc || "";
  }else{
    editorTitle.textContent = "Novo produto";
    pName.value = "";
    pCategory.value = "tenis";
    pPrice.value = "";
    pOldPrice.value = "";
    pDiscount.value = "";
    pBest.value = "no";
    pImage.value = "";
    pDesc.value = "";
  }

  editor.classList.add("is-open");
  editor.setAttribute("aria-hidden","false");
  document.body.classList.add("admin-open");
}

function closeEditor(){
  editor.classList.remove("is-open");
  editor.setAttribute("aria-hidden","true");
  document.body.classList.remove("admin-open");
}

document.getElementById("closeEditor").onclick = closeEditor;
(document.getElementById("cancelProductBtn")).onclick = closeEditor;

addProductBtn.onclick = () => openEditor(null);

document.getElementById("saveProductBtn").onclick = async () => {
  const name = pName.value.trim();
  const category = pCategory.value;
  const price = Number(pPrice.value);
  const oldPrice = pOldPrice.value ? Number(pOldPrice.value) : "";
  const discount = pDiscount.value.trim();
  const best = pBest.value;
  const image = pImage.value.trim() || PLACEHOLDER_IMG;
  const desc = pDesc.value.trim();

  if(!name) return alert("Digite o nome do produto.");
  if(!price || price <= 0) return alert("Digite um preço válido.");
  if(image && !isValidImageSource(image)) return alert("Use uma URL http(s) ou um caminho relativo em assets/ (ex: assets/foto.png). Caminho de disco local não funciona online.");

  const id = editingId || uid();
  const productPayload = { id, name, category, price, oldPrice, discount, best, image, desc };

  if(supabaseClient){
    const { error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .upsert(mapProductToRow(productPayload));

    if(error){
      console.error(error);
      alert("Erro ao salvar no Supabase.");
      return;
    }

    await fetchProductsFromSupabase();
  }else{
    let products = getProducts();

    if(editingId){
      products = products.map(p=>{
        if(p.id !== editingId) return p;
        return { ...p, name, category, price, oldPrice, discount, best, image, desc };
      });
    }else{
      products.unshift(productPayload);
    }

    setProducts(products);
    renderProducts();
    renderAdminList();
  }

  closeEditor();
};

async function deleteProduct(id){
  if(!confirm("Tem certeza que deseja excluir esse produto?")) return;

  if(supabaseClient){
    const { error } = await supabaseClient
      .from(SUPABASE_TABLE)
      .delete()
      .eq("id", id);

    if(error){
      console.error(error);
      alert("Erro ao excluir no Supabase.");
      return;
    }

    await fetchProductsFromSupabase();
  }else{
    let products = getProducts();
    products = products.filter(p=>p.id !== id);
    setProducts(products);
    renderProducts();
    renderAdminList();
  }
}

// ---------- Import / Export ----------
document.getElementById("exportBtn").onclick = () => {
  const data = getProducts();
  const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "produtos-cloud-sneakers.json";
  a.click();
};

document.getElementById("importInput").addEventListener("change", async (e)=>{
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try{
      const json = JSON.parse(reader.result);
      if(!Array.isArray(json)) throw new Error("Formato inválido");

      if(supabaseClient){
        const rows = json.map(item => mapProductToRow({
          id: item.id || uid(),
          name: item.name,
          category: item.category || "tenis",
          price: item.price || 0,
          oldPrice: item.oldPrice || item.old_price || "",
          discount: item.discount || "",
          best: item.best || "no",
          image: item.image || item.image_url || PLACEHOLDER_IMG,
          desc: item.desc || ""
        }));

        const { error } = await supabaseClient.from(SUPABASE_TABLE).upsert(rows);
        if(error) throw error;
        await fetchProductsFromSupabase();
      }else{
        setProducts(json);
        renderProducts();
        renderAdminList();
      }

      alert("Produtos importados com sucesso!");
    }catch(err){
      alert("Erro ao importar JSON.");
    }
  };
  reader.readAsText(file);
});

// ---------- Start ----------
updateCartUI();
renderProducts();
fetchProductsFromSupabase();
