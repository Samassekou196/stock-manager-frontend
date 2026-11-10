import React, { useEffect, useMemo, useState } from 'react';
import ProductService from '../../api/productService';
import SupplierService from '../../api/supplierService';
import PurchaseOrderService from '../../api/purchaseOrderService';
import './PurchasesPage.css';

const money = (amount) => `${Number(amount || 0).toLocaleString('fr-FR')} FCFA`;

function PurchasesPage() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [supplierId, setSupplierId] = useState('');
  const [expectedAt, setExpectedAt] = useState('');
  const [notes, setNotes] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitCost, setUnitCost] = useState('');
  const [items, setItems] = useState([]);
  const [receiving, setReceiving] = useState(null);
  const [receiptLines, setReceiptLines] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const [productsResponse, suppliersResponse, ordersResponse] = await Promise.all([
      ProductService.getAll(), SupplierService.getAll(), PurchaseOrderService.getAll(),
    ]);
    setProducts(productsResponse.data);
    setSuppliers(suppliersResponse.data);
    setOrders(ordersResponse.data);
  };

  useEffect(() => {
    refresh().catch(() => setError('Impossible de charger les achats. Vérifiez la connexion au serveur.'));
  }, []);

  const selectedProduct = useMemo(() => products.find((p) => String(p.id) === String(productId)), [products, productId]);
  const estimatedTotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const addItem = () => {
    setError('');
    const qty = Number(quantity);
    const cost = Number(unitCost);
    if (!selectedProduct || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) {
      setError('Choisissez un produit, une quantité positive et un coût valide.');
      return;
    }
    if (!selectedProduct.isFractional && !Number.isInteger(qty)) {
      setError('Ce produit doit être commandé en quantité entière.');
      return;
    }
    setItems((current) => [...current, {
      productId: selectedProduct.id, productName: selectedProduct.name, quantity: qty, unitCost: cost,
    }]);
    setProductId(''); setQuantity('1'); setUnitCost('');
  };

  const createOrder = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!supplierId || items.length === 0) { setError('Sélectionnez un fournisseur et ajoutez au moins un article.'); return; }
    setBusy(true);
    try {
      const response = await PurchaseOrderService.create({
        supplierId: Number(supplierId), expectedAt: expectedAt || null, notes,
        items: items.map(({ productId: id, quantity: qty, unitCost: cost }) => ({ productId: id, quantity: qty, unitCost: cost })),
      });
      setSuccess(`Commande ${response.data.orderNumber} créée.`);
      setItems([]); setNotes(''); setExpectedAt('');
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'La commande n’a pas pu être créée.');
    } finally { setBusy(false); }
  };

  const startReceipt = (order) => {
    const nextLines = {};
    order.items.forEach((line) => {
      const remaining = Number(line.quantityOrdered) - Number(line.quantityReceived);
      if (remaining > 0) nextLines[line.id] = {
        orderItemId: line.id, quantity: remaining, batchCode: '', expiryDate: '', trackExpiry: line.product.trackExpiry,
      };
    });
    setReceiptLines(nextLines); setReceiving(order); setError(''); setSuccess('');
  };

  const submitReceipt = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    const payload = Object.values(receiptLines).map(({ orderItemId, quantity: qty, batchCode, expiryDate }) => ({
      orderItemId, quantity: Number(qty), batchCode: batchCode || null, expiryDate: expiryDate || null,
    }));
    if (payload.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0)) {
      setError('Chaque quantité reçue doit être supérieure à zéro.'); setBusy(false); return;
    }
    if (Object.values(receiptLines).some((line) => line.trackExpiry && !line.expiryDate)) {
      setError('Renseignez la date de péremption pour chaque produit suivi par lot.'); setBusy(false); return;
    }
    try {
      const result = await PurchaseOrderService.receive(receiving.id, { items: payload });
      setSuccess(`Réception enregistrée. État : ${result.data.status}.`);
      setReceiving(null); setReceiptLines({}); await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'La réception n’a pas pu être enregistrée.');
    } finally { setBusy(false); }
  };

  return (
    <main className="purchases-page">
      <header className="purchases-header"><div><h1>Achats fournisseurs</h1><p>Commandes, réceptions et traçabilité des lots.</p></div></header>
      {error && <div className="purchases-alert error" role="alert">{error}</div>}
      {success && <div className="purchases-alert success" role="status">{success}</div>}

      <section className="purchase-card">
        <h2>Nouvelle commande</h2>
        <form onSubmit={createOrder}>
          <div className="purchase-form-grid">
            <label>Fournisseur<select required value={supplierId} onChange={(event) => setSupplierId(event.target.value)}>
              <option value="">Choisir un fournisseur</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select></label>
            <label>Date prévue<input type="date" value={expectedAt} onChange={(event) => setExpectedAt(event.target.value)} /></label>
            <label>Produit<select value={productId} onChange={(event) => { setProductId(event.target.value); const p = products.find((entry) => String(entry.id) === event.target.value); setUnitCost(p?.purchasePrice || ''); }}>
              <option value="">Choisir un produit</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select></label>
            <label>Quantité<input min="0.001" step="any" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
            <label>Coût unitaire<input min="0" step="any" type="number" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} /></label>
            <button className="purchase-secondary" type="button" onClick={addItem}>Ajouter l’article</button>
          </div>
          {items.length > 0 && <div className="purchase-table-wrap"><table><thead><tr><th>Produit</th><th>Quantité</th><th>Coût unitaire</th><th>Total</th><th /></tr></thead>
            <tbody>{items.map((item, index) => <tr key={`${item.productId}-${index}`}><td>{item.productName}</td><td>{item.quantity}</td><td>{money(item.unitCost)}</td><td>{money(item.quantity * item.unitCost)}</td><td><button className="purchase-link danger" type="button" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>Retirer</button></td></tr>)}</tbody>
          </table></div>}
          <div className="purchase-submit-row"><label>Note<textarea value={notes} maxLength="2000" onChange={(event) => setNotes(event.target.value)} /></label><div><strong>Total estimé : {money(estimatedTotal)}</strong><button className="purchase-primary" type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Créer la commande'}</button></div></div>
        </form>
      </section>

      <section className="purchase-card"><h2>Commandes récentes</h2>
        <div className="purchase-table-wrap"><table><thead><tr><th>Référence</th><th>Fournisseur</th><th>Date</th><th>État</th><th>Total</th><th>Articles</th><th /></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id}><td>{order.orderNumber}</td><td>{order.supplier?.name}</td><td>{order.orderedAt ? new Date(order.orderedAt).toLocaleDateString('fr-FR') : '—'}</td><td><span className={`purchase-status ${order.status.toLowerCase()}`}>{order.status}</span></td><td>{money(order.totalAmount)}</td><td>{order.items?.length || 0}</td><td>{order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && <button className="purchase-link" type="button" onClick={() => startReceipt(order)}>Réceptionner</button>}</td></tr>)}
            {orders.length === 0 && <tr><td colSpan="7" className="purchase-empty">Aucune commande fournisseur.</td></tr>}</tbody>
        </table></div>
      </section>

      {receiving && <div className="purchase-modal-backdrop"><section className="purchase-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <h2 id="receipt-title">Réception {receiving.orderNumber}</h2><form onSubmit={submitReceipt}>
          {receiving.items.filter((item) => receiptLines[item.id]).map((item) => <div className="receipt-line" key={item.id}>
            <strong>{item.product.name}</strong><span>Reste à recevoir : {Number(item.quantityOrdered) - Number(item.quantityReceived)}</span>
            <label>Quantité reçue<input type="number" min="0.001" step="any" max={Number(item.quantityOrdered) - Number(item.quantityReceived)} value={receiptLines[item.id].quantity} onChange={(event) => setReceiptLines((current) => ({ ...current, [item.id]: { ...current[item.id], quantity: event.target.value } }))} /></label>
            <label>Code du lot<input value={receiptLines[item.id].batchCode} onChange={(event) => setReceiptLines((current) => ({ ...current, [item.id]: { ...current[item.id], batchCode: event.target.value } }))} /></label>
            {item.product.trackExpiry && <label>Date de péremption<input type="date" required value={receiptLines[item.id].expiryDate} onChange={(event) => setReceiptLines((current) => ({ ...current, [item.id]: { ...current[item.id], expiryDate: event.target.value } }))} /></label>}
          </div>)}
          <div className="purchase-modal-actions"><button type="button" className="purchase-secondary" onClick={() => setReceiving(null)}>Annuler</button><button type="submit" className="purchase-primary" disabled={busy}>Enregistrer la réception</button></div>
        </form>
      </section></div>}
    </main>
  );
}

export default PurchasesPage;
