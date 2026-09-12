import {test,expect} from '@playwright/test';

test('DTIA lab website exposes research, project notes, contact and working showcases',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  await expect(page).toHaveTitle('DTIA — Digital Twin Research Center for Infrastructure Assets');
  await expect(page.locator('#lab-visual')).toHaveClass('is-loaded');
  await expect(page.locator('.showcase:visible')).toHaveCount(2);
  await page.locator('[data-filter="energy"]').click();
  await expect(page.locator('.showcase:visible')).toHaveCount(1);
  await expect(page.locator('#showcase-count')).toHaveText('Showing 1 working demonstrator');
  await page.locator('[data-project="energy"]').click();
  await expect(page.locator('#project-dialog')).toBeVisible();
  await expect(page.locator('#project-dialog')).toContainText('Scope of the prototype');
  await page.keyboard.press('Escape');
  await expect(page.locator('#project-dialog')).toBeHidden();
  await expect(page.getByRole('link',{name:'suwilai.ph@kmitl.ac.th',exact:true})).toHaveAttribute('href','mailto:suwilai.ph@kmitl.ac.th');
  expect(await page.locator('.showcase-image img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0))).toBe(true);
  await page.getByRole('link',{name:'Launch digital twin',exact:false}).click();
  await expect(page).toHaveURL(/\/showcase\/distribution$/);
  await page.waitForFunction(()=>window.__dtiaReady);
  await page.getByRole('link',{name:'DTIA lab home',exact:true}).click();
  await expect(page.locator('#hero-heading')).toBeVisible();
  await page.locator('[data-filter="cities"]').click();
  await page.getByRole('link',{name:'Explore the city',exact:false}).click();
  await expect(page).toHaveURL(/\/showcase\/city$/);await page.waitForFunction(()=>window.__cityReady);
  expect(errors).toEqual([]);
});

test('lab mobile navigation and reduced-motion controls work without overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');await expect(page.locator('#lab-visual')).toHaveClass('is-loaded');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.locator('#visual-motion')).toHaveText('Play motion ▷');
  await page.locator('#visual-motion').click();await expect(page.locator('#visual-motion')).toHaveText('Pause motion Ⅱ');
  await page.locator('#lab-menu-toggle').click();await expect(page.locator('#lab-menu-toggle')).toHaveAttribute('aria-expanded','true');
  await page.locator('#lab-navigation a[href="#research"]').click();
  await expect(page.locator('#lab-menu-toggle')).toHaveAttribute('aria-expanded','false');
  await expect(page).toHaveURL(/#research$/);
  await page.locator('[data-filter="all"]').click();await expect(page.locator('.showcase:visible')).toHaveCount(2);
});
