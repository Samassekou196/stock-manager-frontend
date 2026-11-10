import React, { useState, useEffect } from 'react';
import ProductService from '../../api/productService';
import '../categories/CategoriesPage.css';
import './AlertsPage.css';

function AlertsPage() {
  const [lowStock, setLowStock] = useState([]);
  const [outOfStock, setOutOfStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAlerts(); }, []);

  const loadAlerts = async () => {
    try {
      const [lowRes, outRes] = await Promise.all([
        ProductService.getLowStock(),
        ProductService.getOutOfStock(),
      ]);
      setLowStock(Array.isArray(lowRes.data) ? lowRes.data : []);
      setOutOfStock(Array.isArray(outRes.data) ? outRes.data : []);
    } catch (err) {
      setError('Erreur lors du chargement des alertes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Alertes Stock</h1>
        <button className="btn-refresh" onClick={loadAlerts}>↻ Actualiser</button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <>
          {/* Résumé */}
          <div className="alerts-summary">
            <div className="alert-summary-card danger">
              <span className="alert-summary-icon">🔴</span>
              <div>
                <span className="alert-summary-value">{outOfStock.length}</span>
                <span className="alert-summary-label">Produit(s) en rupture</span>
              </div>
            </div>
            <div className="alert-summary-card warning">
              <span className="alert-summary-icon">🟡</span>
              <div>
                <span className="alert-summary-value">{lowStock.length}</span>
                <span className="alert-summary-label">Produit(s) en stock faible</span>
              </div>
            </div>
            {outOfStock.length === 0 && lowStock.length === 0 && (
              <div className="alert-summary-card success">
                <span className="alert-summary-icon">🟢</span>
                <div>
                  <span className="alert-summary-value">✓</span>
                  <span className="alert-summary-label">Tous les stocks sont OK</span>
                </div>
              </div>
            )}
          </div>

          {/* Produits en rupture */}
          <div className="alert-section">
            <div className="alert-section-header danger">
              <h2>🔴 Produits en rupture de stock</h2>
              <span className="badge-danger">{outOfStock.length}</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Fournisseur</th>
                    <th>Prix unitaire</th>
                    <th>Stock</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {outOfStock.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty">
                        ✅ Aucun produit en rupture de stock.
                      </td>
                    </tr>
                  ) : (
                    outOfStock.map((p) => (
                      <tr key={p.id} className="row-danger">
                        <td>{p.id}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category?.name || '—'}</td>
                        <td>{p.supplier?.name || '—'}</td>
                        <td>{Number(p.price).toLocaleString()} FCFA</td>
                        <td>{p.quantity}</td>
                        <td><span className="badge-danger">Rupture</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Produits stock faible */}
          <div className="alert-section">
            <div className="alert-section-header warning">
              <h2>🟡 Produits en stock faible</h2>
              <span className="badge-warning">{lowStock.length}</span>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Fournisseur</th>
                    <th>Prix unitaire</th>
                    <th>Stock actuel</th>
                    <th>Seuil alerte</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty">
                        ✅ Aucun produit en stock faible.
                      </td>
                    </tr>
                  ) : (
                    lowStock.map((p) => (
                      <tr key={p.id} className="row-warning">
                        <td>{p.id}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.category?.name || '—'}</td>
                        <td>{p.supplier?.name || '—'}</td>
                        <td>{Number(p.price).toLocaleString()} FCFA</td>
                        <td>{p.quantity}</td>
                        <td>{p.alertThreshold}</td>
                        <td><span className="badge-warning">Stock faible</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AlertsPage;