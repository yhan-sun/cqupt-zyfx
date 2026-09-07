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

with sync_playwright() as p:
    executable = os.getenv('CHROMIUM_PATH')
    options = {'headless': True, 'args': ['--no-sandbox']}
    if executable:
        options['executable_path'] = executable
    browser = p.chromium.launch(**options)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(url, wait_until='domcontentloaded')
    page.wait_for_function("document.documentElement.classList.contains('js')")
    check('desktop: main title is visible', page.locator('h1').is_visible())
    check('desktop: navigation visible without menu toggle', page.locator('#main-nav').is_visible() and not page.locator('.menu-toggle').is_visible())
    check('desktop: no horizontal overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    page.locator('[data-route="campus"]').click()
    check('route selection changes content and accessible state', page.locator('#route-title').inner_text() == '校园里的慢跑' and page.locator('[data-route="campus"]').get_attribute('aria-pressed') == 'true')
    page.locator('[data-route="track"]').click()
    page.locator('[data-filter="club"]').click()
    check('club filter leaves exactly one story', page.locator('.story:visible').count() == 1)
    page.locator('[data-filter="campus"]').click()
    check('campus filter leaves two stories', page.locator('.story:visible').count() == 2)
    page.locator('[data-filter="all"]').click()
    trigger = page.locator('[data-story="campus-2026"]').first
    trigger.click()
    check('article opens a native modal with sourced copy', page.locator('#story-dialog').is_visible() and len(page.locator('#dialog-body p').all()) > 0)
    page.keyboard.press('Escape')
    check('Escape closes modal and restores focus', not page.locator('#story-dialog').is_visible() and trigger.evaluate('(el) => el === document.activeElement'))
    page.locator('#pace-form button[type="submit"]').click()
    check('calculator: 5 km at 6:00 yields 00:30:00', page.locator('#pace-output').inner_text() == '00:30:00')
    page.locator('#distance').select_option('21.0975')
    page.locator('#pace-form button[type="submit"]').click()
    check('calculator: half marathon handles decimal distance', page.locator('#pace-output').inner_text() == '02:06:35')
    page.locator('#pace-sec').fill('60')
    page.locator('#pace-form button[type="submit"]').click()
    check('calculator: invalid seconds show inline error', page.locator('#pace-error').is_visible() and page.locator('#pace-output').inner_text() == '—')
    page.locator('#pace-sec').fill('')
    page.locator('#pace-form button[type="submit"]').click()
    check('calculator: empty input does not silently become zero', page.locator('#pace-error').is_visible())
    page.locator('#pace-sec').fill('0')
    page.locator('#distance').select_option('5')
    page.locator('#pace-form button[type="submit"]').click()
    check('join button never pretends an unverified signup is live', page.locator('#join-button').get_attribute('href') == '#join-details')
    page.locator('[data-copy]').click()
    page.wait_for_function("document.querySelector('#copy-status').textContent.length > 0")
    check('copy control reports success or a manual fallback', bool(page.locator('#copy-status').inner_text()))
    if os.getenv('REQUIRE_LOCAL_MEDIA') == '1':
        for image in page.locator('img[data-media]').all():
            image.scroll_into_view_if_needed()
            image.evaluate('(img) => img.decode()')
            check('local photo decodes: ' + image.get_attribute('data-media'), image.evaluate('(img) => img.complete && img.naturalWidth > 0 && new URL(img.src).origin === location.origin'))
    page.evaluate('window.scrollTo(0, 0)')
    page.screenshot(path=str(output / 'desktop.png'), full_page=True)
    check('desktop: no uncaught JavaScript errors', not errors)
    for width in [320, 390, 768]:
        page.set_viewport_size({'width': width, 'height': 844})
        page.evaluate('window.scrollTo(0, 0)')
        check(f'{width}px: no horizontal overflow', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        if width < 621:
            toggle = page.locator('.menu-toggle')
            check(f'{width}px: mobile menu starts collapsed', toggle.is_visible() and not page.locator('#main-nav').is_visible())
            toggle.click()
            check(f'{width}px: mobile menu opens', page.locator('#main-nav').is_visible())
            page.keyboard.press('Escape')
            check(f'{width}px: Escape collapses mobile menu', toggle.get_attribute('aria-expanded') == 'false')
        if width == 390:
            page.screenshot(path=str(output / 'mobile.png'), full_page=True)
    page.goto(url + 'sources.html', wait_until='domcontentloaded')
    check('source and image permissions page is available', page.locator('h1').is_visible())
    nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    fallback = nojs.new_page()
    fallback.goto(url, wait_until='domcontentloaded')
    check('without JavaScript: content and navigation remain accessible', fallback.locator('h1').is_visible() and fallback.locator('#main-nav').is_visible() and fallback.locator('.story').count() == 3)
    check('without JavaScript: no horizontal overflow', fallback.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    browser.close()

(output / 'browser-checks.json').write_text(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False, indent=2))
print(f'{len(checks)} browser checks passed')
