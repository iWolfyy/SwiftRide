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

export const generateVehicleReportPDF = (vehicleData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Company Header with SwiftRide branding
  doc.setFillColor(37, 99, 235); // Primary blue
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
  doc.text('Vehicle Information Report', pageWidth / 2, 28, { align: 'center' });

  yPosition = 50;
  doc.setTextColor(0, 0, 0);

  // Report Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Details:', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportId = `VEH-${Date.now().toString().slice(-6)}`;
  const generatedDate = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.text(`Report ID: ${reportId}`, 20, yPosition);
  doc.text(`Generated: ${generatedDate}`, 20, yPosition + 5);
  doc.text(`Report Type: Vehicle Information`, 20, yPosition + 10);
  doc.text(`Vehicle ID: ${vehicleData._id}`, 20, yPosition + 15);

  yPosition += 35;

  // Vehicle Information Box
  doc.setFillColor(240, 248, 255);
  doc.rect(15, yPosition - 5, pageWidth - 30, 100, 'F');
  doc.setDrawColor(37, 99, 235);
  doc.rect(15, yPosition - 5, pageWidth - 30, 100, 'S');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`, 20, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Vehicle Information', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Basic Information
  doc.text(`License Plate: ${vehicleData.licensePlate}`, 20, yPosition);
  doc.text(`VIN: ${vehicleData.vin || 'Not specified'}`, 120, yPosition);
  yPosition += 8;

  doc.text(`Fuel Type: ${vehicleData.fuelType || 'Not specified'}`, 20, yPosition);
  doc.text(`Transmission: ${vehicleData.transmission || 'Not specified'}`, 120, yPosition);
  yPosition += 8;

  doc.text(`Color: ${vehicleData.color || 'Not specified'}`, 20, yPosition);
  doc.text(`Mileage: ${vehicleData.mileage ? `${vehicleData.mileage.toLocaleString()} miles` : 'Not specified'}`, 120, yPosition);
  yPosition += 8;

  doc.text(`Seating Capacity: ${vehicleData.seatingCapacity || 'Not specified'}`, 20, yPosition);
  doc.text(`Engine Size: ${vehicleData.engineSize || 'Not specified'}`, 120, yPosition);
  yPosition += 8;

  doc.text(`Price Per Day: $${vehicleData.pricePerDay || 'Not specified'}`, 20, yPosition);
  doc.text(`Status: ${vehicleData.isAvailable ? 'Available' : 'Rented'}`, 120, yPosition);
  yPosition += 8;

  doc.text(`Location: ${vehicleData.location || 'Not specified'}`, 20, yPosition);
  yPosition += 15;

  // Vehicle Features Section
  if (vehicleData.features && vehicleData.features.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Features:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const features = vehicleData.features.join(', ');
    const maxWidth = pageWidth - 40;
    const splitFeatures = doc.splitTextToSize(features, maxWidth);
    
    doc.text(splitFeatures, 20, yPosition);
    yPosition += splitFeatures.length * 5 + 10;
  }

  // Description Section
  if (vehicleData.description) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const description = vehicleData.description;
    const maxWidth = pageWidth - 40;
    const splitDescription = doc.splitTextToSize(description, maxWidth);
    
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5 + 10;
  }

  // Rental History Section
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Rental Statistics', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Bookings: ${vehicleData.totalBookings || 0}`, 20, yPosition);
  doc.text(`Total Revenue: $${vehicleData.totalRevenue || 0}`, 120, yPosition);
  yPosition += 8;

  doc.text(`Average Rating: ${vehicleData.averageRating || 'N/A'}`, 20, yPosition);
  doc.text(`Last Rented: ${formatDate(vehicleData.lastRented)}`, 120, yPosition);
  yPosition += 8;

  // Maintenance Information
  if (vehicleData.maintenanceHistory && vehicleData.maintenanceHistory.length > 0) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Maintenance:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    vehicleData.maintenanceHistory.slice(0, 3).forEach((maintenance, index) => {
      doc.text(`${index + 1}. ${maintenance.type} - ${formatDate(maintenance.date)}`, 20, yPosition);
      yPosition += 6;
    });
  }

  // Insurance Information
  if (vehicleData.insurance) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Insurance Information:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Provider: ${vehicleData.insurance.provider || 'Not specified'}`, 20, yPosition);
    doc.text(`Policy Number: ${vehicleData.insurance.policyNumber || 'Not specified'}`, 120, yPosition);
    yPosition += 8;

    doc.text(`Expiry Date: ${formatDate(vehicleData.insurance.expiryDate)}`, 20, yPosition);
    yPosition += 8;
  }

  // Vehicle Images Section
  if (vehicleData.images && vehicleData.images.length > 0) {
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Images:', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${vehicleData.images.length} image(s) available`, 20, yPosition);
    yPosition += 8;

    // Add note about images
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('Note: Images are available in the online system', 20, yPosition);
    yPosition += 15;
  }

  // Vehicle Statistics
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Vehicle Statistics', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Created: ${formatDateTime(vehicleData.createdAt)}`, 20, yPosition);
  doc.text(`Last Updated: ${formatDateTime(vehicleData.updatedAt)}`, 20, yPosition + 5);
  
  // Calculate vehicle age
  if (vehicleData.createdAt) {
    const vehicleAge = Math.floor((new Date() - new Date(vehicleData.createdAt)) / (1000 * 60 * 60 * 24));
    doc.text(`Vehicle Age: ${vehicleAge} days`, 20, yPosition + 10);
  }

  // Contact Information
  yPosition += 25;
  doc.setFillColor(37, 99, 235);
  doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Contact Information', 20, yPosition);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('For inquiries about this vehicle:', 20, yPosition + 8);
  doc.text('Email: support@swiftride.com | Phone: +1-234-567-8900', 20, yPosition + 16);

  // Footer
  yPosition = pageHeight - 30;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, yPosition, pageWidth, 30, 'F');
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document ID: SwiftRide-${reportId} | Generated: ${new Date().toISOString()}`, pageWidth / 2, yPosition + 25, { align: 'center' });

  return doc;
};

export const exportVehiclePDF = (vehicleData, enqueueSnackbar) => {
  try {
    const doc = generateVehicleReportPDF(vehicleData);
    const filename = `vehicle-report-${vehicleData.make}-${vehicleData.model}-${vehicleData.year}-${Date.now()}.pdf`;
    doc.save(filename);
    enqueueSnackbar(`Vehicle report exported: ${filename}`, { variant: 'success' });
  } catch (error) {
    console.error('Error exporting vehicle PDF:', error);
    enqueueSnackbar('Error exporting vehicle report', { variant: 'error' });
  }
};
