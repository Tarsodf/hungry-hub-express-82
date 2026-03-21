import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Index from "./pages/Index";
import { lazy, Suspense } from "react";

const MenuPage = lazy(() => import("./pages/MenuPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen flex-col">
            <Header />
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/cardapio" element={<Suspense fallback={null}><MenuPage /></Suspense>} />
                <Route path="/carrinho" element={<Suspense fallback={null}><CartPage /></Suspense>} />
                <Route path="/admin/login" element={<Suspense fallback={null}><AdminLogin /></Suspense>} />
                <Route path="/admin/forgot-password" element={<Suspense fallback={null}><ForgotPassword /></Suspense>} />
                <Route path="/reset-password" element={<Suspense fallback={null}><ResetPassword /></Suspense>} />
                <Route path="/admin" element={<Suspense fallback={null}><ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute></Suspense>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<Suspense fallback={null}><NotFound /></Suspense>} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
