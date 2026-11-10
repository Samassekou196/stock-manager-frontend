import React, { useState } from 'react';
import ProductService from '../../api/productService';
import CustomerService from '../../api/customerService';
import SupplierService from '../../api/supplierService';
import CategoryService from '../../api/categoryService';
import '../categories/CategoriesPage.css';
import './SearchPage.css';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (query.trim() === '') return;
    setLoading(true);
    setError('');
    try {
      const [productsRes, customersRes, suppliersRes, categoriesRes] = await Promise.all([
        ProductService.search(query),
        CustomerService.search(query),
        SupplierService.search(query),
        CategoryService.search(query),
      ]);
      setResults({
        products: Array.isArray(productsRes.data) ? productsRes.data : [],
        customers: Array.isArray(customersRes.data) ? customersRes.data : [],
        suppliers: Array.isArray(suppliersRes.data) ? suppliersRes.data : [],
        categories: Array.isArray(categoriesRes.data) ? categoriesRes.data : [],
      });
    } catch (err) {
      setError('Erreur lors de la recherche.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalResults = results
    ? results.products.length + results.customers.length +
      results.suppliers.length + results.categories.length
    : 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Recherche globale</h1>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="search-hero">
        <div className="search-hero-input">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un produit, client, fournisseur, catégorie..."
            autoFocus
          />
          <button className="btn-primary" onClick={handleSearch}>
            Rechercher
          </button>
        </div>
        {results && (
          <p className="search-result-count">
            {totalResults} résultat(s) trouvé(s) pour "<strong>{query}</strong>"
          </p>
        )}
      </div>

      {loading && <p>Recherche en cours...</p>}

      {results && (
        <div className="search-results">

          {/* Produits */}
          <div className="search-section">
            <div className="search-section-header">
              <h2>📦 Produits</h2>
              <span className="result-count">{results.products.length}</span>
            </div>
            {results.products.length === 0 ? (
              <p className="no-result">Aucun produit trouvé.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>Prix unitaire</th>
                      <th>Stock</th>
                      <th>Catégorie</th>
                      <th>Fournisseur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>{Number(p.price).toLocaleString()} FCFA</td>
                        <td>
                          {p.quantity === 0
                            ? <span className="badge-danger">Rupture</span>
                            : p.quantity <= p.alertThreshold
                            ? <span className="badge-warning">{p.quantity}</span>
                            : <span className="badge-success">{p.quantity}</span>
                          }
                        </td>
                        <td>{p.category?.name || '—'}</td>
                        <td>{p.supplier?.name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clients */}
          <div className="search-section">
            <div className="search-section-header">
              <h2>👥 Clients</h2>
              <span className="result-count">{results.customers.length}</span>
            </div>
            {results.customers.length === 0 ? (
              <p className="no-result">Aucun client trouvé.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Téléphone</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.customers.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td><strong>{c.lastName}</strong></td>
                        <td>{c.firstName}</td>
                        <td>{c.phone || '—'}</td>
                        <td>{c.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Fournisseurs */}
          <div className="search-section">
            <div className="search-section-header">
              <h2>🚚 Fournisseurs</h2>
              <span className="result-count">{results.suppliers.length}</span>
            </div>
            {results.suppliers.length === 0 ? (
              <p className="no-result">Aucun fournisseur trouvé.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>Téléphone</th>
                      <th>Email</th>
                      <th>Ville</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.suppliers.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td><strong>{s.name}</strong></td>
                        <td>{s.phone || '—'}</td>
                        <td>{s.email || '—'}</td>
                        <td>{s.city || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Catégories */}
          <div className="search-section">
            <div className="search-section-header">
              <h2>🏷️ Catégories</h2>
              <span className="result-count">{results.categories.length}</span>
            </div>
            {results.categories.length === 0 ? (
              <p className="no-result">Aucune catégorie trouvée.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nom</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.categories.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td><strong>{c.name}</strong></td>
                        <td>{c.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;