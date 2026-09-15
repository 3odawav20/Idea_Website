import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import "../styles/index.css";
import { I18nProvider } from "./i18n/i18n";
import { ThemeProvider } from "./theme/theme";
import { StoreProvider } from "./store/store";
import { BackendProvider } from "./backend/db";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { Collections, CollectionDetail } from "./pages/Collections";
import { ProductDetail } from "./pages/ProductDetail";
import { Favorites } from "./pages/Favorites";
import { RequestQuote } from "./pages/RequestQuote";
import { HowItWorks, AiVisualizer } from "./pages/Static";
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
import { Checkout } from "./pages/Checkout";
import { RoomDesignerHome, PhotoGuide, RoomDesignerEditor } from "./pages/RoomDesigner";

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
              <Route path="/ai-room-visualizer" element={<AiVisualizer />} />

              {/* RFQ */}
              <Route path="/request-quote" element={<Navigate to="/request-quote/new" replace />} />
              <Route path="/request-quote/new" element={<RequestQuote />} />

              {/* Auth */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/customer" element={<RegisterCustomer />} />
              <Route path="/register/business" element={<RegisterBusiness />} />
              <Route path="/onboarding/role" element={<RoleSelect />} />

              {/* Subscriptions + checkout */}
              <Route path="/subscriptions" element={<SubscriptionsHome />} />
              <Route path="/subscriptions/customers" element={<SubscriptionsCustomers />} />
              <Route path="/subscriptions/businesses" element={<SubscriptionsBusinesses />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Room designer */}
              <Route path="/room-designer" element={<RoomDesignerHome />} />
              <Route path="/room-designer/photo-guide" element={<PhotoGuide />} />
              <Route path="/room-designer/new" element={<RoomDesignerEditor />} />
              <Route path="/room-designer/project/:projectId" element={<RoomDesignerEditor />} />

              {/* Customer account */}
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

              {/* Business */}
              <Route path="/business/onboarding" element={<BusinessOnboarding />} />
              <Route path="/business" element={<BusinessLayout />}>
                <Route index element={<BusinessOverview />} />
                <Route path="verification" element={<BusinessVerification />} />
                <Route path="inbox" element={<BusinessInbox />} />
                <Route path="requests" element={<BusinessRequests />} />
                <Route path="requests/:requestId" element={<BusinessRequestDetail />} />
                <Route path="offers" element={<BusinessOffers />} />
                <Route path="offers/:offerId" element={<BusinessOffers />} />
                <Route path="orders" element={<BusinessOrders />} />
                <Route path="products" element={<BusinessProducts />} />
                <Route path="subscription" element={<BusinessSubscriptionPage />} />
                <Route path="reports" element={<BusinessReports />} />
                <Route path="team" element={<BusinessReports />} />
                <Route path="settings" element={<BusinessSettings />} />
              </Route>

              {/* Admin */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="subscriptions" element={<AdminSubscriptions />} />
                <Route path="settings/payments" element={<AdminPayments />} />
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
