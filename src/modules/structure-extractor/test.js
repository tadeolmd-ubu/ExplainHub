import { StructureExtractor } from "../structure-extractor/index.js";
import path from "node:path";

const extractor = new StructureExtractor();

const projectPath = path.resolve("../../..");

async function run() {
  try {
    console.log("Analizando:", projectPath);

    const result = await extractor.extract(projectPath);

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error); 
    throw error;
  }
}

run();
