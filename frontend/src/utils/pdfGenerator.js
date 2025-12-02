import jsPDF from 'jspdf';

/**
 * Generates a modern PDF for booking confirmation
 * @param {Object} booking - The booking object containing all booking details
 * @param {Function} enqueueSnackbar - Function to show success/error messages
 * @param {Function} setIsDownloading - Function to set loading state
 * @param {string} paymentStatus - Optional payment status for BookingSuccess page
 */
export const generateBookingPDF = async (booking, enqueueSnackbar, setIsDownloading, paymentStatus = null) => {
  if (!booking) return;
  
  setIsDownloading(true);
  try {
    // Create new PDF with modern design
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors for modern design
    const colors = {
      primary: '#2563eb',
      secondary: '#f1f5f9',
      accent: '#10b981',
      text: '#1f2937',
      lightGray: '#f8fafc',
      darkGray: '#64748b'
    };

    // Add modern header with gradient effect
    pdf.setFillColor(37, 99, 235); // Primary blue
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // Add company logo
    try {
      const logoImg = new Image();
      logoImg.src = '/logo.png';
      pdf.addImage(logoImg, 'PNG', 20, 8, 20, 20);
    } catch (error) {
      console.log('Logo not loaded, using text fallback');
      // Fallback to text if logo fails to load
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.text('SwiftRide', 20, 20);
    }
    
    // Company name and tagline
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('SwiftRide', 50, 20);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Car Rental Service', 50, 28);
    
    // Add booking confirmation badge
    pdf.setFillColor(16, 185, 129); // Green accent
    pdf.roundedRect(pageWidth - 60, 10, 50, 20, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('CONFIRMED', pageWidth - 55, 18);
    pdf.text(`ID: ${booking._id.slice(-6)}`, pageWidth - 55, 26);

    // Reset text color for content
    pdf.setTextColor(31, 41, 55);
    let yPosition = 60;

    // Booking Confirmation Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Booking Confirmation', 20, yPosition);
    
    // Date and status
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
    
    // Use paymentStatus if provided (from BookingSuccess), otherwise use booking status
    const statusText = paymentStatus ? 
      (paymentStatus === 'paid' ? 'Payment Confirmed' : 'Processing') : 
      booking.status.toUpperCase();
    pdf.text(`Status: ${statusText}`, 20, yPosition + 16);

    yPosition += 35;

    // Vehicle Information Section
    pdf.setFillColor(248, 250, 252); // Light gray background
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 45, 5, 5, 'F');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Vehicle Details', 20, yPosition + 5);
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(37, 99, 235);
    pdf.text(`${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`, 20, yPosition + 15);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`License Plate: ${booking.vehicle.licensePlate}`, 20, yPosition + 25);
    pdf.text(`Fuel Type: ${booking.vehicle.fuelType}`, 120, yPosition + 25);

    yPosition += 50;

    // Rental Details Section
    pdf.setFillColor(241, 245, 249); // Slightly different gray
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 50, 5, 5, 'F');
    
    pdf.setTextColor(31, 41, 55);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Rental Information', 20, yPosition + 5);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    
    // Left column
    pdf.text('Pickup Date:', 20, yPosition + 18);
    pdf.setTextColor(31, 41, 55);
    pdf.text(formatDate(booking.startDate), 50, yPosition + 18);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text('Return Date:', 20, yPosition + 28);
    pdf.setTextColor(31, 41, 55);
    pdf.text(formatDate(booking.endDate), 50, yPosition + 28);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text('Total Days:', 20, yPosition + 38);
    pdf.setTextColor(31, 41, 55);
    pdf.text(`${booking.totalDays} days`, 50, yPosition + 38);
    
    // Right column
    pdf.setTextColor(100, 116, 139);
    pdf.text('Pickup Location:', 120, yPosition + 18);
    pdf.setTextColor(31, 41, 55);
    const pickupText = pdf.splitTextToSize(booking.pickupLocation, 70);
    pdf.text(pickupText, 120, yPosition + 25);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text('Return Location:', 120, yPosition + 35);
    pdf.setTextColor(31, 41, 55);
    const dropoffText = pdf.splitTextToSize(booking.dropoffLocation, 70);
    pdf.text(dropoffText, 120, yPosition + 42);

    yPosition += 55;

    // Payment Summary Section
    pdf.setFillColor(16, 185, 129); // Green background
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 8, 5, 5, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Payment Summary', 20, yPosition);
    
    yPosition += 15;
    
    // Payment details box
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(15, yPosition - 5, pageWidth - 30, 30, 5, 5, 'F');
    
    // Total amount (highlighted and centered)
    pdf.setFillColor(37, 99, 235);
    pdf.roundedRect((pageWidth - 100) / 2, yPosition + 5, 100, 20, 3, 3, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Total Amount:', pageWidth / 2, yPosition + 13, { align: 'center' });
    pdf.setFontSize(16);
    pdf.text(`$${booking.totalAmount.toFixed(2)}`, pageWidth / 2, yPosition + 21, { align: 'center' });

    yPosition += 45;

    // Terms and Conditions
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Important Information:', 20, yPosition);
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const terms = [
      '• Please bring a valid driver\'s license and credit card used for payment',
      '• Arrive 15 minutes before scheduled pickup time',
      '• Vehicle inspection will be conducted at pickup and return',
      '• Late return charges may apply as per rental agreement',
      '• For support contact: support@vehiclerent.com | +1-234-567-8900'
    ];
    
    terms.forEach((term, index) => {
      pdf.text(term, 20, yPosition + 10 + (index * 6));
    });

    // Footer
    yPosition = pageHeight - 30;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, yPosition, pageWidth, 30, 'F');
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`Document ID: SwiftRide-${booking._id.slice(-8)} | Generated: ${new Date().toISOString()}`, pageWidth / 2, yPosition + 25, { align: 'center' });

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `SwiftRide-Booking-${booking._id.slice(-6)}-${timestamp}.pdf`;
    
    // Save PDF
    pdf.save(fileName);
    
    enqueueSnackbar('Booking confirmation PDF downloaded successfully!', { variant: 'success' });
  } catch (error) {
    console.error('Error generating PDF:', error);
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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
