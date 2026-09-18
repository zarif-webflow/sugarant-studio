import * as esbuild from "esbuild";
import { readdirSync } from "fs";
import { basename, join, sep } from "path";

import { ENTRY_POINTS } from "../entypoints.mjs";

// Config output
const BUILD_DIRECTORY = "dist";
// eslint-disable-next-line no-undef
const PRODUCTION = process.env.NODE_ENV === "production";

// Config dev serving
const LIVE_RELOAD = !PRODUCTION;

// eslint-disable-next-line no-undef
const args = process.argv.slice(2);
const portArg =
  args.find((arg) => arg.startsWith("--port=")) || args.find((arg) => arg.startsWith("-p="));
const DEFAULT_SERVE_PORT = 3000;
const SERVE_PORT = portArg ? parseInt(portArg.split("=")[1], 10) : DEFAULT_SERVE_PORT;

const SERVE_ORIGIN = `http://localhost:${SERVE_PORT}`;

// Create context
const context = await esbuild.context({
  bundle: true,
  entryPoints: ENTRY_POINTS,
  outdir: BUILD_DIRECTORY,
  minify: PRODUCTION,
  sourcemap: !PRODUCTION,
  target: PRODUCTION ? "es2020" : "esnext",
  inject: LIVE_RELOAD ? ["./bin/live-reload.js"] : undefined,
  define: {
    SERVE_ORIGIN: JSON.stringify(SERVE_ORIGIN),
  },
  splitting: true,
  format: "esm",
  outExtension: { ".js": ".js" },
  chunkNames: "chunks/[name]-[hash]",
});

// Build files in prod
if (PRODUCTION) {
  await context.rebuild();
  context.dispose();
}

// Watch and serve files in dev
else {
  await context.watch();
  await context
    .serve({
      servedir: BUILD_DIRECTORY,
      port: SERVE_PORT,
      cors: {
        origin: "*",
      },
    })
    .then(logServedFiles);
}

/**
 * Logs information about the files that are being served during local development.
 */
function logServedFiles() {
  /**
   * Recursively gets all files in a directory.
   * @param {string} dirPath
   * @returns {string[]} An array of file paths.
   */
  const getFiles = (dirPath) => {
    // Skip the entire "chunks" directory
    if (basename(dirPath) === "chunks") return [];

    const files = readdirSync(dirPath, { withFileTypes: true }).map((dirent) => {
      const path = join(dirPath, dirent.name);
      return dirent.isDirectory() ? getFiles(path) : path;
    });

    return files.flat();
  };

  const files = getFiles(BUILD_DIRECTORY);

  const filesInfo = files
    .map((file) => {
      if (file.endsWith(".map")) return;

      // Normalize path and create file location
      const paths = file.split(sep);
      paths[0] = SERVE_ORIGIN;

      const location = paths.join("/");

      // Create import suggestion
      const tag = location.endsWith(".css")
        ? `<link href="${location}" rel="stylesheet" type="text/css"/>`
        : `<script defer type="module" src="${location}"></script>`;

      return {
        "File Location": location,
        "Import Suggestion": tag,
      };
    })
    .filter(Boolean);

  // eslint-disable-next-line
  console.table(filesInfo);
}
