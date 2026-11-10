import React, { useCallback, useEffect, useState } from 'react';
import api from '../../api/api';
import ProductService from '../../api/productService';
import './InventoryPage.css';

function InventoryPage() {
  const [movements, setMovements] = useState([]);
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState('');
  const [quantityDelta, setQuantityDelta] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [movementResult, batchResult, productResult] = await Promise.all([
      api.get('/inventory/movements'), api.get('/inventory/batches/expiring?withinDays=90'), ProductService.getAll(),
    ]);
    setMovements(movementResult.data); setBatches(batchResult.data); setProducts(productResult.data);
  }, []);

  useEffect(() => { load().catch(() => setError('Impossible de charger les données de stock.')); }, [load]);

  const submitAdjustment = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setSuccess('');
    try {
      await api.post('/inventory/adjustments', { productId: Number(productId), quantityDelta: Number(quantityDelta), reason });
      setSuccess('Ajustement enregistré dans le journal de stock.');
      setProductId(''); setQuantityDelta(''); setReason(''); await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'L’ajustement n’a pas pu être enregistré.');
    } finally { setBusy(false); }
  };

  return <main className="inventory-page">
    <header><h1>Inventaire et mouvements</h1><p>Suivez chaque entrée et sortie de stock et corrigez les écarts avec un motif.</p></header>
    {error && <div className="inventory-alert error" role="alert">{error}</div>}
    {success && <div className="inventory-alert success" role="status">{success}</div>}
    <section className="inventory-card"><h2>Ajustement de stock</h2><form className="inventory-adjustment" onSubmit={submitAdjustment}>
      <label>Produit<select required value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Choisir un produit</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} (stock : {p.quantity})</option>)}</select></label>
      <label>Variation (+ entrée, − sortie)<input required type="number" step="any" value={quantityDelta} onChange={(event) => setQuantityDelta(event.target.value)} /></label>
      <label>Motif<input required minLength="3" maxLength="500" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. comptage physique, casse" /></label>
      <button type="submit" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
    </form></section>
    <section className="inventory-card"><h2>Lots à péremption proche <span className="inventory-caption">90 prochains jours</span></h2>
      <div className="inventory-table-scroll"><table><thead><tr><th>Produit</th><th>Lot</th><th>Péremption</th><th>Reste</th><th>Coût unitaire</th></tr></thead><tbody>
        {batches.map((batch) => <tr key={batch.id}><td>{batch.product?.name}</td><td>{batch.batchCode || '—'}</td><td>{batch.expiryDate || '—'}</td><td>{batch.quantityRemaining}</td><td>{batch.unitCost == null ? '—' : `${Number(batch.unitCost).toLocaleString('fr-FR')} FCFA`}</td></tr>)}
        {batches.length === 0 && <tr><td colSpan="5" className="inventory-empty">Aucun lot à péremption proche.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="inventory-card"><h2>Derniers mouvements</h2><div className="inventory-table-scroll"><table><thead><tr><th>Date</th><th>Produit</th><th>Type</th><th>Variation</th><th>Avant</th><th>Après</th><th>Motif</th><th>Référence</th><th>Utilisateur</th></tr></thead><tbody>
      {movements.map((movement) => <tr key={movement.id}><td>{movement.createdAt ? new Date(movement.createdAt).toLocaleString('fr-FR') : '—'}</td><td>{movement.product?.name}</td><td>{movement.movementType}</td><td>{movement.quantityChange > 0 ? '+' : ''}{movement.quantityChange}</td><td>{movement.quantityBefore}</td><td>{movement.quantityAfter}</td><td>{movement.reason}</td><td>{movement.referenceCode || '—'}</td><td>{movement.actorUsername || '—'}</td></tr>)}
      {movements.length === 0 && <tr><td colSpan="9" className="inventory-empty">Aucun mouvement de stock enregistré.</td></tr>}
    </tbody></table></div></section>
  </main>;
}

export default InventoryPage;
