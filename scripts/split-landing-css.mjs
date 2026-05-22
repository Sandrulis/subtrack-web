import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const srcPath = path.join(root, "styles", "subtrack.css");
const lines = fs.readFileSync(srcPath, "utf8").split(/\r?\n/);
const slice = (a, b) => lines.slice(a - 1, b).join("\n") + "\n";

const modulesDir = path.join(root, "styles", "modules");
fs.mkdirSync(modulesDir, { recursive: true });

fs.writeFileSync(path.join(modulesDir, "core.css"), slice(1, 1101));
fs.writeFileSync(path.join(modulesDir, "landing-page.css"), slice(1103, 2594));
fs.writeFileSync(path.join(modulesDir, "shared-footer.css"), slice(2595, 2618));

let shell =
  "/* Landing shell: topbar, lang switcher, mobile nav, footer, cookies */\n";
for (const [a, b] of [
  [2637, 3097],
  [7196, 7300],
  [7584, 7830],
]) {
  shell += slice(a, b);
}
fs.writeFileSync(path.join(modulesDir, "landing-shell.css"), shell);

let app =
  "/* App UI: dashboard, admin, auth, panel (without landing-page block) */\n";
app += slice(2620, lines.length);
fs.writeFileSync(path.join(modulesDir, "subtrack-app.css"), app);

fs.writeFileSync(
  path.join(root, "styles", "landing.css"),
  [
    '@import "./modules/core.css";',
    '@import "./modules/landing-page.css";',
    '@import "./modules/shared-footer.css";',
    '@import "./modules/landing-shell.css";',
    "",
  ].join("\n"),
);

fs.writeFileSync(
  path.join(root, "styles", "subtrack-app.bundle.css"),
  [
    '@import "./modules/core.css";',
    '@import "./modules/shared-footer.css";',
    '@import "./modules/subtrack-app.css";',
    "",
  ].join("\n"),
);

for (const f of ["styles/subtrack.css", "styles/landing.css", "styles/subtrack-app.bundle.css"]) {
  const kb = (fs.statSync(path.join(root, f)).size / 1024).toFixed(1);
  console.log(`${f}: ${kb} KB`);
}
