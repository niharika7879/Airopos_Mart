import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://subhammart.airopos.com/login');
  await page.getByRole('textbox', { name: 'Phone number or username' }).fill('9000000000');
  await page.getByRole('button', { name: 'Send OTP' }).click();
  await page.getByRole('textbox', { name: 'Please enter OTP character 1' }).fill('1');
  await page.getByRole('textbox', { name: 'Please enter OTP character 2' }).fill('2');
  await page.getByRole('textbox', { name: 'Please enter OTP character 3' }).fill('3');
  await page.getByRole('textbox', { name: 'Please enter OTP character 4' }).fill('4');
  await page.getByRole('textbox', { name: 'Please enter OTP character 5' }).fill('5');
  await page.getByRole('textbox', { name: 'Please enter OTP character 6' }).fill('6');
  await page.getByRole('button', { name: 'Open ERP' }).click();
});