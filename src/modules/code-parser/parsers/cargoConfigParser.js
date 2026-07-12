import { parse } from "smol-toml";

function extractBuild(doc) {
  const build = doc.build;
  if (!build) return null;
  return {
    target: build.target || null,
    jobs: build.jobs || null,
    rustflags: Array.isArray(build.rustflags) ? build.rustflags : build.rustflags ? [build.rustflags] : [],
    linker: build.linker || null,
  };
}

function extractRegistries(doc) {
  const registries = doc.registries;
  if (!registries) return [];
  return Object.entries(registries).map(([name, value]) => ({
    name,
    index: value.index || "",
  }));
}

function extractNet(doc) {
  const net = doc.net;
  if (!net) return null;
  return {
    "git-fetch-with-cli": net["git-fetch-with-cli"] || false,
    retry: net.retry || null,
  };
}

function extractAliases(doc) {
  const alias = doc.alias;
  if (!alias) return {};
  return Object.fromEntries(
    Object.entries(alias).map(([key, value]) => [key, value])
  );
}

function extractTargets(doc) {
  const targetSection = doc.target;
  if (!targetSection || typeof targetSection !== "object") return null;
  const targets = {};
  for (const [triple, config] of Object.entries(targetSection)) {
    if (typeof config === "object" && config !== null) {
      targets[triple] = {
        linker: config.linker || null,
        rustflags: Array.isArray(config.rustflags)
          ? config.rustflags
          : config.rustflags
            ? [config.rustflags]
            : [],
      };
    }
  }
  return Object.keys(targets).length > 0 ? targets : null;
}

export async function parseCargoConfig(content) {
  try {
    const doc = parse(content);

    return {
      imports: [],
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      cargoConfig: {
        build: extractBuild(doc),
        registries: extractRegistries(doc),
        net: extractNet(doc),
        aliases: extractAliases(doc),
        targets: extractTargets(doc),
      },
    };
  } catch {
    return {
      imports: [],
      functions: [],
      classes: [],
      routes: [],
      exports: [],
      cargoConfig: {},
    };
  }
}
