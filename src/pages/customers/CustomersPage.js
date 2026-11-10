import React, { useState, useEffect } from 'react';
import CustomerService from '../../api/customerService';
import '../../pages/categories/CategoriesPage.css';

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', phone: '', email: '', address: ''
  });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      const response = await CustomerService.getAll();
      setCustomers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Erreur lors du chargement des clients.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      loadCustomers();
    } else {
      const res = await CustomerService.search(value);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.lastName.trim() || !formData.firstName.trim()) {
      setError('Le nom et le prénom sont obligatoires.');
      return;
    }
    try {
      if (editingCustomer) {
        await CustomerService.update(editingCustomer.id, formData);
      } else {
        await CustomerService.create(formData);
      }
      resetForm();
      loadCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      lastName: customer.lastName || '',
      firstName: customer.firstName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression de ce client ?')) {
      try {
        await CustomerService.delete(id);
        loadCustomers();
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de supprimer ce client.');
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ lastName: '', firstName: '', phone: '', email: '', address: '' });
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clients</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Nouveau client
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h2>{editingCustomer ? 'Modifier le client' : 'Nouveau client'}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input type="text" value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Nom de famille" />
            </div>
            <div className="form-group">
              <label>Prénom *</label>
              <input type="text" value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Prénom" />
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
          </div>
          <div className="form-group">
            <label>Adresse</label>
            <textarea value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Adresse complète" rows={2} />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>
              {editingCustomer ? 'Modifier' : 'Créer'}
            </button>
            <button className="btn-secondary" onClick={resetForm}>Annuler</button>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input type="text" value={search} onChange={handleSearch}
          placeholder="Rechercher un client..." />
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
                <th>Prénom</th>
                <th>Téléphone</th>
                <th>Email</th>
                <th>Adresse</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty">Aucun client trouvé.</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.lastName}</td>
                    <td>{customer.firstName}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.address || '—'}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(customer)}>Modifier</button>
                      <button className="btn-delete" onClick={() => handleDelete(customer.id)}>Supprimer</button>
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

export default CustomersPage;