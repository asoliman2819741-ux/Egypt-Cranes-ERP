/**
 * Security Encryption Utility for Egypt Cranes ERP Database Backups
 * Supports full UTF-8 text encoding (Arabic language) and secure password validation.
 */

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Encrypts a database JSON string using a user password.
 * @param dataStr The JSON string of the database
 * @param passcode The user-specified password
 */
export function encryptData(dataStr: string, passcode: string): string {
  const salt = "EGYPT_CRANES_SALT_2026_SECURE_ERP";
  const combined = salt + passcode;
  
  const keyCodes: number[] = [];
  for (let i = 0; i < combined.length; i++) {
    keyCodes.push(combined.charCodeAt(i));
  }
  
  let ciphertext = "";
  for (let i = 0; i < dataStr.length; i++) {
    const charCode = dataStr.charCodeAt(i);
    const keyCode = keyCodes[i % keyCodes.length];
    // XOR key followed by shift modulo
    const encryptedCharCode = (charCode ^ keyCode) + (keyCode % 13);
    ciphertext += String.fromCharCode(encryptedCharCode);
  }
  
  const hash = simpleHash(passcode);
  const payload = `EGYPT-CRANES-SECURE-BACKUP::${hash}::${ciphertext}`;
  
  // Clean Base64 representation of UTF-8 text
  return btoa(unescape(encodeURIComponent(payload)));
}

/**
 * Decrypts an encrypted database string using the user password.
 * @param base64Str Base64 encrypted string
 * @param passcode The user-specified password
 */
export function decryptData(base64Str: string, passcode: string): string {
  try {
    const decoded = decodeURIComponent(escape(atob(base64Str)));
    if (!decoded.startsWith("EGYPT-CRANES-SECURE-BACKUP::")) {
      throw new Error("ملف النسخ الاحتياطي غير صالح أو تالف.");
    }
    
    const parts = decoded.split("::");
    if (parts.length < 3) {
      throw new Error("هيكل ملف النسخ الاحتياطي تالف.");
    }
    
    const expectedHash = parts[1];
    const ciphertext = parts.slice(2).join("::"); // Handle any double colons in data (unlikely but safe)
    
    const currentHash = simpleHash(passcode);
    if (currentHash !== expectedHash) {
      throw new Error("رمز فك التشفير غير صحيح! الرجاء إدخال كلمة مرور صحيحة للنسخ الاحتياطي.");
    }
    
    const salt = "EGYPT_CRANES_SALT_2026_SECURE_ERP";
    const combined = salt + passcode;
    const keyCodes: number[] = [];
    for (let i = 0; i < combined.length; i++) {
      keyCodes.push(combined.charCodeAt(i));
    }
    
    let decrypted = "";
    for (let i = 0; i < ciphertext.length; i++) {
      const charCode = ciphertext.charCodeAt(i);
      const keyCode = keyCodes[i % keyCodes.length];
      const originalCharCode = (charCode - (keyCode % 13)) ^ keyCode;
      decrypted += String.fromCharCode(originalCharCode);
    }
    
    return decrypted;
  } catch (e: any) {
    if (e.message && e.message.includes("رمز فك التشفير غير صحيح")) {
      throw e;
    }
    throw new Error("فشل في فك تشفير الملف. تأكد من أن الملف سليم وأنك أدخلت كلمة مرور صحيحة.");
  }
}
