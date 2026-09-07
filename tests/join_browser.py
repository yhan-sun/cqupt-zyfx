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
    print('PASS', name, flush=True)

def wait_qr(page, scope):
    image = page.locator(scope)
    image.scroll_into_view_if_needed(timeout=10000)
    page.wait_for_function("selector => { const img=document.querySelector(selector); return !!img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0; }", arg=scope, timeout=15000)
    return image

with sync_playwright() as p:
    options = {'headless': True, 'args': ['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):
        options['executable_path'] = os.getenv('CHROMIUM_PATH')
    browser = p.chromium.launch(**options)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, permissions=['clipboard-read','clipboard-write'])
    page = context.new_page()
    page.set_default_timeout(15000)
    page.set_default_navigation_timeout(20000)
    errors = []
    requests = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('request', lambda request: requests.append(request.url))

    page.goto(url, wait_until='networkidle')
    check('join home: participation section replaces generic contact panel', page.locator('.home-join-band').count() == 1 and page.locator('.join-section').count() == 0)
    check('join home: supplied purpose and group number are visible', '为重邮学子搭建的跑步交流平台' in page.locator('.home-join-band').inner_text() and '468686951' in page.locator('.home-join-band').inner_text())
    check('join home: four concrete participation modes are present', page.locator('.home-join-band .join-activity').count() == 4)
    check('join home: current timing boundary is explicit', '当期通知' in page.locator('.home-join-band').inner_text())
    qr = wait_qr(page, '.home-join-band img[data-join-qr]')
    check('join home: QR is local and decoded', qr.evaluate("img=>img.naturalWidth>0 && new URL(img.src).origin===location.origin && img.src.endsWith('/assets/join-qq.svg')"))
    check('join home: no remote runtime QR image request', not any('join-qq' in req and not req.startswith(url) for req in requests))
    check('join home: standalone join page is linked', page.locator('a[href="join.html"]').count() >= 3)
    check('join home: direct QQ invitation link is available', page.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count() >= 2)
    page.locator('.home-join-band [data-copy-group]').first.click()
    page.wait_for_function("document.querySelector('.home-join-band .join-copy-status').textContent.includes('468686951')", timeout=10000)
    check('join home: copy action confirms the exact QQ group', '468686951' in page.locator('.home-join-band .join-copy-status').first.inner_text())

    page.goto(url + 'join.html', wait_until='networkidle')
    check('join page: direct static route renders', page.locator('h1').is_visible() and '一起跑' in page.locator('h1').inner_text())
    check('join page: navigation marks join only once', page.locator('#main-nav [aria-current="page"]').count() == 1 and page.locator('#main-nav [aria-current="page"]').inner_text() == '加入我们')
    check('join page: club archive navigation remains available', page.locator('#main-nav a').filter(has_text='跑团足迹').count() == 1)
    check('join page: group number has multiple text fallbacks', page.get_by_text('468686951', exact=True).count() >= 3)
    check('join page: direct QQ invitation is exposed without a fake form', page.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count() >= 3 and page.locator('form').count() == 0)
    check('join page: four activity descriptions render', page.locator('.join-activity-grid .join-activity').count() == 4)
    check('join page: three-step participation path renders', page.locator('.join-steps-grid li').count() == 3)
    check('join page: four participation-stage entries render', page.locator('.join-fit-grid>div').count() == 4)
    check('join page: five FAQs render', page.locator('.join-faq details').count() == 5)
    check('join page: old recruitment deadline is absent', '2025.10.27' not in page.locator('main').inner_text())
    check('join page: fixed historic training times are not presented', '周一18:00' not in page.locator('main').inner_text())
    check('join page: current activity wording remains non-scheduled', '不定期' in page.locator('main').inner_text() and '当期通知' in page.locator('main').inner_text())
    qr = wait_qr(page, '.join-hero img[data-join-qr]')
    check('join page: regenerated SVG QR renders at full intrinsic size', qr.evaluate('img=>img.complete&&img.naturalWidth===560&&img.naturalHeight===560'))
    copy_button = page.locator('.join-hero [data-copy-group]')
    check('join page: clipboard interaction is keyboard-focusable', copy_button.evaluate('(el)=>el.tagName==="BUTTON"'))
    copy_button.click()
    page.wait_for_function("document.querySelector('.join-hero .join-copy-status').textContent.includes('468686951')", timeout=10000)
    check('join page: exact copied number is acknowledged', '468686951' in page.locator('.join-hero .join-copy-status').inner_text())
    check('join page: mobile dock is intentionally absent on destination page', page.locator('.mobile-join-dock').count() == 0)

    for width in [320, 390, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        check(f'join page: {width}px has no horizontal overflow', page.evaluate('document.documentElement.scrollWidth<=innerWidth'))

    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(output / 'join-mobile-top.png'))
    page.screenshot(path=str(output / 'join-mobile.png'), full_page=True)
    page.goto(url, wait_until='networkidle')
    check('join mobile: compact participation dock is visible on home', page.locator('.mobile-join-dock').is_visible() and '468686951' in page.locator('.mobile-join-dock').inner_text())
    page.screenshot(path=str(output / 'join-home-mobile.png'), full_page=True)
    page.set_viewport_size({'width': 1440, 'height': 1000})
    page.goto(url + 'join.html', wait_until='networkidle')
    page.screenshot(path=str(output / 'join-desktop-top.png'))
    page.screenshot(path=str(output / 'join-desktop.png'), full_page=True)

    page.goto(url + 'sources.html', wait_until='networkidle')
    check('join sources: supplied group information has a provenance section', page.locator('#join-source').count() == 1 and '跑团提供' in page.locator('#join-source').inner_text())
    check('join sources: decoded QQ invitation is documented', page.locator('#join-source a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count() == 1)
    check('join sources: old and current recruitment paths are explicitly separated', '历史公众号招新资料分开维护' in page.locator('#join-source').inner_text())

    nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    fallback = nojs.new_page()
    fallback.set_default_timeout(15000)
    fallback.set_default_navigation_timeout(20000)
    fallback.goto(url + 'join.html', wait_until='domcontentloaded')
    image = fallback.locator('img[data-join-qr]')
    image.scroll_into_view_if_needed(timeout=10000)
    fallback.wait_for_function("() => { const img=document.querySelector('img[data-join-qr]'); return !!img && img.complete && img.naturalWidth > 0; }", timeout=15000)
    check('join no JS: QR and group number remain readable', image.is_visible() and '468686951' in fallback.locator('main').inner_text())
    check('join no JS: direct QQ invitation remains usable', fallback.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count() >= 3)
    check('join no JS: dead copy buttons stay hidden', fallback.locator('[data-copy-group]:visible').count() == 0)
    check('join no JS: all FAQs remain native details elements', fallback.locator('.join-faq details').count() == 5)
    check('join: no uncaught JavaScript errors', not errors)
    nojs.close()
    browser.close()

(output / 'join-browser-checks.json').write_text(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False, indent=2))
print(f'{len(checks)} join browser checks passed')
