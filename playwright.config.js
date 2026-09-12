import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests',use:{channel:'chrome',headless:true,viewport:{width:1440,height:1000}},webServer:{command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:true},reporter:'list'});
