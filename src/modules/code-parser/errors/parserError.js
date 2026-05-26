export class ParserError extends Error {
  constructor(filePath, reason, fileType) {
    super(`Error parsing ${filePath}: ${reason}`);
    this.filePath = filePath;
    this.reason = reason;
    this.fileType = fileType;
    this.name = "ParserError";
  }
}