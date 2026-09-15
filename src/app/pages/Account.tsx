import { useEffect } from "react";
import { Outlet, useNavigate, useParams, Link } from "react-router";
import { Inbox, Package, FileText, Heart, GitCompare, CreditCard, Home as HomeIcon } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { useStore } from "../store/store";
import { Button } from "../components/ui";
import { DashLayout, Panel, StatusBadge, EmptyState, Field, inputStyle } from "../components/dash";
import { ProductCard } from "../components/ProductCard";

function useGuard() {
  const { session } = useBackend();
  const nav = useNavigate();
  useEffect(() => { if (!session) nav("/login"); }, [session, nav]);
  return session;
}

export function AccountLayout() {
  const { t, locale } = useI18n();
  const session = useGuard();
  const { db } = useBackend();
  if (!session) return null;
  const unread = db.messages.filter((m) => m.to === session.id && m.scope === "customer" && !m.read).length;
  const links = [
    { to: "/account", label: t("acct.profile") },
    { to: "/account/inbox", label: t("acct.inbox"), badge: unread },
    { to: "/account/requests", label: t("acct.requests") },
    { to: "/account/orders", label: t("acct.orders") },
    { to: "/account/invoices", label: t("acct.invoices") },
    { to: "/account/favorites", label: t("acct.favorites") },
    { to: "/account/compare", label: t("acct.compare") },
    { to: "/account/room-projects", label: t("acct.roomProjects") },
    { to: "/account/subscription", label: t("acct.subscription") },
    { to: "/account/notifications", label: t("acct.notifications") },
    { to: "/account/settings", label: t("acct.settings") },
  ];
  return <DashLayout title={t("acct.title")} links={links}><div lang={locale}><Outlet /></div></DashLayout>;
}

export function AccountProfile() {
  const { session, db } = useBackend();
  const { t } = useI18n();
  const orders = db.orders.filter((o) => o.customerId === session?.id);
  const reqs = db.requests.filter((r) => r.customerId === session?.id);
  const stats = [
    { icon: FileText, label: t("acct.requests"), value: reqs.length },
    { icon: Package, label: t("acct.orders"), value: orders.length },
    { icon: Inbox, label: t("acct.inbox"), value: db.messages.filter((m) => m.to === session?.id).length },
  ];
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-display" style={{ fontSize: "var(--idea-text-xl)", color: "var(--idea-text)" }}>{session?.name}</div>
        <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{session?.email || session?.phone} · {session?.provider}</div>
      </Panel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--idea-space-3)" }}>
        {stats.map((s) => (
          <Panel key={s.label} style={{ textAlign: "center" }}>
            <s.icon size={20} color="var(--idea-gold-bright)" style={{ margin: "0 auto 8px" }} />
            <div className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)" }}>{s.value}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{s.label}</div>
          </Panel>
        ))}
      </div>
    </>
  );
}

export function AccountInbox() {
  const { session, db, api } = useBackend();
  const msgs = db.messages.filter((m) => m.to === session?.id && m.scope === "customer");
  if (!msgs.length) return <EmptyState title="No messages yet" sub="Offers, order and subscription updates appear here." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {msgs.map((m) => (
        <Panel key={m.id} style={{ borderInlineStart: m.read ? undefined : "2px solid var(--idea-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>{m.title}</div>
            {!m.read && <button onClick={() => api.markRead(m.id)} style={{ background: "none", border: "none", color: "var(--idea-gold-bright)", cursor: "pointer", fontSize: "var(--idea-text-xs)" }}>Mark read</button>}
          </div>
          <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{m.body}</div>
          {m.requestId && <Link to={`/account/requests/${m.requestId}/offers`} style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)" }}>View offers →</Link>}
        </Panel>
      ))}
    </div>
  );
}

export function AccountRequests() {
  const { session, db } = useBackend();
  const reqs = db.requests.filter((r) => r.customerId === session?.id);
  if (!reqs.length) return <EmptyState title="No requests yet" sub="Submit a Best-Price request from any product." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {reqs.map((r) => {
        const product = db && r.productId;
        const offers = db.offers.filter((o) => o.requestId === r.id);
        return (
          <Panel key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="idea-display" style={{ color: "var(--idea-text)" }}>{r.quantity} {r.unit} · {r.governorate}</div>
                <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{r.id} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge text={r.status} tone={r.status === "Offer Selected" ? "green" : r.status === "No Offers Received" ? "red" : "gold"} />
                <Link to={`/account/requests/${r.id}/offers`}><Button size="sm" variant="outline">{offers.length} offers</Button></Link>
              </div>
            </div>
            <span style={{ display: "none" }}>{String(product)}</span>
          </Panel>
        );
      })}
    </div>
  );
}

export function AccountRequestOffers() {
  const { requestId } = useParams();
  const { db, api, session } = useBackend();
  const { locale } = useI18n();
  const nav = useNavigate();
  const req = db.requests.find((r) => r.id === requestId);
  const offers = db.offers.filter((o) => o.requestId === requestId);
  const products = useStore().products;
  if (!req) return <EmptyState title="Request not found" />;
  const product = products.find((p) => p.id === req.productId);
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow">Request {req.id}</div>
        <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)", marginTop: 4 }}>{product?.name[locale]} — {req.quantity} {req.unit}</div>
        <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{req.governorate} · {req.destination}</div>
        <div style={{ marginTop: 8 }}><StatusBadge text={req.status} tone={req.acceptedOfferId ? "green" : "gold"} /></div>
        {!offers.length && <Button size="sm" variant="ghost" style={{ marginTop: 12 }} onClick={() => api.seedOffersFor(req.id)}>Simulate supplier offers</Button>}
      </Panel>
      {!offers.length ? <EmptyState title="Awaiting offers" sub="Verified matching suppliers submit private offers here." /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {offers.map((o) => {
            const biz = db.businesses.find((b) => b.id === o.businessId);
            const subtotal = o.unitPrice * o.quantity;
            const total = subtotal + subtotal * o.taxRate + o.shipping;
            const selected = req.acceptedOfferId === o.id;
            return (
              <Panel key={o.id} style={{ border: selected ? "1px solid var(--idea-gold)" : undefined, opacity: o.status === "not-selected" ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div className="idea-display" style={{ color: "var(--idea-text)" }}>{biz?.publicName} <StatusBadge text={biz?.status || ""} tone="green" /></div>
                    <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)", marginTop: 2 }}>★ {biz?.rating.toFixed(1)} · {o.exactProduct ? "Exact product" : "Approved equivalent"} · {o.availability}</div>
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="idea-display" style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-xl)" }}>{total.toLocaleString()} EGP</div>
                    <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{o.unitPrice} EGP/{o.unit} · {o.quantity} {o.unit} · +{o.shipping} shipping · {(o.taxRate * 100).toFixed(0)}% tax</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)", flexWrap: "wrap" }}>
                  <span>Prep {o.prepDays}d</span><span>Delivery {o.deliveryDays}d</span><span>{o.paymentTerms}</span>
                  <span>Expires {new Date(o.expiresAt).toLocaleDateString()}</span>
                </div>
                {!req.acceptedOfferId && (
                  <Button size="sm" style={{ marginTop: 12 }} onClick={() => { const ord = api.acceptOffer(o.id); if (ord) nav("/checkout?order=" + ord.id); }}>Accept & continue to payment</Button>
                )}
                {selected && <div style={{ marginTop: 10 }}><StatusBadge text="Accepted" tone="green" /></div>}
              </Panel>
            );
          })}
          <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>Offers are private. Suppliers cannot see each other's offers. The lowest price is not automatically the best offer — compare delivery, terms and rating. <span style={{ display: "none" }}>{session?.id}</span></p>
        </div>
      )}
    </>
  );
}

export function AccountOrders() {
  const { session, db, api } = useBackend();
  const orders = db.orders.filter((o) => o.customerId === session?.id);
  if (!orders.length) return <EmptyState title="No orders yet" />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {orders.map((o) => (
        <Panel key={o.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="idea-display" style={{ color: "var(--idea-text)" }}>{o.id}</div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{o.total.toLocaleString()} EGP · {new Date(o.createdAt).toLocaleDateString()}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StatusBadge text={o.status} tone={o.status === "Delivered" ? "green" : o.paymentStatus === "Sandbox Failed" ? "red" : "gold"} />
              {o.paymentStatus === "None" && <Link to={`/checkout?order=${o.id}`}><Button size="sm">Pay</Button></Link>}
              {o.paymentStatus === "Sandbox Authorized" && o.status === "Preparing" && <Button size="sm" variant="outline" onClick={() => api.sandboxPay(o.id, true)}>Confirm delivery</Button>}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function AccountInvoices() {
  const { session, db } = useBackend();
  const paid = db.orders.filter((o) => o.customerId === session?.id && o.paymentStatus === "Sandbox Authorized");
  if (!paid.length) return <EmptyState title="No invoices yet" sub="Invoices are generated after a verified payment." />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {paid.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>Invoice INV-{o.id.slice(-6).toUpperCase()}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{o.total.toLocaleString()} EGP · {new Date(o.createdAt).toLocaleDateString()}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.print()}><CreditCard size={14} /> Download</Button>
        </Panel>
      ))}
    </div>
  );
}

export function AccountFavorites() {
  const { favorites, products } = useStore();
  const items = products.filter((p) => favorites.includes(p.id));
  if (!items.length) return <EmptyState title="No favorites yet" />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "var(--idea-space-4)" }}>
      {items.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

export function AccountCompare() {
  const { compare, products } = useStore();
  const { locale } = useI18n();
  const items = products.filter((p) => compare.includes(p.id));
  if (!items.length) return <EmptyState title="Nothing to compare" sub="Add up to 4 products to compare." />;
  const rows: { label: string; get: (p: typeof items[number]) => string }[] = [
    { label: "Model", get: (p) => p.model },
    { label: "Size", get: (p) => p.sizes[0]?.label || "—" },
    { label: "Finish", get: (p) => p.finish || "—" },
    { label: "Color", get: (p) => (p.colors || []).join(", ") || "—" },
    { label: "Usage", get: (p) => (p.usage || []).join(", ") || "—" },
  ];
  return (
    <Panel style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--idea-text)", fontSize: "var(--idea-text-sm)" }}>
        <thead><tr><th /> {items.map((p) => <th key={p.id} style={{ padding: 8, textAlign: "start", color: "var(--idea-gold-bright)" }}>{p.name[locale]}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} style={{ borderTop: "var(--idea-hairline)" }}>
              <td style={{ padding: 8, color: "var(--idea-text-muted)" }}>{r.label}</td>
              {items.map((p) => <td key={p.id} style={{ padding: 8 }}>{r.get(p)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

export function AccountRoomProjects() {
  const { session, db, api } = useBackend();
  const projects = db.roomProjects.filter((p) => p.userId === session?.id);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="idea-display" style={{ color: "var(--idea-text)" }}>Saved projects</div>
        <Link to="/room-designer/new"><Button size="sm"><HomeIcon size={14} /> New project</Button></Link>
      </div>
      {!projects.length ? <EmptyState title="No saved projects" sub="Design a room and save it here." /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {projects.map((p) => (
            <Panel key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div className="idea-display" style={{ color: "var(--idea-text)" }}>{p.name}</div>
                <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{p.surfaces.length} surfaces · {new Date(p.createdAt).toLocaleDateString()}</div></div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/room-designer/project/${p.id}`}><Button size="sm" variant="outline">Open</Button></Link>
                <Button size="sm" variant="ghost" onClick={() => api.deleteRoomProject(p.id)}>Delete</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

export function AccountNotifications() { return <AccountInbox />; }

export function AccountSettings() {
  const { session } = useBackend();
  const { t } = useI18n();
  return (
    <Panel>
      <Field label={t("acct.profile")}><input style={inputStyle} defaultValue={session?.name} /></Field>
      <Field label={t("auth.email")}><input style={inputStyle} defaultValue={session?.email || ""} /></Field>
      <Field label={t("auth.phone")}><input style={inputStyle} defaultValue={session?.phone || ""} /></Field>
      <Button size="sm">{t("common.save")}</Button>
    </Panel>
  );
}

// Re-export the icons import guard usage to avoid unused warnings.
export const _icons = { Inbox, Package, Heart, GitCompare, FileText };
