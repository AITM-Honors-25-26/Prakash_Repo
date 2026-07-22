import QRCode from "qrcode";

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