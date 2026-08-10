// Turns any reasonable phone input into international format for gateway
// delivery (WhatsApp Cloud API, Sparrow SMS etc.): "98XXXXXXXX" / "0XXXXXXXXX"
// → "97798XXXXXXXX", already-international "97798XXXXXXXX" stays as-is.
export const toInternational = (phone) => {
    let digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("00")) digits = digits.slice(2); // +977 as 00...
    if (digits.startsWith("0")) digits = digits.slice(1);  // local 0-prefix
    if (digits.startsWith("977")) return digits;           // already international
    if (digits.length === 10) return `977${digits}`;       // plain Nepali mobile
    return digits;
};
