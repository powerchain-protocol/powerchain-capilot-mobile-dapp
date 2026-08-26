import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

function key() {
  if (!env.SETTINGS_ENCRYPTION_KEY) {
    throw new Error("SETTINGS_ENCRYPTION_KEY is not configured.");
  }
  return createHash("sha256").update(env.SETTINGS_ENCRYPTION_KEY).digest();
}

export function encryptSetting(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptSetting(envelope: string) {
  const [version, ivRaw, tagRaw, cipherRaw] = envelope.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !cipherRaw) {
    throw new Error("Invalid encrypted-setting envelope.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(cipherRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
