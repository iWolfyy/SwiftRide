import jsPDF from 'jspdf';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

// Helper function to format dates
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Generates a financial summary report PDF
 * @param {Object} reportData - Financial report data
 * @param {Object} dateRange - Date range object with startDate and endDate
 * @returns {jsPDF} - Generated PDF document
 */
export const generateSummaryReportPDF = (reportData, dateRange) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Company Header with Logo Area
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add company logo
  try {
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    doc.addImage(logoImg, 'PNG', 20, 8, 20, 20);
  } catch (error) {
    console.log('Logo not loaded, using text fallback');
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SwiftRide', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Financial Summary Report', pageWidth / 2, 28, { align: 'center' });
  
  yPosition = 50;
  doc.setTextColor(0, 0, 0);

  // Report Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportId = `RPT-${Date.now().toString().slice(-6)}`;
  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const periodText = dateRange ? 
    `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}` :
    'All Time';
  
  doc.text(`Report ID: ${reportId}`, 20, yPosition);
  doc.text(`Generated: ${generatedDate}`, 20, yPosition + 5);
  doc.text(`Period: ${periodText}`, 20, yPosition + 10);
  doc.text(`Report Type: Financial Summary`, 20, yPosition + 15);
  
  yPosition += 35;

  // Executive Summary Box
  doc.setFillColor(240, 248, 255);
  doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
  doc.setDrawColor(41, 128, 185);
  doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'S');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 20, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const totalRevenue = reportData.totalRevenue || 0;
  const totalBookings = reportData.totalBookings || 0;
  const avgRevenuePerBooking = totalBookings > 0 ? (totalRevenue / totalBookings) : 0;
  
  doc.text(`This report covers ${totalBookings} total bookings generating ${formatCurrency(totalRevenue)} in revenue.`, 20, yPosition);
  doc.text(`Average revenue per booking: ${formatCurrency(avgRevenuePerBooking)}`, 20, yPosition + 5);
  
  yPosition += 20;

  // Key Performance Indicators
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Performance Indicators', 20, yPosition);
  yPosition += 15;

  // KPI Grid
  const kpiData = [
    { label: 'Total Revenue', value: formatCurrency(reportData.totalRevenue || 0), color: [46, 204, 113] },
    { label: 'Total Bookings', value: (reportData.totalBookings || 0).toString(), color: [52, 152, 219] },
    { label: 'Completed Bookings', value: (reportData.completedBookings || 0).toString(), color: [46, 204, 113] },
    { label: 'Cancelled Bookings', value: (reportData.cancelledBookings || 0).toString(), color: [231, 76, 60] },
    { label: 'Completion Rate', value: `${(reportData.completionRate || 0).toFixed(2)}%`, color: [155, 89, 182] },
    { label: 'Avg Revenue/Booking', value: formatCurrency(avgRevenuePerBooking), color: [230, 126, 34] }
  ];

  kpiData.forEach((kpi, index) => {
    const x = 20 + (index % 2) * 90;
    const y = yPosition + Math.floor(index / 2) * 25;
    
    // KPI Box
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(x, y - 15, 80, 20, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + 40, y - 5, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + 40, y + 2, { align: 'center' });
  });

  yPosition += 60;
  doc.setTextColor(0, 0, 0);

  // Detailed Statistics
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Statistics', 20, yPosition);
  yPosition += 15;

  const detailedStats = [
    { category: 'Revenue Analysis', items: [
      { label: 'Total Revenue', value: formatCurrency(reportData.totalRevenue || 0) },
      { label: 'Average Revenue per Booking', value: formatCurrency(avgRevenuePerBooking) },
      { label: 'Highest Single Booking', value: formatCurrency(reportData.maxTransactionValue || 0) },
      { label: 'Lowest Single Booking', value: formatCurrency(reportData.minTransactionValue || 0) }
    ]},
    { category: 'Booking Analysis', items: [
      { label: 'Total Bookings', value: (reportData.totalBookings || 0).toString() },
      { label: 'Completed Bookings', value: (reportData.completedBookings || 0).toString() },
      { label: 'Cancelled Bookings', value: (reportData.cancelledBookings || 0).toString() },
      { label: 'Completion Rate', value: `${(reportData.completionRate || 0).toFixed(2)}%` }
    ]},
    { category: 'Performance Metrics', items: [
      { label: 'Revenue Growth Rate', value: 'N/A' },
      { label: 'Booking Success Rate', value: `${(reportData.completionRate || 0).toFixed(2)}%` },
      { label: 'Average Booking Value', value: formatCurrency(avgRevenuePerBooking) },
      { label: 'Total Active Users', value: 'N/A' }
    ]}
  ];

  detailedStats.forEach(category => {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(category.category, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    category.items.forEach(item => {
      doc.text(`${item.label}:`, 30, yPosition);
      doc.setFont('helvetica', 'bold');
      doc.text(item.value, 120, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 6;
    });
    yPosition += 5;
  });

  // Footer
  yPosition = pageHeight - 30;
  doc.setFillColor(41, 128, 185);
  doc.rect(0, yPosition, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by SwiftRide', pageWidth / 2, yPosition + 10, { align: 'center' });
  doc.text(`Report ID: ${reportId} | Page 1 of 1`, pageWidth / 2, yPosition + 20, { align: 'center' });

  return doc;
};

/**
 * Generates a transaction report PDF
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} dateRange - Date range object with startDate and endDate
 * @returns {jsPDF} - Generated PDF document
 */
export const generateTransactionReportPDF = (transactions, dateRange) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;
  let currentPage = 1;

  // Company Header with Logo Area
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add company logo
  try {
    const logoImg = new Image();
    logoImg.src = '/logo.png';
    doc.addImage(logoImg, 'PNG', 20, 8, 20, 20);
  } catch (error) {
    console.log('Logo not loaded, using text fallback');
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SwiftRide', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Transaction Report', pageWidth / 2, 28, { align: 'center' });
  
  yPosition = 50;
  doc.setTextColor(0, 0, 0);

  // Report Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportId = `TXN-${Date.now().toString().slice(-6)}`;
  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const periodText = dateRange ? 
    `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}` :
    'All Time';
  
  doc.text(`Report ID: ${reportId}`, 20, yPosition);
  doc.text(`Generated: ${generatedDate}`, 20, yPosition + 5);
  doc.text(`Period: ${periodText}`, 20, yPosition + 10);
  doc.text(`Report Type: Transaction Details`, 20, yPosition + 15);
  
  yPosition += 35;

  // Transaction Summary Statistics
  if (transactions && transactions.length > 0) {
    const totalAmount = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const avgAmount = totalAmount / transactions.length;
    const statusCounts = transactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    const paymentStatusCounts = transactions.reduce((acc, t) => {
      acc[t.paymentStatus] = (acc[t.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    // Summary Box
    doc.setFillColor(240, 248, 255);
    doc.rect(15, yPosition - 5, pageWidth - 30, 30, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.rect(15, yPosition - 5, pageWidth - 30, 30, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Summary', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Transactions: ${transactions.length}`, 20, yPosition);
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, 20, yPosition + 5);
    doc.text(`Average Amount: ${formatCurrency(avgAmount)}`, 20, yPosition + 10);
    
    yPosition += 25;

    // Status Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Status Breakdown', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(statusCounts).forEach(([status, count]) => {
      const percentage = ((count / transactions.length) * 100).toFixed(1);
      doc.text(`${status}: ${count} (${percentage}%)`, 30, yPosition);
      yPosition += 5;
    });

    yPosition += 10;

    // Payment Status Breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Status Breakdown', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    Object.entries(paymentStatusCounts).forEach(([status, count]) => {
      const percentage = ((count / transactions.length) * 100).toFixed(1);
      doc.text(`${status}: ${count} (${percentage}%)`, 30, yPosition);
      yPosition += 5;
    });

    yPosition += 15;
  }

  // Transaction Table
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 20, yPosition);
  yPosition += 15;

  if (transactions && transactions.length > 0) {
    // Table headers with styling
    doc.setFillColor(41, 128, 185);
    doc.rect(15, yPosition - 8, pageWidth - 30, 12, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer', 20, yPosition);
    doc.text('Vehicle', 60, yPosition);
    doc.text('Amount', 100, yPosition);
    doc.text('Status', 130, yPosition);
    doc.text('Payment', 150, yPosition);
    doc.text('Date', 170, yPosition);
    yPosition += 8;

    // Table data
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    transactions.forEach((transaction, index) => {
      if (yPosition > pageHeight - 40) {
        // Add footer to current page
        doc.setFillColor(41, 128, 185);
        doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
          doc.text('Generated by SwiftRide', pageWidth / 2, pageHeight - 20, { align: 'center' });
          doc.text(`Report ID: ${reportId} | Page ${currentPage}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Add new page
        doc.addPage();
        currentPage++;
        yPosition = 20;
        
        // Add header to new page
        doc.setFillColor(41, 128, 185);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        // Add company logo
        try {
          const logoImg = new Image();
          logoImg.src = '/logo.png';
          doc.addImage(logoImg, 'PNG', 20, 8, 20, 20);
        } catch (error) {
          console.log('Logo not loaded, using text fallback');
        }
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('SwiftRide', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text('Transaction Report (Continued)', pageWidth / 2, 28, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPosition = 50;
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, yPosition - 6, pageWidth - 30, 8, 'F');
      }
      
      const customerName = transaction.customer?.name || transaction.customerDetails?.name || 'N/A';
      const vehicleInfo = transaction.vehicle ? 
        `${transaction.vehicle.make} ${transaction.vehicle.model}` : 'N/A';
      const amount = formatCurrency(transaction.totalAmount);
      const status = transaction.status || 'N/A';
      const paymentStatus = transaction.paymentStatus || 'N/A';
      const date = new Date(transaction.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      doc.text(customerName.substring(0, 18), 20, yPosition);
      doc.text(vehicleInfo.substring(0, 15), 60, yPosition);
      doc.text(amount, 100, yPosition);
      doc.text(status, 130, yPosition);
      doc.text(paymentStatus, 150, yPosition);
      doc.text(date, 170, yPosition);
      yPosition += 6;
    });
  } else {
    doc.setFontSize(12);
    doc.text('No transaction data available for the selected period.', 20, yPosition);
  }

  // Final Footer
  yPosition = pageHeight - 30;
  doc.setFillColor(41, 128, 185);
  doc.rect(0, yPosition, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Generated by SwiftRide', pageWidth / 2, yPosition + 10, { align: 'center' });
  doc.text(`Report ID: ${reportId} | Page ${currentPage} of ${currentPage}`, pageWidth / 2, yPosition + 20, { align: 'center' });

  return doc;
};

/**
 * Exports financial summary report as PDF and triggers download
 * @param {Object} reportData - Financial report data
 * @param {Object} dateRange - Date range object
 * @param {Function} enqueueSnackbar - Snackbar notification function
 */
export const exportSummaryReportPDF = (reportData, dateRange, enqueueSnackbar) => {
  try {
    const doc = generateSummaryReportPDF(reportData, dateRange);
    const date = new Date().toISOString().split('T')[0];
    const filename = `financial-summary-report-${date}.pdf`;
    doc.save(filename);
    enqueueSnackbar(`Financial summary report exported: ${filename}`, { variant: 'success' });
  } catch (error) {
    console.error('Error exporting financial summary PDF:', error);
    enqueueSnackbar('Error exporting financial summary report', { variant: 'error' });
  }
};

/**
 * Exports transaction report as PDF and triggers download
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} dateRange - Date range object
 * @param {Function} enqueueSnackbar - Snackbar notification function
 */
export const exportTransactionReportPDF = (transactions, dateRange, enqueueSnackbar) => {
  try {
    const doc = generateTransactionReportPDF(transactions, dateRange);
    const date = new Date().toISOString().split('T')[0];
    const filename = `transaction-report-${date}.pdf`;
    doc.save(filename);
    enqueueSnackbar(`Transaction report exported: ${filename}`, { variant: 'success' });
  } catch (error) {
    console.error('Error exporting transaction PDF:', error);
    enqueueSnackbar('Error exporting transaction report', { variant: 'error' });
  }
};
