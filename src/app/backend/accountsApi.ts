export interface AccountSnapshot { user: any | null; company: any | null; membership: any | null; csrf: string; }
const endpoint = `${import.meta.env.BASE_URL}api/accounts.php`;
let csrf = '', latest: AccountSnapshot | null = null;
let pendingSession: Promise<any> | null = null;
export function currentAccount() { return latest; }
export async function accountRequest(action: string, data?: Record<string, any> | FormData): Promise<any> {
  // Share the bootstrap request so a slow anonymous session cannot replace the
  // cookie or account state returned by a completed sign-in.
  if (action === 'session' && !data) {
    if (!pendingSession) pendingSession = sendAccountRequest(action).finally(() => { pendingSession = null; });
    return pendingSession;
  }
  if (data && (!csrf || pendingSession)) await accountRequest('session');
  return sendAccountRequest(action, data);
}
async function sendAccountRequest(action: string, data?: Record<string, any> | FormData): Promise<any> {
  const multipart = data instanceof FormData;
  const response = await fetch(`${endpoint}?action=${encodeURIComponent(action)}`, { method: data ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
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
