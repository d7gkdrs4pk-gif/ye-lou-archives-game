/* G01-C V0.4 | Optional offline friend leaderboard. No network, no fabricated rankings. */
(() => {
  'use strict';
  const RANK_KEY = 'g01-friend-leaderboard.v0.4';
  const REWARD_KEY = 'g01-b.reward.v0.3';
  const COUNT = 5;
  const MAX_PEERS = 30;
  const $ = id => document.getElementById(id);
  const clampTime = n => Number.isInteger(n) && n >= 1 && n <= 86400 ? n : null;
  const cleanName = value => String(value || '').trim().replace(/[<>\r\n\t]/g, '').slice(0, 12);
  const validStars = b => Array.isArray(b) && b.length === COUNT && b.every(n => Number.isInteger(n) && n >= 0 && n <= 3);
  const uuid = () => 'p' + Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
  const safeRead = key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } };
  let saved = safeRead(RANK_KEY);
  if (!saved || saved.v !== 1 || typeof saved.id !== 'string' || !/^[a-z0-9]{6,40}$/i.test(saved.id)) {const id=uuid();saved = { v:1, id, name:'夜行玩家'+id.slice(-4), records:[], peers:[] };}
  saved.name = cleanName(saved.name) || '夜行玩家';
  if (!Array.isArray(saved.records)) saved.records = [];
  if (!Array.isArray(saved.peers)) saved.peers = [];
  saved.peers = saved.peers.slice(0,MAX_PEERS).filter(p=>isValidScore(p) && p.id !== saved.id);
  function store() { try {localStorage.setItem(RANK_KEY, JSON.stringify(saved));} catch (_) { /* private mode */ } }
  function isValidScore(p) {
    return !!p && p.v === 1 && typeof p.id === 'string' && /^[a-z0-9]{6,40}$/i.test(p.id) &&
      typeof p.name === 'string' && cleanName(p.name).length >= 1 && p.name.length <= 12 &&
      validStars(p.best) && Array.isArray(p.times) && p.times.length === COUNT &&
      p.times.every(x => x === null || clampTime(x) !== null);
  }
  function bestStars() {
    const a = safeRead(REWARD_KEY)?.best;
    return validStars(a) ? a : [0,0,0,0,0];
  }
  function selfScore() {
    const best=bestStars(), times=best.map((s,i)=>{
      const r=saved.records[i];
      return r && r.stars === s ? clampTime(r.seconds) : null;
    });
    return {v:1,id:saved.id,name:saved.name,best,times};
  }
  function total(s) {return s.best.reduce((a,b)=>a+b,0);}
  function done(s) {return s.best.filter(x=>x>0).length;}
  function fullTime(s) {return s.times.every(x=>x!==null) && done(s)===COUNT ? s.times.reduce((a,b)=>a+b,0) : null;}
  function sortScores(a,b) {return total(b)-total(a) || done(b)-done(a) || (fullTime(a)??Infinity)-(fullTime(b)??Infinity) || a.name.localeCompare(b.name,'zh-CN');}
  function rankList() {return [selfScore(), ...saved.peers].sort(sortScores);}
  function ownRank() {return rankList().findIndex(s=>s.id===saved.id)+1;}
  function encode(data) {
    const bytes = new TextEncoder().encode(JSON.stringify(data));
    let raw=''; bytes.forEach(b=>raw+=String.fromCharCode(b));
    return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function decode(str) {
    if(typeof str!=='string' || str.length<16 || str.length>1200 || !/^[A-Za-z0-9_-]+$/.test(str)) throw Error('成绩码格式无效');
    let data;
    try {
      const raw=atob(str.replace(/-/g,'+').replace(/_/g,'/'));
      const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
      data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    } catch (_) {throw Error('成绩码格式无效');}
    if(!isValidScore(data)) throw Error('成绩内容不符合当前5关版本');
    if(data.id===saved.id) throw Error('这是你自己的挑战记录');
    return data;
  }
  function parseInput(raw) {
    let value=raw.trim();
    if(value.length>3000) throw Error('输入过长');
    if(value.includes('://')) {try {value=new URL(value).searchParams.get('pk')||'';} catch (_) {throw Error('链接格式错误');}}
    else if(value.startsWith('pk=')) value=value.slice(3);
    return decode(value);
  }
  const css=document.createElement('style');
  css.textContent=`
  .rank-shortcuts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}
  .rank-open,.reward-rank{color:#ffe2aa;background:#263a53;border:1px solid #e7b774;border-radius:10px;font-size:12px;font-weight:800;min-height:42px;padding:5px 10px}
  .reward-rank{width:100%;margin-top:10px;min-height:44px}
  .rank-dialog[hidden]{display:none!important}
  .rank-dialog{position:fixed;z-index:3100;inset:0;display:grid;place-items:center;background:rgba(4,12,25,.84);padding:12px;backdrop-filter:blur(4px)}
  .rank-card{width:min(100%,460px);max-height:92dvh;overflow-y:auto;border-radius:19px;border:1px solid #739bb6;background:#11283c;color:#e9f6fd;padding:18px;box-shadow:0 14px 50px #0008}
  .rank-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .rank-head h2{margin:0;font-size:22px;color:#ffdb99}
  .rank-close{min-width:44px;min-height:44px;border-radius:11px;background:#244359;border:1px solid #698ba2;color:#fff;font-size:20px}
  .rank-note{font-size:12px;color:#a9c3d4;line-height:1.6;margin:7px 0 12px}
  .rank-self{display:flex;gap:8px;align-items:center;margin-bottom:12px}
  .rank-self label{font-size:12px;color:#a9c3d4;white-space:nowrap}
  .rank-self input{min-width:0;flex:1;background:#0b1c2e;color:#fff;border:1px solid #52718a;border-radius:8px;padding:11px;font:inherit}
  .rank-save,.rank-action{min-height:43px;border-radius:9px;padding:8px 12px;font-size:13px;font-weight:800;background:#305b68;color:#e9fffe;border:1px solid #79b3a7}
  .rank-list{display:grid;gap:6px;margin:8px 0 12px}
  .rank-row{display:grid;grid-template-columns:34px minmax(0,1fr) 70px 76px;align-items:center;gap:7px;border-radius:10px;padding:10px 8px;background:#1d364d;border:1px solid #3d5e78;font-size:12px}
  .rank-row.mine{border-color:#efca83;background:#3b3d42}
  .rank-pos{font-size:18px;font-weight:900;color:#ffd184;text-align:center}
  .rank-name{font-weight:800;overflow-wrap:anywhere}.rank-name small{display:block;color:#9db7ca;font-weight:400;font-size:10px}
  .rank-score{text-align:right;font-weight:800;color:#fff0bc}.rank-time{text-align:right;color:#afcad9;font-size:11px}
  .rank-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
  .rank-actions .rank-action{width:100%}
  .rank-input{width:100%;min-height:43px;background:#0b1d30;border:1px solid #617e93;color:#eaf4ff;border-radius:9px;padding:10px;font:inherit;font-size:12px;resize:vertical}
  .rank-label{display:block;color:#cdddea;font-weight:750;font-size:12px;margin:13px 0 7px}
  .rank-status{min-height:22px;font-size:12px;color:#f8d99f;line-height:1.5;margin:5px 0}
  .rank-bottom{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:7px}
  .rank-bottom button{background:none;border:0;color:#aac3d9;text-decoration:underline;font-size:11px;min-height:35px}
  .rank-tiny{font-size:10px;color:#88a8bd;line-height:1.6}
  .rank-win{font-size:12px;color:#ffdfaa;margin:6px 0 4px}
  @media(max-width:470px){.rank-shortcuts{gap:4px}.rank-open{font-size:10px;padding:4px 7px}.rank-card{padding:13px}.rank-row{grid-template-columns:29px minmax(0,1fr) 57px 65px;gap:3px;padding:8px 5px}.rank-name{font-size:11px}.rank-self{gap:5px}}
  `;
  document.head.appendChild(css);
  const starHud=$('starHud');
  const header=starHud?.parentElement;
  if(!starHud || !header) return;
  const actions=document.createElement('div'); actions.className='rank-shortcuts';
  header.insertBefore(actions,starHud); actions.appendChild(starHud);
  const openButton=document.createElement('button');openButton.type='button';openButton.className='rank-open';openButton.textContent='🏆 排行榜';actions.appendChild(openButton);
  const overlay=document.createElement('div');overlay.className='rank-dialog';overlay.id='rankDialog';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','rankHeading');
  overlay.innerHTML=`<section class="rank-card"><div class="rank-head"><h2 id="rankHeading">🏆 好友挑战榜</h2><button type="button" id="rankClose" class="rank-close" aria-label="关闭排行榜">×</button></div>
  <p class="rank-note">同样的五关，累计星星越多越靠前；星数相同且完整记录计时的玩家，比总用时。只比较本机和你主动加入的好友成绩。</p>
  <div class="rank-self"><label for="rankNickname">我的昵称</label><input id="rankNickname" maxlength="12" autocomplete="off" aria-label="昵称，不要填写真实姓名"><button type="button" id="rankSave" class="rank-save">保存</button></div>
  <div id="rankList" class="rank-list"></div><div id="rankStatus" class="rank-status" role="status" aria-live="polite"></div>
  <div class="rank-actions"><button id="rankShare" class="rank-action" type="button">分享战绩挑战好友</button><button id="rankImport" class="rank-action" type="button">加入好友成绩</button></div>
  <label class="rank-label" for="rankShareLink">我的挑战链接（可长按复制）</label><textarea id="rankShareLink" class="rank-input" rows="2" readonly></textarea>
  <label class="rank-label" for="rankPaste">粘贴好友分享的链接或成绩码</label><textarea id="rankPaste" class="rank-input" rows="2" maxlength="3000" placeholder="收到好友战绩链接后粘贴到这里"></textarea>
  <div class="rank-bottom"><span class="rank-tiny">排名仅存在本机，好友数据为自行分享，未经服务端防作弊验证。请勿使用真实姓名。</span><button id="rankClear" type="button">清空好友成绩</button></div></section>`;
  document.body.appendChild(overlay);
  const winLink=document.createElement('button');winLink.type='button';winLink.className='reward-rank';winLink.textContent='🏆 查看我的好友榜排名';
  const rewardActions=document.querySelector('.reward-actions');if(rewardActions)rewardActions.after(winLink);
  const winMessage=document.createElement('p');winMessage.className='rank-win';winLink.before(winMessage);
  const $el=id=>$(id);
  const rankStatus=text=>{ $el('rankStatus').textContent=text; };
  function renderRank() {
    $el('rankNickname').value=saved.name;
    const rows=$el('rankList');rows.replaceChildren();
    const all=rankList();
    all.forEach((score,i)=>{
      const row=document.createElement('div');row.className='rank-row'+(score.id===saved.id?' mine':'');
      const place=document.createElement('span');place.className='rank-pos';place.textContent='#'+(i+1);
      const name=document.createElement('span');name.className='rank-name';name.textContent=score.name;
      const sub=document.createElement('small');sub.textContent=score.id===saved.id?'我（本机成绩）':'好友（自报成绩）';name.appendChild(sub);
      const stars=document.createElement('span');stars.className='rank-score';stars.textContent=`★ ${total(score)}/15`;
      const seconds=document.createElement('span');seconds.className='rank-time';const t=fullTime(score);seconds.textContent=t===null?`${done(score)}/5关`:`${t}秒`;
      row.append(place,name,stars,seconds);rows.appendChild(row);
    });
    if(all.length===1)rankStatus('当前仅有自己的纪录，分享挑战链接邀请朋友加入排名。');
    $el('rankShareLink').value=challengeLink();
  }
  function challengeLink() {
    const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('pk',encode(selfScore()));return u.toString();
  }
  function openRank(message) {renderRank();if(message)rankStatus(message);overlay.hidden=false;$el('rankClose').focus();}
  function closeRank() {overlay.hidden=true;openButton.focus();}
  openButton.addEventListener('click',()=>openRank());
  winLink.addEventListener('click',()=>openRank());
  $el('rankClose').addEventListener('click',closeRank);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeRank();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.preventDefault();e.stopImmediatePropagation();closeRank();}},true);
  $el('rankSave').addEventListener('click',()=>{saved.name=cleanName($el('rankNickname').value)||'夜行玩家';store();renderRank();rankStatus('昵称已在本机保存。分享时只包含昵称和成绩。');});
  function addPeer(p) {
    const existing=saved.peers.findIndex(x=>x.id===p.id);
    if(existing===-1 && saved.peers.length>=MAX_PEERS) throw Error('最多保存30位好友，请先清理旧成绩');
    if(existing>=0){
      const prev=saved.peers[existing];
      if(sortScores(p,prev)<0)saved.peers[existing]=p;
      else if(total(p)===total(prev)) saved.peers[existing]={...prev,name:p.name};
    } else saved.peers.push(p);
    store();renderRank();rankStatus(`已加入 ${p.name} 的成绩。目前你的好友榜排名：第${ownRank()} / ${rankList().length}名。`);
  }
  $el('rankImport').addEventListener('click',()=>{try{addPeer(parseInput($el('rankPaste').value));$el('rankPaste').value='';}catch(e){rankStatus(e.message||'无法导入成绩');}});
  $el('rankShare').addEventListener('click',async()=>{
    const link=challengeLink();$el('rankShareLink').value=link;
    try {if(navigator.share){await navigator.share({title:'今晚拼出路 · 好友PK',text:`我已经拿到${total(selfScore())}/15颗星，你能超过我吗？`,url:link});rankStatus('已打开系统分享菜单。');return;}}
    catch(e){if(e.name==='AbortError'){rankStatus('已取消分享，可长按下方链接复制。');return;}}
    try {await navigator.clipboard.writeText(link);rankStatus('挑战链接已复制，可以发送给微信好友。');}
    catch(e){$el('rankShareLink').focus();$el('rankShareLink').select();rankStatus('浏览器未允许自动复制，请长按下方链接复制。');}
  });
  $el('rankClear').addEventListener('click',()=>{if(confirm('只清除本机导入的好友成绩，不影响你的闯关记录。确定吗？')){saved.peers=[];store();renderRank();rankStatus('已清空本机好友成绩。');}});
  let startedAt=Date.now();
  function resetTimer(){startedAt=Date.now();}
  const levels=$('levels');
  if(levels)levels.addEventListener('click',e=>{if(e.target.closest('button'))resetTimer();},true);
  ['nextBtn','rewardContinue','retry'].forEach(id=>$(id)?.addEventListener('click',resetTimer,true));
  const rewardDialog=$('rewardDialog');
  if(rewardDialog){new MutationObserver(()=>{
    if(rewardDialog.hidden) return;
    const match=$('rewardTitle')?.textContent.match(/第(\d+)关/);
    const star=$('rewardStars')?.getAttribute('aria-label')?.match(/获得(\d+)星/);
    if(!match||!star)return;
    const index=Number(match[1])-1, earned=Number(star[1]);
    if(index<0||index>=COUNT||earned<1||earned>3)return;
    const seconds=Math.max(1,Math.min(86400,Math.round((Date.now()-startedAt)/1000)));
    const old=saved.records[index];
    if(!old || earned>old.stars || (earned===old.stars && seconds<(clampTime(old.seconds)??Infinity))){saved.records[index]={stars:earned,seconds};store();}
    const all=rankList(),num=ownRank();
    winMessage.textContent=all.length===1?'恭喜！你是本机排行榜的首位挑战者。':`你目前在已加入的${all.length}人好友榜中排第${num}名，继续挑战！`;
    startedAt=Date.now();
  }).observe(rewardDialog,{attributes:true,attributeFilter:['hidden']});}
  try{
    const incoming=new URL(location.href).searchParams.get('pk');
    if(incoming){const challenger=decode(incoming);$el('rankPaste').value=incoming;openRank(`收到 ${challenger.name} 的挑战：${total(challenger)}/15★。点击“加入好友成绩”进行比较。`);}
  }catch(e){openRank('收到的挑战链接无法识别，可能已过期或内容不完整。');}
  // Read-only snapshot for V0.5 share posters. All values remain local/self-reported.
  window.G01FriendScores = Object.freeze({
    snapshot() {
      const self = selfScore();
      const count = rankList().length;
      return {
        nickname: self.name, stars: total(self), levels: done(self),
        best: [...self.best], fullTimeSeconds: fullTime(self),
        rank: count > 1 ? {position:ownRank(), participants:count, scope:'仅本机已加入好友'} : null,
        challengeUrl: challengeLink()
      };
    }
  });
  store();
})();