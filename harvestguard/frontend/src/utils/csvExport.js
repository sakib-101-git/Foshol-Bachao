/**
 * Export utilities - CSV and PDF
 * Generates and downloads reports from batch data
 */

import { jsPDF } from 'jspdf';

/**
 * Convert batches array to CSV string
 * @param {Array} batches - Array of batch objects
 * @returns {string} CSV content
 */
export function batchesToCSV(batches) {
  if (!batches || batches.length === 0) {
    return '';
  }
  
  const headers = [
    'ID',
    'Crop Type',
    'Weight (kg)',
    'Harvest Date',
    'Division',
    'District',
    'Upazila',
    'Storage Type',
    'Status',
    'Notes',
    'Synced',
    'Created At'
  ];
  
  const rows = batches.map(batch => [
    batch.id || '',
    batch.cropType || 'Paddy',
    batch.estimatedWeightKg || '',
    batch.harvestDate || '',
    batch.division || '',
    batch.district || '',
    batch.upazila || '',
    batch.storageType || '',
    batch.status || 'active',
    `"${(batch.notes || '').replace(/"/g, '""')}"`,
    batch.synced ? 'Yes' : 'No',
    batch.createdAt || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Download content as a file
 * @param {string} content - File content
 * @param {string} filename - Name of file to download
 * @param {string} type - MIME type
 */
export function downloadFile(content, filename, type = 'text/csv') {
  const blob = new Blob([content], { type: `${type};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export batches as CSV file
 * @param {Array} batches - Batches to export
 */
export function exportBatchesCSV(batches) {
  const csv = batchesToCSV(batches);
  const filename = `harvestguard-batches-${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export batches as JSON file
 * @param {Array} batches - Batches to export
 */
export function exportBatchesJSON(batches) {
  const data = {
    exportDate: new Date().toISOString(),
    totalBatches: batches.length,
    batches: batches
  };
  
  const json = JSON.stringify(data, null, 2);
  const filename = `harvestguard-batches-${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
}

/**
 * Export batches as PDF report
 * @param {Array} batches - Batches to export
 * @param {string} lang - Language ('bn' or 'en')
 * @param {string} farmerName - Farmer's name
 */
export function exportBatchesPDF(batches, lang = 'en', farmerName = 'Farmer') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const greenDark = [26, 61, 26];
  const gold = [201, 162, 39];
  const gray = [107, 114, 128];
  
  // Title Header
  doc.setFillColor(...greenDark);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Main Title - FOSHOL BACHAO
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FOSHOL BACHAO', pageWidth / 2, 18, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(lang === 'bn' ? 'Harvest Report / Foshol Report' : 'Harvest Report', pageWidth / 2, 28, { align: 'center' });
  
  // Gold accent line
  doc.setFillColor(...gold);
  doc.rect(0, 40, pageWidth, 3, 'F');
  
  // Report Info Section
  let yPos = 55;
  
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`${lang === 'bn' ? 'Date:' : 'Date:'} ${today}`, 15, yPos);
  doc.text(`${lang === 'bn' ? 'Farmer:' : 'Farmer:'} ${farmerName}`, pageWidth - 15, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Summary Box
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
  
  // Summary Stats
  const totalBatches = batches.length;
  const totalWeight = batches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
  const activeBatches = batches.filter(b => b.status === 'active').length;
  
  doc.setTextColor(...greenDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(lang === 'bn' ? 'SUMMARY' : 'SUMMARY', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 18;
  
  const summaryItems = [
    { label: lang === 'bn' ? 'Total Batches:' : 'Total Batches:', value: totalBatches.toString() },
    { label: lang === 'bn' ? 'Total Weight:' : 'Total Weight:', value: `${totalWeight.toLocaleString()} kg` },
    { label: lang === 'bn' ? 'Active:' : 'Active:', value: activeBatches.toString() }
  ];
  
  const colWidth = (pageWidth - 30) / 3;
  summaryItems.forEach((item, i) => {
    const xPos = 15 + (colWidth * i) + (colWidth / 2);
    doc.setTextColor(...gray);
    doc.text(item.label, xPos, yPos, { align: 'center' });
    doc.setTextColor(...greenDark);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, xPos, yPos + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  
  yPos += 30;
  
  // Batch List Header
  doc.setFillColor(...greenDark);
  doc.rect(15, yPos, pageWidth - 30, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Table headers
  const headers = [
    { text: '#', x: 20, width: 10 },
    { text: lang === 'bn' ? 'Crop' : 'Crop', x: 32, width: 25 },
    { text: lang === 'bn' ? 'Weight' : 'Weight', x: 55, width: 25 },
    { text: lang === 'bn' ? 'Date' : 'Date', x: 85, width: 30 },
    { text: lang === 'bn' ? 'Location' : 'Location', x: 120, width: 40 },
    { text: lang === 'bn' ? 'Storage' : 'Storage', x: 165, width: 35 }
  ];
  
  headers.forEach(h => {
    doc.text(h.text, h.x, yPos + 7);
  });
  
  yPos += 12;
  
  // Batch Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  batches.forEach((batch, index) => {
    // Check if we need a new page
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
      
      // Add header on new page
      doc.setFillColor(...greenDark);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('FOSHOL BACHAO - Continued', pageWidth / 2, 10, { align: 'center' });
      yPos = 25;
    }
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
    }
    
    doc.setTextColor(55, 65, 81);
    
    // Row data
    doc.text((index + 1).toString(), 20, yPos + 2);
    doc.text((batch.cropType || 'Paddy').substring(0, 10), 32, yPos + 2);
    doc.text(`${batch.estimatedWeightKg || 0} kg`, 55, yPos + 2);
    doc.text(batch.harvestDate || '-', 85, yPos + 2);
    doc.text(`${batch.division || ''}, ${batch.district || ''}`.substring(0, 20), 120, yPos + 2);
    doc.text((batch.storageType || '-').substring(0, 15), 165, yPos + 2);
    
    yPos += 10;
  });
  
  // Footer
  yPos = Math.max(yPos + 10, 260);
  if (yPos > 270) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text('Generated by FOSHOL BACHAO App', pageWidth / 2, yPos + 8, { align: 'center' });
  doc.text(lang === 'bn' ? 'Protect Your Harvest' : 'Protect Your Harvest', pageWidth / 2, yPos + 14, { align: 'center' });
  
  // Save PDF
  const filename = `FOSHOL-BACHAO-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

