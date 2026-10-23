import {PlatformProfile,PlatformAddresses,VerifyEmail,PlatformNotifications,PlatformVerification,PlatformOrders,PlatformCart,PlatformDesigns,PlatformAdmin,GeminiSettings} from './pages/Platform';
import { AccountSecurity } from './pages/AccountSecurity';
import { useUiText as useLocaleText } from "./i18n/useUiText";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import "../styles/index.css";
import { I18nProvider } from "./i18n/i18n";
import { ThemeProvider } from "./theme/theme";
import { StoreProvider } from "./store/store";
import { BackendProvider } from "./backend/db";
import { useBackend, type Role } from "./backend/db";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { Collections, CollectionDetail } from "./pages/Collections";
import { ProductDetail } from "./pages/ProductDetail";
import { Favorites } from "./pages/Favorites";
import { RequestQuote } from "./pages/RequestQuote";
import { HowItWorks } from "./pages/Static";
import { Login, Register, RegisterCustomer, RegisterBusiness, RoleSelect } from "./pages/Auth";
import {
  AccountLayout, AccountProfile, AccountInbox, AccountRequests, AccountRequestOffers,
  AccountOrders, AccountInvoices, AccountFavorites, AccountCompare, AccountRoomProjects,
  AccountNotifications, AccountSettings,
} from "./pages/Account";
import {
  BusinessLayout, BusinessOverview, BusinessOnboarding, BusinessVerification, BusinessInbox,
  BusinessRequests, BusinessRequestDetail, BusinessOffers, BusinessOrders, BusinessProducts,
  BusinessReports, BusinessSubscriptionPage, BusinessSettings,
} from "./pages/Business";
import { SubscriptionsHome, SubscriptionsCustomers, SubscriptionsBusinesses, AccountSubscription } from "./pages/Subscriptions";
import { AdminLayout, AdminOverview, AdminSubscriptions, AdminPayments } from "./pages/Admin";
import { AdminStudioLayout, AdminStudioHome, AdminProducts, AdminQuality, AdminOperations, AdminSettings } from "./pages/AdminStudio";
import { Checkout } from "./pages/Checkout";
import { RoomDesignerHome, PhotoGuide, RoomDesignerEditor } from "./pages/RoomDesigner";
import { TileShowroom } from "./pages/TileShowroom";
import { Resources } from "./pages/Resources";
import { SurfaceStyles } from "./pages/SurfaceStyles";
import { CompanyShowcase } from "./pages/CompanyShowcase";
import { QuoteMailbox } from "./pages/QuoteMailbox";
import { AdminAccounts, AdminControlLayout } from "./pages/AdminAccounts";
import { SupplierQuoteRequest } from "./pages/SupplierQuoteRequest";
import { ResetPassword } from "./pages/ResetPassword";

import { lazy, Suspense } from "react";
const CeramicVisualizer = lazy(() => import("./pages/CeramicVisualizer").then(module => ({default:module.CeramicVisualizer})));
function CeramicVisualizerPage() {
  const uiText = useLocaleText();

  return <Suspense fallback={<div style={{padding:40,textAlign:"center",color:"var(--idea-text-muted)"}}>{uiText("جارٍ تحميل استوديو الخامات…")}</div>}><CeramicVisualizer /></Suspense>;
}

function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const uiText = useLocaleText();
  const { session, loading } = useBackend();
  if (loading) return <p role="status" style={{ padding: 32, textAlign: "center" }}>{uiText("Loading your account…")}</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default function App() {

  return (
    // MARKER-MAKE-KIT-INVOKED  MARKER-MAKE-KIT-DISCOVERY-READ  MARKER-MAKE-KIT-TOKENS-READ  MARKER-MAKE-KIT-FINAL-CHECK-READ
    // The installed Astra UI kit is a minimal light-mode SaaS system whose rules
    // (mandatory sidebar rail, lavender canvas) conflict with the requested luxury
    // Black & Gold marketplace. Per user direction the storefront is built on a
    // custom, fully token-driven design system defined in src/styles/globals.css.
    <ThemeProvider>
    <I18nProvider>
      <BackendProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Storefront */}
              <Route index element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:slug" element={<CollectionDetail />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/ai-room-visualizer" element={<CeramicVisualizerPage />} />
              <Route path="/ceramic-studio" element={<CeramicVisualizerPage />} />
              <Route path="/tile-showroom/:lookId" element={<TileShowroom />} />
              <Route path="/tile-showroom" element={<TileShowroom />} />
              <Route path="/surface-styles" element={<SurfaceStyles />} />
              <Route path="/suppliers" element={<CompanyShowcase />} />
              <Route path="/suppliers/:companyId" element={<CompanyShowcase />} />

              {["about", "showrooms", "downloads", "projects", "journal", "videos", "glossary", "contact", "updates"].map(path => <Route key={path} path={`/${path}`} element={<Resources />} />)}
              <Route path="/inspiration/:destination" element={<Resources />} />
              <Route path="/journal/:guideId" element={<Resources />} />

              {/* RFQ */}
              <Route path="/request-quote" element={<Navigate to="/request-quote/new" replace />} />
              <Route path="/request-quote/new" element={<RequestQuote />} />
              <Route path="/request-quote/supplier/:productId" element={<SupplierQuoteRequest />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/customer" element={<RegisterCustomer />} />
              <Route path="/register/business" element={<RegisterBusiness />} />
              <Route path="/onboarding/role" element={<RoleSelect />} />

              {/* Subscriptions + checkout */}
              <Route path="/subscriptions" element={<SubscriptionsHome />} />
              <Route path="/subscriptions/customers" element={<SubscriptionsCustomers />} />
              <Route path="/subscriptions/businesses" element={<SubscriptionsBusinesses />} />
              <Route path="/checkout" element={<PlatformCart />} /><Route path="/cart" element={<PlatformCart />} /><Route path="/verify-email" element={<VerifyEmail />} />

              {/* Room designer */}
              <Route path="/room-designer" element={<RoomDesignerHome />} />
              <Route path="/room-designer/photo-guide" element={<PhotoGuide />} />
              <Route path="/room-designer/new" element={<RoomDesignerEditor />} />
              <Route path="/room-designer/project/:projectId" element={<RoomDesignerEditor />} />

              {/* Customer account */}
              <Route element={<ProtectedRoute roles={["customer", "designer", "contractor"]} />}>
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<PlatformProfile />} />
                <Route path="profile" element={<PlatformProfile />} /><Route path="addresses" element={<PlatformAddresses />} />
                <Route path="inbox" element={<QuoteMailbox />} />
                <Route path="outbox" element={<QuoteMailbox sent />} />
                <Route path="offers" element={<QuoteMailbox />} />
                <Route path="requests" element={<QuoteMailbox sent />} />
                <Route path="requests/:requestId" element={<QuoteMailbox sent />} />
                <Route path="requests/:requestId/offers" element={<QuoteMailbox />} />
                <Route path="orders" element={<PlatformOrders />} />
                <Route path="orders/:orderId" element={<PlatformOrders />} />
                <Route path="invoices" element={<PlatformOrders invoices />} />
                <Route path="favorites" element={<AccountFavorites />} />
                <Route path="compare" element={<AccountCompare />} />
                <Route path="room-projects" element={<PlatformDesigns />} />
                <Route path="subscription" element={<AccountSubscription />} />
                <Route path="notifications" element={<PlatformNotifications />} />
                <Route path="settings" element={<AccountSecurity />} />
              </Route>
              </Route>

              {/* Business */}
              <Route element={<ProtectedRoute roles={["business"]} />}>
              <Route path="/business/onboarding" element={<BusinessOnboarding />} />
              <Route path="/business" element={<BusinessLayout />}>
                <Route index element={<BusinessOverview />} />
                <Route path="verification" element={<PlatformVerification />} />
                <Route path="inbox" element={<QuoteMailbox />} />
                <Route path="outbox" element={<QuoteMailbox sent />} />
                <Route path="requests" element={<QuoteMailbox />} />
                <Route path="requests/:requestId" element={<QuoteMailbox />} />
                <Route path="offers" element={<QuoteMailbox sent />} />
                <Route path="offers/:offerId" element={<QuoteMailbox sent />} />
                <Route path="orders" element={<PlatformOrders />} />
                <Route path="products" element={<BusinessProducts />} />
                <Route path="subscription" element={<BusinessSubscriptionPage />} />
                <Route path="reports" element={<BusinessReports />} />
                <Route path="team" element={<BusinessReports />} />
                <Route path="settings" element={<BusinessSettings />} />
              </Route>
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/admin" element={<AdminControlLayout />}>
                <Route index element={<AdminAccounts />} />
                <Route path="catalogue" element={<AdminAccounts initialTab="products" />} />
                <Route path="quality" element={<PlatformAdmin />} /><Route path="platform" element={<PlatformAdmin />} /><Route path="ai" element={<GeminiSettings />} /><Route path="verifications" element={<PlatformAdmin />} />
                <Route path="operations" element={<AdminAccounts />} />
                <Route path="settings" element={<AccountSecurity />} />
                <Route path="subscriptions" element={<AdminAccounts initialTab="memberships" />} />
                <Route path="settings/payments" element={<PlatformAdmin />} />
              </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
      </BackendProvider>
    </I18nProvider>
    </ThemeProvider>
  );
}
