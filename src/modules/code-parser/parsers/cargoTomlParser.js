import { parse } from "smol-toml";

function toArray(obj) {
  if (obj == null) return [];
  return Array.isArray(obj) ? obj : [obj];
}

function extractPackage(doc) {
  const pkg = doc.package;
  if (!pkg) return null;
  return {
    name: pkg.name || "",
    version: pkg.version || "",
    edition: pkg.edition || "",
    authors: toArray(pkg.authors),
    description: pkg.description || "",
    license: pkg.license || "",
    licenseFile: pkg["license-file"] || "",
    repository: pkg.repository || "",
    homepage: pkg.homepage || "",
    documentation: pkg.documentation || "",
    readme: pkg.readme || "",
    keywords: toArray(pkg.keywords),
    categories: toArray(pkg.categories),
    rustVersion: pkg["rust-version"] || "",
    publish: pkg.publish ?? true,
    build: pkg.build ?? "build.rs",
    links: pkg.links || "",
    resolver: pkg.resolver || "",
    exclude: toArray(pkg.exclude),
    include: toArray(pkg.include),
    defaultRun: pkg["default-run"] || "",
  };
}

function extractDependencies(doc, section) {
  const deps = doc[section];
  if (!deps) return [];
  return Object.entries(deps).map(([name, value]) => {
    if (typeof value === "string") {
      return { name, version: value };
    }
    return {
      name,
      version: value.version || "",
      features: toArray(value.features),
      optional: value.optional || false,
      defaultFeatures: value["default-features"] ?? true,
      git: value.git || "",
      branch: value.branch || "",
      tag: value.tag || "",
      rev: value.rev || "",
      path: value.path || "",
      registry: value.registry || "",
      package: value.package || "",
      workspace: value.workspace || false,
    };
  });
}

function extractFeatures(doc) {
  const features = doc.features;
  if (!features) return {};
  const result = {};
  for (const [key, value] of Object.entries(features)) {
    result[key] = toArray(value);
  }
  return result;
}

function extractProfiles(doc) {
  const profiles = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith("profile.") && typeof value === "object") {
      const name = key.replace("profile.", "");
      profiles[name] = {
        optLevel: value["opt-level"] ?? null,
        debug: value.debug ?? null,
        lto: value.lto ?? null,
        codegenUnits: value["codegen-units"] ?? null,
        panic: value.panic || null,
        incremental: value.incremental ?? null,
        strip: value.strip || null,
        debugAssertions: value["debug-assertions"] ?? null,
        overflowChecks: value["overflow-checks"] ?? null,
        inherits: value.inherits || null,
      };
    }
  }
  return Object.keys(profiles).length > 0 ? profiles : null;
}

function extractWorkspace(doc) {
  const ws = doc.workspace;
  if (!ws) return null;
  return {
    members: toArray(ws.members),
    exclude: toArray(ws.exclude),
    defaultMembers: toArray(ws["default-members"]),
    resolver: ws.resolver || "",
  };
}

function extractBuildTargets(doc) {
  const targets = { bin: [], lib: null, example: [], test: [], bench: [] };

  if (doc.lib) {
    const lib = doc.lib;
    targets.lib = {
      name: lib.name || "",
      path: lib.path || "",
      crateType: toArray(lib["crate-type"]),
      procMacro: lib["proc-macro"] || false,
      doctest: lib.doctest ?? true,
    };
  }

  for (const type of ["bin", "example", "test", "bench"]) {
    const key = type === "bin" ? "bin" : type;
    const items = doc[key];
    if (!items) continue;
    for (const item of toArray(items)) {
      targets[type].push({
        name: item.name || "",
        path: item.path || "",
        requiredFeatures: toArray(item["required-features"]),
      });
    }
  }

  return targets;
}

function extractPatches(doc) {
  const patches = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith("patch.") && typeof value === "object") {
      const source = key.replace("patch.", "");
      patches[source] = Object.entries(value).map(([name, dep]) => ({
        name,
        version: typeof dep === "string" ? dep : dep.version || "",
        git: typeof dep === "object" ? dep.git || "" : "",
        branch: typeof dep === "object" ? dep.branch || "" : "",
        path: typeof dep === "object" ? dep.path || "" : "",
      }));
    }
  }
  return Object.keys(patches).length > 0 ? patches : null;
}

function extractPlatformDeps(doc) {
  const platformDeps = {};
  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith("target.") && key.includes(".dependencies") && typeof value === "object") {
      const target = key.replace(/^target\./, "").replace(/\.dependencies$/, "");
      platformDeps[target] = Object.entries(value).map(([name, dep]) => ({
        name,
        version: typeof dep === "string" ? dep : dep.version || "",
      }));
    }
  }
  return Object.keys(platformDeps).length > 0 ? platformDeps : null;
}

function collectAllDeps(normal, dev, build) {
  const all = [...normal, ...dev, ...build];
  return all.map(d => `${d.name}@${d.version || "workspace"}`);
}

export async function parseCargoToml(content) {
  try {
    const doc = parse(content);

    const pkg = extractPackage(doc);
    const normalDeps = extractDependencies(doc, "dependencies");
    const devDeps = extractDependencies(doc, "dev-dependencies");
    const buildDeps = extractDependencies(doc, "build-dependencies");

    return {
      imports: collectAllDeps(normalDeps, devDeps, buildDeps),
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      package: pkg,
      dependencies: {
        normal: normalDeps,
        dev: devDeps,
        build: buildDeps,
      },
      features: extractFeatures(doc),
      profiles: extractProfiles(doc),
      workspace: extractWorkspace(doc),
      buildTargets: extractBuildTargets(doc),
      patches: extractPatches(doc),
      platformDeps: extractPlatformDeps(doc),
    };
  } catch {
    return {
      imports: [],
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      package: null,
      dependencies: { normal: [], dev: [], build: [] },
      features: {},
      profiles: null,
      workspace: null,
      buildTargets: { bin: [], lib: null, example: [], test: [], bench: [] },
      patches: null,
      platformDeps: null,
    };
  }
}
