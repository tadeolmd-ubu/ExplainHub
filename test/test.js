import path from "node:path";
import { RepositoryCloner } from "../src/modules/cloner/index.js";

/**
 * Script manual para probar el modulo cloner sin depender del resto de la app.
 *
 * Uso:
 * node test/test.js https://github.com/usuario/repositorio.git
 * node test/test.js git@github.com:usuario/repositorio.git
 * node test/test.js .
 */
async function run() {
  const repositoryUrl = process.argv[2];

  if (!repositoryUrl) {
    console.error("Debes pasar una URL o ruta de repositorio como argumento.");
    process.exitCode = 1;
    return;
  }

  const cloner = new RepositoryCloner({
    baseTempDir: path.join(process.cwd(), "../temp"),
  });

  try {
    console.log(`Clonando repositorio: ${repositoryUrl}`);

    const result = await cloner.clone(repositoryUrl);

    console.log("Clonado completado.");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Fallo la prueba del cloner.");
    console.error(error.message);
    process.exitCode = 1;
  }
}

run();
