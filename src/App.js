import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/login/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import SuppliersPage from './pages/suppliers/SuppliersPage';
import ProductsPage from './pages/products/ProductsPage';
import CustomersPage from './pages/customers/CustomersPage';
import SalesPage from './pages/sales/SalesPage';
import SettingsPage from './pages/settings/SettingsPage';
import ReportsPage from './pages/reports/ReportsPage';
import AlertsPage from './pages/alerts/AlertsPage';
import SearchPage from './pages/search/SearchPage';
import PurchasesPage from './pages/purchases/PurchasesPage';
import InventoryPage from './pages/inventory/InventoryPage';
import AuthService from './api/authService';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    let active = true;
    AuthService.getSession()
      .then((session) => { if (active) setUser(session); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoadingSession(false); });
    return () => { active = false; };
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loadingSession) {
    return <div className="app-loading" role="status">Chargement de votre session…</div>;
  }

  const getHomePage = () => {
    if (!user) return '/login';
    if (user.role === 'CASHIER') return '/sales';
    return '/dashboard';
  };

  const ProtectedRoute = ({ element, roles }) => {
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) {
      return <Navigate to={getHomePage()} />;
    }
    return element;
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to={getHomePage()} />} />
          <Route path="/login" element={<Navigate to={getHomePage()} />} />

          {/* ADMIN + CAISSIER */}
          <Route path="/sales" element={
            <ProtectedRoute element={<SalesPage />} roles={['ADMIN', 'CASHIER']} />
          } />

          {/* ADMIN uniquement */}
          <Route path="/dashboard" element={
            <ProtectedRoute element={<DashboardPage />} roles={['ADMIN']} />
          } />
          <Route path="/categories" element={
            <ProtectedRoute element={<CategoriesPage />} roles={['ADMIN']} />
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute element={<SuppliersPage />} roles={['ADMIN']} />
          } />
          <Route path="/purchases" element={
            <ProtectedRoute element={<PurchasesPage />} roles={['ADMIN']} />
          } />
          <Route path="/inventory" element={
            <ProtectedRoute element={<InventoryPage />} roles={['ADMIN']} />
          } />
          <Route path="/products" element={
            <ProtectedRoute element={<ProductsPage />} roles={['ADMIN']} />
          } />
          <Route path="/customers" element={
            <ProtectedRoute element={<CustomersPage />} roles={['ADMIN']} />
          } />
          <Route path="/reports" element={
            <ProtectedRoute element={<ReportsPage />} roles={['ADMIN']} />
          } />
          <Route path="/alerts" element={
            <ProtectedRoute element={<AlertsPage />} roles={['ADMIN']} />
          } />
          <Route path="/search" element={
            <ProtectedRoute element={<SearchPage />} roles={['ADMIN']} />
          } />
          <Route path="/settings" element={
            <ProtectedRoute element={<SettingsPage />} roles={['ADMIN']} />
          } />

          <Route path="*" element={<Navigate to={getHomePage()} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
