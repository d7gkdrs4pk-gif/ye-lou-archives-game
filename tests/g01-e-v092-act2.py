# Reused from the verified V0.9.1 complete-page acceptance suite; only runner paths/configuration changed.
from playwright.sync_api import sync_playwright
from pathlib import Path
import argparse, json, os, traceback, sys

parser=argparse.ArgumentParser(description='Reuse the 45 integrated Act 2 acceptance checks against a complete candidate page.')
parser.add_argument('--url',default='http://127.0.0.1:8872/ye-lou-act2-puzzle-v092.html')
parser.add_argument('--output',type=Path,default=Path('/tmp/ye-lou-v092-test/act2'))
parser.add_argument('--only-alt',action='store_true')
args=parser.parse_args()
OUT=args.output
OUT.mkdir(parents=True,exist_ok=True)
URL=args.url
report={'source':'Complete V0.9.2 candidate HTML with unchanged act2-workshop-v090.js; local HTTP, no stubs',
        'viewport':{'width':390,'height':844},'tests':[],'cases':[],'page_errors':[]}
REPORT=OUT/('results-alt.json' if '--only-alt' in sys.argv else 'results.json')

def check(name,condition,details=None):
    report['tests'].append({'name':name,'passed':bool(condition),'details':details})
    print(('PASS ' if condition else 'FAIL ')+name,flush=True)

def state(page): return page.evaluate('G01Act2Puzzle.status()')
def score(page): return page.evaluate('G01Chapter.summary()')
def note(page): return page.locator('#a2Note').inner_text()
def shot(page,name): page.screenshot(path=str(OUT/(name+'.png')),full_page=True)
def select_story(page,gate):
    if page.locator('#beginStory').is_visible():page.locator('#beginStory').click()
    if page.locator('#clearStory').is_visible() and page.locator('#storyChoices button:disabled').count():page.locator('#clearStory').click()
    for i in ([0,1,2] if gate=='lift' else [3,4,5]):page.locator('#storyChoices button').nth(i).click()
    page.locator('#toRoute').click()
    page.wait_for_timeout(100)
def inspect(page,thing):page.locator(f'[data-inspect="{thing}"]').click()
def item(page,thing):page.locator(f'[data-pick="{thing}"]').click()
def room(page,slot,kind,rot):
    page.locator(f'[data-slot="{slot}"]').click()
    page.locator(f'#a2Cards [data-type="{kind}"]').click()
    for _ in range(rot):page.locator('#a2Rotate').click()
def map_room(page,gate):
    if page.locator('#undo').is_enabled():page.locator('#undo').click()
    page.locator('#roomChoices button').nth(1 if gate=='lift' else 0).click()
    for _ in range(3 if gate=='lift' else 1):page.locator('#rotate').click()
def solve(page,gate):
    page.locator(f'#a2Routes [data-gate="{gate}"]').click()
    inspect(page,'power' if gate=='lift' else 'fire');inspect(page,'tools')
    item(page,'fuse15' if gate=='lift' else 'hook')
    if gate=='lift':room(page,'A','tee',0);room(page,'B','corner',2)
    else:room(page,'A','straight',1);room(page,'B','tee',3)
    page.locator('#a2Test').click()

with sync_playwright() as p:
    browser_env=os.environ.copy()
    browser_env['XDG_CACHE_HOME']=str(OUT/'browser-cache')
    browser_env['XDG_CONFIG_HOME']=str(OUT/'browser-config')
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,env=browser_env)
    report['browser_version']=browser.version
    def run_case(name,seed,action):
        context=browser.new_context(viewport=report['viewport'],is_mobile=True,has_touch=True)
        script="if(!sessionStorage.getItem('auditSeeded')){localStorage.setItem('g01-story-chapter.v0.1',JSON.stringify("+json.dumps(seed)+"));sessionStorage.setItem('auditSeeded','1')}"
        context.add_init_script(script)
        page=context.new_page();page.set_default_timeout(8000)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        case={'name':name,'seed':seed,'setup':'seeded only existing story checkpoint in isolated browser profile; mechanisms and route interactions via UI'}
        try:
            response=page.goto(URL,wait_until='networkidle',timeout=30000)
            check(name+' complete page HTTP',response.status==200)
            check(name+' real module initialized',page.evaluate('!!window.G01Act2Puzzle'))
            action(page)
            case['status']='completed'
        except Exception as e:
            case.update({'status':'test_failed','error':str(e),'traceback':traceback.format_exc()})
            shot(page,name+'-failure')
            print('CASE FAILED '+name+' '+str(e),flush=True)
        finally:
            case['console_page_errors']=errors
            case['last_url']=page.url
            case['final_storage']=page.evaluate('Object.fromEntries(Object.entries(localStorage))')
            report['cases'].append(case);report['page_errors']+=errors
            context.close()
            REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2))

    def lift(page):
        select_story(page,'lift')
        check('unused record: alternate stairs is locked',not page.locator('[data-gate="stairs"]').is_enabled(),state(page))
        map_room(page,'lift');page.locator('#escape').click()
        check('old map cannot bypass workshop',page.locator('#successOverlay').is_hidden() and '维修机关尚未解除' in page.locator('#status').inner_text(),page.locator('#status').inner_text())
        page.locator('#a2Test').click();check('uninspected power rejected','配电柜尚未检查' in note(page),note(page))
        inspect(page,'power');inspect(page,'tools');item(page,'fuse20')
        room(page,'A','tee',0);room(page,'B','corner',2)
        page.locator('#a2Test').click();check('wrong 20A rejected',not state(page)['solved']['lift'] and '20A保险丝与15A' in note(page),note(page))
        item(page,'hook');page.locator('#a2Test').click();check('wrong hook for lift rejected',not state(page)['solved']['lift'] and '熔断器' in note(page),note(page))
        item(page,'fuse15');room(page,'A','straight',1)
        page.locator('#a2Test').click();check('missing lift safety probe rejected',not state(page)['solved']['lift'] and '安全探针' in note(page),note(page))
        before=state(page);page.reload(wait_until='networkidle');after=state(page)
        check('unsolved workshop inventory/rooms survive refresh',before['rooms']==after['rooms'] and before['item']==after['item'] and before['solved']==after['solved'],{'before':before,'after':after})
        select_story(page,'lift');room(page,'A','tee',0)
        page.locator('#a2Test').click();check('lift two-room correct wiring accepted',state(page)['solved']['lift'] and page.evaluate("G01Act2Puzzle.canEscape('lift')"),note(page))
        before_score=score(page);inspect(page,'radio')
        check('radio hidden clue unlocks without reward inflation',state(page)['secret'] and score(page)==before_score,{'state':state(page),'score':score(page)})
        shot(page,'lift-solved')
        map_room(page,'lift');page.locator('#escape').click()
        check('lift integrated escape succeeds',page.locator('#successOverlay').is_visible(),page.locator('#status').inner_text())
        first_score=score(page);check('lift grants one stage fragment',first_score['clues']==2,first_score)
        page.locator('#winBack').click();page.locator('#escape').click()
        check('lift replay cannot duplicate fragment or badge',score(page)==first_score,score(page))
        page.locator('#winBack').click();page.reload(wait_until='networkidle')
        check('solved lift and original achievements survive refresh',state(page)['solved']['lift'] and score(page)==first_score,{'state':state(page),'score':score(page)})

    def stairs(page):
        select_story(page,'stairs')
        check('stairs primary locks unused lift',not page.locator('[data-gate="lift"]').is_enabled(),state(page))
        inspect(page,'fire');inspect(page,'tools');item(page,'fuse15')
        room(page,'A','straight',1);room(page,'B','tee',3)
        page.locator('#a2Test').click();check('stairs rejects fuse instead of hook',not state(page)['solved']['stairs'] and '机械解锁钩' in note(page),note(page))
        item(page,'hook');room(page,'B','corner',3)
        page.locator('#a2Test').click();check('stairs missing warning lamp rejected',not state(page)['solved']['stairs'] and '联动灯' in note(page),note(page))
        room(page,'B','tee',3);page.locator('#a2Test').click()
        check('stairs correct dual-room connections accepted',state(page)['solved']['stairs'] and page.evaluate("G01Act2Puzzle.canEscape('stairs')"),note(page))
        shot(page,'stairs-solved');map_room(page,'stairs');page.locator('#escape').click()
        check('stairs integrated escape succeeds',page.locator('#successOverlay').is_visible(),page.locator('#status').inner_text())
        first_score=score(page);check('stairs grants one fragment and stairs badge',first_score['clues']==2 and 'stairs' in first_score['achievementKeys'],first_score)
        page.locator('#winBack').click();page.locator('#escape').click()
        check('stairs replay reward remains stable',score(page)==first_score,score(page))

    def legacy(page):
        select_story(page,'lift')
        check('legacy checkpoint without record has no relic panel',page.locator('#relicPanel').is_hidden())
        check('legacy checkpoint cannot select unavailable stairs',not page.locator('[data-gate="stairs"]').is_enabled(),state(page))
        solve(page,'lift');map_room(page,'lift');page.locator('#escape').click()
        check('no old record still allows primary lift escape',page.locator('#successOverlay').is_visible() and not score(page)['relicsUsed'][1],score(page))

    def alternate(page,primary,exit_gate):
        select_story(page,primary)
        page.locator('#stepBack').click()
        page.locator('#relicButtons button').click()
        page.locator('#toRoute').click()
        check(primary+' record enables both workshops',page.locator('[data-gate="lift"]').is_enabled() and page.locator('[data-gate="stairs"]').is_enabled(),state(page))
        before=score(page);solve(page,exit_gate)
        check(primary+' alternate '+exit_gate+' can be repaired',state(page)['solved'][exit_gate],state(page))
        map_room(page,exit_gate);page.locator('#escape').click()
        after=score(page)
        check(primary+' alternate integrated escape succeeds',page.locator('#successOverlay').is_visible() and after['decisions'][1]['gate']==exit_gate,after)
        check(primary+' alternate maintenance reward granted once',page.evaluate('G01Chapter.relics().secret.maintenance') and after['badges']==before['badges']+2,{'before':before,'after':after})
        shot(page,'alternate-'+primary+'-to-'+exit_gate)
        page.locator('#winBack').click();page.locator('#escape').click()
        check(primary+' alternate replay prevents duplicate reward',score(page)==after,score(page))
        page.locator('#winBack').click();page.reload(wait_until='networkidle')
        check(primary+' record/repair/rewards survive reload',score(page)==after and state(page)['solved'][exit_gate] and page.evaluate('G01Chapter.relics().used[1]'),{'state':state(page),'score':score(page)})

    standard={'schema':1,'stage':1,'achievements':{'power':True},'decisions':[]}
    if '--only-alt' not in sys.argv:
        run_case('lift',standard,lift)
        run_case('stairs',standard,stairs)
        run_case('legacy-no-record',{'schema':1,'stage':1,'achievements':{'lift':True},'decisions':[]},legacy)
    run_case('alternate-lift-to-stairs',standard,lambda p:alternate(p,'lift','stairs'))
    run_case('alternate-stairs-to-lift',standard,lambda p:alternate(p,'stairs','lift'))
    browser.close()
report['summary']={'checks':len(report['tests']),'passed':sum(t['passed'] for t in report['tests']),'failed':sum(not t['passed'] for t in report['tests']),'case_errors':[c['name'] for c in report['cases'] if c['status']!='completed']}
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report['summary']),flush=True)

sys.exit(1 if report['summary']['failed'] or report['summary']['case_errors'] or report['page_errors'] else 0)
