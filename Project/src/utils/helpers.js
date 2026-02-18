export const randomStringGenerator = (length = 100, type="string") => {
    let chars = "0123456789";
    if (chars === "string"){
        chars +="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }else if(type="special"){
        chars+="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*(_)-+{}";
    }
    let len = chars.length
    let random = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * len);
        random += chars[randomIndex];
    }
    return random;
};