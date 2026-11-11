const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const section=(a,b)=>html.slice(html.indexOf(a),html.indexOf(b,html.indexOf(a)));
const ctx=vm.createContext({console,Set,Array,JSON,escHtml:s=>s,GAME:{hintOn:false},deepseekChat:async()=>JSON.stringify({words:['春天','春风','春雨'],idioms:['春暖花开','春风化雨','春色满园'],sentences:['春风轻轻拂过河岸，柳树的嫩芽在阳光里慢慢舒展。','春雨落在松软的泥土上，沉睡的种子悄悄伸出了根。','春天的燕子掠过清澈的湖面，翅膀剪开一片金色晨光。']})});
vm.runInContext(section('function questHtml','function renderGameQuest'),ctx);
assert.equal(vm.runInContext("questHtml({text:'春去春来'},'', '春').includes('春')",ctx),false);
vm.runInContext(section('function parseAiJson','/* ---------- 游戏流程'),ctx);
(async()=>{
 const result=await vm.runInContext("aiGen('春')",ctx);assert.equal(result.words.length,3);assert.equal(result.idioms.length,3);assert.equal(result.sentences.length,3);
 ctx.deepseekChat=async()=>JSON.stringify({words:['春天'],idioms:['春天'],sentences:['春天来了']});
 await assert.rejects(vm.runInContext("aiGen('春')",ctx));
 console.log('PASS: every target occurrence blanked; 3+3+3 valid items; incomplete generation rejected');
})().catch(e=>{console.error(e);process.exitCode=1;});
