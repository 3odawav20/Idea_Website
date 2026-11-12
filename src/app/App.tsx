import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { lazy, Suspense } from "react";
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
import { AiVisualizerStudio } from "./pages/AiVisualizerStudio";
import { Login, Register, RegisterCustomer, RegisterBusiness, BusinessLogin, AdminLogin, RoleSelect } from "./pages/Auth";
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
import { AdminStudioLayout, AdminStudioHome, AdminProducts, AdminQuality, AdminOperations, AdminSettings, AdminVisualizer } from "./pages/AdminStudio";
import { AdminPromotions } from "./pages/AdminPromotions";
import { Checkout } from "./pages/Checkout";
const Room3DStudio = lazy(() => import("./pages/Room3DStudio").then(module => ({ default: module.Room3DStudio })));
import { CompanyControlCenter, CompanyApplication } from "./pages/CompanyControlCenter";
import { CompanyRevenueReport, AdminAnnouncementEditor, BusinessAdvertising } from "./pages/BusinessGrowth";
import { AdminCodeLookup } from "./pages/AdminCodeLookup";
import { Resources } from "./pages/Resources";
import { SurfaceStyles } from "./pages/SurfaceStyles";

function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { session } = useBackend();
  if (!session) return <Navigate to={roles?.includes("admin") ? "/admin/login" : roles?.includes("business") ? "/business/login" : "/login"} replace />;
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
        <BrowserRouter basename={window.location.pathname.startsWith("/idea-next/") ? "/idea-next" : undefined}>
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
              <Route path="/ai-room-visualizer" element={<AiVisualizerStudio />} />
              <Route path="/surface-styles" element={<SurfaceStyles />} />

              {["about", "showrooms", "downloads", "projects", "journal", "videos", "glossary", "contact", "updates"].map(path => <Route key={path} path={`/${path}`} element={<Resources />} />)}
              <Route path="/inspiration/:destination" element={<Resources />} />
              <Route path="/journal/:guideId" element={<Resources />} />

              {/* RFQ */}
              <Route path="/request-quote" element={<Navigate to="/request-quote/new" replace />} />
              <Route path="/request-quote/new" element={<RequestQuote />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/customer" element={<RegisterCustomer />} />
              <Route path="/register/business" element={<RegisterBusiness />} />
              <Route path="/business/login" element={<BusinessLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/business/apply" element={<CompanyApplication />} />
              <Route path="/onboarding/role" element={<RoleSelect />} />

              {/* Subscriptions + checkout */}
              <Route path="/subscriptions" element={<SubscriptionsHome />} />
              <Route path="/subscriptions/customers" element={<SubscriptionsCustomers />} />
              <Route path="/subscriptions/businesses" element={<SubscriptionsBusinesses />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Room designer */}
              <Route path="/room-designer" element={<Navigate to="/room-designer/3d" replace />} />
              <Route path="/room-designer/photo-guide" element={<Navigate to="/ai-room-visualizer" replace />} />
              <Route path="/room-designer/new" element={<Navigate to="/room-designer/3d" replace />} />
              <Route path="/room-designer/3d" element={<Suspense fallback={<div style={{padding:32}}>Loading 3D studio…</div>}><Room3DStudio /></Suspense>} />
              <Route path="/room-designer/project/:projectId" element={<Navigate to="/account/room-projects" replace />} />

              {/* Customer account */}
              <Route element={<ProtectedRoute roles={["customer", "designer", "contractor"]} />}>
              <Route path="/account" element={<AccountLayout />}>
                <Route index element={<AccountProfile />} />
                <Route path="profile" element={<AccountProfile />} />
                <Route path="inbox" element={<AccountInbox />} />
                <Route path="requests" element={<AccountRequests />} />
                <Route path="requests/:requestId" element={<AccountRequestOffers />} />
                <Route path="requests/:requestId/offers" element={<AccountRequestOffers />} />
                <Route path="orders" element={<AccountOrders />} />
                <Route path="orders/:orderId" element={<AccountOrders />} />
                <Route path="invoices" element={<AccountInvoices />} />
                <Route path="favorites" element={<AccountFavorites />} />
                <Route path="compare" element={<AccountCompare />} />
                <Route path="room-projects" element={<AccountRoomProjects />} />
                <Route path="subscription" element={<AccountSubscription />} />
                <Route path="notifications" element={<AccountNotifications />} />
                <Route path="settings" element={<AccountSettings />} />
              </Route>
              </Route>

              {/* Business */}
              <Route element={<ProtectedRoute roles={["business"]} />}>
              <Route path="/business/onboarding" element={<Navigate to="/business/apply" replace />} />
              <Route path="/business" element={<BusinessLayout />}>
                <Route index element={<BusinessOverview />} />
                <Route path="verification" element={<BusinessVerification />} />
                <Route path="inbox" element={<BusinessInbox />} />
                <Route path="requests" element={<BusinessRequests />} />
                <Route path="requests/:requestId" element={<BusinessRequestDetail />} />
                <Route path="offers" element={<BusinessOffers />} />
                <Route path="offers/:offerId" element={<BusinessOffers />} />
                <Route path="orders" element={<BusinessOrders />} />
                <Route path="products" element={<CompanyControlCenter mode="supplier" />} />
                <Route path="sales" element={<CompanyRevenueReport mode="supplier" />} />
                <Route path="ads" element={<BusinessAdvertising mode="supplier" />} />
                <Route path="subscription" element={<BusinessSubscriptionPage />} />
                <Route path="reports" element={<BusinessReports />} />
                <Route path="team" element={<BusinessReports />} />
                <Route path="settings" element={<BusinessSettings />} />
              </Route>
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute roles={["admin"]} />}>
              <Route path="/admin" element={<AdminStudioLayout />}>
                <Route index element={<AdminStudioHome />} />
                <Route path="catalogue" element={<AdminProducts />} />
                <Route path="companies" element={<CompanyControlCenter mode="admin" />} />
                <Route path="sales" element={<CompanyRevenueReport mode="admin" />} />
                <Route path="search" element={<AdminCodeLookup />} />
                <Route path="announcements" element={<AdminAnnouncementEditor />} />
                <Route path="advertising" element={<BusinessAdvertising mode="admin" />} />
                <Route path="promotions" element={<AdminPromotions />} />
                <Route path="quality" element={<AdminQuality />} />
                <Route path="operations" element={<AdminOperations />} />
                <Route path="visualizer" element={<AdminVisualizer />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="settings/payments" element={<AdminPayments />} />
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
