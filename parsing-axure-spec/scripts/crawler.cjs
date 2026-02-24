var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// index.js
var import_playwright = require("playwright");
var import_promises = require("fs/promises");
var import_path = __toESM(require("path"), 1);
var args = process.argv.slice(2);
var TARGET_URL = args[0];
if (!TARGET_URL) {
  console.error('\u274C \u8ACB\u63D0\u4F9B Axure \u539F\u578B\u7DB2\u5740\uFF0C\u4F8B\u5982\uFF1Anode index.js https://xxxx.axshare.com/ [--password xxx] [--list | --pages "1,3,5"]');
  process.exit(1);
}
function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
}
var PASSWORD = getArg("--password") ?? "";
var MODE_LIST = args.includes("--list");
var MODE_PAGES = args.includes("--pages");
var PAGES_ARG = getArg("--pages");
if (!MODE_LIST && !MODE_PAGES) {
  console.error('\u274C \u8ACB\u6307\u5B9A\u57F7\u884C\u6A21\u5F0F\uFF1A--list \u6216 --pages "1,3,5"');
  process.exit(1);
}
async function checkBrowser() {
  try {
    const execPath = import_playwright.chromium.executablePath();
    await (0, import_promises.access)(execPath);
  } catch {
    console.error("\u274C \u627E\u4E0D\u5230 Playwright Chromium\uFF0C\u8ACB\u5148\u57F7\u884C\uFF1A");
    console.error("   npx playwright install chromium");
    process.exit(1);
  }
}
function buildOutputDir(url) {
  const hostname = new URL(url).hostname.replace(/\./g, "_");
  const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return import_path.default.join("./output", hostname, date);
}
async function login(page, url, password) {
  await page.goto(url, { waitUntil: "networkidle" });
  const passwordInput = await page.$('input[type="password"]');
  if (!passwordInput) return;
  if (!password) {
    console.error("\u274C \u6B64\u539F\u578B\u9700\u8981\u5BC6\u78BC\uFF0C\u8ACB\u4F7F\u7528 --password \u53C3\u6578\u50B3\u5165");
    process.exit(1);
  }
  await passwordInput.fill(password);
  const submitBtn = await page.$('button[type="submit"], input[type="submit"], button');
  if (submitBtn) {
    await submitBtn.click();
  } else {
    await passwordInput.press("Enter");
  }
  await page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {
  });
  await page.waitForTimeout(2e3);
  const stillLocked = await page.$('input[type="password"]');
  if (stillLocked) {
    console.error("\u274C \u5BC6\u78BC\u932F\u8AA4\uFF0C\u8ACB\u78BA\u8A8D\u5F8C\u91CD\u8A66");
    process.exit(1);
  }
}
async function fetchPageList(page) {
  return page.evaluate(() => {
    const links = document.querySelectorAll("a.sitemapPageLink[nodeurl]");
    return Array.from(links).map((a, index) => ({
      index: index + 1,
      name: a.querySelector(".sitemapPageName")?.textContent.trim() || a.textContent.trim(),
      nodeurl: a.getAttribute("nodeurl")
    }));
  });
}
async function getContentSize(page) {
  const frames = page.frames();
  const contentFrame = frames.find((f) => f !== page.mainFrame());
  if (!contentFrame) return null;
  const measure = () => contentFrame.evaluate(() => {
    const all = document.querySelectorAll("*");
    let maxRight = 0;
    let maxBottom = 0;
    all.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > maxRight) maxRight = rect.right;
      if (rect.bottom > maxBottom) maxBottom = rect.bottom;
    });
    return { width: Math.ceil(maxRight), height: Math.ceil(maxBottom) };
  });
  const size = await measure();
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.waitForTimeout(1e3);
  return measure();
}
async function runList() {
  await checkBrowser();
  const browser = await import_playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await login(page, TARGET_URL, PASSWORD);
  const pages = await fetchPageList(page);
  await browser.close();
  process.stdout.write(JSON.stringify(pages, null, 2) + "\n");
}
async function runPages() {
  if (!PAGES_ARG) {
    console.error('\u274C \u8ACB\u63D0\u4F9B\u9801\u9762\u7D22\u5F15\uFF0C\u4F8B\u5982\uFF1A--pages "1,3,5"');
    process.exit(1);
  }
  const pageArgs = PAGES_ARG.split(",").map((s) => s.trim()).filter(Boolean);
  await checkBrowser();
  const screenshotsDir = import_path.default.join(buildOutputDir(TARGET_URL), "screenshots");
  await (0, import_promises.mkdir)(screenshotsDir, { recursive: true });
  const browser = await import_playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await login(page, TARGET_URL, PASSWORD);
  const allPages = await fetchPageList(page);
  const selectedPages = allPages.filter(
    (p) => pageArgs.some((arg) => /^\d+$/.test(arg) ? p.index === Number(arg) : p.name.includes(arg))
  );
  if (selectedPages.length === 0) {
    console.error("\u274C \u627E\u4E0D\u5230\u7B26\u5408\u7684\u9801\u9762\u7D22\u5F15");
    await browser.close();
    process.exit(1);
  }
  const screenshotResults = [];
  for (let i = 0; i < selectedPages.length; i++) {
    const { name, nodeurl, index } = selectedPages[i];
    const pageId = nodeurl.replace(/\.html$/, "");
    const pageUrl = `${TARGET_URL}#p=${pageId}`;
    process.stderr.write(`[${i + 1}/${selectedPages.length}] ${name}
`);
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("iframe", { timeout: 15e3 });
    await page.waitForTimeout(3e3);
    const finalSize = await getContentSize(page);
    if (!finalSize) {
      process.stderr.write(`  \u26A0\uFE0F  \u627E\u4E0D\u5230 iframe frame\uFF0C\u8DF3\u904E
`);
      continue;
    }
    await page.setViewportSize({ width: finalSize.width, height: finalSize.height });
    const safeFilename = name.replace(/[\/\\:*?"<>|]/g, "_").replace(/\s+/g, "_");
    const filename = `${String(index).padStart(2, "0")}_${safeFilename}.png`;
    const screenshotPath = import_path.default.join(screenshotsDir, filename);
    const iframeElement = await page.$("iframe");
    await iframeElement.screenshot({ path: screenshotPath });
    process.stderr.write(`  \u{1F4F8} \u5DF2\u5132\u5B58\uFF1A${screenshotPath}
`);
    screenshotResults.push({ index, name, screenshotPath });
    await page.setViewportSize({ width: 1440, height: 900 });
  }
  await browser.close();
  process.stdout.write(JSON.stringify(screenshotResults, null, 2) + "\n");
}
var run = MODE_LIST ? runList : runPages;
run().catch((err) => {
  console.error("\u274C \u767C\u751F\u932F\u8AA4\uFF1A", err);
  process.exit(1);
});
