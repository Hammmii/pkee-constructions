// Repro for audit defect #3: capture console errors + count <main> elements.
import { chromium } from "playwright";

const routes = process.argv.slice(2);
const targets =
  routes.length > 0
    ? routes
    : ["/", "/products", "/products/pvc-wall-panels/classic-marble-pvc-panel", "/quote", "/admin"];

const browser = await chromium.launch();
const page = await browser.newPage({ baseURL: "http://localhost:3000" });

let failures = 0;
for (const route of targets) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text().split("\n")[0] ?? "");
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message.split("\n")[0]}`));
  await page.goto(route, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const mains = await page.locator("main").count();
  const nested = await page.evaluate(() => document.querySelectorAll("main main").length);
  const hydration = errors.filter((e) =>
    /hydration|cannot be a child|Did not expect server HTML|insertBefore|removeChild/i.test(e),
  );
  // biome-ignore lint/suspicious/noConsole: CLI repro tool output
  console.log(
    `${route}: main=${mains} nested=${nested} hydrationErrors=${hydration.length} totalErrors=${errors.length}`,
  );
  for (const e of [...new Set(errors)].slice(0, 8)) {
    // biome-ignore lint/suspicious/noConsole: CLI repro tool output
    console.log(`   ${e}`);
  }
  if (hydration.length > 0 || mains !== 1 || nested > 0) failures++;
}
await browser.close();
process.exit(failures > 0 ? 1 : 0);
