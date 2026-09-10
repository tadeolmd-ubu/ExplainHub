import yauzl from "yauzl";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { repositoryLimits, limitError } from "../security/limits.js";

export async function extractArchive(zipPath, repoPath, validateName) {
  if ((await fs.stat(zipPath)).size > repositoryLimits.maxBytes) throw limitError("Zip exceeds compressed size limit");
  const archive = await new Promise((resolve, reject) => yauzl.open(zipPath, { lazyEntries: true, autoClose: false }, (error, zip) => error ? reject(error) : resolve(zip)));
  let total = 0;
  let entries = 0;
  let archiveError;
  archive.on("error", error => { archiveError = error; });
  try {
    await fs.mkdir(repoPath, { recursive: true });
    while (true) {
      if (archiveError) throw archiveError;
      const entry = await nextEntry(archive);
      if (!entry) break;
      if (++entries > repositoryLimits.maxEntries) throw limitError("Zip contains too many entries");
      const name = validateName(entry.fileName, repoPath);
      if (name.split("/").length > repositoryLimits.maxDepth) throw limitError("Zip exceeds maximum depth");
      if (((entry.externalFileAttributes >>> 16) & 0xf000) === 0xa000) throw new Error("Zip symbolic links are not supported");
      if (name.endsWith("/")) {
        await fs.mkdir(path.join(repoPath, name), { recursive: true });
        continue;
      }
      if (entry.uncompressedSize > repositoryLimits.maxFileBytes) throw limitError("Zip entry exceeds maximum file size");
      const target = path.join(repoPath, name);
      await fs.mkdir(path.dirname(target), { recursive: true });
      const stream = await new Promise((resolve, reject) => archive.openReadStream(entry, (error, value) => error ? reject(error) : resolve(value)));
      let bytes = 0;
      const limiter = new Transform({ transform(chunk, encoding, callback) {
        bytes += chunk.length;
        total += chunk.length;
        if (bytes > repositoryLimits.maxFileBytes || total > repositoryLimits.maxBytes) return callback(limitError("Zip exceeds extracted size limit"));
        callback(null, chunk);
      } });
      await pipeline(stream, limiter, createWriteStream(target, { flags: "wx" }));
      if (bytes !== entry.uncompressedSize) throw new Error("Invalid zip entry size");
    }
  } finally {
    archive.close();
  }
}

function nextEntry(archive) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      archive.off("entry", onEntry);
      archive.off("end", onEnd);
      archive.off("error", onError);
    };
    const onEntry = entry => { cleanup(); resolve(entry); };
    const onEnd = () => { cleanup(); resolve(null); };
    const onError = error => { cleanup(); reject(error); };
    archive.once("entry", onEntry);
    archive.once("end", onEnd);
    archive.once("error", onError);
    archive.readEntry();
  });
}
