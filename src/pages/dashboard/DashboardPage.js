import React, { useState, useEffect } from 'react';
import DashboardService from '../../api/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './DashboardPage.css';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const response = await DashboardService.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleString('fr-FR'); }
    catch { return '—'; }
  };

  if (loading) return <div className="dashboard-loading">Chargement...</div>;
  if (error) return <div className="alert-error">{error}</div>;
  if (!stats) return null;

  const pieData = [
    { name: 'En stock', value: stats.totalProducts - stats.produitsRupture - stats.produitsStockFaible },
    { name: 'Stock faible', value: stats.produitsStockFaible },
    { name: 'Rupture', value: stats.produitsRupture },
  ];

  const COLORS = ['#16a34a', '#d97706', '#dc2626'];

  const barData = [
    { name: "Aujourd'hui", montant: Number(stats.caJour) },
    { name: 'Ce mois', montant: Number(stats.caMois) },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
        <button className="btn-refresh" onClick={loadStats}>↻ Actualiser</button>
      </div>

      {/* Cartes statistiques */}
      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProducts}</span>
            <span className="stat-label">Produits</span>
          </div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">🏷️</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalCategories}</span>
            <span className="stat-label">Catégories</span>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalSuppliers}</span>
            <span className="stat-label">Fournisseurs</span>
          </div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalCustomers}</span>
            <span className="stat-label">Clients</span>
          </div>
        </div>
        <div className="stat-card teal">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalSales}</span>
            <span className="stat-label">Ventes totales</span>
          </div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-value">{formatAmount(stats.caJour)}</span>
            <span className="stat-label">CA du jour (FCFA)</span>
          </div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-value">{formatAmount(stats.caMois)}</span>
            <span className="stat-label">CA du mois (FCFA)</span>
          </div>
        </div>
        <div className="stat-card dark">
          <div className="stat-icon">🏪</div>
          <div className="stat-info">
            <span className="stat-value">{formatAmount(stats.valeurStock)}</span>
            <span className="stat-label">Valeur stock (FCFA)</span>
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="alerts-row">
        {stats.produitsRupture > 0 && (
          <div className="alert-card danger">
            <span>🔴</span>
            <span><strong>{stats.produitsRupture}</strong> produit(s) en rupture de stock</span>
          </div>
        )}
        {stats.produitsStockFaible > 0 && (
          <div className="alert-card warning">
            <span>🟡</span>
            <span><strong>{stats.produitsStockFaible}</strong> produit(s) en stock faible</span>
          </div>
        )}
        {stats.produitsRupture === 0 && stats.produitsStockFaible === 0 && (
          <div className="alert-card success">
            <span>🟢</span>
            <span>Tous les stocks sont en bonne santé !</span>
          </div>
        )}
      </div>

      {/* Graphiques */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>Chiffre d'affaires</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} FCFA`} />
              <Bar dataKey="montant" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>État du stock</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dernières ventes */}
      <div className="recent-sales">
        <h3>Dernières ventes</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>N° Facture</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.derniereVentes && stats.derniereVentes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">Aucune vente enregistrée.</td>
                </tr>
              ) : (
                stats.derniereVentes?.map((sale, i) => (
                  <tr key={i}>
                    <td>{sale.id}</td>
                    <td>{sale.invoiceNumber}</td>
                    <td>{formatAmount(sale.totalAmount)} FCFA</td>
                    <td>{formatDate(sale.saleDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;