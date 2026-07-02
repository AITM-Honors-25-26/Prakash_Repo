import QRCode from 'qrcode';
import { getFrontendBaseUrl } from '../../constants/constants';

/**
 * Generates a QR code image string.
 * @param {string} id - The unique Table ID or Number.
 * @returns {Promise<string>} - Base64 Data URL of the QR code.
 */
export const generateTableQR = async (id: string): Promise<string> => {
  try {
    const frontendBaseUrl = await getFrontendBaseUrl();
    const guestUrl = `${frontendBaseUrl}/MenuPage/${id}`;

    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#48392a',
        light: '#faf7f2',
      },
    });

    return qrDataUrl;
  } catch (err) {
    console.error('QR Generation Error:', err);
    throw err;
  }
};