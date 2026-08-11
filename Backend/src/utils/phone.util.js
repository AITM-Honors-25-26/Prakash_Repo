export const toInternational = (phone) => {
    let digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    if (digits.startsWith("977")) return digits;
    if (digits.length === 10) return `977${digits}`;
    return digits;
};
