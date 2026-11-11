const {chromium}=require('C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const [name,width,height] of [['small-phone',320,700],['iphone',390,844],['ipad',1024,768],['split',600,800],['landscape',844,390]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**',route=>route.abort());
  await page.goto('file:///'+process.cwd().replace(/\\/g,'/')+'/index.html');
  await page.evaluate(()=>{
   localStorage.setItem('hanzi.ai.v1',JSON.stringify({key:'test'}));
   localStorage.setItem('hanzi.game.v2',JSON.stringify({'春':{w:['春天','春风','春雨'],i:['春暖花开','春风化雨','春色满园'],s:['春风轻轻吹过河岸，柳树的嫩芽在阳光里慢慢舒展。','春雨落在松软的泥土上，沉睡的种子悄悄伸出了根。','春天的燕子掠过清澈湖面，翅膀剪开金色晨光。'],at:Date.now()}}));
  });
  // Existing library defaults need a matching char; add through the app's stored schema.
  await page.evaluate(()=>{const k=Object.keys(localStorage).find(k=>{try{const v=JSON.parse(localStorage[k]);return Array.isArray(v)&&v[0]?.char;}catch{return false;}});if(k)localStorage.setItem(k,JSON.stringify([{char:'春',pinyin:'chūn',words:['春天'],count:0,createdAt:Date.now()}]));});
  await page.reload();await page.locator('[data-tab="game"]:visible').last().click();
  if(await page.locator('.game-pick').count())throw Error('Character picker still exists');
  await page.locator('.gq-pinyin').waitFor();
  if(width<768 && height>650){const ys=await page.locator('.tabbar .tab').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().top));if(new Set(ys).size!==1)throw Error('Tabs wrapped');}
  await page.getByRole('textbox',{name:'填写空缺的生字'}).fill('春');await page.getByRole('button',{name:'检查答案'}).click();
  await page.getByRole('button',{name:'读一读，下一题'}).waitFor();
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error(name+' horizontal overflow');
  if(errors.length)throw Error(errors.join(';'));
  await page.screenshot({path:name+'-game.png',fullPage:true});
  await page.locator('[data-tab="library"]:visible').last().click();
  await page.locator('.tag-learning').filter({hasText:'待复习'}).waitFor();
  let apiCalls=0;
  await page.route('https://api.deepseek.com/chat/completions',async route=>{
    apiCalls++;const request=route.request().postDataJSON();
    if(!request.messages[1].content.includes('每句必须完整包含'))throw Error('Missing sentence prompt');
    await route.fulfill({json:{choices:[{message:{content:JSON.stringify({sentences:['春风轻轻拂过河岸，柳树的嫩芽在阳光里慢慢舒展。','春雨落在松软的泥土上，沉睡的种子悄悄伸出了根。','春天的燕子掠过清澈的湖面，翅膀剪开一片金色晨光。']})}}]}});
  });
  await page.locator('[data-tab="entry"]:visible').last().click();
  await page.locator('#entryChar').fill('春');
  await page.waitForFunction(()=>document.getElementById('entrySentence').value.includes('春风轻轻'));
  if(apiCalls!==1)throw Error('Entry did not use DeepSeek');
  await page.locator('#entrySentence').fill('春天是孩子们喜欢的季节。');
  await page.locator('#btnEntryAi').click();
  await page.waitForFunction(()=>document.getElementById('entrySentence').value.includes('春风轻轻'));
  console.log('PASS '+name+' auto game, pinyin, answer/next, tab row, learning badge, DeepSeek entry generation/retry + no overflow');await page.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});

