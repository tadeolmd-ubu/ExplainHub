import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { simpleGit } from "simple-git";
import AdmZip from "adm-zip";

const MAX_EXTRACTED_BYTES = 100 * 1024 * 1024;
/**
 * Encapsula la logica de clonado de repositorios Git dentro del proyecto.
 * Cada clon se guarda en una carpeta unica dentro de /temp para evitar colisiones.
 */
export class RepositoryCloner {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseTempDir] Directorio base donde se guardaran los clones.
   * @param {import("simple-git").SimpleGitOptions} [options.gitOptions] Opciones opcionales para simple-git.
   */
  constructor(options = {}) {
    this.baseTempDir = options.baseTempDir ?? path.join(process.cwd(), "temp");
    this.git = simpleGit({
      baseDir: process.cwd(),
      ...options.gitOptions,
    });
  }

  /**
   * Clona un repositorio remoto o local dentro de una carpeta temporal del proyecto.
   * Si se pasa un processCallback, ejecuta el callback con el resultado del clon
   * y automaticamente elimina el repositorio al finalizar.
   *
   * @param {string} repositoryUrl URL o referencia del repositorio Git.
   * @param {(result: CloneResult) => Promise<void>} [processCallback] Callback opcional para procesar el clon.
   * @returns {Promise<CloneResult>} Metadata del clon realizado.
   */
  async clone(repositoryUrl, processCallback) {
    const sanitizedRepositoryUrl = this.validateRepositoryUrl(repositoryUrl);

    await this.ensureBaseTempDirectory();

    const cloneName = this.extractRepositoryName(sanitizedRepositoryUrl);
    const tempPath = path.join(this.baseTempDir, cloneName);
    const repoPath = path.join(tempPath, "repository");
    if (existsSync(tempPath)) {
      await this.cleanup(tempPath);
    }

    await fs.mkdir(tempPath, { recursive: true });

    try {
      await Promise.race([
        this.git.clone(sanitizedRepositoryUrl, repoPath, ["--depth", "1"]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Clone timeout: excedió 60 segundos")), 60000),
        ),
      ]);
    } catch (error) {
      await this.cleanup(tempPath);
      throw new Error(
        `No se pudo clonar el repositorio "${sanitizedRepositoryUrl}": ${error.message}`,
      );
    }

    const result = {
      repositoryUrl: sanitizedRepositoryUrl,
      tempPath,
      repoPath,
      cloneName,
    };

    if (processCallback) {
      try {
        await processCallback(result);
      } finally {
        await this.cleanup(tempPath);
      }
    }

    return result;
  }

  /**
   * Valida que la entrada tenga forma razonable para un repositorio Git.
   * Acepta HTTPS, HTTP, SSH, Git protocol y rutas locales.
   *
   * @param {string} repositoryUrl
   * @returns {string}
   */
  validateRepositoryUrl(repositoryUrl) {
    if (
      typeof repositoryUrl !== "string" ||
      repositoryUrl.trim().length === 0
    ) {
      throw new Error(
        "Debes proporcionar una URL o ruta de repositorio valida.",
      );
    }

    const normalizedUrl = repositoryUrl.trim();

    if (
      this.isSupportedRemoteUrl(normalizedUrl) ||
      this.isLikelyLocalPath(normalizedUrl)
    ) {
      return normalizedUrl;
    }

    throw new Error(
      "Formato de repositorio no soportado. Usa HTTPS, HTTP, SSH, git:// o una ruta local.",
    );
  }

  /**
   * Crea el directorio base /temp si aun no existe.
   *
   * @returns {Promise<void>}
   */
  async ensureBaseTempDirectory() {
    await fs.mkdir(this.baseTempDir, { recursive: true });
  }

  /**
   * Elimina una carpeta temporal cuando el clon falla.
   *
   * @param {string} targetPath
   * @returns {Promise<void>}
   */
  async cleanup(targetPath) {
    await fs.rm(targetPath, { recursive: true, force: true });
  }

  /**
   * Extrae una porcion legible del nombre del repositorio para nombrar carpetas.
   *
   * @param {string} repositoryUrl
   * @returns {string}
   */
  extractRepositoryName(repositoryUrl) {
    if (this.isLikelyLocalPath(repositoryUrl)) {
      const resolvedPath = path.resolve(repositoryUrl);
      const localName = path.basename(resolvedPath);

      if (localName) {
        return localName.replace(/[^a-zA-Z0-9-_]/g, "-");
      }
    }

    const normalizedUrl = repositoryUrl.replace(/\/+$/, "");
    const segments = normalizedUrl.split(/[/:]/).filter(Boolean);
    const rawName = segments.at(-1) ?? "repository";

    return rawName.replace(/\.git$/i, "").replace(/[^a-zA-Z0-9-_]/g, "-");
  }

  /**
   * Detecta URLs remotas soportadas por Git.
   *
   * @param {string} repositoryUrl
   * @returns {boolean}
   */
  isSupportedRemoteUrl(repositoryUrl) {
    const supportedSchemes = /^(https?:\/\/|git:\/\/|ssh:\/\/)/i;
    const sshShortcut = /^[\w.-]+@[\w.-]+:[\w./-]+(?:\.git)?$/i;

    return (
      supportedSchemes.test(repositoryUrl) || sshShortcut.test(repositoryUrl)
    );
  }

  /**
   * Permite clonar desde una ruta local absoluta o relativa.
   *
   * @param {string} repositoryUrl
   * @returns {boolean}
   */
  isLikelyLocalPath(repositoryUrl) {
    if (
      repositoryUrl === "." ||
      repositoryUrl === ".." ||
      repositoryUrl.startsWith("./") ||
      repositoryUrl.startsWith("../")
    ) {
      return true;
    }

    if (path.isAbsolute(repositoryUrl)) {
      return true;
    }

    if (/^[a-zA-Z]:[\\/]/.test(repositoryUrl)) {
      return true;
    }

    if (/^[\w.-]+@[\w.-]+:/.test(repositoryUrl)) {
      return false;
    }

    if (repositoryUrl.includes("/") || repositoryUrl.includes("\\")) {
      return true;
    }

    return existsSync(repositoryUrl);
  }
  async extractZip(zipPath) {
    await this.ensureBaseTempDirectory();
    const extractName = this.extractRepositoryName(zipPath);
    const tempPath = path.join(this.baseTempDir, extractName);
    const repoPath = path.join(tempPath, "repository");
    if (existsSync(tempPath)) {
      await this.cleanup(tempPath);
    }

    await fs.mkdir(tempPath, { recursive: true });
    try {
      const zip = new AdmZip(zipPath);
      const entries = zip.getEntries();
      if (entries.length > 5000) {
        throw new Error(
          `Zip contiene ${entries.length} archivos, máximo permitido 5000`,
        );
      }

      let totalSize = 0;
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const name = this.safeZipEntryName(entry.entryName, repoPath);
        totalSize += Number(entry.header.size) || 0;
        if (totalSize > MAX_EXTRACTED_BYTES) {
          throw new Error(
            "El zip excede el tamaño máximo permitido al descomprimir",
          );
        }
        const destination = path.join(repoPath, name);
        const content = zip.readFile(entry);
        await fs.mkdir(path.dirname(destination), { recursive: true });
        await fs.writeFile(destination, content);
      }
    } catch (error) {
      await this.cleanup(tempPath);
      throw new Error(`No se pudo extraer el zip: ${error.message}`);
    }

    return {
      repositoryUrl: zipPath,
      tempPath,
      repoPath,
      cloneName: extractName,
    };
  }

  safeZipEntryName(entryName, repoPath) {
    const raw = String(entryName);
    if (
      raw.startsWith("/") ||
      raw.startsWith("\\") ||
      /^[a-zA-Z]:/.test(raw)
    ) {
      throw new Error(`Ruta no permitida dentro del zip: "${entryName}"`);
    }
    const normalized = raw.replace(/\\/g, "/");
    if (path.posix.isAbsolute(normalized)) {
      throw new Error(`Ruta no permitida dentro del zip: "${entryName}"`);
    }
    const resolved = path.resolve(repoPath, normalized);
    if (resolved !== repoPath && !resolved.startsWith(repoPath + path.sep)) {
      throw new Error(`Ruta no permitida dentro del zip: "${entryName}"`);
    }
    return normalized;
  }
}

/**
 * @typedef {Object} CloneResult
 * @property {string} repositoryUrl URL o ruta original normalizada.
 * @property {string} tempPath Carpeta contenedora creada dentro de /temp.
 * @property {string} repoPath Ruta final del repositorio clonado.
 * @property {string} cloneNames Identificador unico del clon.
 */
