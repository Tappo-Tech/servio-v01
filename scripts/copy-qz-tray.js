const fs = require("node:fs");
const path = require("node:path");
const packageInfo = require("qz-tray/package.json");

const projectRoot = path.resolve(__dirname, "..");
const source = require.resolve("qz-tray");
const destination = path.join(projectRoot, "public", "qz-tray.js");

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);
console.log(`Prepared QZ Tray browser client ${packageInfo.version} for lazy local loading (LGPL-2.1).`);
