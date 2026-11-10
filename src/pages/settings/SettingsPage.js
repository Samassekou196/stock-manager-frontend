import React, { useState, useEffect } from 'react';
import '../categories/CategoriesPage.css';
import './SettingsPage.css';

function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: 'GESTIONNAIRE DE STOCK',
    phone: '',
    address: '',
    email: '',
    city: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('appSettings');
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Paramètres</h1>
      </div>

      {saved && <div className="alert-success">✅ Paramètres sauvegardés avec succès !</div>}

      <div className="form-card">
        <h2>Informations de l'entreprise</h2>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
          Ces informations apparaîtront sur les reçus de vente.
        </p>

        <div className="form-group">
          <label>Nom de l'entreprise *</label>
          <input
            type="text"
            value={settings.companyName}
            onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            placeholder="Nom de votre entreprise"
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Téléphone</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              placeholder="Ex: +225 07 00 00 00"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              placeholder="email@entreprise.com"
            />
          </div>
          <div className="form-group">
            <label>Ville</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              placeholder="Ex: Abidjan"
            />
          </div>
          <div className="form-group">
            <label>Adresse</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Ex: Cocody, Rue des Jardins"
            />
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={handleSave}>
            💾 Sauvegarder
          </button>
        </div>
      </div>

      <div className="form-card">
        <h2>Aperçu du reçu</h2>
        <div className="receipt-preview">
          <div className="receipt-preview-header">
            <strong>{settings.companyName || "NOM DE L'ENTREPRISE"}</strong>
            {settings.phone && <p>Tél : {settings.phone}</p>}
            {settings.email && <p>{settings.email}</p>}
            {settings.city && <p>{settings.city}</p>}
            {settings.address && <p>{settings.address}</p>}
          </div>
          <hr />
          <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>Reçu de vente</p>
          <hr />
          <p style={{ fontSize: '0.75rem' }}>Article &nbsp; Qté &nbsp; P.U &nbsp; Total</p>
          <p style={{ fontSize: '0.75rem' }}>Fanta &nbsp;&nbsp;&nbsp; 2 &nbsp;&nbsp; 300 &nbsp; 600</p>
          <hr />
          <p style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '0.85rem' }}>TOTAL : 600 FCFA</p>
          <hr />
          <p style={{ textAlign: 'center', fontSize: '0.75rem' }}>Merci pour votre achat !</p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;