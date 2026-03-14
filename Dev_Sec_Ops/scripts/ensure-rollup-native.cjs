const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function getLibcVariant() {
  if (process.platform !== "linux") {
    return null;
  }

  const report = process.report && typeof process.report.getReport === "function"
    ? process.report.getReport()
    : null;
  const glibcVersion = report && report.header ? report.header.glibcVersionRuntime : null;
  return glibcVersion ? "gnu" : "musl";
}

function getRollupNativePackageName() {
  const libc = getLibcVariant();
  const candidates = {
    win32: {
      arm64: "@rollup/rollup-win32-arm64-msvc",
      x64: "@rollup/rollup-win32-x64-msvc",
      ia32: "@rollup/rollup-win32-ia32-msvc",
    },
    linux: {
      arm64: `@rollup/rollup-linux-arm64-${libc}`,
      x64: `@rollup/rollup-linux-x64-${libc}`,
      arm: libc === "musl"
        ? "@rollup/rollup-linux-arm-musleabihf"
        : "@rollup/rollup-linux-arm-gnueabihf",
    },
  };

  return candidates[process.platform] && candidates[process.platform][process.arch]
    ? candidates[process.platform][process.arch]
    : null;
}

function loadRollupPackageJson() {
  try {
    const packagePath = require.resolve("rollup/package.json", { paths: [process.cwd()] });
    return {
      path: packagePath,
      json: JSON.parse(fs.readFileSync(packagePath, "utf8")),
    };
  } catch (error) {
    if (error && error.code === "MODULE_NOT_FOUND") {
      return null;
    }

    throw error;
  }
}

function hasPackageInstalled(packageName) {
  const packageDir = path.join(process.cwd(), "node_modules", ...packageName.split("/"));
  return fs.existsSync(packageDir);
}

function installPackage(packageName, version) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const spec = `${packageName}@${version}`;
  const result = spawnSync(
    npmCommand,
    ["install", "--no-save", "--include=optional", spec],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      shell: false,
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

try {
  const packageName = getRollupNativePackageName();
  if (!packageName) {
    process.exit(0);
  }

  const rollupPackage = loadRollupPackageJson();
  if (!rollupPackage) {
    process.exit(0);
  }

  const rollup = rollupPackage.json;
  const version = rollup.optionalDependencies && rollup.optionalDependencies[packageName];
  if (!version) {
    process.exit(0);
  }

  if (hasPackageInstalled(packageName)) {
    process.exit(0);
  }

  console.log(`Installing missing Rollup native package: ${packageName}@${version}`);
  installPackage(packageName, version);
} catch (error) {
  console.error("Unable to verify the Rollup native dependency.");
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
