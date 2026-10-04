const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalDev
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
  : '/api';

function getToken(): string | null {
  return localStorage.getItem('doblee_token');
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || `Error ${res.status}`);
  }
  return res.json();
}

// ── AUTH ────────────────────────────────────────────────────────────────────

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handleResponse<{ token: string; user: { id: string; email: string; name: string; role: string; branchId?: string } }>(res);
  localStorage.setItem('doblee_token', data.token);
  return data;
}

export function apiLogout() {
  localStorage.removeItem('doblee_token');
}

// ── PRODUCTS ────────────────────────────────────────────────────────────────

export async function apiGetProducts(branchId?: string) {
  const query = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/products${query}`);
  return handleResponse<any[]>(res);
}

export async function apiCreateProduct(data: any) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiUpdateProduct(id: string, data: any) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiDeleteProduct(id: string) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<{ success: boolean }>(res);
}

// ── TOPPINGS ────────────────────────────────────────────────────────────────

export async function apiGetToppings(branchId?: string) {
  const query = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/toppings${query}`);
  return handleResponse<any[]>(res);
}

export async function apiCreateTopping(data: any) {
  const res = await fetch(`${API_URL}/toppings`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiUpdateTopping(id: string, data: any) {
  const res = await fetch(`${API_URL}/toppings/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiDeleteTopping(id: string) {
  const res = await fetch(`${API_URL}/toppings/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<{ success: boolean }>(res);
}

// ── ORDERS ──────────────────────────────────────────────────────────────────

export async function apiGetOrders(branchId?: string) {
  const query = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/orders${query}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}

export async function apiCreateOrder(data: any) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiUpdateOrderStatus(id: string, status: string) {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse<any>(res);
}

export async function apiUpdateOrder(id: string, updates: any) {
  const res = await fetch(`${API_URL}/orders/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(updates),
  });
  return handleResponse<any>(res);
}
// -- USERS -------------------------------------------------------------------

export async function apiGetUsers() {
  const res = await fetch(`${API_URL}/users`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}

export async function apiCreateUser(data: any) {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiUpdateUser(id: string, data: any) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiDeleteUser(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<{ success: boolean }>(res);
}

// ── BRANCHES ─────────────────────────────────────────────────────────────────

export async function apiGetBranches() {
  const res = await fetch(`${API_URL}/branches`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}

export async function apiCreateBranch(data: any) {
  const res = await fetch(`${API_URL}/branches`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiUpdateBranch(id: string, data: any) {
  const res = await fetch(`${API_URL}/branches/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<any>(res);
}

export async function apiDeleteBranch(id: string) {
  const res = await fetch(`${API_URL}/branches/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse<{ success: boolean }>(res);
}

// ── STAFF ─────────────────────────────────────────────────────────────────────

export async function apiGetStaff(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/staff${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateStaff(data: any) {
  const res = await fetch(`${API_URL}/staff`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiUpdateStaff(id: string, data: any) {
  const res = await fetch(`${API_URL}/staff/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteStaff(id: string) {
  const res = await fetch(`${API_URL}/staff/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────

export async function apiGetCustomers(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/customers${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateCustomer(data: any) {
  const res = await fetch(`${API_URL}/customers`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiUpdateCustomer(id: string, data: any) {
  const res = await fetch(`${API_URL}/customers/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteCustomer(id: string) {
  const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── TABLES ─────────────────────────────────────────────────────────────────────

export async function apiGetTables(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/tables${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateTable(data: any) {
  const res = await fetch(`${API_URL}/tables`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiUpdateTable(id: string, data: any) {
  const res = await fetch(`${API_URL}/tables/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteTable(id: string) {
  const res = await fetch(`${API_URL}/tables/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── EXPENSES ─────────────────────────────────────────────────────────────────

export async function apiGetExpenses(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/expenses${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateExpense(data: any) {
  const res = await fetch(`${API_URL}/expenses`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteExpense(id: string) {
  const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── INVENTORY ─────────────────────────────────────────────────────────────────

export async function apiGetInventory(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/inventory${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateInventoryItem(data: any) {
  const res = await fetch(`${API_URL}/inventory`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiUpdateInventoryItem(id: string, data: any) {
  const res = await fetch(`${API_URL}/inventory/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteInventoryItem(id: string) {
  const res = await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── REWARDS ─────────────────────────────────────────────────────────────────

export async function apiGetRewards(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/rewards${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateReward(data: any) {
  const res = await fetch(`${API_URL}/rewards`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiUpdateReward(id: string, data: any) {
  const res = await fetch(`${API_URL}/rewards/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteReward(id: string) {
  const res = await fetch(`${API_URL}/rewards/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── FLAVORS ─────────────────────────────────────────────────────────────────

export async function apiGetFlavors(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/flavors${q}`, { headers: authHeaders() });
  return handleResponse<any[]>(res);
}
export async function apiCreateFlavor(data: any) {
  const res = await fetch(`${API_URL}/flavors`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiUpdateFlavor(id: string, data: any) {
  const res = await fetch(`${API_URL}/flavors/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiDeleteFlavor(id: string) {
  const res = await fetch(`${API_URL}/flavors/${id}`, { method: 'DELETE', headers: authHeaders() });
  return handleResponse<{ success: boolean }>(res);
}

// ── CASH SHIFT ───────────────────────────────────────────────────────────────

export async function apiGetActiveCashShift(branchId?: string) {
  const q = branchId ? `?branchId=${branchId}` : '';
  const res = await fetch(`${API_URL}/cashshift/active${q}`, { headers: authHeaders() });
  return handleResponse<any>(res);
}
export async function apiOpenCashShift(data: any) {
  const res = await fetch(`${API_URL}/cashshift/open`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}
export async function apiCloseCashShift(data: any) {
  const res = await fetch(`${API_URL}/cashshift/close`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) });
  return handleResponse<any>(res);
}


