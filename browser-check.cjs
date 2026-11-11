const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const [name,width,height] of [['iphone',390,844],['ipad',1024,768],['split',600,800]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',route=>route.abort());
  await page.goto('file:///'+process.cwd().replace(/\\/g,'/')+'/index.html');
  await page.evaluate(()=>{
   localStorage.setItem('hanzi.ai.v1',JSON.stringify({key:'test'}));
   localStorage.setItem('hanzi.game.v2',JSON.stringify({'春':{w:['春天','春风','春雨'],i:['春暖花开','春风化雨','春色满园'],s:['春风轻轻吹过河岸，柳树的嫩芽在阳光里慢慢舒展。','春雨落在松软的泥土上，沉睡的种子悄悄伸出了根。','春天的燕子掠过清澈湖面，翅膀剪开金色晨光。'],at:Date.now()}}));
  });
  await page.reload();await page.locator('[data-tab="game"]:visible').last().click();
  // Existing library defaults need a matching char; add through the app's stored schema.
  await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>{try{const v=JSON.parse(localStorage[k]);return Array.isArray(v)&&v[0]?.char;}catch{return false;}});if(k)localStorage.setItem(k,JSON.stringify([{char:'春',pinyin:'chūn',words:['春天'],count:0,createdAt:Date.now()}]));});
  await page.reload();await page.locator('[data-tab="game"]:visible').last().click();await page.locator('.g-chip').filter({hasText:'春'}).click();
  await page.getByRole('textbox',{name:'填写空缺的生字'}).fill('春');await page.getByRole('button',{name:'检查答案'}).click();
  await page.getByRole('button',{name:'读一读，下一题'}).waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(name+' horizontal overflow');
  if(errors.length)throw Error(errors.join(';'));
  await page.screenshot({path:name+'-game.png',fullPage:true});console.log('PASS '+name+' fill/answer/next + no overflow');await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});

