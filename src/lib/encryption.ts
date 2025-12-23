import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): string {
    const key = process.env.DATA_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("DATA_ENCRYPTION_KEY is not set");
    }

    const salt = crypto.randomBytes(SALT_LENGTH);
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, "sha512");
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, "hex")]);
    return result.toString("base64");
}

/**
 * Decrypts a string encrypted with the encrypt function
 */
export function decrypt(encryptedData: string): string {
    const key = process.env.DATA_ENCRYPTION_KEY;
    if (!key) {
        throw new Error("DATA_ENCRYPTION_KEY is not set");
    }

    const buffer = Buffer.from(encryptedData, "base64");

    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const tag = buffer.subarray(
        SALT_LENGTH + IV_LENGTH,
        SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, "sha512");
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
