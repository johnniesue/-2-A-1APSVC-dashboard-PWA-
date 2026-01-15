/**
 * customer-data.js (GitHub Pages friendly)
 * - Uses Supabase JS v2 for auth (magic link / session storage)
 * - Uses REST API for CRUD with the logged-in user's access token
 *
 * UI shape returned: snake_case fields:
 *   first_name, last_name, email, mobile_phone, home_phone, work_phone,
 *   street1, street2, city, state, zip, address (computed)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zzigzylypifjokskehkn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ei0eWX62jrS8MMq7odV4iQ_IW-9yqG6";

// Cache keys
const CACHE_KEY = "a1apsvc-customers";
const CACHE_TIME_KEY = "a1apsvc-customers-cache-time";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabase = supabase;

// -------------------- Helpers --------------------

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

    street1: r.street1 ?? "",
    street2: r.street2 ?? "",
    city: r.city ?? "",
    state: r.state ?? "",
    zip: r.zip ?? "",

    // convenience for UI display/search
    address: buildAddress(r),

    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null,
  };
}

async function getAccessTokenOrThrow() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;

  const token = data?.session?.access_token;
  if (!token) throw new Error("Not logged in. Click Login first.");
  return token;
}

async function supabaseFetchJson(pathWithQuery, method = "GET", body = null) {
  const token = await getAccessTokenOrThrow();

  const resp = await fetch(`${SUPABASE_URL}${pathWithQuery}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : null,
  });

  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Supabase error ${resp.status}: ${text}`);
  }

  return text ? JSON.parse(text) : null;
}

// -------------------- Public API --------------------

async function initializeCustomerData() {
  // 6 hour cache
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY) || "0", 10);
  const maxAgeMs = 6 * 60 * 60 * 1000;

  if (cached && cachedTime && Date.now() - cachedTime < maxAgeMs) {
    try {
      return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  // IMPORTANT: only select columns that exist in your schema
  const rows = await supabaseFetchJson(
    "/rest/v1/customers" +
      "?select=id,first_name,last_name,company,email,mobile_phone,home_phone,work_phone,street1,street2,city,state,zip,created_at,updated_at" +
      "&order=created_at.desc" +
      "&limit=5000"
  );

  const customers = (rows || []).map(mapRowToUI);

  localStorage.setItem(CACHE_KEY, JSON.stringify(customers));
  localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  return customers;
}

async function createCustomerInSupabase(c) {
  const payload = {
    first_name: (c.firstName ?? c.first_name ?? "").trim(),
    last_name: (c.lastName ?? c.last_name ?? "").trim(),
    email: (c.email ?? "").trim() || null,
    mobile_phone: (c.mobilePhone ?? c.mobile_phone ?? "").trim() || null,
    home_phone: (c.homePhone ?? c.home_phone ?? "").trim() || null,
    work_phone: (c.workPhone ?? c.work_phone ?? "").trim() || null,
    company: (c.company ?? "").trim() || null,

    street1: (c.street1 ?? c.address ?? "").trim() || null,
    street2: (c.street2 ?? "").trim() || null,
    city: (c.city ?? "").trim() || null,
    state: (c.state ?? "").trim() || null,
    zip: (c.zip ?? "").trim() || null,
  };

  const rows = await supabaseFetchJson("/rest/v1/customers", "POST", payload);
  return rows?.[0] ? mapRowToUI(rows[0]) : null;
}

async function updateCustomerInSupabase(id, c) {
  // NOTE: customer.html currently sends { address } as a single line.
  // We'll store that into street1 and clear street2 unless you later split it out.
  const payload = {
    first_name: (c.firstName ?? c.first_name ?? "").trim(),
    last_name: (c.lastName ?? c.last_name ?? "").trim(),
    email: (c.email ?? "").trim() || null,
    mobile_phone: (c.mobilePhone ?? c.mobile_phone ?? "").trim() || null,
    home_phone: (c.homePhone ?? c.home_phone ?? "").trim() || null,
    work_phone: (c.workPhone ?? c.work_phone ?? "").trim() || null,
    company: (c.company ?? "").trim() || null,

    street1: (c.street1 ?? c.address ?? "").trim() || null,
    street2: (c.street2 ?? "").trim() || null,
    city: (c.city ?? "").trim() || null,
    state: (c.state ?? "").trim() || null,
    zip: (c.zip ?? "").trim() || null,
  };

  const rows = await supabaseFetchJson(
    `/rest/v1/customers?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    payload
  );

  // clear cache so list refreshes next load
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);

  return rows?.[0] ? mapRowToUI(rows[0]) : null;
}

async function deleteCustomerInSupabase(id) {
  await supabaseFetchJson(
    `/rest/v1/customers?id=eq.${encodeURIComponent(id)}`,
    "DELETE"
  );

  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIME_KEY);

  return true;
}

// expose for pages
window.initializeCustomerData = initializeCustomerData;
window.createCustomerInSupabase = createCustomerInSupabase;
window.updateCustomerInSupabase = updateCustomerInSupabase;
window.deleteCustomerInSupabase = deleteCustomerInSupabase;

