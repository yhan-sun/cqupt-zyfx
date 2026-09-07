import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url = os.getenv('SITE_URL', 'http://127.0.0.1:4173/cqupt-zyfx/')
output = Path('test-results')
output.mkdir(exist_ok=True)
checks = []

def check(name, condition):
    assert condition, name
    checks.append(name)

def wait_official_images(page):
    images = page.locator('img[data-official-image]')
    if images.count():
        images.evaluate_all("ims => ims.forEach(i => i.loading='eager')")
        page.wait_for_function("[...document.querySelectorAll('img[data-official-image]')].every(i => i.complete && i.naturalWidth > 0)")

with sync_playwright() as p:
    options = {'headless': True, 'args': ['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):
        options['executable_path'] = os.getenv('CHROMIUM_PATH')
    browser = p.chromium.launch(**options)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))

    page.goto(url, wait_until='networkidle')
    wait_official_images(page)
    check('homepage: source-backed footprint module is visible', page.locator('#footprints').is_visible())
    check('homepage: latest national sixth record is displayed', '全国第六' in page.locator('#footprints').inner_text())
    check('homepage: footprint photography stays same-origin', page.locator('#footprints img[data-official-image]').evaluate_all("ims => ims.every(i => new URL(i.src).origin === location.origin)"))
    check('homepage: association copy links to supplied official account article', page.locator('.about-source-note a').get_attribute('href') == 'https://mp.weixin.qq.com/s/rFnYKMVPCkgz5MUhlAGItQ')
    check('homepage: navigation now includes run-club archive', page.locator('#main-nav a').count() == 8 and page.locator('#main-nav a').nth(2).inner_text() == '跑团足迹')
    page.screenshot(path=str(output/'official-home-top.png'))

    page.goto(url + 'club.html', wait_until='networkidle')
    wait_official_images(page)
    check('archive: direct static route has correct title', page.locator('h1').inner_text().startswith('从太极运动场'))
    check('archive: all eight supplied records are represented', page.locator('[data-official-post]').count() == 8)
    check('archive: active navigation state is unique', page.locator('#main-nav [aria-current="page"]').count() == 1 and page.locator('#main-nav [aria-current="page"]').inner_text() == '跑团足迹')
    check('archive: each record links to the official WeChat source', page.locator('.club-timeline .official-source').count() == 8 and page.locator('.club-timeline .official-source').evaluate_all("els => els.every(a => a.href.startsWith('https://mp.weixin.qq.com/s/'))"))
    check('archive: official photographs are local and decoded', page.locator('img[data-official-image]').count() >= 7 and page.locator('img[data-official-image]').evaluate_all("ims => ims.every(i => i.naturalWidth > 0 && new URL(i.src).origin === location.origin)"))
    check('archive: historic training warning is explicit', '不代表当前训练时间' in page.locator('#training-history').inner_text())
    check('archive: no current signup deadline or personal contact leaked', '2025.10.27' not in page.locator('main').inner_text() and not page.locator('main').evaluate("el => /1[3-9]\\d{9}/.test(el.innerText)"))
    check('archive: first expedition wording is scoped', '不用于推断协会成立年份' in page.locator('#post-relay-2024').inner_text())
    check('archive: volunteer count is scoped to the university', '并非跑团队员人数' in page.locator('#post-cqmarathon-2025').inner_text())
    page.locator('[data-club-year="2025"]').click()
    check('archive filter: 2025 shows four source records', page.locator('[data-official-post]:visible').count() == 4)
    check('archive filter: live status updates', '4' in page.locator('#club-filter-status').inner_text())
    page.locator('[data-club-year="2024"]').click()
    check('archive filter: 2024 shows three source records', page.locator('[data-official-post]:visible').count() == 3)
    page.locator('[data-club-year="all"]').click()
    check('archive filter: all restores eight records', page.locator('[data-official-post]:visible').count() == 8)
    page.screenshot(path=str(output/'official-club-desktop.png'), full_page=True)
    page.screenshot(path=str(output/'official-club-top.png'))
    for width in [320, 390, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        check(f'archive: {width}px no horizontal page overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    page.set_viewport_size({'width':390,'height':844})
    page.screenshot(path=str(output/'official-club-mobile.png'), full_page=True)
    page.screenshot(path=str(output/'official-club-mobile-top.png'))
    page.locator('.menu-toggle').click()
    check('archive mobile: all eight navigation destinations are reachable', page.locator('#main-nav a:visible').count() == 8)
    page.keyboard.press('Escape')
    check('archive mobile: Escape closes the navigation', page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false')

    page.goto(url + 'science/training.html', wait_until='networkidle')
    check('science training: historical club structure is cross-referenced', page.locator('.club-training-archive').is_visible())
    training_text = page.locator('.club-training-archive').inner_text()
    check('science training: historical dates are not presented as current', '不是当前课表' in training_text and '2025' in training_text)
    check('science training: interval threshold strength and long run are contextualized', all(term in training_text for term in ['间歇', '阈值', '力量', '长距离']))

    page.goto(url + 'sources.html', wait_until='networkidle')
    wait_official_images(page)
    check('sources: all eight official-account articles are listed', page.locator('#official-wechat .official-source-list article').count() == 8)
    check('sources: eight selected photographs have rights notes and article links', page.locator('#official-wechat .official-media-source-grid > div').count() == 8 and '未发现开放许可' in page.locator('#official-wechat').inner_text())

    nojs = browser.new_context(java_script_enabled=False, viewport={'width':390,'height':844})
    fallback = nojs.new_page()
    fallback.goto(url + 'club.html', wait_until='domcontentloaded')
    wait_official_images(fallback)
    check('archive no JS: all eight records remain readable', fallback.locator('[data-official-post]').count() == 8 and fallback.locator('[data-official-post]:visible').count() == 8)
    check('archive no JS: filter controls do not become dead UI', not fallback.locator('.club-year-filter').is_visible())
    check('archive no JS: no horizontal overflow', fallback.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    fallback.goto(url, wait_until='domcontentloaded')
    check('homepage no JS: footprint module remains visible', fallback.locator('#footprints').is_visible())
    nojs.close()

    check('official archive: no uncaught JavaScript errors', not errors)
    browser.close()

(output/'official-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} official archive browser checks passed')