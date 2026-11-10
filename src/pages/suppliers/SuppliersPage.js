import React, { useState, useEffect } from 'react';
import SupplierService from '../../api/supplierService';
import '../../pages/categories/CategoriesPage.css';

function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', address: '', phone: '', email: '', city: '', country: ''
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      const response = await SupplierService.getAll();
      setSuppliers(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des fournisseurs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      loadSuppliers();
    } else {
      const response = await SupplierService.search(value);
      setSuppliers(response.data);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    try {
      if (editingSupplier) {
        await SupplierService.update(editingSupplier.id, formData);
      } else {
        await SupplierService.create(formData);
      }
      setFormData({ name: '', address: '', phone: '', email: '', city: '', country: '' });
      setEditingSupplier(null);
      setShowForm(false);
      setError('');
      loadSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      address: supplier.address || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      city: supplier.city || '',
      country: supplier.country || ''
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression de ce fournisseur ?')) {
      try {
        await SupplierService.delete(id);
        loadSuppliers();
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de supprimer ce fournisseur.');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSupplier(null);
    setFormData({ name: '', address: '', phone: '', email: '', city: '', country: '' });
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Fournisseurs</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingSupplier(null); setFormData({ name: '', address: '', phone: '', email: '', city: '', country: '' }); }}>
          + Nouveau fournisseur
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h2>{editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h2>
          <div className="form-group">
            <label>Nom *</label>
            <input type="text" value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom du fournisseur" />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input type="text" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Numéro de téléphone" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Adresse email" />
          </div>
          <div className="form-group">
            <label>Adresse</label>
            <input type="text" value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Adresse" />
          </div>
          <div className="form-group">
            <label>Ville</label>
            <input type="text" value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Ville" />
          </div>
          <div className="form-group">
            <label>Pays</label>
            <input type="text" value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Pays" />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>
              {editingSupplier ? 'Modifier' : 'Créer'}
            </button>
            <button className="btn-secondary" onClick={handleCancel}>Annuler</button>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input type="text" value={search} onChange={handleSearch}
          placeholder="Rechercher un fournisseur..." />
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
                <th>Téléphone</th>
                <th>Email</th>
                <th>Ville</th>
                <th>Pays</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty">Aucun fournisseur trouvé.</td>
                </tr>
              ) : (
                suppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td>{sup.id}</td>
                    <td>{sup.name}</td>
                    <td>{sup.phone || '—'}</td>
                    <td>{sup.email || '—'}</td>
                    <td>{sup.city || '—'}</td>
                    <td>{sup.country || '—'}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(sup)}>Modifier</button>
                      <button className="btn-delete" onClick={() => handleDelete(sup.id)}>Supprimer</button>
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

export default SuppliersPage;