import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

// Componentes que SIEMPRE se cargan primero (críticos)
import Header from './components/Header/Header'
import Banner from './components/Banner/Banner'
import Home from './components/Home/Home'
import Footer from './components/Footer/Footer'
import Login from './components/Auth/Login'
import WhatsappButton from './components/WhatsappButton/WhatsappButton'

// Loading component para Suspense
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh' 
  }}>
    <div>Cargando...</div>
  </div>
);

// ========== LAZY LOADING para páginas menos críticas ==========
// Páginas principales (cargadas por separado)
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const ProductDetails = lazy(() => import('./components/ProductDetails/ProductDetails'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Register = lazy(() => import('./components/Auth/Register'))
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const UserProfile = lazy(() => import('./components/Profile/UserProfile'))

// Páginas de pago (separadas en otro chunk)
const PagoExito = lazy(() => import('./pages/PagoExitoso'))
const PagoError = lazy(() => import('./pages/PagoError'))
const PagoPendiente = lazy(() => import('./pages/PagoPendiente'))

// Páginas legales (todas en un mismo chunk)
const PrivacyPolicy = lazy(() => import('./components/Footer/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./components/Footer/TermsOfService'))
const CookiePolicy = lazy(() => import('./components/Footer/CookiePolicy'))
const FyQ = lazy(() => import('./components/Footer/Fya'))

// Versión con preload para mejor UX (opcional)
const preloadedImports = {
  products: () => import('./pages/Products'),
  cart: () => import('./pages/Cart'),
  checkout: () => import('./pages/Checkout')
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <FavoritesProvider>
            <div className="App">
              <Header />
              <main>
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    {/* Ruta principal - cargada inmediatamente */}
                    <Route path="/" element={
                      <>
                        <Banner />
                        <Home />
                      </>
                    } />
                    
                    {/* Rutas con lazy loading */}
                    <Route path="/products" element={<Products />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/product/:productId" element={<ProductDetails />} />
                    <Route path="/favorites" element={<Favorites />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    <Route path="/my-account" element={<UserProfile />} />
                    
                    {/* Rutas de pago - separadas */}
                    <Route path="/pago/exito" element={<PagoExito />} />
                    <Route path="/pago/error" element={<PagoError />} />
                    <Route path="/pago/pendiente" element={<PagoPendiente />} />
                    
                    {/* Rutas legales - pueden ir en un mismo chunk */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                    <Route path="/faq" element={<FyQ />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
              <WhatsappButton />
            </div>
          </FavoritesProvider>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App