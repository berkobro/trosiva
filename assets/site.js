/* Trosiva site: shared nav, footer, cart drawer and cart storage */
(function () {
  // ---- Products (edit prices here) ----
  const PRODUCTS = {
    "disc-5":  { discs: 5,  price: 9.99,  name: "Trosiva Box · 5 Discs" },
    "disc-10": { discs: 10, price: 18.99, name: "Trosiva Box · 10 Discs" },
    "disc-15": { discs: 15, price: 26.99, name: "Trosiva Box · 15 Discs" },
    "disc-20": { discs: 20, price: 34.99, name: "Trosiva Box · 20 Discs" },
  };
  const BAGS_PER_DISC = 5;
  const KEY = "trosiva-cart-v1";
  const money = (n) => "$" + n.toFixed(2);

  // ---- Cart storage (works even if storage is blocked) ----
  let memCart = {};
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return memCart; }
  }
  function save(cart) {
    memCart = cart;
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    render();
  }
  const Cart = {
    items() {
      const c = load();
      return Object.keys(c).filter((id) => PRODUCTS[id] && c[id] > 0)
        .map((id) => ({ id, qty: c[id], ...PRODUCTS[id], total: c[id] * PRODUCTS[id].price }));
    },
    count() { return this.items().reduce((s, i) => s + i.qty, 0); },
    subtotal() { return this.items().reduce((s, i) => s + i.total, 0); },
    add(id, qty) { const c = load(); c[id] = (c[id] || 0) + qty; save(c); },
    set(id, qty) { const c = load(); if (qty <= 0) delete c[id]; else c[id] = Math.min(qty, 99); save(c); },
    clear() { save({}); },
  };

  // ---- Shared chrome ----
  const page = document.body.dataset.page;
  const links = [
    ["index.html", "Home", "home"],
    ["how-it-works.html", "How It Works", "how"],
    ["about.html", "About Us", "about"],
    ["shop.html", "Shop", "shop"],
  ];
  const nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML = `
    <div class="wrap">
      <a class="brand" href="index.html" aria-label="Trosiva home"><img src="assets/img/logo-wordmark.png" alt="Trosiva" width="133" height="30"></a>
      <ul id="nav-links">
        ${links.map(([h, t, k]) => `<li><a href="${h}"${k === page ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}
      </ul>
      <button class="menu-toggle" aria-label="Menu" aria-controls="nav-links" aria-expanded="false">☰</button>
      <button class="cart-btn" data-open-cart aria-label="Open cart">Cart <span class="cart-count">0</span></button>
    </div>`;
  document.body.prepend(nav);
  const toggle = nav.querySelector(".menu-toggle");
  toggle.addEventListener("click", () => {
    const ul = nav.querySelector("ul");
    ul.classList.toggle("open");
    toggle.setAttribute("aria-expanded", ul.classList.contains("open"));
  });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="wrap">
      <img src="assets/img/logo-wordmark.png" alt="Trosiva" width="115" height="26">
      <span class="pill" style="font-size:16px">Set it. Forget it.</span>
      <nav>${links.map(([h, t]) => `<a href="${h}">${t}</a>`).join("")}<a href="checkout.html">Checkout</a></nav>
      <p class="copy">© ${new Date().getFullYear()} Trosiva. All rights reserved.</p>
    </div>`;
  document.body.append(footer);

  const drawer = document.createElement("div");
  drawer.innerHTML = `
    <div class="drawer-scrim" data-close-cart></div>
    <aside class="drawer" aria-label="Shopping cart" role="dialog">
      <header><h3>Your Cart</h3><button class="close" data-close-cart aria-label="Close cart">×</button></header>
      <div class="items" id="drawer-items"></div>
      <footer>
        <div class="totals"><div class="grand"><span>Subtotal</span><span id="drawer-subtotal">$0.00</span></div></div>
        <a class="btn btn-solid full" href="checkout.html" id="drawer-checkout">Checkout</a>
        <p style="color:var(--dim);font-size:14px;text-align:center;margin-top:10px;text-transform:uppercase;letter-spacing:.06em">Shipping calculated at checkout</p>
      </footer>
    </aside>`;
  document.body.append(drawer);
  const toast = document.createElement("div");
  toast.className = "toast"; toast.setAttribute("role", "status");
  document.body.append(toast);

  function openCart() { document.body.classList.add("cart-open"); }
  function closeCart() { document.body.classList.remove("cart-open"); }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-cart]")) { e.preventDefault(); openCart(); }
    if (e.target.closest("[data-close-cart]")) closeCart();
    const b = e.target.closest("[data-cart-action]");
    if (b) {
      const id = b.dataset.id, cur = (load()[id] || 0);
      const a = b.dataset.cartAction;
      Cart.set(id, a === "inc" ? cur + 1 : a === "dec" ? cur - 1 : 0);
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  function lineItemHTML(i) {
    return `<div class="line-item">
      <img src="assets/img/disc.jpg" alt="">
      <div>
        <div class="t">${i.discs} Discs</div>
        <div class="s">${i.discs * BAGS_PER_DISC} bags · ${money(i.price)} each</div>
        <div class="mini">
          <button data-cart-action="dec" data-id="${i.id}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-cart-action="inc" data-id="${i.id}" aria-label="Increase">+</button>
          <button class="remove" data-cart-action="remove" data-id="${i.id}">Remove</button>
        </div>
      </div>
      <div class="lp">${money(i.total)}</div>
    </div>`;
  }

  function render() {
    const items = Cart.items();
    document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = Cart.count()));
    const box = document.getElementById("drawer-items");
    if (box) box.innerHTML = items.length ? items.map(lineItemHTML).join("") : `<p class="empty">Your cart is empty.<br><br><a class="btn btn-ghost" href="shop.html">Shop discs</a></p>`;
    const st = document.getElementById("drawer-subtotal");
    if (st) st.textContent = money(Cart.subtotal());
    const co = document.getElementById("drawer-checkout");
    if (co) co.style.display = items.length ? "" : "none";
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // reveal on scroll
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 }) : null;
  document.querySelectorAll(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

  window.addEventListener("storage", render);
  window.Trosiva = { PRODUCTS, BAGS_PER_DISC, Cart, money, openCart, showToast, lineItemHTML };
  render();
})();
