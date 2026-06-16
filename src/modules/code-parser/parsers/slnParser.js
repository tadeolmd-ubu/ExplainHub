const PROJECT_RE =
  /Project\(\s*"\{?(?<typeGuid>[^}]+)"?\s*\)\s*=\s*"(?<name>[^"]+)"\s*,\s*"(?<path>[^"]+)"\s*,\s*"(?<guid>[^"]+)"\s*\)/g;

const PROJECT_TYPES = {
  "FAE04EC0-301F-11D3-BF4B-00C04F79EFBC": "C#",
  "F184B08F-C81C-45F6-A57F-5ABD9991F28F": "VB.NET",
  "8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942": "C++",
  "E24C65DC-737E-472B-9ABA-BC803B73C61A": "Solution Folder",
  "3AC096D0-A1C2-E12C-1390-A8335801FDAB": "Test",
};

export function parseSln(content) {
  const projects = [];
  let match;
  while ((match = PROJECT_RE.exec(content)) !== null) {
    projects.push({
      name: match.groups.name,
      path: match.groups.path.replace(/\\/g, "/"),
      type:
        PROJECT_TYPES[match.groups.typeGuid.toUpperCase()] ||
        match.groups.typeGuid,
    });
  }
  return {
    imports: projects.map((p) => p.path), // path a cada csproj
    functions: [],
    classes: [],
    routes: [],
    exports: [],
    projects, // ← campo extra con la estructura completa
  };
}