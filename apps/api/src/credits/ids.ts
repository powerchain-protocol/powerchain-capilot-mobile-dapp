import { randomUUID } from "node:crypto";

export function creditId(prefix: string) {
  return `${prefix}_${randomUUID().replaceAll("-", "")}`;
}
