import { StructureExtractor } from "../structure-extractor/index.js";

const extractor = new StructureExtractor();

const projectPath = "../../..";
console.log(projectPath);
async function run() {
  try {
    const result = await extractor.extract(projectPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
  }
}

run();