import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router";
import { lazy, Suspense } from "react";
import "../styles/index.css";
import { I18nProvider } from "./i18n/i18n";
import { ThemeProvider } from "./theme/theme";
import { StoreProvider } from "./store/store";
import { BackendProvider } from "./backend/db";
import { useBackend, type Role } from "./backend/db";
import { Layout } from "./components/Layout";
const Home = lazy(() => import("./pages/Home").then(module => ({ default: module.Home })));
const Products = lazy(() => import("./pages/Products").then(module => ({ default: module.Products })));
const Collections = lazy(() => import("./pages/Collections").then(module => ({ default: module.Collections })));
const CollectionDetail = lazy(() => import("./pages/Collections").then(module => ({ default: module.CollectionDetail })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then(module => ({ default: module.ProductDetail })));
const Favorites = lazy(() => import("./pages/Favorites").then(module => ({ default: module.Favorites })));
const RequestQuote = lazy(() => import("./pages/RequestQuote").then(module => ({ default: module.RequestQuote })));
const HowItWorks = lazy(() => import("./pages/Static").then(module => ({ default: module.HowItWorks })));
const AiVisualizerStudio = lazy(() => import("./pages/AiVisualizerStudio").then(module => ({ default: module.AiVisualizerStudio })));
const Login = lazy(() => import("./pages/Auth").then(module => ({ default: module.Login })));
const Register = lazy(() => import("./pages/Auth").then(module => ({ default: module.Register })));
const RegisterCustomer = lazy(() => import("./pages/Auth").then(module => ({ default: module.RegisterCustomer })));
const RegisterBusiness = lazy(() => import("./pages/Auth").then(module => ({ default: module.RegisterBusiness })));
const BusinessLogin = lazy(() => import("./pages/Auth").then(module => ({ default: module.BusinessLogin })));
const AdminLogin = lazy(() => import("./pages/Auth").then(module => ({ default: module.AdminLogin })));
const RoleSelect = lazy(() => import("./pages/Auth").then(module => ({ default: module.RoleSelect })));
const AccountLayout = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountLayout })));
const AccountProfile = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountProfile })));
const AccountInbox = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountInbox })));
const AccountRequests = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountRequests })));
const AccountRequestOffers = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountRequestOffers })));
const AccountOrders = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountOrders })));
const AccountInvoices = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountInvoices })));
const AccountFavorites = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountFavorites })));
const AccountCompare = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountCompare })));
const AccountRoomProjects = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountRoomProjects })));
const AccountNotifications = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountNotifications })));
const AccountSettings = lazy(() => import("./pages/Account").then(module => ({ default: module.AccountSettings })));
const BusinessLayout = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessLayout })));
const BusinessOverview = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessOverview })));
const BusinessOnboarding = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessOnboarding })));
const BusinessVerification = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessVerification })));
const BusinessInbox = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessInbox })));
const BusinessRequests = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessRequests })));
const BusinessRequestDetail = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessRequestDetail })));
const BusinessOffers = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessOffers })));
const BusinessOrders = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessOrders })));
const BusinessProducts = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessProducts })));
const BusinessReports = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessReports })));
const BusinessSubscriptionPage = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessSubscriptionPage })));
const BusinessSettings = lazy(() => import("./pages/Business").then(module => ({ default: module.BusinessSettings })));
const SubscriptionsHome = lazy(() => import("./pages/Subscriptions").then(module => ({ default: module.SubscriptionsHome })));
const SubscriptionsCustomers = lazy(() => import("./pages/Subscriptions").then(module => ({ default: module.SubscriptionsCustomers })));
const SubscriptionsBusinesses = lazy(() => import("./pages/Subscriptions").then(module => ({ default: module.SubscriptionsBusinesses })));
const AccountSubscription = lazy(() => import("./pages/Subscriptions").then(module => ({ default: module.AccountSubscription })));
const AdminLayout = lazy(() => import("./pages/Admin").then(module => ({ default: module.AdminLayout })));
const AdminOverview = lazy(() => import("./pages/Admin").then(module => ({ default: module.AdminOverview })));
const AdminSubscriptions = lazy(() => import("./pages/Admin").then(module => ({ default: module.AdminSubscriptions })));
const AdminPayments = lazy(() => import("./pages/Admin").then(module => ({ default: module.AdminPayments })));
const AdminStudioLayout = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminStudioLayout })));
const AdminStudioHome = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminStudioHome })));
const AdminProducts = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminProducts })));
const AdminQuality = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminQuality })));
const AdminOperations = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminOperations })));
const AdminSettings = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminSettings })));
const AdminVisualizer = lazy(() => import("./pages/AdminStudio").then(module => ({ default: module.AdminVisualizer })));
const AdminPromotions = lazy(() => import("./pages/AdminPromotions").then(module => ({ default: module.AdminPromotions })));
const Checkout = lazy(() => import("./pages/Checkout").then(module => ({ default: module.Checkout })));
const Room3DStudio = lazy(() => import("./pages/Room3DStudio").then(module => ({ default: module.Room3DStudio })));
const CompanyControlCenter = lazy(() => import("./pages/CompanyControlCenter").then(module => ({ default: module.CompanyControlCenter })));
const CompanyApplication = lazy(() => import("./pages/CompanyControlCenter").then(module => ({ default: module.CompanyApplication })));
const CompanyRevenueReport = lazy(() => import("./pages/BusinessGrowth").then(module => ({ default: module.CompanyRevenueReport })));
const AdminAnnouncementEditor = lazy(() => import("./pages/BusinessGrowth").then(module => ({ default: module.AdminAnnouncementEditor })));
const BusinessAdvertising = lazy(() => import("./pages/BusinessGrowth").then(module => ({ default: module.BusinessAdvertising })));
const AdminCodeLookup = lazy(() => import("./pages/AdminCodeLookup").then(module => ({ default: module.AdminCodeLookup })));
const Resources = lazy(() => import("./pages/Resources").then(module => ({ default: module.Resources })));
const SurfaceStyles = lazy(() => import("./pages/SurfaceStyles").then(module => ({ default: module.SurfaceStyles })));

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
          <Suspense fallback={<div role="status" style={{ padding: 32 }}>Loading IDEA…</div>}>
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
              <Route path="/room-designer/3d" element={<Suspense fallback={<div style={{padding:32}}>Loading 3D studio…</div>}><Room3DStudio tileOnly /></Suspense>} />
              <Route path="/tile-showroom" element={<Suspense fallback={<div style={{padding:32}}>Loading tile studio…</div>}><Room3DStudio tileOnly /></Suspense>} />
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
          </Suspense>
        </BrowserRouter>
      </StoreProvider>
      </BackendProvider>
    </I18nProvider>
    </ThemeProvider>
  );
}
