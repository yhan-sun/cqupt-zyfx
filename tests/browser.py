import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base = os.getenv('SITE_URL', 'http://127.0.0.1:4173/cqupt-zyfx/')
output = Path(os.getenv('TEST_OUTPUT', 'test-results'))
output.mkdir(parents=True, exist_ok=True)
preview_path = os.getenv('PREVIEW_PAGES')
preview = json.loads(Path(preview_path).read_text()) if preview_path else None
checks = []
errors = []


def check(name, condition):
    assert condition, name
    checks.append(name)
    print('PASS', name, flush=True)


def navigate(page, route):
    if preview is not None:
        page.goto('about:blank')
        page.set_content(preview[route], wait_until='load')
    else:
        page.goto(base + route, wait_until='networkidle')
    page.wait_for_function("document.documentElement.classList.contains('js')")


def images_ready(page):
    page.locator('img[src]').evaluate_all("images => images.forEach(image => image.loading = 'eager')")
    page.wait_for_function("[...document.querySelectorAll('img[src]')].every(image => image.complete && image.naturalWidth > 0)", timeout=25000)


with sync_playwright() as p:
    options = {'headless': True, 'args': ['--no-sandbox']}
    if os.getenv('BROWSER_PATH'):
        options['executable_path'] = os.environ['BROWSER_PATH']
    browser = p.chromium.launch(**options)
    context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))
    routes = sorted(path.relative_to(Path('dist')).as_posix() for path in Path('dist').rglob('*.html'))

    for route in routes:
        navigate(page, route)
        images_ready(page)
        check(f'{route}: one page title and loaded images', page.locator('h1').count() == 1)
        for width in [320, 390, 768, 1024, 1440]:
            page.set_viewport_size({'width': width, 'height': 900})
            check(f'{route}: {width}px layout', page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        if route in ['index.html', 'about.html', 'join.html', 'science.html']:
            page.screenshot(path=str(output / (route.replace('.html', '') + '-desktop.png')), full_page=True)
            page.set_viewport_size({'width': 390, 'height': 844})
            page.screenshot(path=str(output / (route.replace('.html', '') + '-mobile.png')), full_page=True)
        page.set_viewport_size({'width': 1440, 'height': 1000})

    for route in ['index.html', 'about.html', 'club.html', 'gallery.html', 'runners.html', 'science.html', 'join.html']:
        navigate(page, route)
        page.set_viewport_size({'width': 390, 'height': 844})
        check(f'{route}: mobile menu initially closed', page.locator('#main-nav').is_hidden())
        page.locator('.menu-toggle').click()
        check(f'{route}: seven destinations', page.locator('#main-nav a:visible').count() == 7)
        page.keyboard.press('Escape')
        check(f'{route}: Escape closes menu and returns focus', page.locator('#main-nav').is_hidden() and page.locator('.menu-toggle').evaluate('node => node === document.activeElement'))

    page.set_viewport_size({'width': 1440, 'height': 1000})
    navigate(page, 'gallery.html')
    images_ready(page)
    ids = page.locator('[data-gallery-item] [data-photo-view]').evaluate_all('nodes => nodes.map(node => node.dataset.photoView)')
    check('gallery: unique photographs', len(ids) == len(set(ids)))
    for category in ['training', 'race']:
        page.locator(f'[data-gallery-filter="{category}"]').click()
        visible = page.locator('[data-gallery-item]:visible')
        expected = page.locator(f'[data-gallery-item][data-category="{category}"]').count()
        check(f'gallery: {category} respects content categories', visible.count() == expected and visible.evaluate_all(f"nodes => nodes.every(node => node.dataset.category === '{category}')"))
    check('gallery: social filter removed after merge', page.locator('[data-gallery-filter="social"]').count() == 0)
    page.locator('[data-gallery-filter="race"]').click()
    for photo_id in ['2026-qingyuan-social', '2026-qingyuan-selfie', '2025-recruit-group', '2025-qingyuan-social', '2025-cqmarathon-social', 'member-qingyuan-talk-2026', 'member-changjiahui-team-2025']:
        check(f'gallery: race includes merged {photo_id}', page.locator(f'[data-photo-view="{photo_id}"]').is_visible())
    page.locator('[data-gallery-filter="training"]').click()
    for photo_id in ['member-captain-run', 'member-two-runners', '2025-track-training']:
        check(f'gallery: training includes {photo_id}', page.locator(f'[data-photo-view="{photo_id}"]').is_visible())

    filtered_ids = page.locator('[data-gallery-item]:visible [data-photo-view]').evaluate_all('nodes => nodes.map(node => node.dataset.photoView)')
    first = page.locator(f'[data-photo-view="{filtered_ids[0]}"]')
    first.click()
    page.wait_for_function("document.querySelector('#photo-image').naturalWidth > 0 && !document.querySelector('#photo-image').hidden")
    check('viewer: filter order starts at first image', page.locator('#photo-position').inner_text() == f'1 / {len(filtered_ids)}')
    page.keyboard.press('ArrowLeft')
    check('viewer: previous wraps inside filtered photos', page.locator('#photo-position').inner_text() == f'{len(filtered_ids)} / {len(filtered_ids)}')
    page.keyboard.press('Escape')
    check('viewer: Escape closes and restores focus', page.locator('#photo-viewer').is_hidden() and first.evaluate('node => node === document.activeElement'))

    page.locator('[data-gallery-filter="all"]').click()
    for photo_id in ['member-captain-run', 'race-2025']:
        trigger = page.locator(f'[data-photo-view="{photo_id}"]')
        trigger.click()
        expected_index = ids.index(photo_id)
        check(f'viewer: {photo_id} position equals DOM order', page.locator('#photo-position').inner_text() == f'{expected_index + 1} / {len(ids)}')
        page.keyboard.press('ArrowRight')
        next_id = ids[(expected_index + 1) % len(ids)]
        expected_title = page.locator(f'[data-photo-view="{next_id}"]').get_attribute('data-title')
        check(f'viewer: next after {photo_id} follows visible order', page.locator('#photo-title').inner_text() == expected_title)
        page.keyboard.press('Escape')
    page.locator('[data-photo-view="member-two-runners"]').click()
    page.wait_for_function("document.querySelector('#photo-image').naturalWidth > 0 && !document.querySelector('#photo-image').hidden")
    page.screenshot(path=str(output / 'viewer-desktop.png'))
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(output / 'viewer-mobile.png'))
    check('viewer: mobile dialog fits viewport', page.locator('#photo-viewer').evaluate('node => node.getBoundingClientRect().width <= innerWidth'))
    page.locator('#photo-image').evaluate("image => image.src = 'data:image/webp;base64,AA=='")
    page.wait_for_selector('#photo-error:visible')
    check('viewer: failed decode offers original image', page.locator('#photo-original').get_attribute('href') is not None)
    page.keyboard.press('Escape')

    navigate(page, 'join.html')
    page.set_viewport_size({'width': 390, 'height': 844})
    join_link = page.locator('.join-copy a.button')
    check('join: real action visible in mobile first screen', join_link.bounding_box()['y'] + join_link.bounding_box()['height'] < 844)
    check('join: QQ link and number remain consistent', join_link.get_attribute('href') == 'https://qm.qq.com/q/9rKOuWR8Ag' and page.locator('#group-number').inner_text() == '468686951')
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async text => {window.copiedGroup = text}}})")
    page.locator('[data-copy-group]').click()
    page.wait_for_function("window.copiedGroup === '468686951'")
    check('join: successful copy confirmed only after write', '已复制' in page.locator('#copy-status').inner_text())
    page.evaluate("Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: async () => {throw new Error('Denied')}}})")
    page.locator('[data-copy-group]').click()
    page.wait_for_function("document.querySelector('#copy-status').textContent.includes('复制未完成')")
    check('join: denied clipboard has honest fallback', '已复制' not in page.locator('#copy-status').inner_text())

    navigate(page, 'science.html')
    page.set_viewport_size({'width': 1440, 'height': 1000})
    all_resources = page.locator('[data-resource]').count()
    for query in ['法特雷克', 'ＦＡＲＴＬＥＫ']:
        page.locator('#science-search').fill(query)
        check(f'guide: alias {query}', page.locator('[data-resource][href="science/training.html#method-fartlek"]').is_visible())
    page.locator('#science-search').fill('<script>not a resource</script>')
    check('guide: empty search result', page.locator('#science-empty').is_visible() and page.locator('[data-resource]:visible').count() == 0)
    page.locator('[data-clear-search]').click()
    check('guide: clear restores all resources', page.locator('[data-resource]:visible').count() == all_resources)
    page.locator('[data-science-filter="movement"]').click()
    check('guide: movement filter is semantic', page.locator('[data-resource]:visible').evaluate_all("nodes => nodes.every(node => node.dataset.kind === 'movement')"))

    navigate(page, 'science/strength.html')
    check('movements: reduced-motion never autoplays', page.locator('[data-motion][aria-pressed="true"]').count() == 0)
    controls = page.locator('[data-motion]')
    controls.nth(0).click()
    check('movements: explicitly selected action plays', controls.nth(0).get_attribute('aria-pressed') == 'true')
    controls.nth(1).focus()
    page.keyboard.press('Enter')
    check('movements: only one animation plays', page.locator('[data-motion][aria-pressed="true"]').count() == 1 and controls.nth(0).get_attribute('aria-pressed') == 'false')
    page.locator('[data-stop-motion]').click()
    check('movements: stop restores static posters', page.locator('[data-motion][aria-pressed="true"]').count() == 0)
    page.emulate_media(reduced_motion='no-preference')
    controls.nth(0).click()
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_function("document.querySelectorAll('[data-motion][aria-pressed=\"true\"]').length === 0")
    check('movements: preference change stops motion', True)

    navigate(page, 'science/nutrition.html')
    page.locator('#fuel-form button[type="submit"]').click()
    check('nutrition: input units produce 45g and 1.8 packet equivalents', '45' in page.locator('#fuel-output').inner_text() and '1.8' in page.locator('#fuel-output').inner_text())
    page.locator('#fuel-duration').fill('')
    page.locator('#fuel-form button[type="submit"]').click()
    check('nutrition: blank input is not zero', page.locator('#fuel-error').is_visible() and page.locator('#fuel-output').inner_text() == '')

    nojs = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    fallback = nojs.new_page()
    for route in ['index.html', 'about.html', 'club.html', 'gallery.html', 'runners.html', 'join.html', 'science.html', 'science/strength.html', 'science/nutrition.html']:
        if preview is not None:
            fallback.goto('about:blank')
            fallback.set_content(preview[route])
        else:
            fallback.goto(base + route, wait_until='load')
        images_ready(fallback)
        check(f'no JS: {route} navigation and content readable', fallback.locator('h1').is_visible() and fallback.locator('#main-nav a:visible').count() == 7)
        if route == 'runners.html':
            check('no JS: runner profile and records remain readable', fallback.locator('[data-runner-profile="hu-gang"]').is_visible() and '1:20:57' in fallback.locator('#main').inner_text())
        if route == 'gallery.html':
            check('no JS: all photos and original-image links remain', fallback.locator('[data-gallery-item]:visible').count() == len(ids))
            check('no JS: unavailable filters hidden', fallback.locator('[data-gallery-filter]:visible').count() == 0)
        if route == 'science/strength.html':
            check('no JS: movement instructions stay readable', fallback.locator('.sc-exercise ol').count() > 0 and fallback.locator('[data-motion]:visible').count() == 0)
        if route == 'science/nutrition.html':
            check('no JS: carbohydrate formula remains', fallback.locator('.sc-formula').is_visible())
    nojs.close()
    check('no uncaught JavaScript exceptions', not errors)
    context.close()
    browser.close()

(output / 'browser-checks.json').write_text(json.dumps({'mode': 'offline-preview' if preview is not None else 'HTTP', 'passed': len(checks), 'checks': checks, 'errors': errors}, ensure_ascii=False, indent=2))
print(f'{len(checks)} browser checks passed', flush=True)
