export const randomStringGenerator = (length = 100) => {
    const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const len = chars.length;
    let random = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * len);
        random += chars[randomIndex];
    }
    
    return random;
};
