import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const pkgRoot = path.join(root, "node_modules", "@fortawesome", "fontawesome-free");
const destRoot = path.join(root, "public", "vendor", "font-awesome");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(pkgRoot)) {
  console.error("copy-font-awesome: trūkst @fortawesome/fontawesome-free (npm install).");
  process.exit(1);
}

fs.rmSync(destRoot, { recursive: true, force: true });
fs.mkdirSync(path.join(destRoot, "css"), { recursive: true });
fs.mkdirSync(path.join(destRoot, "webfonts"), { recursive: true });

for (const file of fs.readdirSync(path.join(pkgRoot, "css"))) {
  if (file.endsWith(".css")) {
    fs.copyFileSync(path.join(pkgRoot, "css", file), path.join(destRoot, "css", file));
  }
}

copyDir(path.join(pkgRoot, "webfonts"), path.join(destRoot, "webfonts"));

console.log("copy-font-awesome: public/vendor/font-awesome");
