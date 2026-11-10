import React, { useState, useEffect, useRef, useCallback } from 'react';
import SaleService from '../../api/saleService';
import ProductService from '../../api/productService';
import '../../pages/categories/CategoriesPage.css';
import './SalesPage.css';

const FRACTION_STEPS = [0.25, 0.5, 1, 1.5, 2, 2.5, 3, 5, 10, 15,25];

function SalesPage() {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedType, setSelectedType] = useState('unit');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedPresetValue, setSelectedPresetValue] = useState('');
  const [montantRecu, setMontantRecu] = useState('');
  const [modePaiement, setModePaiement] = useState('especes');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewingSale, setViewingSale] = useState(null);
  const [printingSale, setPrintingSale] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [searchInvoice, setSearchInvoice] = useState('');
  const [companySettings, setCompanySettings] = useState({
    companyName: 'GESTIONNAIRE DE STOCK',
    phone: '',
    address: '',
    email: '',
    city: '',
  });
  const receiptRef = useRef();

  useEffect(() => {
    loadAll();
    const stored = localStorage.getItem('appSettings');
    if (stored) setCompanySettings(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (productSearch.trim() === '') {
      setFilteredProducts([]);
      return;
    }
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [productSearch, products]);

  const loadAll = async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        SaleService.getAll(),
        ProductService.getAll(),
      ]);
      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...sales];
    const now = new Date();
    if (filterPeriod === 'today') {
      filtered = filtered.filter(s => {
        const d = new Date(s.saleDate);
        return d.toDateString() === now.toDateString();
      });
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(s => new Date(s.saleDate) >= weekAgo);
    } else if (filterPeriod === 'month') {
      filtered = filtered.filter(s => {
        const d = new Date(s.saleDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (filterPeriod === 'year') {
      filtered = filtered.filter(s => {
        return new Date(s.saleDate).getFullYear() === now.getFullYear();
      });
    }
    if (searchInvoice.trim() !== '') {
      filtered = filtered.filter(s =>
        s.invoiceNumber?.toLowerCase().includes(searchInvoice.toLowerCase())
      );
    }
    setFilteredSales(filtered);
  }, [sales, filterPeriod, searchInvoice]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const getTotalFiltered = () => {
    return filteredSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  };

  const getSelectedProduct = () => {
    return products.find((p) => p.id === parseInt(selectedProductId));
  };

  // ---- Helpers vente fractionnée ----

  const getBaseUnitPriceValue = (product) => {
    if (product?.baseUnitPrice) return parseFloat(product.baseUnitPrice);
    return parseFloat(product?.price || 0);
  };

  const getQuickAmounts = (product) => {
    if (!product?.quickSaleAmounts) return [];
    return product.quickSaleAmounts
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0)
      .sort((a, b) => a - b);
  };

  const getFractionLabel = (qty) => {
  const labels = {
    0.25: '1/4', 0.5: '1/2',
    1: '1', 1.5: '1 1/2', 2: '2', 2.5: '2 1/2', 3: '3',
  };
  return labels[qty] || formatQty(qty);
};

  const getMinQuantity = () => {
    const product = getSelectedProduct();
    if (product?.isFractional) {
      return product.minQuantity && product.minQuantity > 0 ? product.minQuantity : 0.01;
    }
    return 1;
  };

  const getQuantityStep = () => {
    const product = getSelectedProduct();
    if (product?.isFractional) {
      return product.minQuantity && product.minQuantity > 0 ? product.minQuantity : 0.1;
    }
    return 1;
  };

  const roundQty = (value) => Math.round(value * 1000) / 1000;

  const formatQty = (value) => {
    const n = Number(value);
    if (isNaN(n)) return '0';
    return n.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
  };

  const handleQuantityInputChange = (e) => {
    const val = parseFloat(e.target.value);
    setSelectedQuantity(isNaN(val) ? '' : val);
  };

  const initializeSaleOptions = (product) => {
    if (product.isFractional) {
      const quickAmounts = getQuickAmounts(product);
      if (quickAmounts.length > 0) {
        handlePresetChange(`quick:${quickAmounts[0]}`, product);
      } else {
        handlePresetChange('frac:1', product);
      }
    } else {
      setSelectedType('unit');
      setSelectedQuantity(1);
      setSelectedPresetValue('');
    }
  };

  const handlePresetChange = (value, productOverride) => {
    const product = productOverride || getSelectedProduct();
    if (!product) return;
    setSelectedPresetValue(value);

    if (value === 'wholesale') {
      setSelectedType('wholesale');
      setSelectedQuantity(1);
    } else if (value === 'free') {
      setSelectedType('unit');
      setSelectedQuantity(product.minQuantity && product.minQuantity > 0 ? product.minQuantity : 1);
    } else if (value.startsWith('quick:')) {
      const amount = parseFloat(value.split(':')[1]);
      const base = getBaseUnitPriceValue(product);
      setSelectedType('unit');
      setSelectedQuantity(base > 0 ? roundQty(amount / base) : 0);
    } else if (value.startsWith('frac:')) {
      const qty = parseFloat(value.split(':')[1]);
      setSelectedType('unit');
      setSelectedQuantity(qty);
    }
  };

  const getSelectedPresetLabel = (product) => {
    if (selectedPresetValue.startsWith('quick:')) {
      const amt = selectedPresetValue.split(':')[1];
      return `${Number(amt).toLocaleString()} FCFA`;
    }
    if (selectedPresetValue.startsWith('frac:')) {
      const qty = selectedPresetValue.split(':')[1];
      return `${getFractionLabel(parseFloat(qty))} ${product.unitLabel || product.unitType || ''}`.trim();
    }
    if (selectedPresetValue === 'free') {
      return `Au ${product.unitLabel || product.unitType || 'détail'}`;
    }
    if (selectedPresetValue === 'wholesale') {
      return `${product.wholesaleUnit || 'Gros'} (x${product.wholesaleQuantity})`;
    }
    return 'Unité';
  };

  // ---- Fin helpers ----

  const getUnitPrice = (product, type) => {
    if (type === 'wholesale' && product.wholesalePrice) {
      return parseFloat(product.wholesalePrice);
    }
    if (type === 'unit' && product.isFractional && product.baseUnitPrice) {
      return parseFloat(product.baseUnitPrice);
    }
    return parseFloat(product.price);
  };

  const getQuantityToDeduct = (product, type, qty) => {
    if (type === 'wholesale' && product.wholesaleQuantity) {
      return qty * product.wholesaleQuantity;
    }
    return qty;
  };

  const addToCart = () => {
    const product = getSelectedProduct();
    if (!product) { setError('Veuillez sélectionner un produit.'); return; }

    const min = getMinQuantity();
    if (!selectedQuantity || selectedQuantity < min) {
      const unit = product.isFractional ? (product.unitLabel || '') : '';
      setError(`La quantité minimum pour ce produit est ${formatQty(min)} ${unit}.`.trim() + '.');
      return;
    }

    const qtyToDeduct = roundQty(getQuantityToDeduct(product, selectedType, selectedQuantity));
    if (qtyToDeduct > product.quantity) {
      setError(`Stock insuffisant. Stock disponible : ${formatQty(product.quantity)} ${product.unitLabel || 'unités'}.`);
      return;
    }

    const unitPrice = getUnitPrice(product, selectedType);
    const subTotal = roundQty(unitPrice * selectedQuantity);

    const typeLabel = product.isFractional
      ? getSelectedPresetLabel(product)
      : (selectedType === 'wholesale'
          ? `${product.wholesaleUnit || 'Gros'} (x${product.wholesaleQuantity})`
          : 'Unité');

    const unitLabelForItem = selectedType === 'wholesale'
      ? (product.wholesaleUnit || '')
      : (product.isFractional ? (product.unitLabel || '') : '');

    const existingIndex = cartItems.findIndex(
      (item) => item.productId === product.id && item.type === selectedType && item.typeLabel === typeLabel
    );

    if (existingIndex >= 0) {
      const updatedCart = [...cartItems];
      updatedCart[existingIndex].quantity = roundQty(updatedCart[existingIndex].quantity + selectedQuantity);
      updatedCart[existingIndex].subTotal = roundQty(updatedCart[existingIndex].subTotal + subTotal);
      updatedCart[existingIndex].qtyToDeduct = roundQty(updatedCart[existingIndex].qtyToDeduct + qtyToDeduct);
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, {
        productId: product.id,
        productName: product.name,
        type: selectedType,
        typeLabel: typeLabel,
        unitLabel: unitLabelForItem,
        quantity: selectedQuantity,
        unitPrice: unitPrice,
        subTotal: subTotal,
        qtyToDeduct: qtyToDeduct,
      }]);
    }

    setSelectedProductId('');
    setProductSearch('');
    setFilteredProducts([]);
    setSelectedQuantity(1);
    setSelectedType('unit');
    setSelectedPresetValue('');
    setError('');
  };

  const removeFromCart = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subTotal, 0);
  };

  const handleSubmitSale = async () => {
    if (cartItems.length === 0) { setError('Veuillez ajouter au moins un produit.'); return; }
    if (modePaiement === 'especes' && montantRecu && Number(montantRecu) < getTotal()) {
      setError('Le montant reçu est insuffisant.');
      return;
    }

   const itemsToSend = cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      saleType: item.type === 'wholesale' ? 'WHOLESALE' : 'EACH',
      unitPrice: item.unitPrice,
      subTotal: item.subTotal,
    }));

    const totalAvantReset = cartItems.reduce((sum, item) => sum + item.subTotal, 0);
    const cartSnapshot = [...cartItems];
    const monnaie = montantRecu ? Math.max(0, Number(montantRecu) - totalAvantReset) : 0;

    try {
      const response = await SaleService.create(null, itemsToSend, {
        paymentMethod: 'CASH',
        amountReceived: montantRecu ? Number(montantRecu) : totalAvantReset,
      });
      const newSale = response.data;
      setSuccessMessage('Vente enregistrée !');
      setShowForm(false);
      setCartItems([]);
      setMontantRecu('');
      setModePaiement('especes');
      setError('');
      loadAll();
      setTimeout(() => setSuccessMessage(''), 4000);
      setPrintingSale({
        ...newSale,
        items: cartSnapshot,
        totalAmount: totalAvantReset,
        montantRecu: montantRecu ? Number(montantRecu) : null,
        monnaie: monnaie,
        modePaiement: modePaiement,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setCartItems([]);
    setSelectedProductId('');
    setProductSearch('');
    setFilteredProducts([]);
    setSelectedQuantity(1);
    setSelectedType('unit');
    setSelectedPresetValue('');
    setMontantRecu('');
    setModePaiement('especes');
    setError('');
  };

  const handlePrint = () => { window.print(); };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleString('fr-FR'); }
    catch { return '—'; }
  };

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) return '0';
    return Number(amount).toLocaleString();
  };

  const getModePaiementLabel = (mode) => {
    switch(mode) {
      case 'especes': return '💵 Espèces';
      case 'wave': return '🔵 Wave';
      case 'orange': return '🟠 Orange Money';
      case 'mtn': return '🟡 MTN Money';
      default: return 'Autre';
    }
  };

  const product = getSelectedProduct();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Ventes</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Nouvelle vente
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {successMessage && <div className="alert-success">{successMessage}</div>}

      {showForm && (
        <div className="form-card">
          <h2>Nouvelle vente</h2>

          <div className="sale-product-row">

            {/* Barre de recherche produit */}
            <div className="form-group" style={{ position: 'relative', flex: 2 }}>
              <label>Produit</label>
              <input
                type="text"
                className="product-search-input"
                placeholder="🔍 Rechercher un produit..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setSelectedProductId('');
                }}
              />
              {productSearch && filteredProducts.length > 0 && (
                <div className="product-search-dropdown">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="product-search-item"
                      onClick={() => {
                        setSelectedProductId(String(p.id));
                        setProductSearch(p.name);
                        setFilteredProducts([]);
                        initializeSaleOptions(p);
                      }}
                    >
                      <span className="product-search-name">{p.name}</span>
                      <span className="product-search-stock">
                        Stock: {formatQty(p.quantity)}{p.unitLabel ? ` ${p.unitLabel}` : ''} | {Number(p.price).toLocaleString()} FCFA
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {productSearch && filteredProducts.length === 0 && !selectedProductId && (
                <div className="product-search-dropdown">
                  <div className="product-search-empty">Aucun produit trouvé</div>
                </div>
              )}
            </div>

            {product?.isFractional ? (
              <>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Mode de vente</label>
                  <select value={selectedPresetValue} onChange={(e) => handlePresetChange(e.target.value)}>
                    {getQuickAmounts(product).map((amt) => (
                      <option key={`quick-${amt}`} value={`quick:${amt}`}>
                        {amt.toLocaleString()} FCFA
                        {getBaseUnitPriceValue(product) > 0
                          ? ` (~${formatQty(amt / getBaseUnitPriceValue(product))} ${product.unitLabel || ''})`
                          : ''}
                      </option>
                    ))}
                    {FRACTION_STEPS.map((qty) => (
                      <option key={`frac-${qty}`} value={`frac:${qty}`}>
                        {getFractionLabel(qty)} {product.unitLabel || product.unitType || ''} — {formatAmount(qty * getBaseUnitPriceValue(product))} FCFA
                      </option>
                    ))}
                    <option value="free">Quantité libre...</option>
                    {product.wholesalePrice && (
                      <option value="wholesale">
                        {product.wholesaleUnit || 'Gros'} (x{product.wholesaleQuantity}) — {formatAmount(product.wholesalePrice)} FCFA
                      </option>
                    )}
                  </select>
                </div>

                {selectedPresetValue === 'free' && (
                  <div className="form-group">
                    <label>Quantité ({product.unitLabel || ''})</label>
                    <input
                      type="number"
                      value={selectedQuantity}
                      min={getMinQuantity()}
                      step={getQuantityStep()}
                      onChange={handleQuantityInputChange}
                    />
                  </div>
                )}

                {selectedPresetValue === 'wholesale' && (
                  <div className="form-group">
                    <label>Nombre de {product.wholesaleUnit || 'unités de gros'}</label>
                    <input
                      type="number"
                      value={selectedQuantity}
                      min="1"
                      onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>À payer</label>
                  <input type="text" readOnly
                    value={`${formatAmount(getUnitPrice(product, selectedType) * selectedQuantity)} FCFA${
                      selectedType === 'unit' ? ` (${formatQty(selectedQuantity)} ${product.unitLabel || ''})` : ''
                    }`} />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>Type de vente</label>
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="unit">Unité</option>
                    {product?.wholesalePrice && (
                      <option value="wholesale">
                        {product?.wholesaleUnit || 'Gros'} (x{product?.wholesaleQuantity})
                      </option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantité</label>
                  <input type="number" value={selectedQuantity} min="1"
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)} />
                </div>

                <div className="form-group">
                  <label>Prix</label>
                  <input type="text" readOnly
                    value={product
                      ? `${getUnitPrice(product, selectedType).toLocaleString()} FCFA`
                      : '—'} />
                </div>
              </>
            )}

            <button className="btn-add-cart" onClick={addToCart}>+ Ajouter</button>
          </div>

          {cartItems.length > 0 && (
            <div className="cart">
              <h3>Panier</h3>
              <table>
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Type</th>
                    <th>Qté</th>
                    <th>Prix unitaire</th>
                    <th>Sous-total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.productName}</td>
                      <td>{item.typeLabel}</td>
                      <td>{formatQty(item.quantity)}{item.unitLabel ? ` ${item.unitLabel}` : ''}</td>
                      <td>{item.unitPrice.toLocaleString()} FCFA</td>
                      <td>{item.subTotal.toLocaleString()} FCFA</td>
                      <td>
                        <button className="btn-delete" onClick={() => removeFromCart(index)}>✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cart-total">
                Total : <strong>{getTotal().toLocaleString()} FCFA</strong>
              </div>
            </div>
          )}

          {cartItems.length > 0 && (
            <div className="paiement-section">
              <h3>Paiement</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Mode de paiement</label>
                  <select value={modePaiement} onChange={(e) => setModePaiement(e.target.value)}>
                    <option value="especes">💵 Espèces</option>
                    <option value="wave">🔵 Wave</option>
                    <option value="orange">🟠 Orange Money</option>
                    <option value="mtn">🟡 MTN Money</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Montant reçu (FCFA)</label>
                  <input
                    type="number"
                    value={montantRecu}
                    onChange={(e) => setMontantRecu(e.target.value)}
                    placeholder="Montant donné par le client"
                    min="0"
                  />
                </div>
              </div>
              {montantRecu && Number(montantRecu) >= getTotal() && (
                <div className="monnaie-display">
                  Monnaie à rendre : <strong>{(Number(montantRecu) - getTotal()).toLocaleString()} FCFA</strong>
                </div>
              )}
              {montantRecu && Number(montantRecu) < getTotal() && (
                <div className="monnaie-insuffisant">
                  ⚠️ Montant insuffisant — Reste : <strong>{(getTotal() - Number(montantRecu)).toLocaleString()} FCFA</strong>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmitSale}>
              Valider la vente
            </button>
            <button className="btn-secondary" onClick={resetForm}>Annuler</button>
          </div>
        </div>
      )}

      <div className="history-filters">
        <div className="filter-group">
          <label>Période</label>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
            <option value="all">Toutes les ventes</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Rechercher par N° facture</label>
          <input
            type="text"
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            placeholder="Ex: FAC-2026..."
          />
        </div>
        <div className="filter-summary">
          <span>{filteredSales.length} vente(s)</span>
          <span>Total : <strong>{getTotalFiltered().toLocaleString()} FCFA</strong></span>
        </div>
      </div>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>N° Facture</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty">Aucune vente pour cette période.</td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{sale.id}</td>
                    <td>{sale.invoiceNumber}</td>
                    <td>{formatAmount(sale.totalAmount)} FCFA</td>
                    <td>{formatDate(sale.saleDate)}</td>
                    <td>
                      <button className="btn-edit" onClick={() => setViewingSale(sale)}>
                        Voir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewingSale && (
        <div className="modal-overlay" onClick={() => setViewingSale(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Facture — {viewingSale.invoiceNumber}</h2>
              <button className="btn-close" onClick={() => setViewingSale(null)}>✕</button>
            </div>
            <p><strong>Date :</strong> {formatDate(viewingSale.saleDate)}</p>
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Qté</th>
                  <th>Prix unitaire</th>
                  <th>Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {viewingSale.items?.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product?.name || item.productName}</td>
                    <td>{formatQty(item.quantity)}{item.product?.unitLabel ? ` ${item.product.unitLabel}` : ''}</td>
                    <td>{formatAmount(item.unitPrice)} FCFA</td>
                    <td>{formatAmount(item.subTotal)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cart-total">
              Total : <strong>{formatAmount(viewingSale.totalAmount)} FCFA</strong>
            </div>
          </div>
        </div>
      )}

      {printingSale && (
        <div className="modal-overlay">
          <div className="modal receipt-modal" ref={receiptRef}>
            <div className="receipt" id="receipt-content">
              <div className="receipt-header">
                <h2>{companySettings.companyName}</h2>
                {companySettings.phone && <p>Tél : {companySettings.phone}</p>}
                {companySettings.email && <p>{companySettings.email}</p>}
                {companySettings.city && <p>{companySettings.city}</p>}
                {companySettings.address && <p>{companySettings.address}</p>}
                <p>Reçu de vente</p>
                <hr />
              </div>
              <div className="receipt-info">
                <p><strong>N° Facture :</strong> {printingSale.invoiceNumber}</p>
                <p><strong>Date :</strong> {new Date().toLocaleString('fr-FR')}</p>
              </div>
              <hr />
              <table className="receipt-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Qté</th>
                    <th>P.U</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {printingSale.items?.map((item, i) => (
                    <tr key={i}>
                      <td>{item.productName}</td>
                      <td>{formatQty(item.quantity)}{item.unitLabel ? ` ${item.unitLabel}` : ''}</td>
                      <td>{item.unitPrice?.toLocaleString()}</td>
                      <td>{item.subTotal?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <hr />
              <div className="receipt-total">
                <strong>TOTAL : {Number(printingSale.totalAmount).toLocaleString()} FCFA</strong>
              </div>
              <hr />
              <div className="receipt-paiement">
                <p><strong>Mode :</strong> {getModePaiementLabel(printingSale.modePaiement)}</p>
                {printingSale.montantRecu && (
                  <p><strong>Reçu :</strong> {Number(printingSale.montantRecu).toLocaleString()} FCFA</p>
                )}
                {printingSale.monnaie > 0 && (
                  <p><strong>Monnaie :</strong> {Number(printingSale.monnaie).toLocaleString()} FCFA</p>
                )}
              </div>
              <hr />
              <div className="receipt-footer">
                <p>Merci pour votre achat !</p>
                <p>À bientôt</p>
              </div>
            </div>
            <div className="receipt-actions no-print">
              <button className="btn-primary" onClick={handlePrint}>
                🖨️ Imprimer
              </button>
              <button className="btn-secondary" onClick={() => setPrintingSale(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage;
