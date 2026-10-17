export interface AccountSnapshot { user: any | null; company: any | null; membership: any | null; csrf: string; }
const endpoint = `${import.meta.env.BASE_URL}api/accounts.php`;
let csrf = '', latest: AccountSnapshot | null = null;
export function currentAccount() { return latest; }
export async function accountRequest(action: string, data?: Record<string, any> | FormData): Promise<any> {
  if (data && !csrf) await accountRequest('session');
  const multipart = data instanceof FormData;
  const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, { method: data ? 'POST' : 'GET', credentials: 'same-origin',
    headers: data ? { 'X-CSRF-Token': csrf, ...(multipart ? {} : { 'Content-Type': 'application/json' }) } : {},
    body: data ? multipart ? data : JSON.stringify(data) : undefined,
  });
  let payload: any; try { payload = await response.json(); } catch { throw new Error('ACCOUNTS_UNAVAILABLE'); }
  if (!response.ok) throw new Error(payload.error || 'ACCOUNTS_UNAVAILABLE');
  if (payload.csrf) csrf = payload.csrf;
  if (Object.prototype.hasOwnProperty.call(payload, 'user')) { latest = payload; window.dispatchEvent(new Event('idea-account-change')); }
  return payload;
}
export async function generationAccess(): Promise<string> {
  const data: AccountSnapshot = await accountRequest('session');
  if (!data.user) throw new Error('AUTH_REQUIRED');
  if (data.user.role !== 'buyer' || data.company) throw new Error('CUSTOMER_ONLY');
  return data.csrf;
}
