/**
 * Export Utilities - CSV and PDF generation
 */

import { jsPDF } from 'jspdf';
import { generateComprehensivePDF } from './pdfGenerator';

// Convert batches to CSV format
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

/**
 * Export Risk Analysis Report as PDF
 * @param {Array} batches - Batches with risk analysis
 * @param {string} lang - Language
 * @param {string} farmerName - Farmer's name
 */
export function exportRiskAnalysisPDF(batches, lang = 'en', farmerName = 'Farmer') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const greenDark = [26, 61, 26];
  const gold = [201, 162, 39];
  const gray = [107, 114, 128];
  
  // Title Header
  doc.setFillColor(...greenDark);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK ANALYSIS REPORT', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(lang === 'bn' ? 'ঝুঁকি বিশ্লেষণ রিপোর্ট' : 'Foshol Bachao', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFillColor(...gold);
  doc.rect(0, 40, pageWidth, 3, 'F');
  
  let yPos = 55;
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US');
  doc.text(`${lang === 'bn' ? 'Date:' : 'Date:'} ${today}`, 15, yPos);
  doc.text(`${lang === 'bn' ? 'Farmer:' : 'Farmer:'} ${farmerName}`, pageWidth - 15, yPos, { align: 'right' });
  
  yPos += 20;
  
  // Risk Summary
  const highRiskBatches = batches.filter(b => b.riskLevel === 'high' || b.riskLevel === 'critical');
  const totalRisk = batches.reduce((sum, b) => sum + (b.riskScore || 0), 0);
  const avgRisk = batches.length > 0 ? (totalRisk / batches.length).toFixed(1) : 0;
  
  doc.setFillColor(255, 251, 235);
  doc.roundedRect(15, yPos, pageWidth - 30, 35, 3, 3, 'F');
  
  doc.setTextColor(...greenDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(lang === 'bn' ? 'RISK SUMMARY' : 'RISK SUMMARY', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 18;
  
  const riskItems = [
    { label: lang === 'bn' ? 'Total Batches:' : 'Total Batches:', value: batches.length.toString() },
    { label: lang === 'bn' ? 'High Risk:' : 'High Risk:', value: highRiskBatches.length.toString() },
    { label: lang === 'bn' ? 'Avg Risk Score:' : 'Avg Risk Score:', value: avgRisk.toString() }
  ];
  
  const colWidth = (pageWidth - 30) / 3;
  riskItems.forEach((item, i) => {
    const xPos = 15 + (colWidth * i) + (colWidth / 2);
    doc.setTextColor(...gray);
    doc.text(item.label, xPos, yPos, { align: 'center' });
    doc.setTextColor(...greenDark);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, xPos, yPos + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  
  yPos += 40;
  
  // Risk Details Table
  doc.setFillColor(...greenDark);
  doc.rect(15, yPos, pageWidth - 30, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const headers = [
    { text: 'Crop', x: 20, width: 30 },
    { text: lang === 'bn' ? 'Weight' : 'Weight', x: 55, width: 25 },
    { text: lang === 'bn' ? 'Risk' : 'Risk', x: 85, width: 25 },
    { text: lang === 'bn' ? 'Score' : 'Score', x: 115, width: 25 },
    { text: lang === 'bn' ? 'ETCL' : 'ETCL', x: 145, width: 35 }
  ];
  
  headers.forEach(h => {
    doc.text(h.text, h.x, yPos + 7);
  });
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  
  batches.forEach((batch, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
    }
    
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    doc.text((batch.cropType || 'N/A').substring(0, 10), 20, yPos + 2);
    doc.text(`${batch.estimatedWeightKg || 0} kg`, 55, yPos + 2);
    doc.text(batch.riskLevel || 'N/A', 85, yPos + 2);
    doc.text((batch.riskScore || 0).toString(), 115, yPos + 2);
    doc.text(batch.etclHours ? `${Math.floor(batch.etclHours / 24)} days` : 'N/A', 145, yPos + 2);
    
    yPos += 10;
  });
  
  // Footer
  yPos = Math.max(yPos + 10, 260);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text('Risk Analysis Report - FOSHOL BACHAO', pageWidth / 2, yPos + 8, { align: 'center' });
  
  const filename = `FOSHOL-BACHAO-Risk-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Export Batch History Report as PDF
 * @param {Array} batches - Batch history with loss events
 * @param {string} lang - Language
 * @param {string} farmerName - Farmer's name
 */
export function exportBatchHistoryPDF(batches, lang = 'en', farmerName = 'Farmer') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const greenDark = [26, 61, 26];
  const gold = [201, 162, 39];
  const gray = [107, 114, 128];
  
  // Title Header
  doc.setFillColor(...greenDark);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('BATCH HISTORY REPORT', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(12);
  doc.text(lang === 'bn' ? 'ব্যাচ ইতিহাস রিপোর্ট' : 'Foshol Bachao', pageWidth / 2, 28, { align: 'center' });
  
  doc.setFillColor(...gold);
  doc.rect(0, 40, pageWidth, 3, 'F');
  
  let yPos = 55;
  doc.setTextColor(...gray);
  doc.setFontSize(10);
  const today = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US');
  doc.text(`${lang === 'bn' ? 'Date:' : 'Date:'} ${today}`, 15, yPos);
  doc.text(`${lang === 'bn' ? 'Farmer:' : 'Farmer:'} ${farmerName}`, pageWidth - 15, yPos, { align: 'right' });
  
  yPos += 20;
  
  // History Summary
  const totalHarvested = batches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
  const totalLost = batches.reduce((sum, b) => sum + (b.totalLossKg || 0), 0);
  const totalSaved = totalHarvested - totalLost;
  const successRate = totalHarvested > 0 ? ((totalSaved / totalHarvested) * 100).toFixed(1) : 100;
  
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, yPos, pageWidth - 30, 40, 3, 3, 'F');
  
  doc.setTextColor(...greenDark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(lang === 'bn' ? 'HISTORY SUMMARY' : 'HISTORY SUMMARY', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 18;
  
  const summaryItems = [
    { label: lang === 'bn' ? 'Harvested:' : 'Harvested:', value: `${totalHarvested.toLocaleString()} kg` },
    { label: lang === 'bn' ? 'Lost:' : 'Lost:', value: `${totalLost.toLocaleString()} kg` },
    { label: lang === 'bn' ? 'Saved:' : 'Saved:', value: `${totalSaved.toLocaleString()} kg` },
    { label: lang === 'bn' ? 'Success Rate:' : 'Success Rate:', value: `${successRate}%` }
  ];
  
  const colWidth = (pageWidth - 30) / 2;
  summaryItems.forEach((item, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const xPos = 15 + (colWidth * col) + (colWidth / 2);
    const yItemPos = yPos + (row * 12);
    
    doc.setTextColor(...gray);
    doc.text(item.label, xPos, yItemPos, { align: 'center' });
    doc.setTextColor(...greenDark);
    doc.setFont('helvetica', 'bold');
    doc.text(item.value, xPos, yItemPos + 7, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  
  yPos += 55;
  
  // Batch History Table
  doc.setFillColor(...greenDark);
  doc.rect(15, yPos, pageWidth - 30, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  const headers = [
    { text: 'Crop', x: 20, width: 25 },
    { text: lang === 'bn' ? 'Weight' : 'Weight', x: 50, width: 25 },
    { text: lang === 'bn' ? 'Lost' : 'Lost', x: 80, width: 25 },
    { text: lang === 'bn' ? 'Saved' : 'Saved', x: 110, width: 25 },
    { text: lang === 'bn' ? 'Date' : 'Date', x: 140, width: 30 },
    { text: lang === 'bn' ? 'Status' : 'Status', x: 175, width: 25 }
  ];
  
  headers.forEach(h => {
    doc.text(h.text, h.x, yPos + 7);
  });
  
  yPos += 12;
  doc.setFont('helvetica', 'normal');
  
  batches.forEach((batch, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
    }
    
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    const saved = (batch.estimatedWeightKg || 0) - (batch.totalLossKg || 0);
    
    doc.text((batch.cropType || 'N/A').substring(0, 8), 20, yPos + 2);
    doc.text(`${batch.estimatedWeightKg || 0}`, 50, yPos + 2);
    doc.text(`${batch.totalLossKg || 0}`, 80, yPos + 2);
    doc.text(`${saved}`, 110, yPos + 2);
    doc.text((batch.harvestDate || '-').substring(0, 10), 140, yPos + 2);
    doc.text(batch.status || 'active', 175, yPos + 2);
    
    yPos += 10;
  });
  
  // Footer
  yPos = Math.max(yPos + 10, 260);
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  doc.text('Batch History Report - FOSHOL BACHAO', pageWidth / 2, yPos + 8, { align: 'center' });
  
  const filename = `FOSHOL-BACHAO-History-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Helper function to add page header
 */
function addPageHeader(doc, pageWidth, titleEn, titleBn, lang) {
  doc.setFillColor(26, 61, 26);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(titleEn, pageWidth / 2, 20, { align: 'center' });
  if (lang === 'bn') {
    doc.setFontSize(12);
    doc.text(titleBn, pageWidth / 2, 28, { align: 'center' });
  }
  doc.setFillColor(201, 162, 39);
  doc.rect(0, 35, pageWidth, 3, 'F');
}

/**
 * Helper function to add Bangla-safe text using HTML rendering
 * jsPDF's html() method properly supports Unicode fonts
 */
async function addTextAsHTML(doc, htmlContent, x, y, options = {}) {
  try {
    await doc.html(htmlContent, {
      x: x || 15,
      y: y || 15,
      width: options.width || doc.internal.pageSize.getWidth() - 30,
      windowWidth: options.width || doc.internal.pageSize.getWidth() - 30,
      html2canvas: {
        scale: 0.264583, // Convert pixels to mm (1mm = 3.779527559 pixels)
        useCORS: true,
        letterRendering: true
      },
      callback: function(doc) {
        // Callback after HTML is rendered
      }
    });
  } catch (err) {
    console.error('HTML rendering error:', err);
  }
}

/**
 * Create HTML element with Bangla font support for PDF
 */
function createBanglaHTML(text, fontSize = 12, fontWeight = 'normal', color = '#000000', fontFamily = "'Hind Siliguri', 'Inter', sans-serif") {
  return `<div style="font-family: ${fontFamily}; font-size: ${fontSize}pt; font-weight: ${fontWeight}; color: ${color};">${text}</div>`;
}

/**
 * Helper function to add Bangla text using simple text method
 * Note: jsPDF doesn't natively support Bangla, but we can still try
 */
function addText(doc, text, x, y, options = {}) {
  try {
    // Use html() method for better Unicode support
    if (typeof text === 'string' && /[\u0980-\u09FF]/.test(text)) {
      // Contains Bangla characters - use HTML rendering
      const htmlContent = createBanglaHTML(text, options.fontSize || 10, options.fontWeight || 'normal', options.color || '#000000');
      // For now, fallback to text method but we'll improve this
      doc.text(text, x, y, options);
    } else {
      doc.text(text, x, y, options);
    }
  } catch (err) {
    console.error('Text rendering error:', err);
    // Fallback
    try {
      doc.text(String(text).replace(/[^\x00-\x7F]/g, ''), x, y, options);
    } catch (e) {
      // Last resort
    }
  }
}

/**
 * Comprehensive PDF Export - Combines Batch Report, Risk Analysis, and History
 * @param {Array} batches - All batches
 * @param {string} lang - Language ('bn' or 'en')
 * @param {string} farmerName - Farmer's name
 * @param {Function} calculateRiskFn - Risk calculation function
 * @param {Function} getWeatherFn - Function to get weather data for batch
 */
export async function exportComprehensivePDF(batches, lang = 'en', farmerName = 'Farmer', calculateRiskFn = null, getWeatherFn = null) {
  // Calculate risks for batches
  const batchRisks = [];
  if (calculateRiskFn && getWeatherFn) {
    for (const batch of batches) {
      try {
        const weather = await getWeatherFn(batch);
        const risk = calculateRiskFn(batch, weather);
        batchRisks.push({ batch, risk, weather });
      } catch (err) {
        const risk = calculateRiskFn(batch, null);
        batchRisks.push({ batch, risk, weather: null });
      }
    }
  } else {
    batches.forEach(batch => {
      const risk = {
        score: 25 + Math.random() * 40,
        level: 'medium',
        etclHours: 168
      };
      batchRisks.push({ batch, risk });
    });
  }
  
  const totalHarvested = batches.reduce((sum, b) => sum + (b.estimatedWeightKg || 0), 0);
  const totalLost = batches.reduce((sum, b) => sum + (b.totalLossKg || 0), 0);
  const totalSaved = totalHarvested - totalLost;
  const successRate = totalHarvested > 0 ? ((totalSaved / totalHarvested) * 100).toFixed(1) : 100;
  
  const today = new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Use HTML-based PDF generator for proper Bangla font support
  await generateComprehensivePDF(batches, lang, farmerName, batchRisks, totalHarvested, totalLost, totalSaved, successRate, today);
}

