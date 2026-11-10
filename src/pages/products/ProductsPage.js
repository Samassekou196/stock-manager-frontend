import React, { useState, useEffect } from 'react';
import ProductService from '../../api/productService';
import CategoryService from '../../api/categoryService';
import SupplierService from '../../api/supplierService';
import '../../pages/categories/CategoriesPage.css';
import './ProductsPage.css';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', quantity: '',
    alertThreshold: 5, wholesalePrice: '', wholesaleQuantity: '',
    wholesaleUnit: '', unitType: 'piece', unitLabel: '',
    isFractional: false, baseUnitPrice: '', minQuantity: '',
    quickSaleAmounts: '', barcode: '', sku: '', brand: '', purchasePrice: '', trackExpiry: false
  });
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        ProductService.getAll(),
        CategoryService.getAll(),
        SupplierService.getAll(),
      ]);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      const res = await ProductService.getAll();
      setProducts(Array.isArray(res.data) ? res.data : []);
    } else {
      const res = await ProductService.search(value);
      setProducts(Array.isArray(res.data) ? res.data : []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price || formData.quantity === '' || !categoryId || !supplierId) {
      setError('Tous les champs obligatoires doivent être remplis.');
      return;
    }
    try {
      if (editingProduct) {
        await ProductService.update(editingProduct.id, formData, categoryId, supplierId);
      } else {
        await ProductService.create(formData, categoryId, supplierId);
      }
      resetForm();
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      quantity: product.quantity,
      alertThreshold: product.alertThreshold || 5,
      wholesalePrice: product.wholesalePrice || '',
      wholesaleQuantity: product.wholesaleQuantity || '',
      wholesaleUnit: product.wholesaleUnit || '',
      unitType: product.unitType || 'piece',
      unitLabel: product.unitLabel || '',
      isFractional: product.isFractional || false,
      baseUnitPrice: product.baseUnitPrice || '',
      minQuantity: product.minQuantity || '',
      quickSaleAmounts: product.quickSaleAmounts || '',
      barcode: product.barcode || '', sku: product.sku || '', brand: product.brand || '',
      purchasePrice: product.purchasePrice || '', trackExpiry: Boolean(product.trackExpiry),
    });
    setCategoryId(product.category?.id || '');
    setSupplierId(product.supplier?.id || '');
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression de ce produit ?')) {
      try {
        await ProductService.delete(id);
        loadAll();
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de supprimer ce produit.');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '', description: '', price: '', quantity: '',
      alertThreshold: 5, wholesalePrice: '', wholesaleQuantity: '',
      wholesaleUnit: '', unitType: 'piece', unitLabel: '',
      isFractional: false, baseUnitPrice: '', minQuantity: '',
      quickSaleAmounts: '', barcode: '', sku: '', brand: '', purchasePrice: '', trackExpiry: false
    });
    setCategoryId('');
    setSupplierId('');
    setError('');
  };

  const getStockStatus = (product) => {
    if (product.quantity === 0) return <span className="badge-danger">Rupture</span>;
    if (product.quantity <= product.alertThreshold) return <span className="badge-warning">Stock faible</span>;
    return <span className="badge-success">En stock</span>;
  };

  const getUnitDisplay = (product) => {
    const types = {
      piece: 'Pièce', kg: 'Kg', g: 'Gramme',
      litre: 'Litre', cl: 'Cl', ml: 'Ml',
      sachet: 'Sachet', boite: 'Boîte', autre: 'Autre',
    };
    const label = product.unitLabel ? `${product.unitLabel} ` : '';
    const type = types[product.unitType] || 'Pièce';
    return label ? `${label}(${type})` : type;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Produits</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Nouveau produit
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h2>{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h2>

          {/* Informations de base */}
          <div className="form-section-title">📦 Informations de base</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input type="text" value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Huile végétale, Sucre blanc..." />
            </div>
            <div className="form-group">
              <label>Quantité en stock *</label>
              <input type="number" value={formData.quantity} disabled={Boolean(editingProduct)}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Quantité" min="0" step="0.01" />
              {editingProduct && <small>Modifiez le stock depuis Inventaire pour conserver l’historique.</small>}
            </div>
            <div className="form-group">
              <label>Code-barres</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder="EAN / UPC" maxLength="64" />
            </div>
            <div className="form-group">
              <label>Référence interne (SKU)</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Référence produit" maxLength="64" />
            </div>
            <div className="form-group">
              <label>Marque</label>
              <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Marque" maxLength="120" />
            </div>
            <div className="form-group">
              <label>Catégorie *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">-- Choisir une catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fournisseur *</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">-- Choisir un fournisseur --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Seuil d'alerte stock</label>
              <input type="number" value={formData.alertThreshold}
                onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                placeholder="Ex: 5" min="0" />
            </div>
            <div className="form-group">
              <label>Coût d’achat unitaire (FCFA)</label>
              <input type="number" min="0" step="any" value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                placeholder="Coût d'achat" />
            </div>
            <div className="form-group">
              <label className="toggle-label">
                <input type="checkbox" checked={Boolean(formData.trackExpiry)}
                  onChange={(e) => setFormData({ ...formData, trackExpiry: e.target.checked })} />
                Suivre lots et dates de péremption
              </label>
            </div>
          </div>

          {/* Type de vente */}
          <div className="form-section-title">🏷️ Type de vente</div>
          <div className="form-group">
            <label>Ce produit se vend-il à la mesure ? (litre, kg, gramme...)</label>
            <div className="toggle-row">
              <label className="toggle-label">
                <input type="checkbox"
                  checked={formData.isFractional}
                  onChange={(e) => setFormData({ ...formData, isFractional: e.target.checked })}
                />
                <span>Oui, ce produit se vend à la mesure</span>
              </label>
            </div>
          </div>

          {!formData.isFractional ? (
            // Vente à l'unité normale
            <div className="form-grid">
              <div className="form-group">
                <label>Prix unitaire (FCFA) *</label>
                <input type="number" value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="Ex: 500" min="0" step="1" />
              </div>
              <div className="form-group">
                <label>Type d'unité</label>
                <select value={formData.unitType}
                  onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}>
                  <option value="piece">Pièce (unité)</option>
                  <option value="sachet">Sachet</option>
                  <option value="boite">Boîte</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          ) : (
            // Vente à la mesure (litre, kg, etc.)
            <div className="fractional-section">
              <div className="fractional-info">
                💡 Ce mode permet de vendre par litre, kg, gramme, etc. Le caissier verra un menu avec les montants rapides, les fractions (1/4, 1/2, 1, 1.5...) et pourra saisir une quantité libre si besoin.
              </div>
              <div className="form-grid">
                <div className="form-group">
  <label>Unité de mesure</label>
  <select value={formData.unitType}
    onChange={(e) => {
      const map = { litre: 'L', kg: 'kg', g: 'g', cl: 'cl', ml: 'ml', autre: '' };
      setFormData({ ...formData, unitType: e.target.value, unitLabel: map[e.target.value] || '' });
    }}>
    <option value="litre">Litre (L)</option>
    <option value="kg">Kilogramme (kg)</option>
    <option value="g">Gramme (g)</option>
    <option value="cl">Centilitre (cl)</option>
    <option value="ml">Millilitre (ml)</option>
    <option value="autre">Autre</option>
  </select>
</div>
<div className="form-group">
  <label>Label affiché</label>
  <input type="text" value={formData.unitLabel}
    onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
    placeholder="Ex: L, kg, g" />
</div>
                <div className="form-group">
                  <label>Prix par unité (FCFA/{formData.unitType}) *</label>
                  <input type="number" value={formData.baseUnitPrice}
                    onChange={(e) => setFormData({ ...formData, baseUnitPrice: e.target.value, price: e.target.value })}
                    placeholder={`Ex: 1000 FCFA/${formData.unitType}`} min="0" step="1" />
                </div>
                <div className="form-group">
                  <label>Vente minimum</label>
                  <input type="number" value={formData.minQuantity}
                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                    placeholder="Ex: 0.1 (pour 100ml)" min="0" step="0.01" />
                </div>
                <div className="form-group">
                  <label>Prix minimum de vente (FCFA)</label>
                  <input type="number" value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ex: 100 FCFA minimum" min="0" step="1" />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Montants rapides (FCFA, séparés par une virgule)</label>
                  <input type="text" value={formData.quickSaleAmounts}
                    onChange={(e) => setFormData({ ...formData, quickSaleAmounts: e.target.value })}
                    placeholder="Ex: 100,200 (petites sommes fréquemment demandées par les clients)" />
                </div>
              </div>
              <div className="fractional-example">
                {formData.baseUnitPrice && formData.unitType && (
                  <div className="example-box">
                    <strong>Exemples de vente :</strong>
                    <span>100 FCFA → {(100 / Number(formData.baseUnitPrice || 1)).toFixed(2)} {formData.unitType}</span>
                    <span>200 FCFA → {(200 / Number(formData.baseUnitPrice || 1)).toFixed(2)} {formData.unitType}</span>
                    <span>500 FCFA → {(500 / Number(formData.baseUnitPrice || 1)).toFixed(2)} {formData.unitType}</span>
                    <span>1000 FCFA → {(1000 / Number(formData.baseUnitPrice || 1)).toFixed(2)} {formData.unitType}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vente en gros */}
          <div className="form-section-title">📦 Vente en gros (optionnel)</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Prix en gros (FCFA)</label>
              <input type="number" value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                placeholder="Ex: 6000" min="0" step="1" />
            </div>
            <div className="form-group">
              <label>Quantité par conditionnement</label>
              <input type="number" value={formData.wholesaleQuantity}
                onChange={(e) => setFormData({ ...formData, wholesaleQuantity: e.target.value })}
                placeholder="Ex: 24" min="1" />
            </div>
            <div className="form-group">
              <label>Nom du conditionnement</label>
              <input type="text" value={formData.wholesaleUnit}
                onChange={(e) => setFormData({ ...formData, wholesaleUnit: e.target.value })}
                placeholder="Ex: carton, sac, bidon, pack..." />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description du produit" rows={2} />
          </div>

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>
              {editingProduct ? 'Modifier' : 'Créer'}
            </button>
            <button className="btn-secondary" onClick={resetForm}>Annuler</button>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input type="text" value={search} onChange={handleSearch}
          placeholder="Rechercher un produit..." />
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nom</th>
                <th>Prix</th>
                <th>Unité</th>
                <th>Prix gros</th>
                <th>Stock</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty">Aucun produit trouvé.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td><strong>{product.name}</strong></td>
                    <td>
                      {Number(product.price).toLocaleString()} FCFA
                      {product.isFractional && (
                        <span className="unit-badge">/{product.unitType}</span>
                      )}
                    </td>
                    <td>{getUnitDisplay(product)}</td>
                    <td>
                      {product.wholesalePrice
                        ? `${Number(product.wholesalePrice).toLocaleString()} FCFA / ${product.wholesaleUnit || 'gros'}`
                        : '—'}
                    </td>
                    <td>
                      {product.quantity}
                      {product.isFractional ? ` ${product.unitType}` : ''}
                    </td>
                    <td>{product.category?.name || '—'}</td>
                    <td>{getStockStatus(product)}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(product)}>Modifier</button>
                      <button className="btn-delete" onClick={() => handleDelete(product.id)}>Supprimer</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;
