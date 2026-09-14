const ERP_BASE = process.env.NEXT_PUBLIC_ERP_API_URL?.replace(/\/$/, "") ?? "";

const TOKEN_KEY = "dorst-partner-token";
const REFRESH_KEY = "dorst-partner-refresh";

export type PartnerProduct = {
  id: string;
  name: string;
  style: string | null;
  volume_unit: string;
  unit_price_eur_cents: number;
  unit_price_eur: number;
  description: string | null;
  image_url: string | null;
};

export type RegistryDraft = {
  eik: string;
  legal_name: string;
  latin_name: string | null;
  billing_address: {
    line1: string;
    line2?: string | null;
    city: string;
    postal_code: string;
    country: string;
  } | null;
  vat_number: string | null;
  vat_registered?: boolean;
  representative_name?: string | null;
  owner_name?: string | null;
  registry_url?: string | null;
  email: string;
};

export function getPartnerToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setPartnerSession(accessToken: string, refreshToken?: string) {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) sessionStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearPartnerSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

async function partnerFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  if (!ERP_BASE) {
    throw new Error("NEXT_PUBLIC_ERP_API_URL is not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = getPartnerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${ERP_BASE}/api/partner${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    throw new Error(
      `Cannot reach ERP at ${ERP_BASE} (${detail}). Check NEXT_PUBLIC_ERP_API_URL and that the ERP is running on that port.`
    );
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }

  return body as T;
}

export function volumeUnitLabel(unit: string): string {
  const map: Record<string, string> = {
    bottle_330ml: "330ml can",
    bottle_500ml: "500ml can",
    can_500ml: "500ml can",
    keg_30l: "30L keg",
    keg_50l: "50L keg",
    keg_20l: "20L keg",
    hl: "hL",
    l: "L",
  };
  return map[unit] ?? unit;
}

/** Partner order catalog sections (stable order). */
export const PARTNER_CATALOG_GROUPS = ["Kegs", "Cans / bottles"] as const;
export type PartnerCatalogGroup = (typeof PARTNER_CATALOG_GROUPS)[number];

/**
 * Map commercial volume units (and common legacy values) to partner sections.
 * Services / unknown packs return null and should be hidden from the catalog.
 */
export function productGroup(
  unit: string,
  name = ""
): PartnerCatalogGroup | null {
  const u = (unit ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();

  if (u.includes("keg") || u === "hl" || /\bkeg\b/.test(n)) return "Kegs";
  if (u.includes("can") || u.includes("bottle")) return "Cans / bottles";
  return null;
}

/** Partner-facing name/price overrides (no DB writes). */
function applyPartnerCatalogDisplay(product: PartnerProduct): PartnerProduct {
  const n = product.name.toLowerCase();
  if (!(n.includes("import beer") && n.includes("white label"))) {
    return product;
  }
  return {
    ...product,
    name: "White label - 500ml can",
    unit_price_eur_cents: 250,
    unit_price_eur: 2.5,
  };
}

export async function registerLookup(eik: string, email: string) {
  return partnerFetch<{ status: string; draft?: RegistryDraft; company_name?: string }>(
    "/register/lookup",
    { method: "POST", body: JSON.stringify({ eik, email }) },
    false
  );
}

export async function registerConfirm(payload: Record<string, unknown>) {
  return partnerFetch<{ status: string; company_name?: string }>(
    "/register/confirm",
    { method: "POST", body: JSON.stringify(payload) },
    false
  );
}

export async function partnerLogin(eik: string, password: string) {
  return partnerFetch<{
    access_token: string;
    refresh_token: string;
    client: { id: string; name: string; eik: string | null };
  }>("/login", { method: "POST", body: JSON.stringify({ eik, password }) }, false);
}

export async function resendPartnerPassword(eik: string, email: string) {
  return partnerFetch<{ status: string }>(
    "/password/resend",
    { method: "POST", body: JSON.stringify({ eik, email }) },
    false
  );
}

export type PartnerOrderSummary = {
  id: string;
  order_number: string;
  status: string;
  total_eur_cents: number;
  created_at: string;
  invoices: Array<{ id: string; invoice_number: number | string; status: string }> | null;
};

export type PartnerInvoiceSummary = {
  id: string;
  invoice_number: number | string;
  invoice_date: string | null;
  due_date: string | null;
  status: string;
  total_eur_cents: number;
  drive_file_url: string | null;
  order_id: string | null;
};

export type PartnerOrderDetail = {
  id: string;
  order_number: string;
  status: string;
  delivery_address: Record<string, string> | null;
  subtotal_eur_cents: number;
  vat_eur_cents: number;
  total_eur_cents: number;
  created_at: string;
  order_lines: Array<{
    id: string;
    quantity: number;
    unit_price_eur_cents: number;
    line_total_eur_cents: number;
    products: { name: string; volume_unit: string } | null;
  }>;
  invoices: Array<{
    id: string;
    invoice_number: number | string;
    status: string;
    drive_file_url: string | null;
  }> | null;
};

export async function fetchPartnerOrders() {
  return partnerFetch<{ orders: PartnerOrderSummary[] }>("/orders");
}

export async function fetchPartnerOrder(id: string) {
  return partnerFetch<{ order: PartnerOrderDetail }>(`/orders/${id}`);
}

export async function fetchPartnerInvoices() {
  return partnerFetch<{ invoices: PartnerInvoiceSummary[] }>("/invoices");
}

export async function fetchPartnerMe() {
  return partnerFetch<{
    name: string;
    eik: string | null;
    maps_url: string | null;
    delivery_address: Record<string, string> | null;
  }>("/me");
}

export async function fetchPartnerProducts() {
  const data = await partnerFetch<{ products: PartnerProduct[] }>("/products");
  return {
    products: data.products.map(applyPartnerCatalogDisplay),
  };
}

export async function checkAvailability(productId: string, quantity: number) {
  return partnerFetch<{
    product_id: string;
    requested: number;
    available: number;
    adjusted_quantity: number;
    limited: boolean;
    out_of_stock: boolean;
  }>("/availability/check", {
    method: "POST",
    body: JSON.stringify({ product_id: productId, quantity }),
  });
}

export async function validateDiscount(code: string, subtotalEurCents: number) {
  return partnerFetch<{
    discount_eur_cents: number;
    total_eur_cents: number;
    vat_eur_cents: number;
  }>("/discount/validate", {
    method: "POST",
    body: JSON.stringify({ code, subtotal_eur_cents: subtotalEurCents }),
  });
}

export async function placePartnerOrder(payload: {
  lines: Array<{ product_id: string; quantity: number }>;
  discount_code?: string;
  payment_method: "bank_transfer" | "cash";
  confirm_delivery_address: true;
}) {
  return partnerFetch<{
    order: { id: string; order_number: string };
    invoice: { id: string; invoice_number: number | string };
    pricing: { total_eur_cents: number };
    adjustments: Array<{ product_id: string; limited: boolean; adjusted_quantity: number }>;
  }>("/orders", { method: "POST", body: JSON.stringify(payload) });
}

export async function downloadInvoicePdf(invoiceId: string) {
  if (!ERP_BASE) throw new Error("NEXT_PUBLIC_ERP_API_URL is not configured");
  const token = getPartnerToken();
  const res = await fetch(`${ERP_BASE}/api/partner/invoices/${invoiceId}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? "Download failed");
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/pdf")) {
    const blob = await res.blob();
    return { type: "pdf" as const, blob };
  }

  const json = (await res.json()) as { drive_file_url?: string };
  return { type: "url" as const, url: json.drive_file_url };
}
