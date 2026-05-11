
import QRCode from "qrcode";

/**
 * Generate QR Code
 *
 * @param {string} data - Text/URL/data to encode
 * @param {object} options - Optional QR settings
 * @returns {Promise<string>} Base64 QR image
 */

export async function generateQR(data, options = {}) {
  try {
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || "H",
      type: "image/png",
      quality: options.quality || 0.92,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || "#000000",
        light: options.lightColor || "#FFFFFF",
      },
      width: options.width || 300,
    };

    const qrImage = await QRCode.toDataURL(data, qrOptions);

    return qrImage;
  } catch (error) {
    throw new Error("QR Generation Failed: " + error.message);
  }
}