import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { env } from "../config/env.js";

function key() {
  if (!env.CHAT_MESSAGE_ENCRYPTION_KEY) return null;
  return createHash("sha256").update(env.CHAT_MESSAGE_ENCRYPTION_KEY).digest();
}

export function protectUserMessage(content: string) {
  const digest = createHash("sha256").update(content).digest("hex");
  const k = key();
  if (!k) {
    return { content, encryptedContent: null, contentEncoding: "plain", contentHash: digest };
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const ciphertext = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    content: "[encrypted]",
    encryptedContent: `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`,
    contentEncoding: "aes-256-gcm",
    contentHash: digest,
  };
}

export function revealMessageContent(message: { content: string; encryptedContent?: string | null; contentEncoding?: string | null }) {
  if (message.contentEncoding !== "aes-256-gcm" || !message.encryptedContent) return message.content;
  const k = key();
  if (!k) throw Object.assign(new Error("Chat message encryption key is unavailable."), { code: "CHAT_DECRYPTION_UNAVAILABLE" });
  const [version, ivRaw, tagRaw, cipherRaw] = message.encryptedContent.split(".");
  if (version !== "v1" || !ivRaw || !tagRaw || !cipherRaw) throw new Error("Invalid chat encryption envelope.");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(cipherRaw, "base64url")), decipher.final()]).toString("utf8");
}

export function secureConversationTitle(message: string) {
  return key() ? "New conversation" : message.slice(0, 80);
}
