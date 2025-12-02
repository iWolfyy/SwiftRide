import jsPDF from 'jspdf';

/**
 * Generates a comprehensive PDF for individual payment details
 * @param {Object} payment - The payment object containing all payment details
 * @param {Function} enqueueSnackbar - Function to show success/error messages
 * @param {Function} setIsDownloading - Function to set loading state
 */
export const generatePaymentPDF = async (payment, enqueueSnackbar, setIsDownloading) => {
  if (!payment) return;
  
  setIsDownloading(true);
  try {
    // Debug: Log payment data to see what's available
    console.log('Payment data for PDF:', payment);
    console.log('Price per day:', payment.pricePerDay);
    console.log('Total days:', payment.totalDays);
    console.log('Vehicle price:', payment.vehicle?.pricePerDay);
    
    // Create new PDF with modern design
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Modern design colors (defined inline for better performance)
    
    // Helper function to check if we need a new page
    const checkPageBreak = (requiredHeight) => {
      if (yPosition + requiredHeight > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
        return true;
      }
      return false;
    };

    // Add modern header with gradient effect and professional styling
    pdf.setFillColor(37, 99, 235); // Primary blue
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Add subtle gradient effect with darker blue at top
    pdf.setFillColor(30, 64, 175);
    pdf.rect(0, 0, pageWidth, 15, 'F');
    
    // Add company logo
    try {
      const logoImg = new Image();
      logoImg.src = '/logo.png';
      pdf.addImage(logoImg, 'PNG', 20, 12, 25, 25);
    } catch (error) {
      console.log('Logo not loaded, using text fallback');
      // Fallback to text if logo fails to load
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(28);
      pdf.text('SwiftRide', 20, 25);
    }
    
    // Company name and tagline
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.text('SwiftRide', 55, 25);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Vehicle Rental Service', 55, 35);
    
    // Add payment status badge with enhanced styling
    const statusColor = payment.paymentStatus === 'paid' ? 
      { r: 16, g: 185, b: 129 } : // Green
      payment.paymentStatus === 'pending' ? 
      { r: 245, g: 158, b: 11 } : // Yellow
      { r: 239, g: 68, b: 68 }; // Red
    
    pdf.setFillColor(statusColor.r, statusColor.g, statusColor.b);
    pdf.roundedRect(pageWidth - 70, 15, 60, 25, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('PAYMENT', pageWidth - 65, 25);
    pdf.text(payment.paymentStatus?.toUpperCase() || 'UNKNOWN', pageWidth - 65, 32);
    pdf.setFontSize(9);
    pdf.text(`ID: ${payment._id.slice(-6)}`, pageWidth - 65, 38);
    
    // Add decorative line under header
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(2);
    pdf.line(20, 45, pageWidth - 20, 45);

    // Reset text color for content
    pdf.setTextColor(31, 41, 55);
    let yPosition = 60;

    // Payment Receipt Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Payment Receipt', 20, yPosition);
    
    // Date and transaction info
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    pdf.text(`Generated: ${currentDate}`, 20, yPosition + 8);
    pdf.text(`Transaction Date: ${formatDate(payment.createdAt)}`, 20, yPosition + 16);

    yPosition += 35;

    // Payment Summary Section with enhanced professional styling
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 70, 8, 8, 'F');
    
    // Add border for professional look
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 70, 8, 8, 'S');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('Payment Summary', 20, yPosition + 8);
    
    // Add decorative line under title
    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(1);
    pdf.line(20, yPosition + 12, 80, yPosition + 12);
    
    // Payment status and amount side by side with enhanced styling
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(20, yPosition + 18, 85, 22, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Payment Status:', 25, yPosition + 28);
    pdf.setFontSize(15);
    pdf.text(payment.paymentStatus?.toUpperCase() || 'UNKNOWN', 25, yPosition + 36);
    
    // Total amount with enhanced styling
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(115, yPosition + 18, 85, 22, 5, 5, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Total Amount:', 120, yPosition + 28);
    pdf.setFontSize(18);
    pdf.text(`$${payment.totalAmount?.toFixed(2) || '0.00'}`, 120, yPosition + 36);
    
    // Additional payment info with better formatting
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Transaction ID: ${payment._id}`, 20, yPosition + 45);
    if (payment.stripeSessionId) {
      pdf.text(`Stripe Session: ${payment.stripeSessionId}`, 20, yPosition + 52);
    }
    pdf.text(`Payment Date: ${payment.createdAt ? new Date(payment.createdAt).toLocaleString() : 'N/A'}`, 120, yPosition + 45);
    pdf.text(`Currency: USD`, 120, yPosition + 52);
    pdf.text(`Payment Method: ${payment.paymentMethod?.brand || 'Card'}`, 120, yPosition + 59);

    yPosition += 80;

    // Payment Breakdown Section
    console.log('Adding Payment Breakdown section at yPosition:', yPosition);
    checkPageBreak(90); // Check if we need a new page for this section
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 8, 5, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Payment Breakdown', 20, yPosition);
    
    yPosition += 15;
    
    // Payment breakdown box with clean styling
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 60, 5, 5, 'F');
    
    // Add border for professional look
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 60, 5, 5, 'S');
    
    // Calculate breakdown with fallback values
    const pricePerDay = payment.pricePerDay || payment.vehicle?.pricePerDay || 0;
    const totalDays = payment.totalDays || 0;
    
    console.log('Payment breakdown calculation:', {
      pricePerDay,
      totalDays,
      totalAmount: payment.totalAmount
    });
    
    // If we still don't have the data, try to calculate from total amount
    let subtotal = pricePerDay * totalDays;
    if (subtotal === 0 && payment.totalAmount) {
      // Estimate: total amount / 1.1 (assuming 10% total fees)
      subtotal = payment.totalAmount / 1.1;
      console.log('Using estimated subtotal:', subtotal);
    }
    
    const tax = subtotal * 0.05;
    const serviceFee = subtotal * 0.05;
    
    console.log('Final breakdown values:', {
      subtotal,
      tax,
      serviceFee,
      totalAmount: payment.totalAmount
    });
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    // Clean payment breakdown
    pdf.text('Daily Rate × Days:', 20, yPosition + 8);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`$${pricePerDay.toFixed(2)} × ${totalDays} days`, 120, yPosition + 8);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text('Subtotal:', 20, yPosition + 20);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`$${subtotal.toFixed(2)}`, 120, yPosition + 20);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text('Tax (5%):', 20, yPosition + 32);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`$${tax.toFixed(2)}`, 120, yPosition + 32);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text('Service Fee (5%):', 20, yPosition + 44);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`$${serviceFee.toFixed(2)}`, 120, yPosition + 44);
    
    // Total amount with professional highlighting
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect(15, yPosition + 50, pageWidth - 30, 15, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Total Amount:', 20, yPosition + 60);
    pdf.setFontSize(16);
    pdf.text(`$${payment.totalAmount?.toFixed(2) || '0.00'}`, 120, yPosition + 60);

    yPosition += 100; // Increased spacing to prevent overlap with total amount box

    // Vehicle Information Section (Compact)
    checkPageBreak(40); // Check if we need a new page for this section
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 40, 5, 5, 'F');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Vehicle Information', 20, yPosition + 8);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(37, 99, 235);
    pdf.text(`${payment.vehicle?.year || 'N/A'} ${payment.vehicle?.make || 'N/A'} ${payment.vehicle?.model || 'N/A'}`, 20, yPosition + 20);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    
    pdf.text(`License: ${payment.vehicle?.licensePlate || 'N/A'}`, 20, yPosition + 30);
    pdf.text(`Type: ${payment.vehicle?.type || 'N/A'}`, 120, yPosition + 30);
    pdf.text(`Fuel: ${payment.vehicle?.fuelType || 'N/A'}`, 20, yPosition + 38);
    pdf.text(`Transmission: ${payment.vehicle?.transmission || 'N/A'}`, 120, yPosition + 38);

    yPosition += 50;

    // Payment Method Section (Compact)
    if (payment.paymentMethod) {
      checkPageBreak(35); // Check if we need a new page for this section
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 35, 5, 5, 'F');
      
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text('Payment Method', 20, yPosition + 8);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      
      pdf.text(`${payment.paymentMethod.brand?.toUpperCase() || 'CARD'} •••• ${payment.paymentMethod.last4 || '0000'}`, 20, yPosition + 18);
      pdf.text(`Exp: ${String(payment.paymentMethod.expMonth || 0).padStart(2, '0')}/${payment.paymentMethod.expYear || 0}`, 20, yPosition + 28);
      pdf.text(`${payment.paymentMethod.country?.toUpperCase() || 'N/A'}`, 120, yPosition + 18);
      pdf.text(`${payment.paymentMethod.funding?.toUpperCase() || 'N/A'}`, 120, yPosition + 28);

      yPosition += 45;
    }




    // Rental Details Section (Condensed)
    checkPageBreak(25); // Check if we need a new page for this section
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 25, 5, 5, 'F');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Rental Details', 20, yPosition + 5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    
    pdf.text(`Pickup: ${payment.pickupLocation || 'N/A'}`, 20, yPosition + 15);
    pdf.text(`Return: ${payment.dropoffLocation || 'N/A'}`, 120, yPosition + 15);

    yPosition += 35;


    // Transaction Information Section (Compact)
    checkPageBreak(25); // Check if we need a new page for this section
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 25, 5, 5, 'F');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Transaction Info', 20, yPosition + 8);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    
    pdf.text(`Status: ${payment.status?.toUpperCase() || 'UNKNOWN'}`, 20, yPosition + 18);
    pdf.text(`Booking ID: ${payment._id?.slice(-8) || 'N/A'}`, 120, yPosition + 18);

    yPosition += 35;



    // Simple Footer
    yPosition += 20;

    // Simple Footer
    yPosition = pageHeight - 20;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, yPosition, pageWidth, 20, 'F');
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('SwiftRide', pageWidth / 2, yPosition + 8, { align: 'center' });
    pdf.text('Generated: ' + new Date().toLocaleDateString(), pageWidth / 2, yPosition + 15, { align: 'center' });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `Payment-Receipt-${payment._id.slice(-6)}-${timestamp}.pdf`;
    
    // Save PDF
    pdf.save(fileName);
    
    enqueueSnackbar('Payment receipt PDF downloaded successfully!', { variant: 'success' });
  } catch (error) {
    console.error('Error generating payment PDF:', error);
    enqueueSnackbar('Error downloading PDF. Please try again.', { variant: 'error' });
  } finally {
    setIsDownloading(false);
  }
};

/**
 * Helper function to format dates consistently
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
