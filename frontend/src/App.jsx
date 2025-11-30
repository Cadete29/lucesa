import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Header from './components/Header/Header'
import Banner from './components/Banner/Banner'
import Home from './components/Home/Home'
import Footer from './components/Footer/Footer'
import Products from './pages/Products'
import Categories from './pages/Categories'
import ProductDetails from './components/ProductDetails/ProductDetails'
import Favorites from './pages/Favorites'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import ForgotPassword from './components/Auth/ForgotPassword'
import ResetPassword from './components/Auth/ResetPassword'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import UserProfile from './components/Profile/UserProfile';
import PagoExito from './pages/PagoExitoso';
import PagoError from './pages/PagoError';
import PagoPendiente from './pages/PagoPendiente';
import './App.css'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <FavoritesProvider>
            <div className="App">
              <Header />
              <main>
                <Routes>
                  <Route path="/" element={
                    <>
                      <Banner />
                      <Home />
                    </>
                  } />
                  <Route path="/products" element={<Products />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/product/:productId" element={<ProductDetails />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  {/* RUTA CORREGIDA PARA RESET PASSWORD */}
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  {/* RUTA ALTERNATIVA POR SI ACASO */}
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
                  <Route path="/my-account" element={<UserProfile />} />
                  <Route path="/pago/exito" element={<PagoExito />} />
                  <Route path="/pago/error" element={<PagoError />} />
                  <Route path="/pago/pendiente" element={<PagoPendiente />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </FavoritesProvider>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App