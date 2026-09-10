import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
if (!process.env.BTV_REPO) throw Error('Set BTV_REPO to the Big Tree Viewer checkout');
const require = createRequire(`${process.env.BTV_REPO}/package.json`);
const { chromium } = require('playwright');
const output=fileURLToPath(new URL('../assets', import.meta.url));
const previewOnly=process.argv.includes('--preview');
const W=1920,H=1080,FPS=24,seconds=22;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--js-flags=--max-old-space-size=8192']});
const page=await browser.newPage({viewport:{width:W,height:H},deviceScaleFactor:1});
page.on('pageerror',e=>console.log('PAGE ERROR:',e.message));
await page.goto(process.env.BTV_URL || 'http://127.0.0.1:5174/');
await page.waitForFunction(()=>window.__BIG_TREE_VIEWER_APP_TEST__?.getState().treeLoaded,{},{timeout:120000});
await page.evaluate(()=>Object.defineProperty(window,'showOpenFilePicker',{value:undefined,configurable:true}));
const chooser=page.waitForEvent('filechooser');
await page.getByRole('button',{name:'Load Session',exact:true}).click();
if (!process.env.BTV_SESSION) throw Error('Set BTV_SESSION to the full eukaryote .btvsession file path');
await (await chooser).setFiles(process.env.BTV_SESSION);
await page.waitForFunction(()=>window.__BIG_TREE_VIEWER_APP_TEST__?.getState().treeLoaded&&window.__BIG_TREE_VIEWER_APP_TEST_INTERNAL__?.leafNodes.length>400000,{},{timeout:180000});
console.log('Full session loaded');
await page.addStyleTag({content:'.tree-canvas-shell{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;border-radius:0!important;z-index:9999!important}.tree-canvas-shell button,.tree-canvas-shell .canvas-hud,.tutorial-prompt{display:none!important}'});
await page.waitForFunction(()=>document.querySelector('.tree-canvas')?.width===1920);
await page.evaluate(()=>{
 const app=window.__BIG_TREE_VIEWER_APP_TEST__;
 app.setTaxonomyColorRootRankForTest('phylum');
 app.setTaxonomyColorJitterRankForTest('genus');
 app.setTaxonomyColorJitterForTest(1.2);
 app.setTaxonomyRankVisibilityAutoForTest(false);
 app.setShowTipLabels(true);
 app.setShowGenusLabels(false);
 app.setShowTimeStripes(true);
 app.setShowCircularCenterRadialScaleBar(true);
 app.setUseAutoCircularCenterScaleAngle(false);
 app.setCircularCenterScaleAngleDegrees(-90);
 app.setFigureStyleForTest('scale','sizeScale',1.1);
 app.setFigureStyleForTest('taxonomy','thickenOutermostRibbon',false);
 app.setFigureStyleForTest('taxonomy','bandThicknessScale',0.9);
 app.setFigureStyleForTest('tip','sizeScale',1.2);
 app.setBranchThicknessScaleForTest(1.25);
 const internal=window.__BIG_TREE_VIEWER_APP_TEST_INTERNAL__;
 window.movieHuman=internal.names.findIndex(x=>/^Homo_sapiens$/.test(x));
 const cam=window.__BIG_TREE_VIEWER_CANVAS_TEST__.getCamera();
 const point=window.__BIG_TREE_VIEWER_CANVAS_TEST__.getBranchScreenSegmentForTest(window.movieHuman);
 const angle=Math.atan2(point.y2-cam.translateY,point.x2-cam.translateX);
 app.setCircularRotationDegreesForTest(-angle*180/Math.PI);
});
await page.waitForTimeout(600);
const meta=await page.evaluate(()=>({human:window.movieHuman,tipCount:window.__BIG_TREE_VIEWER_APP_TEST_INTERNAL__.leafNodes.length,rotation:window.__BIG_TREE_VIEWER_CANVAS_TEST__.getCamera().rotation,rootAge:window.__BIG_TREE_VIEWER_APP_TEST__.getState().rootAge}));
console.log(meta);
const radius=1530,endScale=(H/2-145)/radius,startScale=meta.tipCount*105/(2*Math.PI*radius);
const smooth=t=>t*t*(3-2*t);
const ranks=[['genus','family','order'],['family','order','class'],['order','class','phylum']];
let lastPhase=-1;
async function setRanks(phase){
 if(lastPhase===phase)return;
 await page.evaluate(selected=>{
  const app=window.__BIG_TREE_VIEWER_APP_TEST__;
  for(const rank of ['genus','family','order','class','phylum'])app.setTaxonomyRankVisibilityForTest(rank,selected.includes(rank));
 },ranks[phase]);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 lastPhase=phase;
}
async function render(scale,x,phase){
 await setRanks(phase);
 return await page.evaluate(({scale,x,H})=>{
  window.__BIG_TREE_VIEWER_CANVAS_TEST__.setCircularCamera({scale,translateX:x-1530*scale,translateY:H/2});
  const c=document.querySelector('.tree-canvas');
  return c.toDataURL('image/jpeg',.98).split(',')[1];
 },{scale,x,H});
}
await writeFile('/tmp/allard-movie-start.jpg',Buffer.from(await render(startScale,W*.58,0),'base64'));
await writeFile('/tmp/allard-movie-end.jpg',Buffer.from(await render(endScale,W/2+radius*endScale,2),'base64'));
await writeFile(`${output}/eukaryota-detail.jpg`,Buffer.from(await render(1.15,W*.68,2),'base64'));
const hashes=[];
for(let phase=0;phase<3;phase++){
 await setRanks(phase);
 hashes.push(await page.evaluate(()=>{const colors=window.__BIG_TREE_VIEWER_CANVAS_TEST__.getCurrentBranchColors();let hash=2166136261;for(const c of colors)for(let i=0;i<c.length;i++)hash=Math.imul(hash^c.charCodeAt(i),16777619);return hash>>>0;}));
}
if(new Set(hashes).size!==1)throw Error(`Branch colors change with ribbons: ${hashes}`);
console.log('Stable branch-color hashes:',hashes);
if(previewOnly){await browser.close();process.exit(0);}
await writeFile(`${output}/eukaryota-poster.jpg`,Buffer.from(await render(endScale,W/2+radius*endScale,2),'base64'));
const encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(FPS),'-i','pipe:0','-i',fileURLToPath(new URL('./video-watermark.png',import.meta.url)),'-filter_complex','overlay=32:H-h-42','-an','-c:v','libx264','-preset','medium','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',`${output}/eukaryota-human-zoom.mp4`],{stdio:['pipe','inherit','inherit']});
const encoderDone=once(encoder,'exit');
for(let frame=0;frame<FPS*seconds;frame++){
 const t=frame/FPS;
 const u=Math.max(0,Math.min(1,(t-1.5)/18));
 const eased=smooth(u);
 const scale=Math.exp(Math.log(startScale)+(Math.log(endScale)-Math.log(startScale))*eased);
 const pan=smooth(Math.max(0,Math.min(1,(u-.6)/.4)));
 const x=W*.58+(W/2+radius*endScale-W*.58)*pan;
 let phase=t<8?0:t<12?1:2;
 let data;
 const boundary=t>=7.6&&t<=8.4?8:t>=11.6&&t<=12.4?12:null;
 if(boundary){
  const oldPhase=boundary===8?0:1,newPhase=oldPhase+1;
  const before=await render(scale,x,oldPhase),after=await render(scale,x,newPhase);
  data=await page.evaluate(async ({before,after,opacity,W,H})=>{
   const a=new Image(),b=new Image();a.src=`data:image/jpeg;base64,${before}`;b.src=`data:image/jpeg;base64,${after}`;await Promise.all([a.decode(),b.decode()]);
   const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.drawImage(a,0,0);ctx.globalAlpha=opacity;ctx.drawImage(b,0,0);return c.toDataURL('image/jpeg',.98).split(',')[1];
  },{before,after,opacity:smooth((t-boundary+.4)/.8),W,H});
 }else data=await render(scale,x,phase);
 if(!encoder.stdin.write(Buffer.from(data,'base64')))await once(encoder.stdin,'drain');
 if(frame%48===0)console.log(`Rendered ${frame}/${FPS*seconds} frames`);
}
encoder.stdin.end();
const [code]=await encoderDone;if(code!==0)throw Error(`ffmpeg exit ${code}`);
await writeFile(`${output}/../scripts/eukaryota-render-metadata.json`,JSON.stringify({...meta,width:W,height:H,fps:FPS,seconds,initialHold:1.5,zoomDuration:18,finalHold:2.5,branchColorHashes:hashes,ribbonStages:ranks,sourceSession:'eukaryota_ultratree_1530mya_v1.btvsession'},null,2)+'\n');
await browser.close();console.log('Movie complete');
