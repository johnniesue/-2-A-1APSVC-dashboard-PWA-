// customers.js (Option A - static JSON on GitHub Pages)

const DATA_URL = "./data/customers.json"; // ✅ correct for GitHub Pages in a repo subfolder

const els = {
  q: document.getElementById("q"),
  msg: document.getElementById("msg"),
  grid: document.getElementById("grid"),
  count: document.getElementById("count"),
  shown: document.getElementById("shown"),
};

let allCustomers = [];

function safe(v) {
  return (v ?? "").toString().trim();
}

function normalize(s) {
  return safe(s).toLowerCase();
}

function customerText(c) {
  // Try common fields; your JSON may vary depending on export
  const name =
    safe(c.name) ||
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
    safe(c.fullName);

  const phone = safe(c.phone) || safe(c.mobile) || safe(c.phoneNumber);
  const email = safe(c.email);
  const address =
    safe(c.address) ||
    safe(c.street) ||
    [c.address1, c.address2].filter(Boolean).join(" ").trim();

  const city = safe(c.city);
  const state = safe(c.state);
  const zip = safe(c.zip) || safe(c.postalCode);

  return normalize([name, phone, email, address, city, state, zip].join(" "));
}

function render(customers) {
  els.grid.innerHTML = "";

  customers.forEach((c) => {
    const name =
      safe(c.name) ||
      [c.firstName, c.lastName].filter(Boolean).join(" ").trim() ||
      safe(c.fullName) ||
      "Unnamed Customer";

    const phone = safe(c.phone) || safe(c.mobile) || safe(c.phoneNumber) || "—";
    const email = safe(c.email) || "—";

    const street =
      safe(c.address) ||
      safe(c.street) ||
      safe(c.address1) ||
      "—";

    const city = safe(c.city) || "—";
    const state = safe(c.state) || "—";
    const zip = safe(c.zip) || safe(c.postalCode) || "—";

    const tags = [];
    if (!safe(c.email)) tags.push("Missing email");
    if (!safe(c.phone) && !safe(c.mobile) && !safe(c.phoneNumber)) tags.push("Missing phone");
    if (street === "—") tags.push("Missing address");

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p class="name">${escapeHtml(name)}</p>
      <p class="line"><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p class="line"><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p class="line"><strong>Address:</strong> ${escapeHtml(street)}</p>
      <p class="line"><strong>City/State/ZIP:</strong> ${escapeHtml(city)}, ${escapeHtml(state)} ${escapeHtml(zip)}</p>
      ${tags.length ? `<div class="tagrow">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
    `;
    els.grid.appendChild(card);
  });

  els.shown.textContent = String(customers.length);
}

function escapeHtml(str) {
  return safe(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(message) {
  els.msg.style.display = "block";
  els.msg.textContent = message;
}

function hideError() {
  els.msg.style.display = "none";
  els.msg.textContent = "";
}

function applySearch() {
  const q = normalize(els.q.value);
  if (!q) {
    render(allCustomers);
    return;
  }
  const filtered = allCustomers.filter((c) => customerText(c).includes(q));
  render(filtered);
}

async function loadCustomers() {
  hideError();

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const data = await res.json();

    // Accept either: [ ...customers ] OR { customers: [ ... ] }
    allCustomers = Array.isArray(data) ? data : (data.customers || []);

    els.count.textContent = String(allCustomers.length);
    render(allCustomers);

  } catch (err) {
    console.error(err);
    showError(
      `Could not load customer data. Confirm this file exists and is reachable:\n${DATA_URL}\n\nError: ${err.message}`
    );
  }
}

els.q.addEventListener("input", applySearch);

loadCustomers();
