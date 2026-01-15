/**
 * customer-data.js
 * Source of truth: Supabase (public.customers)
 * Cache: localStorage (a1apsvc-customers)
 *
 * GitHub Pages compatible:
 * - Supabase JS auth client (magic link login)
 * - REST fetch uses Bearer access token
 *
 * UI expects snake_case keys.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zzigzylypifjokskehkn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ei0eWX62jrS8MMq7odV4iQ_IW-9yqG6";
const PROJECT_REF = "zzigzylypifjokskehkn";

const CACHE_KEY = "a1apsvc-customers";
const CACHE_TIME_KEY = "a1apsvc-customers-cache-time";

// Create client and expose globally
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

async function getSupabaseAccessToken() {
  // Preferred: Supabase JS auth session (GitHub Pages login)
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) {
      const token = data?.session?.access_token;
      if (token) return token;
    }
  } catch {}

  // Fallback: legacy key if you ever used it
  const legacyKey = `sb-${PROJECT_REF}-auth-token`;
  const raw = localStorage.getItem(legacyKey);
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
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

function mapRowToUI(r) {
  return {
    id: r.id,

    first_name: r.first_name ?? "",
    last_name: r.last_name ?? "",
    company: r.company ?? "",

    email: r.email ?? "",
    mobile_phone: r.mobile_phone ?? "",
    home_phone: r.home_phone ?? "",
    work_phone: r.work_phone ?? "",

    address: buildAddress(r),
    city: r.city ?? "",
    state: r.state ?? "",
    zip: r.zip ?? "",

    // IMPORTANT:
    // Your table does NOT have tags/notes right now.
    // We provide safe defaults so the UI won't crash later.
    tags: [],
    notes: "",

    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,
  };
}

async function supabaseFetchJson(url, method = "GET", body = null) {
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) {
    throw new Error("Not logged in. Click Login on Customers page.");
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

  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Load customers from Supabase, with a 6-hour cache fallback.
 */
async function initializeCustomerData() {
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY) || "0", 10);
  const maxAgeMs = 6 * 60 * 60 * 1000;

  if (cached && cachedTime && Date.now() - cachedTime < maxAgeMs) {
    try {
      return JSON.parse(cached);
    } catch {}
  }

  // ✅ Removed tags, notes from select list (they do not exist in your table)
  const url =
    `${SUPABASE_URL}/rest/v1/customers` +
    `?select=id,first_name,last_name,company,email,mobile_phone,home_phone,work_phone,street1,street2,city,state,zip,created_at,updated_at` +
    `&order=created_at.desc` +
    `&limit=5000`;

  const rows = await supabaseFetchJson(url, "GET");
  const customers = (rows || []).map(mapRowToUI);

  localStorage.setItem(CACHE_KEY, JSON.stringify(customers));
  localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  return customers;
}

async function createCustomerInSupabase(c) {
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
  };

  const url = `${SUPABASE_URL}/rest/v1/customers`;
  const rows = await supabaseFetchJson(url, "POST", payload);
  return rows?.[0] ? mapRowToUI(rows[0]) : null;
}

async function updateCustomerInSupabase(id, c) {
  const payload = {
    first_name: c.firstName || "",
    last_name: c.lastName || "",
    email: c.email || null,
    mobile_phone: c.mobilePhone || null,
    home_phone: c.homePhone || null,
    work_phone: c.workPhone || null,
    company: c.company || null,
    street1: (c.address || "").trim() || null,
  };

  const url = `${SUPABASE_URL}/rest/v1/customers?id=eq.${encodeURIComponent(id)}`;
  const rows = await supabaseFetchJson(url, "PATCH", payload);
  return rows?.[0] ? mapRowToUI(rows[0]) : null;
}

async function deleteCustomerInSupabase(id) {
  const url = `${SUPABASE_URL}/rest/v1/customers?id=eq.${encodeURIComponent(id)}`;
  await supabaseFetchJson(url, "DELETE");
  return true;
}

// Expose functions globally for pages
window.initializeCustomerData = initializeCustomerData;
window.createCustomerInSupabase = createCustomerInSupabase;
window.updateCustomerInSupabase = updateCustomerInSupabase;
window.deleteCustomerInSupabase = deleteCustomerInSupabase;
