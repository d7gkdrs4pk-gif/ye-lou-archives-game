/* G01-E Act II V0.9.0 | isolated two-room mechanism. No writes to the original story save keys. */
(() => {
  'use strict';
  const game = window.G01Chapter;
  const routeView = document.getElementById('routeView');
  if (!game || !routeView || document.getElementById('act2Workbench')) return;

  const KEY = 'g01-act2-workshop.v0.9';
  const N=1,E=2,S=4,W=8;
  const types = {
    straight:{name:'直通房',doors:N|S,icon:'┃',detail:'两端连通'},
    corner:{name:'转角房',doors:N|E,icon:'┗',detail:'改变方向'},
    tee:{name:'三岔房',doors:N|E|W,icon:'┳',detail:'分流与联动'}
  };
  const base = () => ({route:'lift',selected:'A',rooms:{A:null,B:null},inspected:{power:false,tools:false,fire:false,radio:false},item:null,solved:{lift:false,stairs:false},secret:false,attempts:0,note:'先调查设备，再尝试接通两间中转房。'});
  const read = () => {try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){return null}};
  const fromSave = read();
  const state=base();
  if(fromSave && typeof fromSave==='object'){
    if(['lift','stairs'].includes(fromSave.route)) state.route=fromSave.route;
    if(['A','B'].includes(fromSave.selected)) state.selected=fromSave.selected;
    for(const k of ['A','B']){
      const v=fromSave.rooms?.[k];
      if(v && types[v.type] && Number.isInteger(v.rotation) && v.rotation>=0 && v.rotation<=3) state.rooms[k]={type:v.type,rotation:v.rotation};
    }
    for(const k of Object.keys(state.inspected))state.inspected[k]=fromSave.inspected?.[k]===true;
    if(['fuse15','fuse20','hook'].includes(fromSave.item))state.item=fromSave.item;
    for(const k of ['lift','stairs'])state.solved[k]=fromSave.solved?.[k]===true;
    state.secret=fromSave.secret===true;
    state.attempts=Math.max(0,Math.min(999,Number(fromSave.attempts)||0));
  }
  const save = () => {try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}};
  const turn = (doors,rotation)=> {let v=doors;for(let i=0;i<rotation;i++)v=((v<<1)&15)|((v&8)>>3);return v;};
  const doors = slot=> {const r=state.rooms[slot];return r?turn(types[r.type].doors,r.rotation):0;};
  const matches = gate => gate==='lift' ? doors('A')===(N|E|W) && doors('B')===(S|W) : gate==='stairs' ? doors('A')===(E|W) && doors('B')===(N|S|W) : false;
  const primary = () => game.route()?.gate || null;
  const usedRecord = () => game.relics()?.used?.[1]===true;
  const accessible = gate=>gate===primary() || (usedRecord() && (gate==='lift'||gate==='stairs'));
  const ready = gate=> state.solved[gate]===true && accessible(gate);
  const $ = id => document.getElementById(id);

  const style = document.createElement('style');
  style.id='act2-workshop-style';
  style.textContent = `
    #act2Workbench[hidden]{display:none!important}
    #act2Workbench{position:relative;isolation:isolate;margin:9px 0 12px;padding:10px;background:linear-gradient(145deg,#06132af5,#121330f7);border:1px solid #75d1df88;color:#f4f4ff;box-shadow:3px 4px 0 #020716;border-radius:5px;font:inherit}
    #act2Workbench *{box-sizing:border-box}
    #act2Workbench button{font:inherit;touch-action:manipulation;cursor:pointer}
    #act2Workbench button:focus-visible{outline:3px solid #fff0ac;outline-offset:2px}
    #act2Workbench .a2-top{display:flex;align-items:center;justify-content:space-between;gap:9px;margin-bottom:7px}
    #act2Workbench .a2-top strong{font-size:15px;color:#ffe3a0;letter-spacing:.02em}
    #act2Workbench .a2-top em{font-size:10px;color:#8bedef;font-style:normal;border:1px solid #8bedef55;padding:3px 5px;white-space:nowrap}
    #act2Workbench .a2-intro{font-size:12px;line-height:1.5;color:#d0daeb;margin:0 0 8px}
    #act2Workbench .a2-route{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px}
    #act2Workbench .a2-route button{padding:7px 6px;min-height:41px;border:1px solid #7189b2;background:#152b48;color:#fff;font-weight:800;font-size:13px;border-radius:3px;line-height:1.3}
    #act2Workbench .a2-route button.active{background:linear-gradient(130deg,#374a78,#244f55);border:2px solid #f7cf7a;color:#fff0bf}
    #act2Workbench .a2-route button:disabled{opacity:.48;cursor:not-allowed}
    #act2Workbench .a2-scene{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;min-height:88px;padding:12px 8px 9px;overflow:hidden;perspective:500px;border:1px solid #54738a;background:linear-gradient(155deg,#162e47 0%,#091125 45%,#1a253d 100%);margin-bottom:8px}
    #act2Workbench .a2-scene:before{content:'';position:absolute;left:8%;right:8%;top:8%;height:80%;pointer-events:none;transform:skewY(-5deg);border:2px solid #7998b226;box-shadow:0 8px 0 #01051480}
    #act2Workbench .a2-prop{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:70px;border:1px solid #8094bb;border-radius:2px;background:linear-gradient(150deg,#102946dd,#151935eb);box-shadow:3px 4px 0 #030819;transform:skewY(-2deg);padding:4px 2px;color:#e8edfa}
    #act2Workbench .a2-prop:active{transform:skewY(-2deg) scale(.96)}
    #act2Workbench .a2-prop .shape{font-size:24px;line-height:1.1;filter:drop-shadow(0 3px 3px #0008)}
    #act2Workbench .a2-prop .name{font-size:11px;font-weight:800;white-space:nowrap}
    #act2Workbench .a2-prop .light{position:absolute;right:5px;top:5px;width:7px;height:7px;border-radius:50%;background:#f39a6e;box-shadow:0 0 7px #e75f47}
    #act2Workbench .a2-prop.done .light{background:#78f2c6;box-shadow:0 0 7px #78f2c6}
    #act2Workbench .a2-prop[data-inspect="radio"]{grid-column:span 3;min-height:37px;flex-direction:row;gap:7px;transform:none}
    #act2Workbench .a2-prop[data-inspect="radio"] .shape{font-size:18px}
    #act2Workbench .a2-prop[data-inspect="radio"] .name{font-size:12px}
    #act2Workbench .a2-evidence{background:#091d31;border-left:3px solid #ffbd72;margin:0 0 8px;padding:7px 8px;font-size:12px;line-height:1.55;min-height:39px;color:#fff0d6}
    #act2Workbench .a2-tools{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 8px}
    #act2Workbench .a2-tools button{background:#1b3150;color:#e4f5ff;border:1px solid #5f83a8;border-radius:3px;padding:6px 8px;font-size:12px;min-height:37px}
    #act2Workbench .a2-tools button.active{background:#204d4b;border:2px solid #8cf5cf;color:#fff}
    #act2Workbench .a2-step{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:8px 0 5px}
    #act2Workbench .a2-step strong{font-size:13px;color:#fff1ba}
    #act2Workbench .a2-step span{font-size:11px;color:#a8bfda}
    #act2Workbench .a2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;max-width:340px;margin:0 auto 7px}
    #act2Workbench .a2-cell{height:65px;min-width:0;position:relative;border:1px solid #61738b;background:linear-gradient(130deg,#152c40,#11172d);border-radius:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:2px;color:#d8e5f3;overflow:hidden}
    #act2Workbench .a2-cell.fixed{border-style:dashed;background:#122435;color:#abbfcd}
    #act2Workbench .a2-cell.fixed.active{border-color:#b4efda;color:#eafff9;background:#193c49}
    #act2Workbench button.a2-cell.slot{border:2px dashed #8db0e2;background:#172d4c;color:#fff}
    #act2Workbench button.a2-cell.slot.selected{border:2px solid #ffd67c;background:#2c2d52;box-shadow:0 0 0 1px #e0ad55}
    #act2Workbench .a2-cell b{font-size:11px;z-index:2;line-height:1.1}
    #act2Workbench .a2-cell small{font-size:10px;color:#b6cfe8;z-index:2}
    #act2Workbench .a2-cell .a2-doors{position:absolute;inset:0;z-index:1;pointer-events:none}
    #act2Workbench .a2-door{position:absolute;background:#ffdb8b;box-shadow:0 0 8px #ffd68a66}
    #act2Workbench .a2-door.n{width:13px;height:21px;left:calc(50% - 6.5px);top:0}
    #act2Workbench .a2-door.s{width:13px;height:21px;left:calc(50% - 6.5px);bottom:0}
    #act2Workbench .a2-door.e{width:21px;height:13px;right:0;top:calc(50% - 6.5px)}
    #act2Workbench .a2-door.w{width:21px;height:13px;left:0;top:calc(50% - 6.5px)}
    #act2Workbench .a2-cell .a2-roomname{position:relative;z-index:2;background:#11182de8;padding:2px 3px;font-size:12px;font-weight:900}
    #act2Workbench .a2-cell .a2-angle{font-size:10px;z-index:2;color:#ffdc98}
    #act2Workbench .a2-roomcards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px}
    #act2Workbench .a2-roomcards button{background:#1e2c4b;border:1px solid #728abe;border-radius:2px;color:#e7efff;min-height:42px;padding:4px 2px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:11px;line-height:1.3}
    #act2Workbench .a2-roomcards button.active{border:2px solid #ffcd7d;background:#30435d}
    #act2Workbench .a2-roomcards b{font-size:12px}
    #act2Workbench .a2-actions{display:grid;grid-template-columns:1fr 1.2fr;gap:6px;margin-top:7px}
    #act2Workbench .a2-actions button{min-height:41px;border:1px solid #8d94ba;background:#253456;color:#fff;font-size:12px;font-weight:800;border-radius:3px}
    #act2Workbench .a2-actions .test{background:#ffce7b;color:#132039;border-color:#ffecb7;font-size:14px}
    #act2Workbench .a2-note{font-size:12px;line-height:1.55;padding:7px 8px;margin-top:7px;min-height:40px;background:#13243e;border:1px solid #52708e;color:#e8f3ff}
    #act2Workbench .a2-note.good{background:#183f3e;border-color:#85e6c4;color:#f2fffb}
    #act2Workbench .a2-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:6px;font-size:11px;color:#aec7dc}
    #act2Workbench .a2-foot button{padding:4px 6px;color:#b7c6d5;background:transparent;border:0;text-decoration:underline}
    #act2Workbench .a2-ready{background:#123e3a;border-left:4px solid #8fedc2;padding:8px 9px;color:#e3fff7;font-size:13px;line-height:1.5;margin-bottom:7px}
    #act2Workbench .a2-help{font-size:11px;color:#c8d9e9;line-height:1.45;margin:5px 0 0}
    @media(max-width:360px){#act2Workbench{padding:7px}#act2Workbench .a2-cell{height:57px}#act2Workbench .a2-scene{gap:4px;padding:8px 5px}#act2Workbench .a2-prop .name{font-size:10px}}
    @media(prefers-reduced-motion:no-preference){body[data-motion="on"] #act2Workbench .a2-prop.done .light{animation:a2-pulse 1.8s ease-in-out infinite alternate}@keyframes a2-pulse{to{box-shadow:0 0 15px #75ffc6,0 0 21px #75ffc644}}}
  `;
  document.head.append(style);

  const root=document.createElement('section');
  root.id='act2Workbench';root.hidden=true;root.setAttribute('aria-label','第二幕双房间机关');
  root.innerHTML=`
    <div class="a2-top"><strong>02 / 双房间维修台</strong><em id="a2Progress">未接通</em></div>
    <p class="a2-intro">旧地图只是最后一扇门。先调查现场，再用 A、B 两间中转房接通真正的机关。</p>
    <div class="a2-route" id="a2Routes"></div>
    <div class="a2-scene" aria-label="可调查的现场物品">
      <button type="button" class="a2-prop" data-inspect="power"><i class="light"></i><span class="shape">▣</span><span class="name">电梯配电柜</span></button>
      <button type="button" class="a2-prop" data-inspect="tools"><i class="light"></i><span class="shape">▤</span><span class="name">应急工具箱</span></button>
      <button type="button" class="a2-prop" data-inspect="fire"><i class="light"></i><span class="shape">▥</span><span class="name">消防门闩</span></button>
      <button type="button" class="a2-prop" data-inspect="radio"><i class="light"></i><span class="shape">◉</span><span class="name">监听弃置的广播机 · 可选</span></button>
    </div>
    <div class="a2-evidence" id="a2Evidence" role="status">物品都有名字，点按检查；已有剧情线索不会被扣除。</div>
    <div class="a2-tools" id="a2Tools"></div>
    <div class="a2-step"><strong>中转网络 · 两个可调整房间</strong><span id="a2Selected">选中 A</span></div>
    <div class="a2-grid" id="a2Grid" aria-label="两间可旋转房间的连通机关"></div>
    <div class="a2-roomcards" id="a2Cards" aria-label="为选中的位置选择房间类型"></div>
    <div class="a2-actions"><button type="button" id="a2Rotate">↻ 旋转选中房间90°</button><button type="button" id="a2Test" class="test">接通并检查机关 →</button></div>
    <div class="a2-note" id="a2Note" role="status" aria-live="polite"></div>
    <div class="a2-foot"><span id="a2Hint">先读配电柜或消防门闩，再选工具。</span><button type="button" id="a2Reset">重新挑战机关</button></div>
  `;
  const routePanel=routeView.querySelector('.panel');
  routePanel.insertBefore(root,document.getElementById('board'));
  const gateName=g=>g==='lift'?'北侧电梯':'东侧消防门';
  const note=(s,good=false)=>{state.note=s;$('a2Note').textContent=s;$('a2Note').className='a2-note'+(good?' good':'');};
  const publish=()=>{save();render();};
  const inspectorText={
    power:'配电柜铭牌：备用回路使用15A熔断器。蓝线从左侧输入，经 A、B 两室，从 B 下侧通往电梯继电器；A 上方还需接通安全探针。',
    tools:'工具箱里有两枚不同规格的熔断器、一支机械解锁钩。先看设备铭牌或门闩结构，再判断该用哪一个。',
    fire:'消防门闩上的红线不是电源，是报警信号。使用机械解锁钩，并让应急动力从左侧经 A、B 到 B 上侧消防门锁；B 下侧必须同时点亮示警灯。',
    radio:'广播机后盖有一道不自然的缝：只有至少修好一条路线，才能解开残留的录音。'
  };
  function inspect(id){
    state.inspected[id]=true;
    if(id==='radio' && (state.solved.lift || state.solved.stairs)){
      state.secret=true;note('隐藏发现：两份广播使用了同一段底噪，但一份提前了两秒。有人在故意制造互相矛盾的出口指示。',true);
    } else note(inspectorText[id]);
    $('a2Evidence').textContent=id==='radio'&&state.secret?'◈ 隐藏录音已解开：广播来自同一控制源，存在两秒剪接。':inspectorText[id];
    publish();
  }
  function pickItem(item){
    if(!state.inspected.tools){note('先检查工具箱，确认可使用的物品。');return;}
    state.item=item;
    note(item==='fuse15'?'已拿起15A备用熔断器。':item==='fuse20'?'已拿起20A熔断器。它可能不符合设备铭牌。':'已拿起机械解锁钩。');
    publish();
  }
  function routeChoice(gate){
    if(!accessible(gate)) {note('该出口尚未被剧情解锁；第一幕检修记录可以开启备用路线。');return;}
    state.route=gate;
    state.selected='A';
    note(state.solved[gate]?`${gateName(gate)}的机关已经解除。返回下方旧地图，拼接最终出口。`:`当前准备挑战${gateName(gate)}。需要检查对应设施和选择工具。`,state.solved[gate]);
    publish();
  }
  function place(slot,type){
    if(!types[type])return;
    state.rooms[slot]={type,rotation:0};
    note(`${slot} 格已选择${types[type].name}。黄色房门方向可旋转，两个房间都需要连上目标机关。`);
    publish();
  }
  function orient(){
    const r=state.rooms[state.selected];
    if(!r){note('先为选中的中转格选择一张房卡。');return;}
    r.rotation=(r.rotation+1)%4;
    note(`${state.selected} 格旋转到 ${r.rotation*90}°。还需要检查另一格及设备的附加连接。`);
    publish();
  }
  function test(){
    state.attempts++;
    const gate=state.route;
    if(!accessible(gate)){note('当前出口尚未由故事解锁。请返回剧情或使用检修记录。');publish();return;}
    if(gate==='lift' && !state.inspected.power){note('配电柜尚未检查，无法确认备用电路允许的规格。');publish();return;}
    if(gate==='stairs' && !state.inspected.fire){note('必须先检查消防门闩，确认它采用机械解除。');publish();return;}
    if(!state.inspected.tools){note('工具箱还未打开，缺少实际维修工具。');publish();return;}
    if(gate==='lift'&&state.item!=='fuse15'){note(state.item==='fuse20'?'20A保险丝与15A设备铭牌不匹配，保护装置拒绝合闸。':'电梯回路需要正确规格的熔断器。');publish();return;}
    if(gate==='stairs'&&state.item!=='hook'){note('消防门闩不能靠熔断器解除，需要机械解锁钩。');publish();return;}
    if(!state.rooms.A || !state.rooms.B){note('A、B 还有空房间。要完整接通两间房，不能只旋转旧地图的中央一格。');publish();return;}
    if(!matches(gate)){
      note(gate==='lift'?'蓝线中断或安全探针无信号。检查 A 是否能接通左侧输入、右侧 B 及上方探针；B 还应连接下方电梯继电器。':'橙线仍不通或联动灯未亮。检查 A 能否连接左右两室；B 必须接左侧 A、上方消防门锁和下方提示灯。');
      publish();return;
    }
    state.solved[gate]=true;
    note(`✓ ${gateName(gate)}机关已解除！A、B 两室完成联动。现在到下方3×3地图拼接最后一个出口；可另选路线探索不同结局。`,true);
    if(state.inspected.radio){state.secret=true;$('a2Evidence').textContent='◈ 隐藏录音已解开：两段广播的底噪完全相同，其中一段提前了两秒。';}
    publish();
  }
  function cell(slot){
    const room=state.rooms[slot];
    const mask=doors(slot);
    const ars=[['n',N],['e',E],['s',S],['w',W]].filter(x=>(mask & x[1])!==0).map(x=>`<i class="a2-door ${x[0]}"></i>`).join('');
    return `<button type="button" class="a2-cell slot${state.selected===slot?' selected':''}" data-slot="${slot}" aria-label="${slot}格，${room?types[room.type].name+'，'+(room.rotation*90)+'度':'空位'}，点击选择"><span class="a2-doors">${ars}</span><span class="a2-roomname">${slot} · ${room?types[room.type].name:'待放房间'}</span><span class="a2-angle">${room?room.rotation*90+'°':'＋'}</span></button>`;
  }
  function renderGrid(){
    const g=state.route;
    const ports = mask=> [['n',N],['e',E],['s',S],['w',W]].filter(v=>(mask&v[1])!==0).map(v=>`<i class="a2-door ${v[0]}"></i>`).join('');
    const fix=(label,desc,on,mask=0)=>`<div class="a2-cell fixed${on?' active':''}"><span class="a2-doors">${ports(mask)}</span><b>${label}</b><small>${desc}</small></div>`;
    $('a2Grid').innerHTML=g==='lift'
    ?fix('封锁区','',false)+fix('安全探针','需连接下方 A',true,S)+fix('警报线路','不可进入',false)
     +fix('蓝色电源','左侧·入口',true,E)+cell('A')+cell('B')
     +fix('停用房','',false)+fix('停用房','',false)+fix('电梯继电器','B 下侧·出口',true,N)
    :fix('封锁区','',false)+fix('停用房','',false)+fix('消防门锁','B 上侧·出口',true,S)
     +fix('机械动力','左侧·入口',true,E)+cell('A')+cell('B')
     +fix('停用房','',false)+fix('停用房','',false)+fix('示警灯','B 下侧·联动',true,N);
    $('a2Selected').textContent=`选中 ${state.selected} · ${state.rooms[state.selected]?state.rooms[state.selected].rotation*90+'°':'未放置'}`;
    const cards=$('a2Cards');cards.replaceChildren();
    for(const [k,v] of Object.entries(types)){
      const b=document.createElement('button');b.type='button';b.dataset.type=k;b.className=state.rooms[state.selected]?.type===k?'active':'';
      b.innerHTML=`<b>${v.icon} ${v.name}</b><small>${v.detail}</small>`;
      cards.append(b);
    }
  }
  function render(){
    root.hidden=game.stageNumber()!==2;
    if(root.hidden)return;
    if(!accessible(state.route))state.route=primary()==='stairs'?'stairs':'lift';
    $('a2Progress').textContent=state.solved.lift&&state.solved.stairs?'双路线已通':state.solved[state.route]?'机关已解除':'等待维修';
    const routes=$('a2Routes');routes.replaceChildren();
    for(const gate of ['lift','stairs']){
      const b=document.createElement('button');b.type='button';b.dataset.gate=gate;b.disabled=!accessible(gate);
      b.className=state.route===gate?'active':'';
      b.textContent=`${gate==='lift'?'北侧电梯':'东侧消防门'} · ${state.solved[gate]?'✓ 完成':accessible(gate)?'待解':'锁定'}`;
      routes.append(b);
    }
    for(const b of root.querySelectorAll('[data-inspect]'))b.classList.toggle('done',state.inspected[b.dataset.inspect] || b.dataset.inspect==='radio'&&state.secret);
    const tools=$('a2Tools');tools.replaceChildren();
    if(state.inspected.tools){
      const opts=[['fuse15','15A 备用熔断器'],['fuse20','20A 熔断器'],['hook','机械解锁钩']];
      for(const [k,label] of opts){const b=document.createElement('button');b.type='button';b.dataset.pick=k;b.className=state.item===k?'active':'';b.textContent=label;tools.append(b);}
    }
    renderGrid();
    $('a2Note').textContent=state.note;
    $('a2Note').className='a2-note'+(state.solved[state.route]?' good':'');
    $('a2Hint').textContent=state.solved[state.route]?'已解除的机关可以复玩；另一出口需剧情解锁。':state.route==='lift'?'电梯：蓝线 + A上方探针 + B下方继电器，注意保险丝规格。':'消防：橙线 + B上方门锁 + B下方示警灯，注意门闩结构。';
  }
  root.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn||!root.contains(btn))return;
    if(btn.dataset.gate)routeChoice(btn.dataset.gate);
    else if(btn.dataset.inspect)inspect(btn.dataset.inspect);
    else if(btn.dataset.pick)pickItem(btn.dataset.pick);
    else if(btn.dataset.slot){state.selected=btn.dataset.slot;publish();}
    else if(btn.dataset.type)place(state.selected,btn.dataset.type);
    else if(btn.id==='a2Rotate')orient();
    else if(btn.id==='a2Test')test();
    else if(btn.id==='a2Reset'){
      const keep={secret:state.secret,solved:{...state.solved}};
      Object.assign(state,base());state.secret=keep.secret;state.solved=keep.solved;
      state.route=primary()==='stairs'?'stairs':'lift';
      note('两间中转房已清空，可以重走接线步骤；已解锁出口与原有奖励不回退。');publish();
    }
  });
  const sync = () => render();
  new MutationObserver(sync).observe($('chapterBadge'),{childList:true,subtree:true});
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-view']});
  new MutationObserver(sync).observe($('relicPanel'),{attributes:true,attributeFilter:['hidden']});
  window.G01Act2Puzzle=Object.freeze({version:'0.9.0',canEscape:gate=> gate==='lift'||gate==='stairs'?ready(gate):false,
    status:()=>({stage:game.stageNumber(),primary:primary(),usable:{lift:accessible('lift'),stairs:accessible('stairs')},solved:{...state.solved},secret:state.secret,rooms:{A:state.rooms.A?{...state.rooms.A}:null,B:state.rooms.B?{...state.rooms.B}:null},item:state.item,attempts:state.attempts}),
    check:gate=>gate==='lift'||gate==='stairs'?matches(gate):false});
  render();
})();
