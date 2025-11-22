import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { SearchProvider } from './context/SearchContext'
import Header from './components/Header/Header'
import Banner from './components/Banner/Banner'
import Home from './components/Home/Home'
import Footer from './components/Footer/Footer'
import Products from './pages/Products'
import Categories from './pages/Categories'
import ProductDetails from './components/ProductDetails/ProductDetails'
import './App.css'

function App() {
  return (
    <SearchProvider>
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
          </Routes>
        </main>
        <Footer />
      </div>
    </SearchProvider>
  )
}

export default App