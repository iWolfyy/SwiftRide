import jsPDF from 'jspdf';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateBranchReportPDF = (branchData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Company Header
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
  doc.text('Branch Information Report', pageWidth / 2, 28, { align: 'center' });

  yPosition = 50;
  doc.setTextColor(0, 0, 0);

  // Report Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportId = `BRN-${Date.now().toString().slice(-6)}`;
  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.text(`Report ID: ${reportId}`, 20, yPosition);
  doc.text(`Generated: ${generatedDate}`, 20, yPosition + 5);
  doc.text(`Report Type: Branch Information`, 20, yPosition + 10);
  doc.text(`Branch ID: ${branchData._id}`, 20, yPosition + 15);

  yPosition += 35;

  // Branch Information Box
  doc.setFillColor(240, 248, 255);
  doc.rect(15, yPosition - 5, pageWidth - 30, 80, 'F');
  doc.setDrawColor(41, 128, 185);
  doc.rect(15, yPosition - 5, pageWidth - 30, 80, 'S');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Branch Information', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Basic Information
  doc.text(`Branch Name: ${branchData.name}`, 20, yPosition);
  doc.text(`Location: ${branchData.location || 'Not specified'}`, 20, yPosition + 5);
  doc.text(`Address: ${branchData.address || 'Not specified'}`, 20, yPosition + 10);
  doc.text(`Phone: ${branchData.phone || 'Not specified'}`, 20, yPosition + 15);
  doc.text(`Email: ${branchData.email || 'Not specified'}`, 20, yPosition + 20);
  doc.text(`Status: ${branchData.isActive ? 'Active' : 'Inactive'}`, 20, yPosition + 25);
  doc.text(`Established: ${formatDate(branchData.establishedDate)}`, 20, yPosition + 30);

  yPosition += 50;

  // Description Section
  if (branchData.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Split description into multiple lines if too long
    const description = branchData.description;
    const maxWidth = pageWidth - 40;
    const splitDescription = doc.splitTextToSize(description, maxWidth);
    
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5 + 10;
  }

  // Operating Hours Section
  if (branchData.openingHours) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Operating Hours:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(branchData.openingHours, 20, yPosition);
    yPosition += 15;
  }

  // Services Section
  if (branchData.services) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Services Offered:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Split services into multiple lines if too long
    const services = branchData.services;
    const maxWidth = pageWidth - 40;
    const splitServices = doc.splitTextToSize(services, maxWidth);
    
    doc.text(splitServices, 20, yPosition);
    yPosition += splitServices.length * 5 + 10;
  }

  // Capacity Section
  if (branchData.capacity) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Branch Capacity:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${branchData.capacity} vehicles`, 20, yPosition);
    yPosition += 15;
  }

  // Manager Information
  if (branchData.manager) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Branch Manager:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${branchData.manager.name || 'Not specified'}`, 20, yPosition);
    doc.text(`Email: ${branchData.manager.email || 'Not specified'}`, 20, yPosition + 5);
    doc.text(`Role: ${branchData.manager.role || 'Not specified'}`, 20, yPosition + 10);
    yPosition += 20;
  }

  // Branch Statistics
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Branch Statistics', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Created: ${formatDateTime(branchData.createdAt)}`, 20, yPosition);
  doc.text(`Last Updated: ${formatDateTime(branchData.updatedAt)}`, 20, yPosition + 5);
  
  // Calculate branch age
  if (branchData.createdAt) {
    const branchAge = Math.floor((new Date() - new Date(branchData.createdAt)) / (1000 * 60 * 60 * 24));
    doc.text(`Branch Age: ${branchAge} days`, 20, yPosition + 10);
  }

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

export const exportBranchPDF = (branchData, enqueueSnackbar) => {
  try {
    const doc = generateBranchReportPDF(branchData);
    const filename = `branch-report-${branchData.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    doc.save(filename);
    enqueueSnackbar(`Branch report exported: ${filename}`, { variant: 'success' });
  } catch (error) {
    console.error('Error exporting branch PDF:', error);
    enqueueSnackbar('Error exporting branch report', { variant: 'error' });
  }
};
