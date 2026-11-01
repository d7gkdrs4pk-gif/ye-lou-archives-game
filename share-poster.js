/* G01-B V0.5 · Optional local boast posters for domestic social apps.
   Self-reported local score; no network, tracking, app auto-posting or fabricated global ranks. */
(() => {
  'use strict';
  const game = window.G01FriendScores;
  const rewards = document.getElementById('rewardDialog');
  const starHud = document.getElementById('starHud');
  if (!game || !starHud) return;

  const HOME = 'https://d7gkdrs4pk-gif.github.io/ye-lou-archives-game/';
  const QR_MAP = [
    '0000000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000000',
    '0001111111001110010111101101011001111111000',
    '0001000001000110111100111000100001000001000',
    '0001011101010111010011111010010001011101000',
    '0001011101001001010010100010111101011101000',
    '0001011101011010100001011011101001011101000',
    '0001000001011010110100110001110101000001000',
    '0001111111010101010101010101010101111111000',
    '0000000000000111010101101110010000000000000',
    '0000100101010101000011001111111010110100000',
    '0000111000101100001001111110000111111000000',
    '0000010001111100011101001010110110100100000',
    '0001111000011101001011011011010010001111000',
    '0000100101101100011100111101001011000110000',
    '0000100100101000010100111010011110010110000',
    '0001111001100011011001110011111001111110000',
    '0000001100111110100001000101000000110101000',
    '0001101001110011101000000101001011101101000',
    '0000001010101010010110000000111100111000000',
    '0001110111110011001001001000001010111100000',
    '0001011100001110110111101101001111010101000',
    '0000101011101000101111101111001011001110000',
    '0001011100100110010110010110011000010100000',
    '0000001111000001101110111010111101000100000',
    '0001101000111110001101101011100111100100000',
    '0000011101100101011011111100101110110110000',
    '0001010110101101001110100010110001001100000',
    '0000011001011111100111010011011010010010000',
    '0000010000001101100101011010001101111111000',
    '0001100111000010011110011111010111110001000',
    '0000000000011011111111010010100100011010000',
    '0001111111001000011001111111110101011100000',
    '0001000001000110010000101001010100010111000',
    '0001011101011011110101010000000111111101000',
    '0001011101000111011000100101111101100000000',
    '0001011101001011100011101111000001001110000',
    '0001000001010011110010111010011000110110000',
    '0001111111000001011001011100001010000111000',
    '0000000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000000',
    '0000000000000000000000000000000000000000000'
  ];
  const $ = id => document.getElementById(id);
  const origins = Object.freeze({
    wechat: '微信好友：先尝试“系统分享图片”并选择微信。若微信不在分享选项里，先保存图片，再从微信聊天的相册里发送。挑战链接可另行复制发给好友。',
    moments: '微信朋友圈：点击“保存海报”，或长按图片保存到相册；打开朋友圈选择图片发布。可以复制挑战文案使用，外链是否可点击取决于平台。',
    qq: 'QQ / QQ空间：先尝试系统分享；或保存图片，在QQ聊天或QQ空间动态里选择相册图片，再添加你的挑战文案。',
    rednote: '小红书：保存竖屏战绩海报，打开小红书创建图文笔记，从相册选择图片；挑战文案可复制粘贴。不要假定外部链接可直接跳转。',
    weibo: '微博：保存海报，在微博发布图文时选择图片，粘贴挑战文案即可。',
    douyin: '抖音：保存海报后按应用当前支持的图文发布流程上传图片；不要将外部链接视为必然可点击。'
  });
  const style = document.createElement('style');
  style.textContent = `
  .brag-open,.brag-reward{min-height:41px;border-radius:10px;border:1px solid #efbb79;background:#443725;color:#ffe5b0;font-weight:850;padding:7px 10px;font-size:12px}
  .brag-reward{display:block;width:100%;margin-top:9px;min-height:47px;font-size:14px;background:linear-gradient(110deg,#ad7028,#e7b967);color:#1d2b3e;border-color:#ffda96}
  .brag-overlay[hidden]{display:none!important}
  .brag-overlay{position:fixed;z-index:4300;inset:0;display:grid;place-items:center;background:rgba(2,10,22,.88);padding:9px;backdrop-filter:blur(7px)}
  .brag-card{width:min(100%,490px);max-height:96dvh;overflow-y:auto;overscroll-behavior:contain;border-radius:20px;background:#12273c;color:#eaf3ff;border:1px solid #a77e4b;box-shadow:0 24px 80px #0009;padding:15px}
  .brag-head{display:flex;gap:10px;align-items:center;justify-content:space-between}
  .brag-head h2{font-size:20px;margin:0;color:#ffdc9f}
  .brag-close{border:1px solid #7292a3;border-radius:10px;background:#254259;color:white;min-height:42px;min-width:44px;font-size:22px}
  .brag-desc{margin:7px 0 9px;font-size:12px;line-height:1.45;color:#c1d7e4}
  .brag-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}
  .brag-tabs button{min-height:39px;background:#173449;border:1px solid #547283;border-radius:10px;color:#d2e8ec;font-weight:750;font-size:12px}
  .brag-tabs button[aria-pressed=true]{background:#59462d;border-color:#f3c97e;color:#ffe8b8}
  .brag-picture{display:flex;justify-content:center;background:#081827;border:1px solid #3f5469;border-radius:12px;padding:7px;overflow:hidden}
  .brag-picture img{display:block;max-width:100%;max-height:43dvh;object-fit:contain;border-radius:7px;touch-action:manipulation;user-select:none;-webkit-user-select:default}
  .brag-picture figcaption{font-size:10px;color:#b4cbd6;text-align:center;margin-top:4px}
  .brag-summary{font-size:12px;text-align:center;line-height:1.45;color:#efdaa7;margin:7px 0}
  .brag-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0}
  .brag-actions button{min-height:45px;padding:7px 5px;border:1px solid #7090a0;background:#21465a;color:#f4fbff;border-radius:10px;font-size:12px;font-weight:800}
  .brag-actions button.primary{background:#f1c67e;color:#203249;border-color:#ffda96}
  .brag-status{font-size:12px;min-height:22px;line-height:1.5;color:#ffdfa2;margin:5px 0}
  .brag-guidance{border:1px solid #35566b;border-radius:12px;padding:10px;margin-top:8px;background:#0e2235}
  .brag-guidance h3{margin:0 0 7px;font-size:12px;color:#dce5ec}
  .brag-platforms{display:flex;gap:6px;flex-wrap:wrap}
  .brag-platforms button{min-height:39px;background:#1b3c51;color:#dcecf6;border:1px solid #567387;padding:6px 10px;font-size:11px;border-radius:999px}
  .brag-platforms button[aria-pressed=true]{background:#4b533a;border-color:#b7d697;color:#f5ffd8}
  .brag-tip{font-size:11px;line-height:1.55;color:#b9ccd9;margin:8px 0 0}
  .brag-privacy{color:#8fadc0;font-size:10px;line-height:1.6;margin-top:8px}
  @media(max-width:470px){.brag-card{padding:10px;max-height:97dvh}.brag-head h2{font-size:17px}.brag-open{font-size:11px;min-height:40px;padding:6px}.brag-picture img{max-height:39dvh}.brag-actions button{font-size:11px}}
  `;
  document.head.appendChild(style);
  const shortcut=document.createElement('button');
  shortcut.className='brag-open'; shortcut.type='button'; shortcut.textContent='晒战绩';
  const group=document.querySelector('.rank-shortcuts');
  (group || starHud.parentElement).appendChild(shortcut);
  if (rewards) {
    const btn=document.createElement('button');btn.type='button';btn.className='brag-reward';btn.textContent='晒出本关成绩 · 向好友发起挑战';
    const rankBtn=document.querySelector('.reward-rank');
    (rankBtn || rewards.querySelector('.reward-actions'))?.after(btn);
    btn.addEventListener('click',()=>openPoster('record'));
  }
  const overlay=document.createElement('div');overlay.id='bragOverlay';overlay.className='brag-overlay';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','bragHeading');
  overlay.innerHTML=`<section class="brag-card">
    <div class="brag-head"><h2 id="bragHeading">晒出我的通关成绩</h2><button id="bragClose" class="brag-close" type="button" aria-label="关闭战绩海报">×</button></div>
    <p class="brag-desc">根据你真实保存在本机的成绩生成海报；分享给微信、朋友圈、QQ、小红书、微博等国内社交平台。</p>
    <div class="brag-tabs"><button type="button" data-poster="record" aria-pressed="true">★ 炫耀战绩</button><button type="button" data-poster="challenge" aria-pressed="false">⚔ 邀请好友PK</button></div>
    <figure class="brag-picture" style="margin:0"><div><img id="bragImage" alt="我的通关成绩海报，可长按保存图片"><figcaption>长按图片可尝试保存到手机相册</figcaption></div></figure>
    <p id="bragSummary" class="brag-summary"></p>
    <div class="brag-actions">
      <button id="bragNative" type="button" class="primary">分享战绩图片</button>
      <button id="bragSave" type="button">保存PNG海报</button>
      <button id="bragCopyText" type="button">复制炫耀文案</button>
      <button id="bragCopyUrl" type="button">复制PK挑战链接</button>
    </div>
    <p id="bragStatus" class="brag-status" role="status" aria-live="polite"></p>
    <section class="brag-guidance"><h3>分享到国内社交软件（选择查看操作方式）</h3>
      <div class="brag-platforms" id="bragPlatforms">
        <button type="button" data-app="wechat" aria-pressed="true">微信</button>
        <button type="button" data-app="moments" aria-pressed="false">朋友圈</button>
        <button type="button" data-app="qq" aria-pressed="false">QQ / QQ空间</button>
        <button type="button" data-app="rednote" aria-pressed="false">小红书</button>
        <button type="button" data-app="weibo" aria-pressed="false">微博</button>
        <button type="button" data-app="douyin" aria-pressed="false">抖音</button>
      </div><p id="bragTip" class="brag-tip"></p>
    </section>
    <p class="brag-privacy">海报中的分数、称号和好友排名均来自当前设备记录，好友榜不是全国或全服实时排名，好友提交成绩也未经服务器核验。生成海报不上传任何记录；是否公开由你自己决定。</p>
  </section>`;
  document.body.appendChild(overlay);
  let mode='record', activeApp='wechat', posterData='', lastFocused=null;
  const cnGame='今晚拼出路';
  function setStatus(text){$('bragStatus').textContent=text;}
  function trackLabel(s){
    if(s.stars===15) return '满星逃脱王';
    if(s.stars>=11) return '机关破解者';
    if(s.stars>=7) return '夜行探路王';
    if(s.stars>=3) return '走廊探险家';
    if(s.stars>0) return '初露锋芒';
    return '等待首个通关';
  }
  function data(){return game.snapshot();}
  function words(s){
    const rank=s.rank?`在本机已加入的${s.rank.participants}人好友榜中排第${s.rank.position}名。`:'';
    return `我在《${cnGame}》已经收集${s.stars}/15颗星，通关${s.levels}/5关，拿到「${trackLabel(s)}」称号！${rank}一起来拼房间，比比谁的星更多：${s.challengeUrl}`;
  }
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext('2d',{alpha:false});
  function rounded(x,y,w,h,r){
    const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();
  }
  function box(x,y,w,h,r,fill,stroke){rounded(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.stroke();}}
  function text(t,x,y,size,color='#fff7e7',weight=700,align='left'){
    ctx.font=`${weight} ${size}px system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif`;
    ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(String(t),x,y);
  }
  function fit(t,x,y,base,maxwidth,color='#fff7e7',weight=700,align='left'){
    let size=base;
    for(;size>25;size-=2){ctx.font=`${weight} ${size}px system-ui,"PingFang SC","Microsoft YaHei",sans-serif`;if(ctx.measureText(String(t)).width<=maxwidth)break;}
    text(t,x,y,size,color,weight,align);
  }
  function drawQR(x,y,size){
    const n=QR_MAP.length;
    box(x-15,y-15,size+30,size+30,12,'#fffdf7');
    const pixel=size/n;
    ctx.fillStyle='#162234';
    QR_MAP.forEach((row,iy)=>{for(let ix=0;ix<n;ix++){if(row[ix]==='1')ctx.fillRect(x+ix*pixel,y+iy*pixel,pixel+.13,pixel+.13);}});
  }
  function draw(s){
    if(!ctx) return '';
    const W=canvas.width,H=canvas.height;
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#132b4b');bg.addColorStop(.53,'#071627');bg.addColorStop(1,'#263749');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const glow=ctx.createRadialGradient(700,320,40,700,320,860);glow.addColorStop(0,'rgba(245,190,105,.25)');glow.addColorStop(1,'rgba(245,190,105,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    for(let i=0;i<48;i++){
      const x=((i*373+79)%970)+48, y=((i*563+101)%1440)+50;
      ctx.fillStyle=(i%3===0)?'rgba(252,212,147,.6)':'rgba(197,227,249,.32)';ctx.beginPath();ctx.arc(x,y,i%9===0?4:2,0,Math.PI*2);ctx.fill();
    }
    // Moon, logo and top title
    ctx.beginPath();ctx.arc(116,128,45,0,2*Math.PI);ctx.fillStyle='#ffe0a2';ctx.fill();
    ctx.beginPath();ctx.arc(135,104,40,0,2*Math.PI);ctx.fillStyle='#132b4b';ctx.fill();
    text('ROOM PATH',190,112,38,'#e6c590',850);
    text('今晚拼出路',190,169,32,'#d3e5f5',700);
    text(mode==='challenge'?'谁敢来挑战我？':'今晚，我成功突围！',540,296,62,'#fff2d5',900,'center');
    text('★ 5关房间连线挑战 · 原创解谜 ★',540,365,28,'#ecd39e',600,'center');
    box(80,432,920,800,48,'rgba(26,51,77,.92)','#b88b56');
    box(117,477,846,108,24,'rgba(250,210,141,.1)');
    fit(s.nickname,540,531,47,780,'#ffdfad',850,'center');
    fit(trackLabel(s),540,652,60,780,'#ffe5b3',900,'center');
    text('★',540,740,90,'#ffc872',800,'center');
    text(`${s.stars}`,492,887,190,'#ffe4a5',900,'right');
    text('/ 15',504,906,66,'#e1cfb3',750,'left');
    text('累计星星',540,1008,34,'#bfdbdd',650,'center');
    box(140,1071,800,103,23,'#142e40','#487583');
    text(`已通关 ${s.levels} / 5 关`,540,1124,40,'#e8f5fa',800,'center');
    if(s.rank){
      box(100,1265,880,120,22,'#253c4c','#b99256');
      fit(`本机好友榜 第 ${s.rank.position} / ${s.rank.participants} 名`,540,1315,42,780,'#ffe0a0',800,'center');
      text('仅包含当前设备已导入的好友 · 非全服排名',540,1368,21,'#b6c9d4',500,'center');
    }else{
      box(100,1265,880,120,22,'#253c4c','#608393');
      text('好友对决，等你开战',540,1318,42,'#ffe0a0',800,'center');
      text('复制挑战链接，邀请朋友加入本机排行榜',540,1367,21,'#b6c9d4',500,'center');
    }
    // Verified only if all five timing records are present
    if(s.fullTimeSeconds!==null){text(`完整计时记录：${s.fullTimeSeconds} 秒`,540,1439,27,'#d8e6ef',600,'center');}
    else{text('挑战进度来自本机记录',540,1439,26,'#d8e6ef',600,'center');}
    box(84,1500,912,305,34,'#f5e7cf');
    drawQR(128,1539,226);
    text(mode==='challenge'?'扫码进游戏，跟我拼一局！':'扫码来玩，你能超过我吗？',400,1602,38,'#26394e',900);
    text('3选1房卡 · 旋转 · 拼通道',400,1677,25,'#436075',650);
    text('微信 / 朋友圈 / QQ / 小红书 / 微博',400,1735,21,'#5e7184',600);
    text('d7gkdrs4pk-gif.github.io/ye-lou-archives-game/',540,1849,23,'#90aabd',600,'center');
    text('战绩来自个人设备，好友排名非全球榜；分享内容由玩家自行发布',540,1890,19,'#9db3c3',450,'center');
    return canvas.toDataURL('image/png');
  }
  function renderPoster(){
    const s=data();posterData=draw(s);
    $('bragImage').src=posterData;
    $('bragHeading').textContent=mode==='record'?'晒出我的通关战绩':'邀请好友来挑战';
    $('bragSummary').textContent=`${trackLabel(s)} · ${s.stars}/15★ · ${s.levels}/5关${s.rank?` · 本机好友榜第${s.rank.position}/${s.rank.participants}名`:''}`;
  }
  function setMode(newMode){mode=newMode;overlay.querySelectorAll('[data-poster]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.poster===mode)));renderPoster();}
  function setApp(app){activeApp=app;overlay.querySelectorAll('[data-app]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.app===app)));$('bragTip').textContent=origins[app];}
  function openPoster(preferred){
    lastFocused=document.activeElement;mode=preferred==='challenge'?'challenge':'record';
    setMode(mode);setApp(activeApp);setStatus('海报已在本机生成。可长按保存，或点击“分享战绩图片”。');
    overlay.hidden=false;$('bragClose').focus();
  }
  function closePoster(){overlay.hidden=true;posterData='';$('bragImage').removeAttribute('src');lastFocused?.focus?.();}
  shortcut.addEventListener('click',()=>openPoster('record'));
  $('bragClose').addEventListener('click',closePoster);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closePoster();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();e.stopImmediatePropagation();closePoster();}},true);
  overlay.querySelectorAll('[data-poster]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.poster)));
  overlay.querySelectorAll('[data-app]').forEach(b=>b.addEventListener('click',()=>setApp(b.dataset.app)));
  function pngBlob(url){
    const raw=atob(url.split(',')[1]);const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return new Blob([bytes],{type:'image/png'});
  }
  $('bragNative').addEventListener('click',async()=>{
    if(!posterData)renderPoster();
    let file;
    try{file=new File([pngBlob(posterData)],`今晚拼出路_${mode==='record'?'炫耀战绩':'好友挑战'}.png`,{type:'image/png'});}
    catch(_){setStatus('图片生成失败，请先选择“保存PNG海报”。');return;}
    if(navigator.share && navigator.canShare?.({files:[file]})){
      // The share call must be initiated by this click; avoid awaiting beforehand.
      try{await navigator.share({files:[file],title:'今晚拼出路 · 战绩挑战',text:'我的游戏战绩！欢迎来挑战。'});setStatus('已唤起系统分享。可选择微信、QQ等已安装应用。');}
      catch(e){setStatus(e.name==='AbortError'?'已取消系统分享。也可长按海报保存到相册。':'当前浏览器未完成图片分享。请长按海报保存后从微信、QQ或小红书发布。');}
    }else{
      setStatus('当前浏览器不支持直接分享PNG文件。长按上面的海报保存至相册，再从微信、朋友圈、QQ、小红书、微博等应用选择图片发布。');
    }
  });
  $('bragSave').addEventListener('click',()=>{
    if(!posterData)renderPoster();
    const a=document.createElement('a');a.href=posterData;a.download='今晚拼出路_我的游戏战绩.png';
    document.body.appendChild(a);a.click();a.remove();
    setStatus('已请求浏览器保存PNG；iPhone部分浏览器会打开图片预览，此时长按海报选择“存储到照片”或使用系统分享保存。');
  });
  async function copy(value,success){
    try{if(!navigator.clipboard?.writeText)throw Error('unsupported');await navigator.clipboard.writeText(value);setStatus(success);}
    catch(_){
      const ta=document.createElement('textarea');ta.value=value;ta.readOnly=true;ta.style.cssText='position:fixed;left:4px;top:4px;opacity:0;';document.body.appendChild(ta);ta.select();
      let ok=false;try{ok=document.execCommand('copy');}catch(_){}ta.remove();
      setStatus(ok?success:'浏览器阻止复制。请使用系统分享或先保存海报。');
    }
  }
  $('bragCopyText').addEventListener('click',()=>copy(words(data()),'战绩文案已复制，可在微信、朋友圈、QQ、小红书或微博中粘贴。'));
  $('bragCopyUrl').addEventListener('click',()=>copy(data().challengeUrl,'好友PK挑战链接已复制，发给朋友打开就能对照成绩。'));
  setApp('wechat');
})();