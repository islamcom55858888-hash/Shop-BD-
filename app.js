/* =========================================================
   ShopBD - Complete App JavaScript
   Works with the provided index.html + style.css

   Features:
   - Product loading
   - Search
   - Categories
   - Shopping cart
   - Quantity control
   - LocalStorage cart
   - Checkout
   - bKash / Nagad instructions
   - Firebase Firestore order saving
   - Demo products when Firebase is not configured
========================================================= */

/* =========================================================
   1. FIREBASE CONFIG
=========================================================

   IMPORTANT:
   এখন এখানে placeholder আছে।

   Firebase Web App তৈরি করার পরে Firebase যে config দেবে,
   সেটি এখানে বসাতে হবে।

========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyBQIzx77k449EJ0c3brXG1mIUUQMDlf3KQ",
  authDomain: "shop-bd-efc75.firebaseapp.com",
  projectId: "shop-bd-efc75",
  storageBucket: "shop-bd-efc75.firebasestorage.app",
  messagingSenderId: "1068485967319",
  appId: "1:1068485967319:web:8024c77597f708889c5f92",
  measurementId: "G-0RJWLWR9TY"
};


/* =========================================================
   2. FIREBASE IMPORT
========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";


/* =========================================================
   3. FIREBASE INITIALIZATION
========================================================= */

let firebaseApp = null;
let db = null;
let firebaseReady = false;

function isFirebaseConfigValid() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    !firebaseConfig.apiKey.includes("PASTE_") &&
    !firebaseConfig.projectId.includes("YOUR_") &&
    !firebaseConfig.appId.includes("PASTE_")
  );
}

try {
  if (isFirebaseConfigValid()) {
    firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp);
    firebaseReady = true;
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  firebaseReady = false;
}


/* =========================================================
   4. DEMO PRODUCTS
=========================================================

   Firebase setup না হওয়া পর্যন্ত ShopBD খালি থাকবে না।
   এই demo products দিয়ে UI এবং cart পরীক্ষা করা যাবে।

   Firebase setup হলে Firestore-এর products collection
   থেকে আসল products ব্যবহার করা হবে।
========================================================= */

const DEMO_PRODUCTS = [
  {
    id: "demo-1",
    name: "স্মার্ট ওয়াচ",
    category: "ইলেকট্রনিক্স",
    price: 1290,
    description: "আকর্ষণীয় ডিজাইনের স্মার্ট ওয়াচ।",
    emoji: "⌚",
    imageUrl: "",
    active: true
  },

  {
    id: "demo-2",
    name: "ওয়্যারলেস ইয়ারবাড",
    category: "ইলেকট্রনিক্স",
    price: 890,
    description: "দৈনন্দিন ব্যবহারের জন্য ওয়্যারলেস ইয়ারবাড।",
    emoji: "🎧",
    imageUrl: "",
    active: true
  },

  {
    id: "demo-3",
    name: "ব্যাকপ্যাক",
    category: "ফ্যাশন",
    price: 750,
    description: "স্টাইলিশ ও ব্যবহারযোগ্য ব্যাকপ্যাক।",
    emoji: "🎒",
    imageUrl: "",
    active: true
  },

  {
    id: "demo-4",
    name: "পানি বোতল",
    category: "লাইফস্টাইল",
    price: 350,
    description: "দৈনন্দিন ব্যবহারের জন্য সুন্দর পানি বোতল।",
    emoji: "🥤",
    imageUrl: "",
    active: true
  },

  {
    id: "demo-5",
    name: "টি-শার্ট",
    category: "ফ্যাশন",
    price: 550,
    description: "আরামদায়ক ও আধুনিক ডিজাইনের টি-শার্ট।",
    emoji: "👕",
    imageUrl: "",
    active: true
  },

  {
    id: "demo-6",
    name: "মোবাইল স্ট্যান্ড",
    category: "অ্যাক্সেসরিজ",
    price: 250,
    description: "মোবাইল রাখার জন্য সহজ ও মজবুত স্ট্যান্ড।",
    emoji: "📱",
    imageUrl: "",
    active: true
  }
];


/* =========================================================
   5. APPLICATION STATE
========================================================= */

let products = [];
let cart = [];

let selectedCategory = "all";
let searchTerm = "";


/* =========================================================
   6. DELIVERY CHARGE
=========================================================

   এখন 0 রাখা হয়েছে।
   পরে চাইলে জেলা/এলাকা অনুযায়ী পরিবর্তন করা যাবে।
========================================================= */

const DELIVERY_CHARGE = 0;


/* =========================================================
   7. LOCAL STORAGE
========================================================= */

const CART_STORAGE_KEY = "shopbd_cart";


function loadCartFromStorage() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      cart = [];
      return;
    }

    const parsedCart = JSON.parse(savedCart);

    if (Array.isArray(parsedCart)) {
      cart = parsedCart;
    } else {
      cart = [];
    }

  } catch (error) {
    console.error("Could not load cart:", error);
    cart = [];
  }
}


function saveCartToStorage() {
  try {
    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart)
    );
  } catch (error) {
    console.error("Could not save cart:", error);
  }
}


/* =========================================================
   8. DOM ELEMENTS
========================================================= */

const elements = {
  cartToggle: document.getElementById("cartToggle"),
  cartCount: document.getElementById("cartCount"),

  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),

  categoryList: document.getElementById("categoryList"),

  productsGrid: document.getElementById("productsGrid"),
  productsEmpty: document.getElementById("productsEmpty"),

  cartSection: document.getElementById("cartSection"),
  cartItems: document.getElementById("cartItems"),

  cartSubtotal: document.getElementById("cartSubtotal"),
  deliveryCharge: document.getElementById("deliveryCharge"),
  cartTotal: document.getElementById("cartTotal"),

  checkoutButton: document.getElementById("checkoutButton"),
  clearCartButton: document.getElementById("clearCartButton"),
  closeCartButton: document.getElementById("closeCartButton"),

  checkoutSection: document.getElementById("checkoutSection"),
  backToCartButton: document.getElementById("backToCartButton"),

  checkoutForm: document.getElementById("checkoutForm"),

  customerName: document.getElementById("customerName"),
  customerPhone: document.getElementById("customerPhone"),
  customerAddress: document.getElementById("customerAddress"),
  customerNote: document.getElementById("customerNote"),

  paymentMethod: document.getElementById("paymentMethod"),
  paymentInstructions: document.getElementById("paymentInstructions"),
  paymentMessage: document.getElementById("paymentMessage"),

  transactionGroup: document.getElementById("transactionGroup"),
  transactionId: document.getElementById("transactionId"),

  checkoutTotal: document.getElementById("checkoutTotal"),
  placeOrderButton: document.getElementById("placeOrderButton"),

  orderStatus: document.getElementById("orderStatus"),

  currentYear: document.getElementById("currentYear")
};


/* =========================================================
   9. NUMBER / CURRENCY HELPERS
========================================================= */

function formatNumber(number) {
  return Number(number || 0).toLocaleString("bn-BD");
}


function formatPrice(amount) {
  return "৳" + formatNumber(amount);
}


function safeNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}


/* =========================================================
   10. ESCAPE HTML
=========================================================

   Firebase-এ রাখা product name/description-এর কারণে
   unwanted HTML injection আটকানোর জন্য ব্যবহার করা হচ্ছে।
========================================================= */

function escapeHTML(value) {
  const text = String(value ?? "");

  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   11. PRODUCT IMAGE
========================================================= */

function getProductVisual(product) {

  const imageUrl = String(product.imageUrl || "").trim();

  if (imageUrl) {
    return `
      <img
        src="${escapeHTML(imageUrl)}"
        alt="${escapeHTML(product.name)}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
      >
      <span class="product-emoji" style="display:none;">
        ${escapeHTML(product.emoji || "🛍️")}
      </span>
    `;
  }

  return `
    <span class="product-emoji">
      ${escapeHTML(product.emoji || "🛍️")}
    </span>
  `;
}


/* =========================================================
   12. LOAD PRODUCTS FROM FIREBASE
========================================================= */

async function loadProducts() {

  showProductsLoading();

  /*
    Firebase configured না থাকলে demo products দেখাবে।
  */

  if (!firebaseReady || !db) {
    products = [...DEMO_PRODUCTS];

    renderCategories();
    renderProducts();

    return;
  }

  /*
    Firebase configured থাকলে products collection থেকে
    products নেওয়ার চেষ্টা করবে।
  */

  try {

    const { getDocs, query, collection: firestoreCollection }
      = await import(
        "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js"
      );

    const productsRef = firestoreCollection(
      db,
      "products"
    );

    const snapshot = await getDocs(
      query(productsRef)
    );

    const loadedProducts = [];

    snapshot.forEach((doc) => {

      const data = doc.data();

      if (data.active === false) {
        return;
      }

      loadedProducts.push({
        id: doc.id,

        name: String(data.name || "নামহীন পণ্য"),

        category: String(
          data.category || "অন্যান্য"
        ),

        price: safeNumber(data.price),

        description: String(
          data.description || ""
        ),

        emoji: String(
          data.emoji || "🛍️"
        ),

        imageUrl: String(
          data.imageUrl || ""
        ),

        active: data.active !== false
      });

    });

    /*
      Firebase-এ product না থাকলে demo products দেখানো হবে।
    */

    products =
      loadedProducts.length > 0
        ? loadedProducts
        : [...DEMO_PRODUCTS];

  } catch (error) {

    console.error(
      "Could not load Firebase products:",
      error
    );

    /*
      Firebase error হলেও ShopBD যেন বন্ধ না হয়ে যায়।
    */

    products = [...DEMO_PRODUCTS];
  }

  renderCategories();
  renderProducts();
}


/* =========================================================
   13. LOADING STATE
========================================================= */

function showProductsLoading() {

  if (!elements.productsGrid) {
    return;
  }

  elements.productsGrid.innerHTML = `
    <p class="loading-message">
      পণ্য লোড হচ্ছে...
    </p>
  `;

  if (elements.productsEmpty) {
    elements.productsEmpty.hidden = true;
  }
}


/* =========================================================
   14. CATEGORIES
========================================================= */

function getCategories() {

  const categories = products
    .map(product => product.category)
    .filter(Boolean);

  return [
    ...new Set(categories)
  ];
}


function renderCategories() {

  if (!elements.categoryList) {
    return;
  }

  const categories = getCategories();

  let html = `
    <button
      type="button"
      class="category-btn ${
        selectedCategory === "all"
          ? "active"
          : ""
      }"
      data-category="all"
    >
      সব পণ্য
    </button>
  `;

  categories.forEach(category => {

    html += `
      <button
        type="button"
        class="category-btn ${
          selectedCategory === category
            ? "active"
            : ""
        }"
        data-category="${escapeHTML(category)}"
      >
        ${escapeHTML(category)}
      </button>
    `;
  });

  elements.categoryList.innerHTML = html;

  const categoryButtons =
    elements.categoryList.querySelectorAll(
      ".category-btn"
    );

  categoryButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        selectedCategory =
          button.dataset.category || "all";

        renderCategories();
        renderProducts();
      }
    );

  });
}


/* =========================================================
   15. FILTER PRODUCTS
========================================================= */

function getFilteredProducts() {

  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  return products.filter(product => {

    const categoryMatch =
      selectedCategory === "all" ||
      product.category === selectedCategory;

    if (!categoryMatch) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const searchableText = [
      product.name,
      product.category,
      product.description
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      normalizedSearch
    );
  });
}


/* =========================================================
   16. RENDER PRODUCTS
========================================================= */

function renderProducts() {

  if (!elements.productsGrid) {
    return;
  }

  const filteredProducts =
    getFilteredProducts();

  if (filteredProducts.length === 0) {

    elements.productsGrid.innerHTML = "";

    if (elements.productsEmpty) {
      elements.productsEmpty.hidden = false;
    }

    return;
  }

  if (elements.productsEmpty) {
    elements.productsEmpty.hidden = true;
  }

  elements.productsGrid.innerHTML =
    filteredProducts
      .map(product => {

        const price =
          safeNumber(product.price);

        return `
          <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
          >

            <div class="product-image">
              ${getProductVisual(product)}
            </div>

            <div class="product-body">

              <div class="product-category">
                ${escapeHTML(product.category)}
              </div>

              <h3 class="product-name">
                ${escapeHTML(product.name)}
              </h3>

              <p class="product-description">
                ${escapeHTML(product.description)}
              </p>

              <div class="product-bottom">

                <strong class="product-price">
                  ${formatPrice(price)}
                </strong>

                <button
                  type="button"
                  class="add-to-cart-button"
                  data-add-product="${escapeHTML(product.id)}"
                >
                  কার্টে যোগ
                </button>

              </div>

            </div>

          </article>
        `;
      })
      .join("");

  const addButtons =
    elements.productsGrid.querySelectorAll(
      "[data-add-product]"
    );

  addButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const productId =
          button.dataset.addProduct;

        addToCart(productId);
      }
    );

  });
}


/* =========================================================
   17. FIND PRODUCT
========================================================= */

function findProduct(productId) {

  return products.find(
    product => String(product.id) === String(productId)
  );
}


/* =========================================================
   18. ADD TO CART
========================================================= */

function addToCart(productId) {

  const product =
    findProduct(productId);

  if (!product) {
    showOrderStatus(
      "পণ্যটি পাওয়া যায়নি।",
      "error"
    );

    return;
  }

  const existingItem =
    cart.find(
      item =>
        String(item.productId) ===
        String(productId)
    );

  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({
      productId: product.id,
      quantity: 1
    });

  }

  saveCartToStorage();

  renderCart();

  openCart();

  showTemporaryMessage(
    "পণ্যটি কার্টে যোগ হয়েছে।"
  );
}


/* =========================================================
   19. REMOVE FROM CART
========================================================= */

function removeFromCart(productId) {

  cart =
    cart.filter(
      item =>
        String(item.productId) !==
        String(productId)
    );

  saveCartToStorage();

  renderCart();
}


/* =========================================================
   20. CHANGE QUANTITY
========================================================= */

function changeQuantity(
  productId,
  change
) {

  const item =
    cart.find(
      cartItem =>
        String(cartItem.productId) ===
        String(productId)
    );

  if (!item) {
    return;
  }

  item.quantity += change;

  if (item.quantity <= 0) {

    removeFromCart(productId);

    return;
  }

  /*
    অতিরিক্ত অস্বাভাবিক quantity আটকানো।
  */

  if (item.quantity > 99) {
    item.quantity = 99;
  }

  saveCartToStorage();

  renderCart();
}


/* =========================================================
   21. GET CART DETAILS
========================================================= */

function getCartDetails() {

  return cart
    .map(item => {

      const product =
        findProduct(item.productId);

      if (!product) {
        return null;
      }

      const quantity =
        Math.max(
          1,
          Math.min(
            99,
            safeNumber(item.quantity)
          )
        );

      const price =
        safeNumber(product.price);

      return {
        product,
        quantity,
        price,
        lineTotal: price * quantity
      };

    })
    .filter(Boolean);
}


/* =========================================================
   22. CART TOTALS
========================================================= */

function getCartSubtotal() {

  return getCartDetails()
    .reduce(
      (total, item) =>
        total + item.lineTotal,
      0
    );
}


function getCartTotal() {

  return (
    getCartSubtotal() +
    (cart.length > 0
      ? DELIVERY_CHARGE
      : 0)
  );
}


/* =========================================================
   23. RENDER CART
========================================================= */

function renderCart() {

  if (!elements.cartItems) {
    return;
  }

  const details =
    getCartDetails();

  const itemCount =
    details.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  /*
    Cart count
  */

  if (elements.cartCount) {
    elements.cartCount.textContent =
      formatNumber(itemCount);
  }

  /*
    Empty cart
  */

  if (details.length === 0) {

    elements.cartItems.innerHTML = `
      <p class="empty-cart-message">
        আপনার কার্ট এখন খালি।
      </p>
    `;

  } else {

    elements.cartItems.innerHTML =
      details
        .map(item => {

          const product =
            item.product;

          return `
            <div
              class="cart-item"
              data-cart-product="${escapeHTML(product.id)}"
            >

              <div class="cart-item-image">

                ${
                  product.imageUrl
                    ? `
                      <img
                        src="${escapeHTML(product.imageUrl)}"
                        alt="${escapeHTML(product.name)}"
                        loading="lazy"
                      >
                    `
                    : `
                      <span>
                        ${escapeHTML(
                          product.emoji || "🛍️"
                      )}
                      </span>
                    `
                }

              </div>

              <div>

                <div class="cart-item-name">
                  ${escapeHTML(product.name)}
                </div>

                <div class="cart-item-price">
                  ${formatPrice(item.lineTotal)}
                </div>

                <div class="cart-item-controls">

                  <button
                    type="button"
                    class="quantity-button"
                    data-quantity-change="-1"
                    data-product-id="${escapeHTML(product.id)}"
                    aria-label="একটি কমান"
                  >
                    −
                  </button>

                  <span class="quantity-value">
                    ${formatNumber(item.quantity)}
                  </span>

                  <button
                    type="button"
                    class="quantity-button"
                    data-quantity-change="1"
                    data-product-id="${escapeHTML(product.id)}"
                    aria-label="একটি বাড়ান"
                  >
                    +
                  </button>

                </div>

              </div>

              <button
                type="button"
                class="remove-cart-item"
                data-remove-product="${escapeHTML(product.id)}"
              >
                মুছুন
              </button>

            </div>
          `;

        })
        .join("");
  }

  /*
    Summary
  */

  const subtotal =
    getCartSubtotal();

  const total =
    getCartTotal();

  if (elements.cartSubtotal) {
    elements.cartSubtotal.textContent =
      formatPrice(subtotal);
  }

  if (elements.deliveryCharge) {
    elements.deliveryCharge.textContent =
      formatPrice(
        details.length > 0
          ? DELIVERY_CHARGE
          : 0
      );
  }

  if (elements.cartTotal) {
    elements.cartTotal.textContent =
      formatPrice(total);
  }

  if (elements.checkoutTotal) {
    elements.checkoutTotal.textContent =
      formatPrice(total);
  }

  /*
    Checkout button
  */

  if (elements.checkoutButton) {
    elements.checkoutButton.disabled =
      details.length === 0;
  }

  /*
    Cart event listeners
  */

  const quantityButtons =
    elements.cartItems.querySelectorAll(
      "[data-quantity-change]"
    );

  quantityButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const productId =
          button.dataset.productId;

        const change =
          Number(
            button.dataset.quantityChange
          );

        changeQuantity(
          productId,
          change
        );
      }
    );

  });

  const removeButtons =
    elements.cartItems.querySelectorAll(
      "[data-remove-product]"
    );

  removeButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        removeFromCart(
          button.dataset.removeProduct
        );
      }
    );

  });
}


/* =========================================================
   24. OPEN CART
========================================================= */

function openCart() {

  if (!elements.cartSection) {
    return;
  }

  elements.cartSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   25. OPEN CHECKOUT
========================================================= */

function openCheckout() {

  if (cart.length === 0) {
    showTemporaryMessage(
      "প্রথমে কার্টে একটি পণ্য যোগ করুন।"
    );

    return;
  }

  if (elements.cartSection) {
    elements.cartSection.style.display =
      "none";
  }

  if (elements.checkoutSection) {
    elements.checkoutSection.classList.add(
      "visible"
    );

    elements.checkoutSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (elements.checkoutTotal) {
    elements.checkoutTotal.textContent =
      formatPrice(getCartTotal());
  }
}


/* =========================================================
   26. CLOSE CHECKOUT
========================================================= */

function closeCheckout() {

  if (elements.checkoutSection) {
    elements.checkoutSection.classList.remove(
      "visible"
    );
  }

  if (elements.cartSection) {
    elements.cartSection.style.display =
      "";
  }

  openCart();
}


/* =========================================================
   27. CLEAR CART
========================================================= */

function clearCart() {

  if (cart.length === 0) {
    return;
  }

  const confirmed =
    window.confirm(
      "আপনি কি পুরো কার্ট খালি করতে চান?"
    );

  if (!confirmed) {
    return;
  }

  cart = [];

  saveCartToStorage();

  renderCart();
}


/* =========================================================
   28. PAYMENT INSTRUCTIONS
========================================================= */

function updatePaymentInstructions() {

  if (!elements.paymentMethod) {
    return;
  }

  const method =
    elements.paymentMethod.value;

  if (!method) {

    if (elements.paymentInstructions) {
      elements.paymentInstructions.hidden =
        true;
    }

    if (elements.transactionGroup) {
      elements.transactionGroup.hidden =
        true;
    }

    if (elements.transactionId) {
      elements.transactionId.required =
        false;
    }

    return;
  }

  let message = "";

  if (method === "bkash") {

    message =
      "bKash নম্বর: 01881555158\n\n" +
      "bKash-এ পেমেন্ট করার পর ট্রানজেকশন আইডি নিচের ঘরে লিখুন।";

  } else if (method === "nagad") {

    message =
      "Nagad নম্বর: 01881555188\n\n" +
      "Nagad-এ পেমেন্ট করার পর ট্রানজেকশন আইডি নিচের ঘরে লিখুন।";

  } else if (method === "cod") {

    message =
      "ক্যাশ অন ডেলিভারি নির্বাচন করা হয়েছে।\n\n" +
      "পণ্য হাতে পাওয়ার সময় ডেলিভারি কর্মীকে টাকা প্রদান করবেন.";
  }

  if (elements.paymentInstructions) {
    elements.paymentInstructions.hidden =
      false;
  }

  if (elements.paymentMessage) {
    elements.paymentMessage.textContent =
      message;
  }

  /*
    Transaction ID শুধু bKash/Nagad-এর জন্য।
  */

  const needsTransaction =
    method === "bkash" ||
    method === "nagad";

  if (elements.transactionGroup) {
    elements.transactionGroup.hidden =
      !needsTransaction;
  }

  if (elements.transactionId) {
    elements.transactionId.required =
      false;
  }
}


/* =========================================================
   29. VALIDATE PHONE
========================================================= */

function isValidBangladeshPhone(phone) {

  const cleanPhone =
    String(phone)
      .replace(/\s+/g, "")
      .replace(/-/g, "");

  return /^01[3-9]\d{8}$/.test(
    cleanPhone
  );
}


/* =========================================================
   30. SHOW ORDER STATUS
========================================================= */

function showOrderStatus(
  message,
  type = "info"
) {

  if (!elements.orderStatus) {
    return;
  }

  elements.orderStatus.textContent =
    message;

  elements.orderStatus.className =
    `order-status show ${type}`;
}

/* =========================================================
   31. TEMPORARY MESSAGE
========================================================= */

let temporaryMessageTimer = null;

function showTemporaryMessage(message) {

  if (temporaryMessageTimer) {
    clearTimeout(
      temporaryMessageTimer
    );
  }

  showOrderStatus(
    message,
    "success"
  );

  temporaryMessageTimer =
    setTimeout(
      () => {

        if (elements.orderStatus) {
          elements.orderStatus.className =
            "order-status";
        }

      },
      2200
    );
}


/* =========================================================
   32. CREATE ORDER OBJECT
========================================================= */

function buildOrderData() {

  const details =
    getCartDetails();

  const customerName =
    elements.customerName.value.trim();

  const customerPhone =
    elements.customerPhone.value
      .trim()
      .replace(/\s+/g, "");

  const customerAddress =
    elements.customerAddress.value.trim();

  const customerNote =
    elements.customerNote.value.trim();

  const paymentMethod =
    elements.paymentMethod.value;

  const transactionId =
    elements.transactionId.value.trim();

  const orderItems =
    details.map(item => ({
      productId: String(
        item.product.id
      ),

      name: String(
        item.product.name
      ),

      quantity: Number(
        item.quantity
      ),

      price: Number(
        item.price
      ),

      lineTotal: Number(
        item.lineTotal
      )
    }));

  return {

    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
      note: customerNote
    },

    payment: {
      method: paymentMethod,
      transactionId:
        transactionId || null
    },

    items: orderItems,

    subtotal: Number(
      getCartSubtotal()
    ),

    deliveryCharge: Number(
      DELIVERY_CHARGE
    ),

    total: Number(
      getCartTotal()
    ),

    status: "pending",

    source: "ShopBD",

    createdAt: new Date().toISOString()
  };
}


/* =========================================================
   33. SAVE ORDER TO FIREBASE
========================================================= */

async function saveOrderToFirebase(
  orderData
) {

  if (!firebaseReady || !db) {
    return {
      success: false,
      reason: "firebase-not-configured"
    };
  }

  try {

    const orderToSave = {
      ...orderData,

      /*
        Firestore server timestamp ব্যবহার করা হবে।
      */

      createdAt:
        serverTimestamp(),

      /*
        Customer order data
      */

      customer: {
        name: orderData.customer.name,
        phone: orderData.customer.phone,
        address: orderData.customer.address,
        note: orderData.customer.note
      },

      payment: {
        method:
          orderData.payment.method,

        transactionId:
          orderData.payment.transactionId
      },

      items:
        orderData.items,

      subtotal:
        orderData.subtotal,

      deliveryCharge:
        orderData.deliveryCharge,

      total:
        orderData.total,

      status:
        "pending",

      source:
        "ShopBD"
    };

    const orderRef =
      await addDoc(
        collection(db, "orders"),
        orderToSave
      );

    return {
      success: true,
      orderId: orderRef.id
    };

  } catch (error) {

    console.error(
      "Order save failed:",
      error
    );

    return {
      success: false,
      reason: "firebase-error",
      error
    };
  }
}


/* =========================================================
   34. SAVE ORDER LOCALLY
=========================================================

   Firebase configured না থাকলে order হারিয়ে যাবে না।
   Browser-এ local backup রাখা হবে।

   IMPORTANT:
   এটি online order system নয়।
   Firebase না থাকলে অন্য ফোনে এই order দেখা যাবে না।
========================================================= */

function saveOrderLocally(
  orderData
) {

  try {

    const key =
      "shopbd_local_orders";

    const oldOrders =
      JSON.parse(
        localStorage.getItem(key) || "[]"
      );

    oldOrders.push({
      ...orderData,
      localOrderId:
        "LOCAL-" +
        Date.now()
    });

    localStorage.setItem(
      key,
      JSON.stringify(oldOrders)
    );

    return true;

  } catch (error) {

    console.error(
      "Local order backup failed:",
      error
    );

    return false;
  }
}


/* =========================================================
   35. SUBMIT ORDER
========================================================= */

async function handleCheckoutSubmit(
  event
) {

  event.preventDefault();

  /*
    Cart check
  */

  if (cart.length === 0) {

    showOrderStatus(
      "আপনার কার্ট খালি।",
      "error"
    );

    return;
  }

  /*
    Browser validation
  */

  if (
    elements.checkoutForm &&
    !elements.checkoutForm.checkValidity()
  ) {

    elements.checkoutForm.reportValidity();

    return;
  }

  /*
    Phone validation
  */

  const phone =
    elements.customerPhone.value
      .trim()
      .replace(/\s+/g, "");

  if (!isValidBangladeshPhone(phone)) {

    showOrderStatus(
      "সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর দিন।",
      "error"
    );

    elements.customerPhone.focus();

    return;
  }

  /*
    Payment validation
  */

  const paymentMethod =
    elements.paymentMethod.value;

  if (!paymentMethod) {

    showOrderStatus(
      "একটি পেমেন্ট পদ্ধতি নির্বাচন করুন।",
      "error"
    );

    elements.paymentMethod.focus();

    return;
  }

  /*
    Order object
  */

  const orderData =
    buildOrderData();

  /*
    Disable submit button
  */

  const originalButtonText =
    elements.placeOrderButton.textContent;

  elements.placeOrderButton.disabled =
    true;

  elements.placeOrderButton.textContent =
    "অর্ডার পাঠানো হচ্ছে...";

  showOrderStatus(
    "আপনার অর্ডার প্রস্তুত করা হচ্ছে...",
    "info"
  );

  /*
    Firebase
  */

  const firebaseResult =
    await saveOrderToFirebase(
      orderData
    );

  /*
    Firebase সফল
  */

  if (firebaseResult.success) {

    showOrderStatus(
      `অর্ডার সফলভাবে পাঠানো হয়েছে। আপনার Order ID: ${firebaseResult.orderId}`,
      "success"
    );

    /*
      Cart clear
    */

    cart = [];

    saveCartToStorage();

    renderCart();

    /*
      Form reset
    */

    elements.checkoutForm.reset();

    updatePaymentInstructions();

    /*
      Button restore
    */

    elements.placeOrderButton.disabled =
      false;

    elements.placeOrderButton.textContent =
      originalButtonText;

    /*
      Scroll to status
    */

    if (elements.orderStatus) {
      elements.orderStatus.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    return;
  }

  /*
    Firebase configured না থাকলে
    local backup রাখবে।
  */

  if (
    firebaseResult.reason ===
    "firebase-not-configured"
  ) {

    saveOrderLocally(
      orderData
    );

    showOrderStatus(
      "Firebase এখনো সেটআপ করা হয়নি। এই ডিভাইসে অর্ডারটি সাময়িকভাবে সংরক্ষণ করা হয়েছে। অনলাইন অর্ডারের জন্য Firebase সেটআপ সম্পূর্ণ করতে হবে।",
      "info"
    );

  } else {

    /*
      Firebase error হলে cart মুছবে না।
      কারণ customer যেন আবার চেষ্টা করতে পারে।
    */

    showOrderStatus(
      "অর্ডার পাঠানো যায়নি। ইন্টারনেট সংযোগ ও Firebase সেটআপ পরীক্ষা করে আবার চেষ্টা করুন।",
      "error"
    );
  }

  elements.placeOrderButton.disabled =
    false;

  elements.placeOrderButton.textContent =
    originalButtonText;
}

/* =========================================================
   36. SEARCH
========================================================= */

function performSearch() {

  searchTerm =
    elements.searchInput
      ? elements.searchInput.value
      : "";

  renderProducts();

  if (elements.productsGrid) {

    elements.productsGrid.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}


/* =========================================================
   37. ENTER KEY SEARCH
========================================================= */

function handleSearchKeydown(event) {

  if (event.key === "Enter") {

    event.preventDefault();

    performSearch();
  }
}


/* =========================================================
   38. CURRENT YEAR
========================================================= */

function setCurrentYear() {

  if (!elements.currentYear) {
    return;
  }

  elements.currentYear.textContent =
    new Date().getFullYear();
}


/* =========================================================
   39. EVENT LISTENERS
========================================================= */

function setupEventListeners() {

  /*
    Cart button
  */

  if (elements.cartToggle) {

    elements.cartToggle.addEventListener(
      "click",
      openCart
    );
  }


  /*
    Search button
  */

  if (elements.searchButton) {

    elements.searchButton.addEventListener(
      "click",
      performSearch
    );
  }


  /*
    Search Enter
  */

  if (elements.searchInput) {

    elements.searchInput.addEventListener(
      "keydown",
      handleSearchKeydown
    );

    elements.searchInput.addEventListener(
      "input",
      () => {

        /*
          Live search
        */

        searchTerm =
          elements.searchInput.value;

        renderProducts();
      }
    );
  }


  /*
    Checkout
  */

  if (elements.checkoutButton) {

    elements.checkoutButton.addEventListener(
      "click",
      openCheckout
    );
  }


  /*
    Close cart
  */

  if (elements.closeCartButton) {

    elements.closeCartButton.addEventListener(
      "click",
      () => {

        if (elements.cartSection) {
          elements.cartSection.style.display =
            "none";
        }

      }
    );
  }


  /*
    Clear cart
  */

  if (elements.clearCartButton) {

    elements.clearCartButton.addEventListener(
      "click",
      clearCart
    );
  }


  /*
    Back to cart
  */

  if (elements.backToCartButton) {

    elements.backToCartButton.addEventListener(
      "click",
      closeCheckout
    );
  }


  /*
    Payment method
  */

  if (elements.paymentMethod) {

    elements.paymentMethod.addEventListener(
      "change",
      updatePaymentInstructions
    );
  }


  /*
    Checkout form
  */

  if (elements.checkoutForm) {

    elements.checkoutForm.addEventListener(
      "submit",
      handleCheckoutSubmit
    );
  }

}


/* =========================================================
   40. CLEAN INVALID CART ITEMS
========================================================= */

function cleanCart() {

  cart =
    cart.filter(item => {

      const product =
        findProduct(item.productId);

      if (!product) {
        return false;
      }

      const quantity =
        safeNumber(item.quantity);

      return quantity > 0;
    });

  saveCartToStorage();
}


/* =========================================================
   41. INITIALIZE APP
========================================================= */

async function initializeShopBD() {

  console.log(
    "ShopBD initializing..."
  );

  /*
    Load saved cart
  */

  loadCartFromStorage();

  /*
    Current year
  */

  setCurrentYear();

  /*
    Event listeners
  */

  setupEventListeners();

  /*
    Products
  */

  await loadProducts();

  /*
    Remove invalid cart items
  */

  cleanCart();

  /*
    Render cart
  */

  renderCart();

  /*
    Payment UI
  */

  updatePaymentInstructions();

  /*
    Firebase status
  */

  if (firebaseReady) {

    console.log(
      "ShopBD: Firebase connected."
    );

  } else {

    console.log(
      "ShopBD: Running in demo mode. Firebase config is not ready."
    );
  }

}


/* =========================================================
   42. START APPLICATION
========================================================= */

initializeShopBD()
  .catch(error => {

    console.error(
      "ShopBD startup error:",
      error
    );

    /*
      App completely crash না করার জন্য
      basic UI restore।
    */

    products = [
      ...DEMO_PRODUCTS
    ];

    renderCategories();
    renderProducts();
    renderCart();

  });