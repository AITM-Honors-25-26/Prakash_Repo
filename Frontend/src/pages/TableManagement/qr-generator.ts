import QRCode from 'qrcode';
// Import your constants (adjust the path if necessary)
import { API_ENDPOINTS } from '../../constants/constants';

/**
 * Generates a QR code for a specific table.
 * The QR encodes a link to your frontend menu page.
 */
export const generateTableQR = async (tableNumber: number | string): Promise<string> => {
  try {
    /**
     * Logic: The QR should point to your FRONTEND route.
     * When the guest scans it, they land on your Menu page.
     * Your Menu page will then use API_ENDPOINTS.TABLENUMBER to get the data.
     */
    const frontendUrl = `${API_ENDPOINTS.TABLENUMBER}/${tableNumber}`;
    
    // Generate the QR as a Data URL
    const qrDataUrl = await QRCode.toDataURL(frontendUrl, {
      width: 300,      margin: 2,
      color: {
        dark: '#000000', 
        light: '#faf7f2',
      },
    });
    
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
};