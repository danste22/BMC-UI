import { expect, type Page, test } from "@playwright/test";

const MOCK = "http://127.0.0.1:18788";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Username" }).fill("root");
  await page.getByRole("textbox", { name: "Password" }).fill("mock");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

test.beforeEach(async ({ request, page }) => {
  await request.post(`${MOCK}/__reset`);
  await login(page);
});

test("USB page preselects the node the BMC reports (BMC-Firmware #164)", async ({
  page,
}) => {
  await page.goto("/usb");
  await expect(
    page.getByRole("combobox", { name: "Connected node" })
  ).toContainText("Node 3");
});

test("About shows firmware and daemon versions separately (BMC-Firmware #240)", async ({
  page,
}) => {
  await page.goto("/about");
  const main = page.locator("main");

  await expect(
    main.getByText("Firmware version", { exact: true })
  ).toBeVisible();
  await expect(main.getByText("v2.3.4", { exact: true })).toBeVisible();
  await expect(main.getByText("Daemon version", { exact: true })).toBeVisible();
  await expect(main.getByText("v2.4.0", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("vundefined");
});

test("failed firmware upgrade shows the BMC error (BMC-UI #19)", async ({
  page,
}) => {
  await page.goto("/firmware-upgrade");
  await page.locator('input[name="file"]').setInputFiles({
    name: "bmc-test.tpu",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("fake-firmware"),
  });
  await page.getByRole("button", { name: /upgrade/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await expect(
    page.locator("main").getByText("failed os_update (exit status: 255)")
  ).toBeVisible();
});

for (const width of [768, 800, 1024]) {
  test(`navigation tabs keep one line at ${width}px (BMC-Firmware #229)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/info");

    // Count rendered text lines per tab. Flex items stretch to the tallest tab,
    // so comparing box heights would not catch a wrapped label.
    const lineCounts = await page.locator("main nav a").evaluateAll((links) =>
      links.map((link) => {
        const range = document.createRange();
        range.selectNodeContents(link);
        const tops = new Set(
          Array.from(range.getClientRects()).map((rect) => Math.round(rect.top))
        );
        return tops.size;
      })
    );

    expect(lineCounts).toEqual([1, 1, 1, 1, 1, 1]);
  });
}
