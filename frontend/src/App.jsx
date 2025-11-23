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
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
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
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation" element={<OrderConfirmation />} />
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