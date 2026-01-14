/**
 * customer-data.js
 * Source of truth: Supabase (public.customers)
 * Cache: localStorage (a1apsvc-customers)
 *
 * IMPORTANT:
 * - Uses publishable (anon) key ONLY.
 * - Uses the logged-in Supabase access token stored in localStorage
 *   under sb-<projectref>-auth-token (set when you login on dashboard).
 *
 * FIX INCLUDED:
 * - customers.html expects snake_case fields: first_name, last_name, mobile_phone, etc.
 * - This file now returns those exact keys (so names show up again).
 */

const SUPABASE_URL = "https://zzigzylypifjokskehkn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ei0eWX62jrS8MMq7odV4iQ_IW-9yqG6";
const PROJECT_REF = "zzigzylypifjokskehkn";

// Cache keys (keep ONE consistent key)
const CACHE_KEY = "a1apsvc-customers";
const CACHE_TIME_KEY = "a1apsvc-customers-cache-time";

// Pull access token from Supabase auth storage (set by your dashboard login)
function getSupabaseAccessToken() {
  const key = `sb-${PROJECT_REF}-auth-token`;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);

    // Supabase can store in a few shapes depending on version
    return (
      obj?.access_token ||
      obj?.currentSession?.access_token ||
      obj?.session?.access_token ||
      obj?.data?.session?.access_token ||
      null
    );
  } catch {
    return null;
  }
}

function buildAddress(r) {
  const parts = [
    r.street1,
    r.street2,
    [r.city, r.state, r.zip].filter(Boolean).join(" "),
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * ✅ IMPORTANT:
 * customers.html is using:
 *  c.first_name, c.last_name, c.mobile_phone, etc.
 * So we must return that exact shape (snake_case).
 */
function mapRowToUI(r) {
  return {
    id: r.id, // UUID string

    // ✅ Names (snake_case)
    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",

    company: r.company ?? "",

    email: r.email ?? "",
    mobile_phone: r.mobile_phone ?? "",
    home_phone: r.home_phone ?? "",
    work_phone: r.work_phone ?? "",

    // customers.html uses c.address / c.city / c.state / c.zip
    address: buildAddress(r),
    city: r.city ?? "",
    state: r.state ?? "",
    zip: r.zip ?? "",

    // Optional extras (safe defaults)
    tags: r.tags ?? [],
    notes: r.notes ?? "",

    created_at: r.created_at ?? new Date().toISOString(),
    updated_at: r.updated_at ?? null,
  };
}

async function supabaseFetchJson(url, method = "GET", body = null) {
  const accessToken = getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error(
      "Not logged in. Please login on the Dashboard first, then open Customers again."
    );
  }

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const resp = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!resp.ok) {
    const msg = await resp.text();
    throw new Error(`Supabase error ${resp.status}: ${msg}`);
  }

  // Some endpoints return empty body; handle safely
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Load customers from Supabase, with a 6-hour local cache fallback.
 */
async function initializeCustomerData() {
  // Migrate any older legacy key if it exists
  const legacy = localStorage.getItem("a1apsvc_customers");
  if (legacy && !localStorage.getItem(CACHE_KEY)) {
    localStorage.setItem(CACHE_KEY, legacy);
  }

  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY) || "0", 10);
  const maxAgeMs = 6 * 60 * 60 * 1000; // 6 hours

  if (cached && cachedTime && Date.now() - cachedTime < maxAgeMs) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore cache parse errors
    }
  }

  const url =
    `${SUPABASE_URL}/rest/v1/customers` +
    `?select=id,first_name,last_name,company,email,mobile_phone,home_phone,work_phone,street1,street2,city,state,zip,created_at,updated_at,tags,notes` +
    `&order=created_at.desc` +
    `&limit=5000`;

  const rows = await supabaseFetchJson(url, "GET");
  const customers = (rows || []).map(mapRowToUI);

  localStorage.setItem(CACHE_KEY, JSON.stringify(customers));
  localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  return customers;
}

/**
 * CRUD helpers (so Add/Edit/Delete can write to Supabase)
 * NOTE: Keep accepting camelCase input (from forms),
 * but always return snake_case objects to the UI.
 */
async function createCustomerInSupabase(c) {
  const payload = {
    first_name: c.firstName ?? c.first_name ?? "",
    last_name: c.lastName ?? c.last_name ?? "",
    email: c.email ?? null,
    mobile_phone: c.mobilePhone ?? c.mobile_phone ?? null,
    home_phone: c.homePhone ?? c.home_phone ?? null,
    work_phone: c.workPhone ?? c.work_phone ?? null,
    company: c.company ?? null,

    // simple: store whatever they typed into street1
    street1: (c.address ?? c.street1 ?? "").trim() || null,
    street2: (c.street2 ?? "").trim() || null,
    city: (c.city ?? "").trim() || null,
    state: (c.state ?? "").trim() || null,
    zip: (c.zip ?? "").trim() || null,

    tags: c.tags ?? null,
    notes: c.notes ?? null,
  };

  const url = `${SUPABASE_URL}/rest/v1/customers`;
  const rows = await supabaseFetchJson(url, "POST", payload);
  return rows?.[0] ? mapRowToUI(rows[0]) : null;
}

async function updateCustomerInSupabase(id, c) {
  const payload = {
    first_name: c.firstName ?? c.first_name ?? "",
    last_name: c.lastName ?? c.last_name ?? "",
    email: c.email ?? null,
    mobile_phone: c.mobilePhone ?? c.mobile_phone ?? null,
    home_phone: c.homePhone ?? c.home_phone ?? null,
    work_phone: c.workPhone ?? c.work_phone ?? null,
    company: c.company ?? null,

    street1: (c.address ?? c.street1 ?? "").trim() || null,
    street2: (c.street2 ?? "").trim() || null,
    city: (c.city ?? "").trim() || null,
    state: (c.state ?? "").trim() || null,
    zip: (c.zip ?? "").trim() || null,

    tags: c.tags ?? null,
    notes: c.notes ?? null,

    updated_at: new Date().toISOString(),
  };

  const url = `${SUPABASE_URL}/rest/v1/customers?id=eq.${encodeURIComponent(
    id
  )}`;
  const rows = await supabaseFetchJson(url, "PATCH", payload);
  return rows?.[0] ? mapRowToUI(rows[0]) : null;
}

async function deleteCustomerInSupabase(id) {
  const url = `${SUPABASE_URL}/rest/v1/customers?id=eq.${encodeURIComponent(
    id
  )}`;
  await supabaseFetchJson(url, "DELETE");
  return true;
}
