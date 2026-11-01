#!/usr/bin/env python3
"""Read-only browser regressions for the two G01-E V0.9.2 presentation fixes.

Run: python tests/g01-e-v092-regression.py --out /tmp/ye-lou-v092-test
Requires Python Playwright and Chromium. Uses isolated browser contexts and an
ephemeral localhost server. It never writes game files or real player storage.
"""

import argparse
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import threading

from playwright.sync_api import sync_playwright


SIZES = [(320, 568), (360, 740), (375, 667), (390, 844), (1280, 850)]
BADGES = ['power', 'lift', 'stairs', 'archive', 'intercom', 'tower',
          'service', 'monitor', 'hidden', 'floor13', 'office']
STORIES = [
    ['找到保险丝', '维修配电箱', '启动总开关'],
    ['找到备用电池', '接通电路', '启动电梯'],
    ['找到访客卡', '翻看住户名册', '刷开档案室'],
    ['找到异常挂钟', '比对备用时间', '开启钟室'],
    ['观察镜面影像', '打开顶灯', '检查监控线路'],
    ['取出旧平面图', '核验门禁记录', '打开十三层入口'],
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--candidate', default='ye-lou-act2-puzzle-v092.html')
    parser.add_argument('--chromium', default='/usr/bin/chromium')
    parser.add_argument('--out', type=Path, default=Path('/tmp/ye-lou-v092-test'))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    if not (args.root / args.candidate).is_file():
        parser.error('candidate does not exist: ' + str(args.root / args.candidate))
    report = {
        'candidate': args.candidate, 'viewports': SIZES,
        'source': 'complete repository HTML and unmodified second-act module; no page stubs',
        'storage': 'isolated browser contexts; only later-act access uses seeded existing badge fields',
        'checks': [], 'cases': [], 'page_errors': [],
        'limitations': ['Chromium simulation only; real iPhone Safari and WeChat are not verified'],
    }

    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0),
                                 functools.partial(QuietHandler, directory=str(args.root)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f'http://127.0.0.1:{server.server_port}/{args.candidate}'

    def check(name, passed, details=None):
        report['checks'].append({'name': name, 'passed': bool(passed), 'details': details})
        print(('PASS ' if passed else 'FAIL ') + name, flush=True)
        if not passed and details is not None:
            print(json.dumps(details, ensure_ascii=False), flush=True)

    def settle(page):
        page.evaluate('() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))')

    def scroll_state(page, selector):
        return page.locator(selector).evaluate('''el => ({
            top: el.scrollTop, max: Math.max(0, el.scrollHeight-el.clientHeight),
            descendants: [...el.querySelectorAll('*')].filter(n => {
                const s=getComputedStyle(n);
                return /auto|scroll/.test(s.overflowY) && n.scrollHeight>n.clientHeight+1;
            }).map(n => ({id:n.id, className:String(n.className), top:n.scrollTop}))
        })''')

    def to_bottom(page, selector):
        page.locator(selector).evaluate('el => {el.scrollTop=el.scrollHeight}')
        settle(page)
        return scroll_state(page, selector)

    def top_visible(page):
        return page.evaluate('''() => {
            const r=document.querySelector('.m08-story-portrait').getBoundingClientRect();
            const speech=document.querySelector('.m08-speech').getBoundingClientRect();
            const bar=document.getElementById('stepBar').getBoundingClientRect();
            return {portraitY:r.top, portraitBottom:r.bottom, speechY:speech.top,
                    barBottom:bar.bottom, visible:r.top>=bar.bottom-1 && speech.top>=bar.bottom-1,
                    comic:!document.getElementById('m08Environment').hidden,
                    overflow:document.body.scrollWidth>innerWidth+1};
        }''')

    def story(page, stage):
        for text in STORIES[stage-1]:
            page.locator('#storyChoices .story-choice').filter(has_text=text).click()
            if stage == 1:
                page.locator('#act1EvidenceOverlay .evidence-action').click()

    def fresh(browser, width, height, stage=None):
        context = browser.new_context(viewport={'width': width, 'height': height},
                                      is_mobile=width < 600, has_touch=width < 600,
                                      reduced_motion='reduce')
        if stage is not None:
            # Existing save schema only unlocks navigation; actions remain real UI events.
            seed = {'schema': 1, 'stage': stage-1,
                    'achievements': {key: True for key in BADGES}, 'decisions': []}
            context.add_init_script(
                "if(!sessionStorage.getItem('g01-regression-seeded')){"
                "localStorage.setItem('g01-story-chapter.v0.1',JSON.stringify(" + json.dumps(seed) + "))"
                ";sessionStorage.setItem('g01-regression-seeded','1')}"
            )
        page = context.new_page()
        page.set_default_timeout(10000)
        page.on('pageerror', lambda error: report['page_errors'].append(str(error)))
        page.goto(url, wait_until='networkidle')
        settle(page)
        return context, page

    def normal_progression(browser, width, height):
        context, page = fresh(browser, width, height)
        try:
            label = f'{width}x{height} fresh first-to-second'
            page.locator('#beginStory').click()
            story(page, 1)
            before = to_bottom(page, '#storyView')
            page.locator('#toRoute').click()
            page.locator('#roomChoices .room-card').filter(has_text='直通房').click()
            page.locator('#rotate').click()
            page.locator('#escape').click()
            check(label + ' real first-act escape', page.locator('#successOverlay').is_visible())
            page.locator('#winNext').click()
            page.locator('#beginStory').click()
            settle(page)
            state = scroll_state(page, '#storyView')
            visible = top_visible(page)
            check(label + ' second-act start is at top',
                  state['top'] == 0 and all(n['top'] == 0 for n in state['descendants']),
                  {'previous': before, 'new': state})
            check(label + ' comic and caption are unobstructed',
                  visible['visible'] and visible['comic'] and not visible['overflow'], visible)
            page.screenshot(path=str(args.out / f'{width}x{height}-normal-act2.png'))
        finally:
            context.close()

    def common_navigation(browser, width, height):
        context, page = fresh(browser, width, height, stage=2)
        try:
            prefix = f'{width}x{height}'
            for stage in range(2, 7):
                if stage > 2:
                    if not page.locator('#chapterShelf').evaluate('el => el.open'):
                        page.locator('#chapterShelf summary').click()
                    page.locator('#stageTabs .stage-tab').nth(stage-1).click()
                settle(page)
                landing = scroll_state(page, '#landingView')
                check(f'{prefix} act{stage} new landing at top', landing['top'] == 0, landing)
                page.locator('#beginStory').click()
                settle(page)
                state = scroll_state(page, '#storyView')
                visible = top_visible(page)
                check(f'{prefix} act{stage} new story/nested scrolling at top',
                      state['top'] == 0 and all(n['top'] == 0 for n in state['descendants']), state)
                check(f'{prefix} act{stage} comic/caption remain visible',
                      visible['visible'] and visible['comic'] and not visible['overflow'], visible)
                story(page, stage)
                before_story = to_bottom(page, '#storyView')
                page.locator('#toRoute').click()
                settle(page)
                route = scroll_state(page, '#routeView')
                check(f'{prefix} act{stage} new route/nested scrolling at top',
                      route['top'] == 0 and all(n['top'] == 0 for n in route['descendants']), route)
                to_bottom(page, '#routeView')
                page.locator('#stepBack').click()
                settle(page)
                returned = scroll_state(page, '#storyView')
                check(f'{prefix} act{stage} return preserves reading position',
                      abs(returned['top']-before_story['top']) <= 2,
                      {'before': before_story, 'after': returned})
                # A user-visible control triggers normal render; no stage transition occurs.
                page.locator('#clearStory').scroll_into_view_if_needed()
                before_clear = scroll_state(page, '#storyView')
                page.locator('#clearStory').click()
                settle(page)
                after_clear = scroll_state(page, '#storyView')
                check(f'{prefix} act{stage} ordinary render does not force top',
                      abs(after_clear['top']-min(before_clear['top'], after_clear['max'])) <= 2,
                      {'before': before_clear, 'after': after_clear})
                # Leaving for the cover and returning within the same act is not a new act.
                reading = to_bottom(page, '#storyView')
                page.locator('#stepBack').click()
                page.locator('#beginStory').click()
                settle(page)
                back = scroll_state(page, '#storyView')
                check(f'{prefix} act{stage} cover return preserves reading position',
                      abs(reading['top']-back['top']) <= 2, {'before': reading, 'after': back})
                page.locator('#stepBack').click()
            # Replay intentionally starts a new attempt, but must retain earned records.
            score_before = page.evaluate('G01Chapter.summary()')
            page.locator('#beginStory').click()
            story(page, 6)
            page.locator('#toRoute').click()
            to_bottom(page, '#routeView')
            page.locator('#restart').click()
            page.locator('#beginStory').click()
            settle(page)
            replay = scroll_state(page, '#storyView')
            check(prefix + ' replay starts clean without losing earned progress',
                  page.evaluate('G01Chapter.stageNumber()') == 6 and replay['top'] == 0
                  and score_before == page.evaluate('G01Chapter.summary()'), replay)
            page.screenshot(path=str(args.out / f'{prefix}-act6-replay.png'))
        finally:
            context.close()

    def topbar(browser, width, height):
        context, page = fresh(browser, width, height)
        try:
            prefix = f'{width}x{height} topbar'
            box = page.locator('#archiveShortcut').bounding_box()
            points = [(box['x'] + dx*box['width'], box['y'] + dy*box['height'])
                      for dx in [.12, .3, .5, .7, .88] for dy in [.2, .5, .8]]
            if width == 320:
                points.insert(0, (30, 26))
            hit = page.evaluate('''points => points.map(([x,y]) => ({x,y,
                id:document.elementFromPoint(x,y)?.closest('button')?.id || null}))''', points)
            check(prefix + ' full visible archive area receives pointer input',
                  all(p['id'] == 'archiveShortcut' for p in hit), hit)
            original_score = page.evaluate('G01Chapter.summary()')
            for index, (x, y) in enumerate(points):
                if width < 600:
                    page.touchscreen.tap(x, y)
                else:
                    page.mouse.click(x, y)
                check(prefix + f' archive sample {index+1} opens archive',
                      page.evaluate('G01Chapter.view()') == 'archive', [x, y])
                if page.evaluate('G01Chapter.view()') == 'archive':
                    page.locator('#archiveReturn').click()
            motion_before = page.evaluate('document.body.dataset.motion')
            page.locator('#motionToggle').click()
            check(prefix + ' motion control remains clickable',
                  motion_before != page.evaluate('document.body.dataset.motion'))
            check(prefix + ' archive/motion actions do not change game records',
                  original_score == page.evaluate('G01Chapter.summary()'))
            page.screenshot(path=str(args.out / f'{width}x{height}-topbar.png'),
                            clip={'x': 0, 'y': 0, 'width': width, 'height': 60})
            page.locator('.top .back').click()
            page.wait_for_url(f'http://127.0.0.1:{server.server_port}/')
            check(prefix + ' back control navigates to unchanged main entry',
                  page.url == f'http://127.0.0.1:{server.server_port}/')
        finally:
            context.close()

    try:
        with sync_playwright() as playwright:
            browser_env = os.environ.copy()
            browser_env['XDG_CACHE_HOME'] = str(args.out / 'browser-cache')
            browser_env['XDG_CONFIG_HOME'] = str(args.out / 'browser-config')
            browser = playwright.chromium.launch(executable_path=args.chromium, env=browser_env)
            report['browser_version'] = browser.version
            try:
                for width, height in SIZES:
                    for action in [normal_progression, common_navigation, topbar]:
                        case = {'name': action.__name__, 'viewport': [width, height]}
                        try:
                            action(browser, width, height)
                            case['completed'] = True
                        except Exception as error:
                            case['completed'] = False
                            case['error'] = str(error)
                            check(f'{width}x{height} {action.__name__} completed', False, str(error))
                        report['cases'].append(case)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        check('no JavaScript page errors', not report['page_errors'], report['page_errors'])
        report['summary'] = {
            'checks': len(report['checks']),
            'passed': sum(c['passed'] for c in report['checks']),
            'failed': sum(not c['passed'] for c in report['checks']),
            'completed_cases': sum(c['completed'] for c in report['cases']),
        }
        (args.out / 'regression-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
        print(json.dumps(report['summary']), flush=True)
    return 1 if report['summary']['failed'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
