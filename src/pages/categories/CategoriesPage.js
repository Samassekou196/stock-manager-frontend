import React, { useState, useEffect } from 'react';
import CategoryService from '../../api/categoryService';
import './CategoriesPage.css';

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await CategoryService.getAll();
      setCategories(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des catégories.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim() === '') {
      loadCategories();
    } else {
      const response = await CategoryService.search(value);
      setCategories(Array.isArray(response.data) ? response.data : []);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Le nom est obligatoire.');
      return;
    }
    try {
      if (editingCategory) {
        await CategoryService.update(editingCategory.id, formData);
      } else {
        await CategoryService.create(formData);
      }
      setFormData({ name: '', description: '' });
      setEditingCategory(null);
      setShowForm(false);
      setError('');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Confirmer la suppression de cette catégorie ?')) {
      try {
        await CategoryService.delete(id);
        loadCategories();
      } catch (err) {
        setError(err.response?.data?.message || 'Impossible de supprimer cette catégorie.');
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Catégories</h1>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingCategory(null); setFormData({ name: '', description: '' }); }}>
          + Nouvelle catégorie
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {showForm && (
        <div className="form-card">
          <h2>{editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <div className="form-group">
            <label>Nom *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nom de la catégorie"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description (optionnelle)"
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleSubmit}>
              {editingCategory ? 'Modifier' : 'Créer'}
            </button>
            <button className="btn-secondary" onClick={handleCancel}>Annuler</button>
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher une catégorie..."
        />
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
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">Aucune catégorie trouvée.</td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>{cat.id}</td>
                    <td>{cat.name}</td>
                    <td>{cat.description || '—'}</td>
                    <td>
                      <button className="btn-edit" onClick={() => handleEdit(cat)}>Modifier</button>
                      <button className="btn-delete" onClick={() => handleDelete(cat.id)}>Supprimer</button>
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

export default CategoriesPage;