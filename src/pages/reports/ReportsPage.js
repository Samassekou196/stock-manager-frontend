import React, { useState } from 'react';
import api from '../../api/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../categories/CategoriesPage.css';
import './ReportsPage.css';

function ReportsPage() {
  const [period, setPeriod] = useState('month');
  const [report, setReport] = useState(null);
  const [lowStockReport, setLowStockReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sales');
  const [error, setError] = useState('');

  const periodLabels = {
    today: "Aujourd'hui",
    week: 'Cette semaine',
    month: 'Ce mois',
    year: 'Cette année',
    all: 'Toutes les ventes',
  };

  const loadSalesReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/reports/sales?period=${period}`);
      setReport(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport.');
    } finally {
      setLoading(false);
    }
  };

  const loadLowStockReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/low-stock');
      setLowStockReport(response.data);
    } catch (err) {
      setError('Erreur lors du chargement du rapport.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setReport(null);
    setLowStockReport(null);
    setError('');
  };

  const formatAmount = (amount) => {
    if (!amount) return '0';
    return Number(amount).toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try { return new Date(dateStr).toLocaleString('fr-FR'); }
    catch { return '—'; }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('report-to-print');
    if (!element) return;

    setExportLoading(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      // En-tête du PDF
      const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.companyName || 'STOCK MANAGER', pdfWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const title = activeTab === 'sales'
        ? `Rapport des ventes — ${periodLabels[period]}`
        : 'Rapport des stocks';
      pdf.text(title, pdfWidth / 2, 23, { align: 'center' });

      pdf.setFontSize(9);
      pdf.text(`Généré le ${new Date().toLocaleString('fr-FR')}`, pdfWidth / 2, 29, { align: 'center' });

      // Ligne de séparation
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(0.5);
      pdf.line(10, 32, pdfWidth - 10, 32);

      // Contenu
      pdf.addImage(imgData, 'PNG', imgX, 36, imgWidth * ratio, imgHeight * ratio);

      // Pied de page
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Stock Manager — ${new Date().toLocaleDateString('fr-FR')}`,
        pdfWidth / 2,
        pdfHeight - 8,
        { align: 'center' }
      );

      const fileName = activeTab === 'sales'
        ? `rapport-ventes-${period}-${new Date().toISOString().slice(0, 10)}.pdf`
        : `rapport-stocks-${new Date().toISOString().slice(0, 10)}.pdf`;

      pdf.save(fileName);
    } catch (err) {
      setError('Erreur lors de la génération du PDF.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Rapports</h1>
        <div className="report-actions">
          {(report || lowStockReport) && (
            <>
              <button className="btn-secondary" onClick={handlePrint}>
                🖨️ Imprimer
              </button>
              <button
                className="btn-primary"
                onClick={handleExportPDF}
                disabled={exportLoading}
              >
                {exportLoading ? '⏳ Export...' : '📄 Exporter PDF'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Onglets */}
      <div className="report-tabs">
        <button
          className={activeTab === 'sales' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('sales')}>
          📊 Rapport des ventes
        </button>
        <button
          className={activeTab === 'stock' ? 'tab active' : 'tab'}
          onClick={() => handleTabChange('stock')}>
          📦 Rapport des stocks
        </button>
      </div>

      {/* Rapport des ventes */}
      {activeTab === 'sales' && (
        <div className="form-card">
          <h2>Rapport des ventes</h2>
          <div className="report-filters">
            <div className="form-group">
              <label>Période</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
                <option value="all">Toutes les ventes</option>
              </select>
            </div>
            <button className="btn-primary" onClick={loadSalesReport}>
              🔍 Générer le rapport
            </button>
          </div>

          {loading && <p>Chargement...</p>}

          {report && (
            <div className="report-content" id="report-to-print">
              <div className="report-summary">
                <div className="summary-card">
                  <span className="summary-value">{report.totalSales}</span>
                  <span className="summary-label">Ventes</span>
                </div>
                <div className="summary-card green">
                  <span className="summary-value">{formatAmount(report.totalCA)}</span>
                  <span className="summary-label">CA Total (FCFA)</span>
                </div>
              </div>

              <h3>Détail des ventes — {periodLabels[period]}</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>N° Facture</th>
                      <th>Client</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.sales.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty">
                          Aucune vente pour cette période.
                        </td>
                      </tr>
                    ) : (
                      report.sales.map((sale, i) => (
                        <tr key={i}>
                          <td>{sale.id}</td>
                          <td>{sale.invoiceNumber}</td>
                          <td>{sale.customerName}</td>
                          <td>{formatAmount(sale.totalAmount)} FCFA</td>
                          <td>{formatDate(sale.saleDate)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rapport des stocks */}
      {activeTab === 'stock' && (
        <div className="form-card">
          <h2>Rapport des stocks</h2>
          <div className="report-filters">
            <button className="btn-primary" onClick={loadLowStockReport}>
              🔍 Générer le rapport
            </button>
          </div>

          {loading && <p>Chargement...</p>}

          {lowStockReport && (
            <div className="report-content" id="report-to-print">

              <div className="report-section">
                <h3 className="report-section-title danger">
                  🔴 Produits en rupture ({lowStockReport.outOfStock?.length || 0})
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Produit</th>
                        <th>Catégorie</th>
                        <th>Fournisseur</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockReport.outOfStock?.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="empty">✅ Aucun produit en rupture.</td>
                        </tr>
                      ) : (
                        lowStockReport.outOfStock?.map((p, i) => (
                          <tr key={i}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.category?.name || '—'}</td>
                            <td>{p.supplier?.name || '—'}</td>
                            <td><span className="badge-danger">{p.quantity}</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="report-section">
                <h3 className="report-section-title warning">
                  🟡 Produits stock faible ({lowStockReport.lowStock?.length || 0})
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Produit</th>
                        <th>Catégorie</th>
                        <th>Fournisseur</th>
                        <th>Stock</th>
                        <th>Seuil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockReport.lowStock?.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="empty">✅ Aucun produit en stock faible.</td>
                        </tr>
                      ) : (
                        lowStockReport.lowStock?.map((p, i) => (
                          <tr key={i}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.category?.name || '—'}</td>
                            <td>{p.supplier?.name || '—'}</td>
                            <td><span className="badge-warning">{p.quantity}</span></td>
                            <td>{p.alertThreshold}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportsPage;