// Noor APK builder.   node build.mjs web      -> downloads the live Noor web app into ./www
//                      node build.mjs android  -> adds icon, azan sound and permissions to ./android
import fs from "node:fs";
import { execSync } from "node:child_process";

// >>> If your Noor website address is different, change it here (no slash at the end) <<<
const SITE = (process.env.NOOR_SITE || "https://ramzan-app.pages.dev").replace(/\/+$/, "");

const FILES = [
  "index.html", "learn.html", "listen.html", "manifest.webmanifest", "azan.mp3",
  "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png",
  "q-ar.js", "q-ur.js", "q-hi.js", "q-en.js", "q-tl.js"
];

// white crescent + star for the notification bar
const STAT_ICON = "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";

const PERMISSIONS = [
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.USE_EXACT_ALARM',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_NETWORK_STATE'
];

async function web() {
  fs.rmSync("www", { recursive: true, force: true });
  fs.mkdirSync("www", { recursive: true });
  for (const f of FILES) {
    const r = await fetch(SITE + "/" + f + "?nocache=" + Date.now());
    if (!r.ok) throw new Error("Could not download " + f + " from " + SITE + " (HTTP " + r.status + "). Is the latest Noor version uploaded to Cloudflare?");
    fs.writeFileSync("www/" + f, Buffer.from(await r.arrayBuffer()));
    console.log("downloaded", f);
  }
  let html = fs.readFileSync("www/index.html", "utf8");
  if (!html.includes("function calc(") || !html.includes("</body>"))
    throw new Error("index.html from " + SITE + " does not look like the Noor app. Upload the latest Noor zip to Cloudflare first.");
  if (fs.statSync("www/q-ar.js").size < 1e6)
    throw new Error("q-ar.js is too small - the Quran data was not uploaded to Cloudflare.");
  html = html.replace("</body>", '<script src="native.js"></script></body>');
  fs.writeFileSync("www/index.html", html);
  fs.writeFileSync("www/native.js", fs.readFileSync("native.js", "utf8").replace("__SITE__", SITE));
  console.log("web app ready (" + SITE + ")");
}

function pickConvert() {
  for (const c of ["convert", "magick"]) {
    try { execSync(c + " -version", { stdio: "ignore" }); return c; } catch (e) {}
  }
  execSync("sudo apt-get update -y && sudo apt-get install -y imagemagick", { stdio: "inherit" });
  return "convert";
}

function android() {
  const root = "android/app/src/main", res = root + "/res";
  if (!fs.existsSync(root + "/AndroidManifest.xml")) throw new Error("Android project not found. Run: npx cap add android");

  // 1) permissions
  let x = fs.readFileSync(root + "/AndroidManifest.xml", "utf8");
  const lines = [];
  for (const p of PERMISSIONS) if (!x.includes('android:name="' + p + '"')) lines.push('    <uses-permission android:name="' + p + '" />');
  if (!x.includes('android:name="android.permission.SCHEDULE_EXACT_ALARM"'))
    lines.push('    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />');
  if (lines.length) x = x.replace("</manifest>", lines.join("\n") + "\n</manifest>");
  fs.writeFileSync(root + "/AndroidManifest.xml", x);
  console.log("permissions added:", lines.length);

  // 2) azan sound + notification-bar icon
  fs.mkdirSync(res + "/raw", { recursive: true });
  fs.copyFileSync("www/azan.mp3", res + "/raw/azan.mp3");
  fs.mkdirSync(res + "/drawable", { recursive: true });
  fs.writeFileSync(res + "/drawable/ic_stat_noor.png", Buffer.from(STAT_ICON, "base64"));

  // 3) launcher icons from the Noor logo (plain square icons; remove the adaptive-icon xml)
  const cvt = pickConvert();
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [d, s] of Object.entries(sizes)) {
    const dir = res + "/mipmap-" + d;
    fs.mkdirSync(dir, { recursive: true });
    for (const n of ["ic_launcher.png", "ic_launcher_round.png"])
      execSync(cvt + " www/icon-512.png -resize " + s + "x" + s + " " + dir + "/" + n);
  }
  fs.rmSync(res + "/mipmap-anydpi-v26", { recursive: true, force: true });
  console.log("android project patched");
}

const mode = process.argv[2];
if (mode === "web") await web();
else if (mode === "android") android();
else { console.error("usage: node build.mjs web|android"); process.exit(1); }
