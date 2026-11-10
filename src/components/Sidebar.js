import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiTag, FiTruck, FiUsers, FiShoppingCart, FiSettings, FiBarChart2, FiBell, FiSearch, FiLogOut, FiClipboard, FiArchive } from 'react-icons/fi';
import AuthService from '../api/authService';
import './Sidebar.css';

const allMenuItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: <FiGrid />, roles: ['ADMIN'] },
  { path: '/categories', label: 'Catégories', icon: <FiTag />, roles: ['ADMIN'] },
  { path: '/suppliers', label: 'Fournisseurs', icon: <FiTruck />, roles: ['ADMIN'] },
  { path: '/purchases', label: 'Achats fournisseurs', icon: <FiClipboard />, roles: ['ADMIN'] },
  { path: '/inventory', label: 'Inventaire', icon: <FiArchive />, roles: ['ADMIN'] },
  { path: '/products', label: 'Produits', icon: <FiPackage />, roles: ['ADMIN'] },
  { path: '/customers', label: 'Clients', icon: <FiUsers />, roles: ['ADMIN'] },
  { path: '/sales', label: 'Ventes', icon: <FiShoppingCart />, roles: ['ADMIN', 'CASHIER'] },
  { path: '/reports', label: 'Rapports', icon: <FiBarChart2 />, roles: ['ADMIN'] },
  { path: '/alerts', label: 'Alertes Stock', icon: <FiBell />, roles: ['ADMIN'] },
  { path: '/search', label: 'Recherche', icon: <FiSearch />, roles: ['ADMIN'] },
  { path: '/settings', label: 'Paramètres', icon: <FiSettings />, roles: ['ADMIN'] },
];

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } finally {
      onLogout();
      navigate('/login');
    }
  };

  const menuItems = allMenuItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <FiGrid size={24} />
        <span>Stock Manager</span>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">{user.role}</span>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
