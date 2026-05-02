//
// LISTA DE CLAVE VALOR QUE DETECTA DE QUE ARCHIVO ES CADA TECNOLOGIA
//
export const techRules = {
  exact: {
    "package.json": "Node.js",
    "requirements.txt": "Python",
    "pom.xml": "Java",
    "index.html": "Frontend",
  },

  extensions: {
    ".csproj": "C#",
    ".py": "Python",
    ".java": "Java",
    ".ts": "TypeScript",
  },
};
