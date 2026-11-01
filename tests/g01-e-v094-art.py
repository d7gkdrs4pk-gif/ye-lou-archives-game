#!/usr/bin/env python3
"""Read-only V0.9.4 artwork integration checks on complete local pages.

Requires Python Playwright and Chromium. Run from the repository root:
    python tests/g01-e-v094-art.py --out /tmp/ye-lou-v094/regression/art
All game state is confined to disposable browser contexts. No project file writes.
"""

import argparse
import functools
import hashlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import threading

from playwright.sync_api import sync_playwright


SIZES = [(320, 568), (375, 667), (390, 844)]
ASSETS = ['dialogue', 'battery', 'circuit', 'lift', 'alarm', 'latch', 'door', 'workbench']
ROUTES = {'lift': ['找到备用电池', '接通电路', '启动电梯'],
          'stairs': ['触发消防警报', '卸下门闩', '推开安全门']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--candidate', default='ye-lou-act2-puzzle-v094.html')
    parser.add_argument('--out', type=Path, default=Path('/tmp/ye-lou-v094/regression/art'))
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    report = {'candidate': args.candidate, 'viewports': SIZES, 'checks': [],
              'page_errors': [], 'cases': [], 'source': 'Complete repository page, no stubs',
              'storage': 'Disposable profiles, existing power badge seeds second-act access only',
              'limitations': ['Real iPhone Safari and WeChat are not verified; this is not aesthetic approval']}

    def check(name, condition, details=None):
        report['checks'].append({'name': name, 'passed': bool(condition), 'details': details})
        print(('PASS ' if condition else 'FAIL ') + name, flush=True)

    original = (args.root / 'ye-lou-act2-puzzle-v092.html').read_text()
    candidate = (args.root / args.candidate).read_text()
    scripts = lambda text: re.findall(r'<script([^>]*)>(.*?)</script>', text, re.S)
    check('11 inline/external script blocks unchanged from V0.9.2',
          len(scripts(candidate)) == 11 and scripts(candidate) == scripts(original))
    for filename, expected in [
        ('ye-lou-act2-puzzle-v092.html', 'b4c5bdc28bb785a2569324aa57bd580a8a055876'),
        ('ye-lou-act1-comic-v082.html', 'f4ceeb59caf333161e6938e940b0717d3e93e221'),
        ('act2-workshop-v090.js', '8efc304900e25d82889369408c89545aa0715e70')]:
        data = (args.root / filename).read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        check(filename + ' frozen blob', blob == expected, blob)

    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0),
                                 functools.partial(QuietHandler, directory=str(args.root)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'

    def settle(page):
        page.evaluate('() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')

    def hit(page, locator):
        locator.scroll_into_view_if_needed()
        settle(page)
        return locator.evaluate('''el => {
          const r=el.getBoundingClientRect();
          const point={x:r.left+r.width/2,y:r.top+r.height/2};
          const top=document.elementFromPoint(point.x,point.y);
          return {clickable:!!top && (top===el || el.contains(top)),
                  point, topTag:top?.tagName, topId:top?.id};
        }''')

    bounds = '''el => {
      const card=el.getBoundingClientRect();
      const parts=[...el.querySelectorAll('strong,small')].map(n=>{
       const r=n.getBoundingClientRect(),s=getComputedStyle(n);
       return {text:n.innerText,x:r.x,y:r.y,right:r.right,bottom:r.bottom,
               visible:s.display!=='none' && r.width>0 && r.height>0,
               inside:r.left>=card.left-1 && r.right<=card.right+1 && r.top>=card.top-1 && r.bottom<=card.bottom+1};
      });
      return {card:card.toJSON(),parts};
    }'''

    try:
        with sync_playwright() as p:
            env = os.environ.copy()
            env['XDG_CACHE_HOME'] = str(args.out / 'browser-cache')
            env['XDG_CONFIG_HOME'] = str(args.out / 'browser-config')
            browser = p.chromium.launch(executable_path=args.chromium, env=env)
            report['browser_version'] = browser.version
            for width, height in SIZES:
                for route, events in ROUTES.items():
                    label = f'{width}x{height}-{route}'
                    context = browser.new_context(viewport={'width': width, 'height': height},
                                                  is_mobile=True, has_touch=True, reduced_motion='reduce')
                    context.add_init_script("if(!sessionStorage.getItem('art-seeded')){localStorage.setItem('g01-story-chapter.v0.1',JSON.stringify({schema:1,stage:1,achievements:{power:true},decisions:[]}));sessionStorage.setItem('art-seeded','1')}")
                    page = context.new_page()
                    page.set_default_timeout(10000)
                    page.on('pageerror', lambda error: report['page_errors'].append(str(error)))
                    case = {'name': label}
                    try:
                        response = page.goto(base + args.candidate, wait_until='networkidle')
                        check(label + ' candidate HTTP 200', response.status == 200)
                        page.locator('#beginStory').click()
                        settle(page)
                        if route == 'lift':
                            for asset in ASSETS:
                                resource = context.request.get(base + f'assets/act2-v094/{asset}.webp')
                                check(label + ' artwork HTTP 200 ' + asset, resource.status == 200)
                                size = page.evaluate('''url=>new Promise(resolve=>{
                                  const im=new Image(); im.onload=()=>resolve([im.naturalWidth,im.naturalHeight]);
                                  im.onerror=()=>resolve([0,0]);im.src=url;
                                })''', base + f'assets/act2-v094/{asset}.webp')
                                check(label + ' artwork decodes ' + asset, size == [768, 256], size)
                        portrait = page.locator('.m08-story-portrait')
                        portrait_paint = portrait.evaluate("el=>({image:getComputedStyle(el,'::before').backgroundImage,size:getComputedStyle(el,'::before').backgroundSize})")
                        check(label + ' dialogue uses complete new painting',
                              'dialogue.webp' in portrait_paint['image'] and portrait_paint['size'] == 'cover', portrait_paint)
                        portrait.screenshot(path=str(args.out / (label + '-dialogue.png')))
                        dialogue = portrait.evaluate('''el=>{
                          const p=el.getBoundingClientRect(),s=el.querySelector('.m08-speech').getBoundingClientRect(),t=el.querySelector('.m081-scene-tag').getBoundingClientRect();
                          const bar=document.getElementById('stepBar').getBoundingClientRect();
                          return {portrait:p.toJSON(),speech:s.toJSON(),tag:t.toJSON(),
                           speechInside:s.left>=p.left-1&&s.right<=p.right+1&&s.top>=p.top-1&&s.bottom<=p.bottom+1,
                           portraitBelowBar:p.top>=bar.bottom-1,
                           tagOverlapsSpeech:Math.min(t.right,s.right)>Math.max(t.left,s.left)&&Math.min(t.bottom,s.bottom)>Math.max(t.top,s.top)};
                        }''')
                        check(label + ' dialogue inside frame and below toolbar', dialogue['speechInside'] and dialogue['portraitBelowBar'], dialogue)
                        check(label + ' time label does not overlap dialogue', not dialogue['tagOverlapsSpeech'], dialogue)
                        for event in events:
                            card = page.locator('#storyChoices .story-choice').filter(has_text=event)
                            asset = ['battery', 'circuit', 'lift', 'alarm', 'latch', 'door'][
                                list(ROUTES.values())[0].index(event) if route == 'lift'
                                else 3 + list(ROUTES.values())[1].index(event)]
                            paint = card.evaluate("el=>{const s=getComputedStyle(el,'::before');return {image:s.backgroundImage,size:s.backgroundSize,position:s.backgroundPosition,width:s.width,height:s.height}}")
                            check(label + ' complete painting fitted to event ' + event,
                                  asset + '.webp' in paint['image'] and paint['size'] == 'cover', paint)
                            target = hit(page, card)
                            check(label + ' event receives pointer ' + event, target['clickable'], target)
                            metric = card.evaluate(bounds)
                            check(label + ' event text remains inside card ' + event,
                                  all(x['inside'] and x['visible'] for x in metric['parts']), metric)
                            card.screenshot(path=str(args.out / (label + '-' + str(events.index(event) + 1) + '.png')))
                            card.click()
                        check(label + ' three original events selected', page.locator('#storyChoices button:disabled').count() == 6)
                        check(label + ' original branch formed', page.evaluate('G01Chapter.route().gate') == route)
                        page.locator('#toRoute').click()
                        settle(page)
                        controls = page.locator('#act2Workbench .a2-prop')
                        scene = page.locator('#act2Workbench .a2-scene').evaluate('el=>getComputedStyle(el).backgroundImage')
                        check(label + ' mechanism environment uses new painting', 'workbench.webp' in scene, scene)
                        for index in range(controls.count()):
                            control = controls.nth(index)
                            target = hit(page, control)
                            check(label + ' inspect control receives pointer ' + str(index + 1), target['clickable'], target)
                            control.click()
                        for selector in ['#a2Rotate', '#a2Test', '#a2Reset', '#rotate', '#escape']:
                            target = hit(page, page.locator(selector))
                            check(label + ' mechanism control receives pointer ' + selector, target['clickable'], target)
                        check(label + ' no horizontal page overflow', page.evaluate('document.body.scrollWidth<=innerWidth+1'))
                        case['status'] = 'completed'
                    except Exception as error:
                        case.update(status='failed', error=str(error))
                        page.screenshot(path=str(args.out / (label + '-failure.png')))
                    finally:
                        report['cases'].append(case)
                        context.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    report['summary'] = {'checks': len(report['checks']),
                         'passed': sum(x['passed'] for x in report['checks']),
                         'failed': sum(not x['passed'] for x in report['checks']),
                         'case_errors': [x['name'] for x in report['cases'] if x['status'] != 'completed']}
    (args.out / 'art-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print(json.dumps(report['summary']), flush=True)
    return 1 if report['summary']['failed'] or report['summary']['case_errors'] or report['page_errors'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
