import { useUiText as useLocaleText } from "../i18n/useUiText";
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
  const uiText = useLocaleText();

  const { t, locale } = useI18n();
  const session = useGuard();
  const { db } = useBackend();
  if (!session) return null;
  const unread = db.messages.filter((m) => m.to === session.id && m.scope === "customer" && !m.read).length;
  const links = [
    { to: "/account", label: t("acct.profile") },
    { to: "/account/inbox", label: t("acct.inbox"), badge: unread },
    { to: "/account/outbox", label: locale === "ar" ? "الصادر" : "Sent" },
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
  return <DashLayout title={uiText(t("acct.title"))} links={links}><div lang={locale}><Outlet /></div></DashLayout>;
}

export function AccountProfile() {
  const uiText = useLocaleText();

  const { session, db, recordsError } = useBackend();
  const { t } = useI18n();
  if(recordsError)return <Panel><p role="alert">{uiText('Could not load account records. Please refresh and try again.')}</p></Panel>;
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
        <div className="idea-display" style={{ fontSize: "var(--idea-text-xl)", color: "var(--idea-text)" }}>{uiText(session?.name)}</div>
        <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{uiText(session?.email || session?.phone)}{uiText(" · ")}{uiText(session?.provider)}</div>
      </Panel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--idea-space-3)" }}>
        {uiText(stats.map((s) => (
          <Panel key={s.label} style={{ textAlign: "center" }}>
            <s.icon size={20} color="var(--idea-gold-bright)" style={{ margin: "0 auto 8px" }} />
            <div className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)" }}>{uiText(s.value)}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(s.label)}</div>
          </Panel>
        )))}
      </div>
    </>
  );
}

export function AccountInbox() {
  const uiText = useLocaleText();

  const { session, db, api } = useBackend();
  const msgs = db.messages.filter((m) => m.to === session?.id && m.scope === "customer");
  if (!msgs.length) return <EmptyState title={uiText("No messages yet")} sub={uiText("Offers, order and subscription updates appear here.")} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {uiText(msgs.map((m) => (
        <Panel key={m.id} style={{ borderInlineStart: m.read ? undefined : "2px solid var(--idea-gold)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(m.title)}</div>
            {uiText(!m.read && <button onClick={() => api.markRead(m.id)} style={{ background: "none", border: "none", color: "var(--idea-gold-bright)", cursor: "pointer", fontSize: "var(--idea-text-xs)" }}>{uiText("Mark read")}</button>)}
          </div>
          <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{uiText(m.body)}</div>
          {uiText(m.requestId && <Link to={`/account/requests/${m.requestId}/offers`} style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-sm)" }}>{uiText("View offers →")}</Link>)}
        </Panel>
      )))}
    </div>
  );
}

export function AccountRequests() {
  const uiText = useLocaleText();

  const { session, db } = useBackend();
  const reqs = db.requests.filter((r) => r.customerId === session?.id);
  if (!reqs.length) return <EmptyState title={uiText("No requests yet")} sub={uiText("Submit a Best-Price request from any product.")} />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {uiText(reqs.map((r) => {
        const product = db && r.productId;
        const offers = db.offers.filter((o) => o.requestId === r.id);
        return (
          <Panel key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(r.quantity)} {uiText(r.unit)}{uiText(" · ")}{uiText(r.governorate)}</div>
                <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(r.id)}{uiText(" · ")}{uiText(new Date(r.createdAt).toLocaleDateString())}</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge text={uiText(r.status)} tone={r.status === "Offer Selected" ? "green" : r.status === "No Offers Received" ? "red" : "gold"} />
                <Link to={`/account/requests/${r.id}/offers`}><Button size="sm" variant="outline">{uiText(offers.length)}{uiText(" offers")}</Button></Link>
              </div>
            </div>
            <span style={{ display: "none" }}>{uiText(String(product))}</span>
          </Panel>
        );
      }))}
    </div>
  );
}

export function AccountRequestOffers() {
  const uiText = useLocaleText();

  const { requestId } = useParams();
  const { db, api, session } = useBackend();
  const { locale } = useI18n();
  const nav = useNavigate();
  const req = db.requests.find((r) => r.id === requestId);
  const offers = db.offers.filter((o) => o.requestId === requestId);
  const products = useStore().products;
  if (!req) return <EmptyState title={uiText("Request not found")} />;
  const product = products.find((p) => p.id === req.productId);
  return (
    <>
      <Panel style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow">{uiText("Request ")}{uiText(req.id)}</div>
        <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)", marginTop: 4 }}>{uiText(product?.name[locale])}{uiText(" — ")}{uiText(req.quantity)} {uiText(req.unit)}</div>
        <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{uiText(req.governorate)}{uiText(" · ")}{uiText(req.destination)}</div>
        <div style={{ marginTop: 8 }}><StatusBadge text={uiText(req.status)} tone={req.acceptedOfferId ? "green" : "gold"} /></div>
      </Panel>
      {uiText(!offers.length ? <EmptyState title={uiText("Awaiting offers")} sub={uiText("Verified matching suppliers submit private offers here.")} /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {uiText(offers.map((o) => {
            const biz = db.businesses.find((b) => b.id === o.businessId);
            const subtotal = o.unitPrice * o.quantity;
            const total = subtotal + subtotal * o.taxRate + o.shipping;
            const selected = req.acceptedOfferId === o.id;
            return (
              <Panel key={o.id} style={{ border: selected ? "1px solid var(--idea-gold)" : undefined, opacity: o.status === "not-selected" ? 0.55 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(biz?.publicName)} <StatusBadge text={uiText(biz?.status || "")} tone="green" /></div>
                    <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)", marginTop: 2 }}>{uiText("★ ")}{uiText(biz?.rating.toFixed(1))}{uiText(" · ")}{uiText(o.exactProduct ? "Exact product" : "Approved equivalent")}{uiText(" · ")}{uiText(o.availability)}</div>
                  </div>
                  <div style={{ textAlign: "end" }}>
                    <div className="idea-display" style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-xl)" }}>{uiText(total.toLocaleString())}{uiText(" EGP")}</div>
                    <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{uiText(o.unitPrice)}{uiText(" EGP/")}{uiText(o.unit)}{uiText(" · ")}{uiText(o.quantity)} {uiText(o.unit)}{uiText(" · +")}{uiText(o.shipping)}{uiText(" shipping · ")}{uiText((o.taxRate * 100).toFixed(0))}{uiText("% tax")}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)", flexWrap: "wrap" }}>
                  <span>{uiText("Prep ")}{uiText(o.prepDays)}{uiText("d")}</span><span>{uiText("Delivery ")}{uiText(o.deliveryDays)}{uiText("d")}</span><span>{uiText(o.paymentTerms)}</span>
                  <span>{uiText("Expires ")}{uiText(new Date(o.expiresAt).toLocaleDateString())}</span>
                </div>
                {uiText(!req.acceptedOfferId && (
                  <Button size="sm" style={{ marginTop: 12 }} onClick={() => { const ord = api.acceptOffer(o.id); if (ord) nav("/checkout?order=" + ord.id); }}>{uiText("Accept & continue to payment")}</Button>
                ))}
                {uiText(selected && <div style={{ marginTop: 10 }}><StatusBadge text={uiText("Accepted")} tone="green" /></div>)}
              </Panel>
            );
          }))}
          <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>{uiText("Offers are private. Suppliers cannot see each other's offers. The lowest price is not automatically the best offer — compare delivery, terms and rating. ")}<span style={{ display: "none" }}>{uiText(session?.id)}</span></p>
        </div>
      ))}
    </>
  );
}

export function AccountOrders() {
  const uiText = useLocaleText();

  const { session, db, api } = useBackend();
  const orders = db.orders.filter((o) => o.customerId === session?.id);
  if (!orders.length) return <EmptyState title={uiText("No orders yet")} />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {uiText(orders.map((o) => (
        <Panel key={o.id}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(o.id)}</div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(o.total.toLocaleString())}{uiText(" EGP · ")}{uiText(new Date(o.createdAt).toLocaleDateString())}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <StatusBadge text={uiText(o.status)} tone={o.status === "Delivered" ? "green" : o.paymentStatus === "Sandbox Failed" ? "red" : "gold"} />
              {uiText(o.paymentStatus === "None" && <Link to={`/checkout?order=${o.id}`}><Button size="sm">{uiText("Pay")}</Button></Link>)}
              {uiText(o.paymentStatus === "Sandbox Authorized" && o.status === "Preparing" && <Button size="sm" variant="outline" onClick={() => api.sandboxPay(o.id, true)}>{uiText("Confirm delivery")}</Button>)}
            </div>
          </div>
        </Panel>
      )))}
    </div>
  );
}

export function AccountInvoices() {
  const uiText = useLocaleText();

  const { session, db } = useBackend();
  const paid = db.orders.filter((o) => o.customerId === session?.id && o.paymentStatus === "Sandbox Authorized");
  if (!paid.length) return <EmptyState title={uiText("No invoices yet")} sub={uiText("Invoices are generated after a verified payment.")} />;
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {uiText(paid.map((o) => (
        <Panel key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText("Invoice INV-")}{uiText(o.id.slice(-6).toUpperCase())}</div>
            <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(o.total.toLocaleString())}{uiText(" EGP · ")}{uiText(new Date(o.createdAt).toLocaleDateString())}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.print()}><CreditCard size={14} />{uiText(" Download")}</Button>
        </Panel>
      )))}
    </div>
  );
}

export function AccountFavorites() {
  const uiText = useLocaleText();

  const { favorites, products } = useStore();
  const items = products.filter((p) => favorites.includes(p.id));
  if (!items.length) return <EmptyState title={uiText("No favorites yet")} />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "var(--idea-space-4)" }}>
      {uiText(items.map((p) => <ProductCard key={p.id} product={p} />))}
    </div>
  );
}

export function AccountCompare() {
  const uiText = useLocaleText();

  const { compare, products } = useStore();
  const { locale } = useI18n();
  const items = products.filter((p) => compare.includes(p.id));
  if (!items.length) return <EmptyState title={uiText("Nothing to compare")} sub={uiText("Add up to 4 products to compare.")} />;
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
        <thead><tr><th /> {uiText(items.map((p) => <th key={p.id} style={{ padding: 8, textAlign: "start", color: "var(--idea-gold-bright)" }}>{uiText(p.name[locale])}</th>))}</tr></thead>
        <tbody>
          {uiText(rows.map((r) => (
            <tr key={r.label} style={{ borderTop: "var(--idea-hairline)" }}>
              <td style={{ padding: 8, color: "var(--idea-text-muted)" }}>{uiText(r.label)}</td>
              {uiText(items.map((p) => <td key={p.id} style={{ padding: 8 }}>{uiText(r.get(p))}</td>))}
            </tr>
          )))}
        </tbody>
      </table>
    </Panel>
  );
}

export function AccountRoomProjects() {
  const uiText = useLocaleText();

  const { session, db, api } = useBackend();
  const projects = db.roomProjects.filter((p) => p.userId === session?.id);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText("Saved projects")}</div>
        <Link to="/room-designer/new"><Button size="sm"><HomeIcon size={14} />{uiText(" New project")}</Button></Link>
      </div>
      {uiText(!projects.length ? <EmptyState title={uiText("No saved projects")} sub={uiText("Design a room and save it here.")} /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {uiText(projects.map((p) => (
            <Panel key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><div className="idea-display" style={{ color: "var(--idea-text)" }}>{uiText(p.name)}</div>
                <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>{uiText(p.surfaces.length)}{uiText(" surfaces · ")}{uiText(new Date(p.createdAt).toLocaleDateString())}</div></div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/room-designer/project/${p.id}`}><Button size="sm" variant="outline">{uiText("Open")}</Button></Link>
                <Button size="sm" variant="ghost" onClick={() => api.deleteRoomProject(p.id)}>{uiText("Delete")}</Button>
              </div>
            </Panel>
          )))}
        </div>
      ))}
    </>
  );
}

export function AccountNotifications() { return <AccountInbox />; }

export function AccountSettings() {
  const uiText = useLocaleText();

  const { session } = useBackend();
  const { t } = useI18n();
  return (
    <Panel>
      <Field label={uiText(t("acct.profile"))}><input style={inputStyle} defaultValue={session?.name} /></Field>
      <Field label={uiText(t("auth.email"))}><input style={inputStyle} defaultValue={session?.email || ""} /></Field>
      <Field label={uiText(t("auth.phone"))}><input style={inputStyle} defaultValue={session?.phone || ""} /></Field>
      <Button size="sm">{uiText(t("common.save"))}</Button>
    </Panel>
  );
}

// Re-export the icons import guard usage to avoid unused warnings.
export const _icons = { Inbox, Package, Heart, GitCompare, FileText };
