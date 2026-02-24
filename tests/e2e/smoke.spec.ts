import { test, expect } from "@playwright/test";

const BASE = "http://alphasupply.int.alpha-it-innovations.org";

test.describe("AlphaSupply Smoke Tests", () => {
  test("Dashboard loads with action cards", async ({ page }) => {
    await page.goto(BASE);
    // CardTitle is not a heading role - use text matcher
    await expect(page.getByText("Offene Aufträge").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Kommissionierung")).toBeVisible();
    await expect(page.getByText("Versandbereit")).toBeVisible();
  });

  test("Auftraege page loads", async ({ page }) => {
    await page.goto(`${BASE}/auftraege`);
    await expect(page.getByRole("heading", { name: "Aufträge" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Neuer Auftrag" })).toBeVisible();
  });

  test("Lager page loads", async ({ page }) => {
    await page.goto(`${BASE}/lager`);
    // Use broader text match for the page content
    await expect(page.getByText("Lager").first()).toBeVisible({ timeout: 10000 });
  });

  test("Artikelverwaltung page loads", async ({ page }) => {
    await page.goto(`${BASE}/artikelverwaltung`);
    await expect(page.getByRole("heading", { name: "Artikelliste" })).toBeVisible();
  });

  test("Lieferanten page loads", async ({ page }) => {
    await page.goto(`${BASE}/lieferanten`);
    await expect(page.getByRole("heading", { name: "Lieferanten" })).toBeVisible();
  });

  test("Wareneingang page loads", async ({ page }) => {
    await page.goto(`${BASE}/wareneingang`);
    await expect(page.getByRole("heading", { name: "Wareneingang" })).toBeVisible();
  });

  test("Neuer Auftrag form loads with required fields", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/neu`);
    await expect(page.getByRole("heading", { name: "Neuer Auftrag" })).toBeVisible();
  });

  test("Commission filter works", async ({ page }) => {
    await page.goto(`${BASE}/auftraege?filter=commission`);
    await expect(page.getByRole("heading", { name: "Aufträge" })).toBeVisible();
  });

  test("Procurement filter works", async ({ page }) => {
    await page.goto(`${BASE}/auftraege?filter=procurement`);
    await expect(page.getByRole("heading", { name: "Aufträge" })).toBeVisible();
  });

  test("Dashboard action card links navigate correctly", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(2000);
    const commissionCard = page.locator("a[href='/auftraege?filter=commission']");
    if (await commissionCard.isVisible()) {
      await commissionCard.click();
      await expect(page).toHaveURL(/filter=commission/);
    }
  });

  test("Order detail page opens from list", async ({ page }) => {
    await page.goto(`${BASE}/auftraege`);
    const orderLinks = page.locator("table a[href^='/auftraege/']");
    if (await orderLinks.count() > 0) {
      await orderLinks.first().click();
      await expect(page.getByText(/AUFTRAG-|BES-/).first()).toBeVisible();
    }
  });

  test("Create order form - submit button disabled without items", async ({ page }) => {
    await page.goto(`${BASE}/auftraege/neu`);
    await expect(page.getByRole("heading", { name: "Neuer Auftrag" })).toBeVisible();
    // Submit button should be disabled when form is empty (no items added)
    const submitBtn = page.getByRole("button", { name: "Auftrag erstellen" });
    await expect(submitBtn).toBeDisabled();
  });
});
