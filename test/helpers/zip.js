import yazl from "yazl";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

export async function createZip(target, files) {
  const zip = new yazl.ZipFile();
  for (const [name, content] of Object.entries(files)) zip.addBuffer(Buffer.from(content), name);
  const writing = pipeline(zip.outputStream, createWriteStream(target));
  zip.end();
  await writing;
}
