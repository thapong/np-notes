import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { basename, join, resolve, relative } from "node:path";
import { pipeline } from "node:stream/promises";
import { loadConfig } from "../config";
export type StoredFile = { storagePath: string; originalName: string; mimeType: string; sizeBytes: number; sha256: string };
export async function saveFile(stream: NodeJS.ReadableStream, filename: string, mimeType: string): Promise<StoredFile> { const root = resolve(loadConfig().storageRoot); const safeName = basename(filename).replace(/[^\w.\- ]/g, "_"); const folder = join(root, new Date().toISOString().slice(0, 10)); await mkdir(folder, { recursive: true }); const fullPath = join(folder, `${randomUUID()}-${safeName || "attachment"}`); const hash = createHash("sha256"); let sizeBytes = 0; const hashing = new (await import("node:stream")).Transform({ transform(chunk, _encoding, callback) { sizeBytes += chunk.length; hash.update(chunk); if (sizeBytes > loadConfig().maxAttachmentBytes) callback(new Error("Attachment exceeds maximum size")); else callback(null, chunk); } }); await pipeline(stream, hashing, createWriteStream(fullPath)); const storagePath = relative(root, fullPath).replaceAll("\\", "/"); return { storagePath, originalName: safeName, mimeType, sizeBytes, sha256: hash.digest("hex") }; }
export async function removeFile(storagePath: string) { const root = resolve(loadConfig().storageRoot); const target = resolve(root, storagePath); if (relative(root, target).startsWith("..")) throw new Error("Invalid storage path"); await rm(target, { force: true }); }
