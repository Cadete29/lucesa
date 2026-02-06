// src/App.jsx
import React, { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

// Componentes que SIEMPRE se cargan primero (críticos)
import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import WhatsappButton from './components/WhatsappButton/WhatsappButton'

/**
 * LOADING SPINNER COMPONENT
 * 
 * Componente de carga que se muestra mientras se cargan los componentes lazy.
 * Se centra verticalmente y tiene margen superior para evitar superponerse con el Header.
 * 
 * @component
 * @returns {JSX.Element} Spinner de carga centrado
 */
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    marginTop: '70px' // Margen para evitar superposición con Header
  }}>
    <div className="loading-spinner"></div>
  </div>
);

// ========== LAZY LOADING ==========

/**
 * IMPORTACIONES CON LAZY LOADING
 * 
 * Todos los componentes de página y secciones principales se cargan dinámicamente
 * usando React.lazy() para mejorar el rendimiento inicial de la aplicación.
 * 
 * @constant {Component} Home - Página de inicio principal
 * @constant {Component} Banner - Banner principal del sitio
 * @constant {Component} Products - Catálogo de productos
 * @constant {Component} Categories - Página de categorías
 * @constant {Component} ProductDetails - Detalles de producto individual
 * @constant {Component} Favorites - Página de favoritos del usuario
 * @constant {Component} Login - Formulario de inicio de sesión
 * @constant {Component} Register - Formulario de registro
 * @constant {Component} ForgotPassword - Recuperación de contraseña
 * @constant {Component} ResetPassword - Restablecimiento de contraseña
 * @constant {Component} Cart - Carrito de compras
 * @constant {Component} Checkout - Proceso de checkout/pago
 * @constant {Component} OrderConfirmation - Confirmación de orden (tarjeta)
 * @constant {Component} OrderConfirmationTransfer - Confirmación de orden (transferencia)
 * @constant {Component} UserProfile - Perfil de usuario
 * @constant {Component} PagoExito - Página de pago exitoso
 * @constant {Component} PagoError - Página de error en pago
 * @constant {Component} PagoPendiente - Página de pago pendiente
 * @constant {Component} PrivacyPolicy - Política de privacidad
 * @constant {Component} TermsOfService - Términos de servicio
 * @constant {Component} CookiePolicy - Política de cookies
 * @constant {Component} FyQ - Preguntas frecuentes (FAQ)
 */
const Home = lazy(() => import('./components/Home/Home'))
const Banner = lazy(() => import('./components/Banner/Banner'))
const Products = lazy(() => import('./pages/Products'))
const Categories = lazy(() => import('./pages/Categories'))
const ProductDetails = lazy(() => import('./components/ProductDetails/ProductDetails'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Login = lazy(() => import('./components/Auth/Login'))
const Register = lazy(() => import('./components/Auth/Register'))
const ForgotPassword = lazy(() => import('./components/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./components/Auth/ResetPassword'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const OrderConfirmationTransfer = lazy(() => import('./pages/OrderConfirmationTransfer'))
const UserProfile = lazy(() => import('./components/Profile/UserProfile'))

// Páginas de pago
const PagoExito = lazy(() => import('./pages/PagoExitoso'))
const PagoError = lazy(() => import('./pages/PagoError'))
const PagoPendiente = lazy(() => import('./pages/PagoPendiente'))

// Páginas legales
const PrivacyPolicy = lazy(() => import('./components/Footer/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./components/Footer/TermsOfService'))
const CookiePolicy = lazy(() => import('./components/Footer/CookiePolicy'))
const FyQ = lazy(() => import('./components/Footer/Fya'))

// Componentes de layout (NO lazy - siempre disponibles)
import SidebarCategories from './components/SlidebarCategories/SlidebarCategories'
import MainLayout from './components/Layout/MainLayout'

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN - App.jsx
 * 
 * Este es el componente raíz de la aplicación React. Configura:
 * 1. Proveedores de contexto global (Auth, Cart, Search, Favorites)
 * 2. Estructura de layout principal (Header, Sidebar, Main Content, Footer)
 * 3. Sistema de enrutamiento con React Router
 * 4. Lazy loading para optimización de rendimiento
 * 5. Componentes globales (WhatsApp button)
 * 
 * Estructura jerárquica:
 * - AuthProvider (más externo - toda la app necesita auth)
 *   - CartProvider (necesita auth para usuario)
 *     - SearchProvider (búsqueda global)
 *       - FavoritesProvider (favoritos del usuario)
 *         - Layout y rutas
 * 
 * @component
 * @returns {JSX.Element} Aplicación completa con estructura de layout y rutas
 */
function App() {
  return (
    /**
     * AUTH PROVIDER
     * 
     * Provee contexto de autenticación a toda la aplicación.
     * Contiene estado de usuario, token, funciones de login/logout.
     * Es el provider más externo porque toda la app necesita acceso a autenticación.
     */
    <AuthProvider>
      /**
       * CART PROVIDER
       * 
       * Provee contexto del carrito de compras.
       * Depende de AuthProvider porque necesita información del usuario.
       * Maneja: items del carrito, totales, funciones add/remove/update.
       */
      <CartProvider>
        /**
         * SEARCH PROVIDER
         * 
         * Provee contexto de búsqueda global.
         * Permite compartir el término de búsqueda entre componentes.
         * Independiente pero útil junto con otros providers.
         */
        <SearchProvider>
          /**
           * FAVORITES PROVIDER
           * 
           * Provee contexto de favoritos del usuario.
           * Depende de AuthProvider (favoritos son por usuario).
           * Maneja: lista de favoritos, funciones toggle/add/remove.
           */
          <FavoritesProvider>
            {/* CONTENEDOR PRINCIPAL DE LA APLICACIÓN */}
            <div className="App">
              
              {/* 
                HEADER GLOBAL
                Siempre visible, carga inmediatamente.
                Contiene: logo, navegación, búsqueda, carrito, usuario.
              */}
              <Header />
              
              {/* 
                CONTENEDOR PRINCIPAL QUE INCLUYE SIDEBAR Y CONTENIDO
                Estructura de dos columnas: sidebar izquierdo + contenido principal
              */}
              <div className="main-app-container">
                
                {/* 
                  SIDEBAR DE CATEGORÍAS
                  Carga inmediatamente, siempre disponible.
                  Contiene: navegación por categorías, filtros, promociones.
                */}
                <SidebarCategories />
                
                {/* 
                  CONTENEDOR DE CONTENIDO PRINCIPAL
                  Contiene el área de contenido principal y el footer
                */}
                <div className="main-content-wrapper">
                  
                  {/* 
                    ÁREA DE CONTENIDO PRINCIPAL
                    Aquí se renderizan las diferentes páginas/rutas
                  */}
                  <main className="main-content">
                    {/* 
                      SUSPENSE PARA LAZY LOADING
                      Muestra LoadingSpinner mientras se cargan componentes lazy
                      Wrapper común para todas las rutas lazy
                    */}
                    <Suspense fallback={<LoadingSpinner />}>
                      
                      {/* 
                        SISTEMA DE RUTAS DE REACT ROUTER
                        Define todas las rutas de la aplicación
                        Algunas rutas usan MainLayout, otras no
                      */}
                      <Routes>
                        
                        {/* 
                          RUTA PRINCIPAL (HOME)
                          URL: /
                          Layout: Con sidebar (MainLayout)
                          Contenido: Banner + Home component
                        */}
                        <Route path="/" element={
                          <MainLayout>
                            <Banner />
                            <Home />
                          </MainLayout>
                        } />
                        
                        {/* 
                          RUTA DE PRODUCTOS
                          URL: /products
                          Layout: Con sidebar (MainLayout)
                          Contenido: Catálogo completo de productos
                        */}
                        <Route path="/products" element={
                          <MainLayout>
                            <Products />
                          </MainLayout>
                        } />
                        
                        {/* 
                          RUTA DE CATEGORÍAS
                          URL: /categories
                          Layout: Con sidebar (MainLayout)
                          Contenido: Exploración por categorías
                        */}
                        <Route path="/categories" element={
                          <MainLayout>
                            <Categories />
                          </MainLayout>
                        } />
                        
                        {/* ==================================================
                           RUTAS SIN SIDEBAR (Layout diferente)
                        ================================================== */}
                        
                        {/* 
                          DETALLES DE PRODUCTO
                          URL: /product/:productId
                          Layout: Sin sidebar - pantalla completa
                          Contenido: Vista detallada de un producto
                        */}
                        <Route path="/product/:productId" element={<ProductDetails />} />
                        
                        {/* 
                          FAVORITOS DEL USUARIO
                          URL: /favorites
                          Layout: Sin sidebar
                          Contenido: Lista de productos favoritos
                        */}
                        <Route path="/favorites" element={<Favorites />} />
                        
                        {/* ==================================================
                           RUTAS DE AUTENTICACIÓN
                        ================================================== */}
                        
                        {/* 
                          LOGIN
                          URL: /login
                          Layout: Sin sidebar - formulario centrado
                        */}
                        <Route path="/login" element={<Login />} />
                        
                        {/* 
                          REGISTRO
                          URL: /register
                          Layout: Sin sidebar - formulario centrado
                        */}
                        <Route path="/register" element={<Register />} />
                        
                        {/* 
                          RECUPERACIÓN DE CONTRASEÑA
                          URL: /forgot-password
                          Layout: Sin sidebar - formulario
                        */}
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        
                        {/* 
                          RESTABLECIMIENTO DE CONTRASEÑA (con token)
                          URL: /reset-password/:token
                          Layout: Sin sidebar - formulario
                        */}
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        
                        {/* 
                          RESTABLECIMIENTO DE CONTRASEÑA (sin token)
                          URL: /reset-password
                          Layout: Sin sidebar - formulario
                        */}
                        <Route path="/reset-password" element={<ResetPassword />} />
                        
                        {/* ==================================================
                           RUTAS DE CARRITO Y CHECKOUT
                        ================================================== */}
                        
                        {/* 
                          CARRITO DE COMPRAS
                          URL: /cart
                          Layout: Sin sidebar - vista de carrito
                        */}
                        <Route path="/cart" element={<Cart />} />
                        
                        {/* 
                          CHECKOUT / PROCESO DE PAGO
                          URL: /checkout
                          Layout: Sin sidebar - formulario de pago
                        */}
                        <Route path="/checkout" element={<Checkout />} />
                        
                        {/* 
                          CONFIRMACIÓN DE ORDEN (PAGO CON TARJETA)
                          URL: /order-confirmation
                          Layout: Sin sidebar - confirmación
                        */}
                        <Route path="/order-confirmation" element={<OrderConfirmation />} />
                        
                        {/* 
                          CONFIRMACIÓN DE ORDEN (TRANSFERENCIA)
                          URL: /order-confirmation-transfer
                          Layout: Sin sidebar - confirmación con datos bancarios
                        */}
                        <Route path="/order-confirmation-transfer" element={<OrderConfirmationTransfer />} />
                        
                        {/* 
                          PERFIL DE USUARIO
                          URL: /my-account
                          Layout: Sin sidebar - panel de usuario
                        */}
                        <Route path="/my-account" element={<UserProfile />} />
                        
                        {/* ==================================================
                           RUTAS DE ESTADO DE PAGO
                        ================================================== */}
                        
                        {/* 
                          PAGO EXITOSO
                          URL: /pago/exito
                          Layout: Sin sidebar - mensaje de éxito
                        */}
                        <Route path="/pago/exito" element={<PagoExito />} />
                        
                        {/* 
                          ERROR EN PAGO
                          URL: /pago/error
                          Layout: Sin sidebar - mensaje de error
                        */}
                        <Route path="/pago/error" element={<PagoError />} />
                        
                        {/* 
                          PAGO PENDIENTE
                          URL: /pago/pendiente
                          Layout: Sin sidebar - mensaje de pendiente
                        */}
                        <Route path="/pago/pendiente" element={<PagoPendiente />} />
                        
                        {/* ==================================================
                           RUTAS LEGALES Y AYUDA
                        ================================================== */}
                        
                        {/* 
                          POLÍTICA DE PRIVACIDAD
                          URL: /privacy-policy
                          Layout: Sin sidebar - contenido legal
                        */}
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        
                        {/* 
                          TÉRMINOS DE SERVICIO
                          URL: /terms-of-service
                          Layout: Sin sidebar - contenido legal
                        */}
                        <Route path="/terms-of-service" element={<TermsOfService />} />
                        
                        {/* 
                          POLÍTICA DE COOKIES
                          URL: /cookie-policy
                          Layout: Sin sidebar - contenido legal
                        */}
                        <Route path="/cookie-policy" element={<CookiePolicy />} />
                        
                        {/* 
                          PREGUNTAS FRECUENTES (FAQ)
                          URL: /faq
                          Layout: Sin sidebar - ayuda
                        */}
                        <Route path="/faq" element={<FyQ />} />
                        
                      </Routes>
                    </Suspense>
                  </main>
                  
                  {/* 
                    FOOTER GLOBAL
                    Siempre visible en la parte inferior.
                    Contiene: enlaces, información de contacto, redes sociales.
                  */}
                  <Footer />
                </div>
              </div>
              
              {/* 
                BOTÓN DE WHATSAPP FLOTANTE
                Siempre visible, posición fija.
                Permite contacto directo con soporte.
              */}
              <WhatsappButton />
            </div>
          </FavoritesProvider>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App;