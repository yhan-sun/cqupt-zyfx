import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url=os.getenv('SITE_URL','http://127.0.0.1:4173/cqupt-zyfx/')
out=Path('test-results');out.mkdir(exist_ok=True)
checks=[]
def check(name,value):
    assert value,name
    checks.append(name);print('PASS',name,flush=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(url+'about.html',wait_until='networkidle')
    check('about: association is now a standalone active nav destination',page.locator('#main-nav a[aria-current="page"]').inner_text()=='协会介绍')
    check('about: president story is attributed',page.locator('.association-story-copy').inner_text().find('胡钢')>=0 and page.locator('.association-story-copy').inner_text().find('个人跑步经历')>=0)
    check('about: all nine supplied photos are present',page.locator('img[data-association-image]').count()==9)
    check('about: school athletics result remains school-scoped',page.locator('.association-school-band').inner_text().find('不等同于跑步爱好者协会战绩')>=0)
    check('about: official result values are rendered',page.locator('.association-school-facts').inner_text().find('85分')>=0 and page.locator('.association-school-facts').inner_text().find('50.5分')>=0)
    check('about: official education source remains external HTTPS',page.locator('.association-school-grid a[href^="https://jw.cq.gov.cn/"]').count()==1)
    page.locator('.association-hero-photo img').click()
    check('about: supplied photo opens global lightbox',page.locator('.motion-lightbox[open]').count()==1)
    page.keyboard.press('Escape')
    page.screenshot(path=str(out/'association-about-desktop.png'),full_page=True)

    page.goto(url,wait_until='networkidle')
    check('home: compact association teaser links to standalone page',page.locator('.association-home-about a[href="about.html"]').count()==1)
    check('home: association nav no longer targets homepage anchor',page.locator('#main-nav a',has_text='协会介绍').get_attribute('href')=='about.html')

    page.goto(url+'club.html',wait_until='networkidle')
    check('events: association-provided supplement exists',page.locator('.association-club-supplement').count()==1)
    check('events: school-level wording remains explicit',page.locator('.association-club-supplement').inner_text().find('不等同于协会战绩')>=0)

    page.goto(url+'gallery.html',wait_until='networkidle')
    check('gallery: archive expands to thirty-five photos',page.locator('[data-gallery-page-item]').count()==35)
    check('gallery: nine association supplied entries are first-class gallery cards',page.locator('[data-gallery-page-item][data-category="association"]').count()==9)
    page.locator('[data-gallery-page-filter="association"]').click()
    check('gallery: association filter reveals exactly nine photos',page.locator('[data-gallery-page-item]:visible').count()==9)
    page.locator('[data-gallery-page-item]:visible [data-gallery-photo]').first.click()
    check('gallery: supplied photo uses dedicated viewer',page.locator('.running-gallery-dialog[open]').count()==1)
    page.keyboard.press('Escape')

    for route in ['about.html','club.html','gallery.html','join.html','science.html']:
        page.goto(url+route,wait_until='networkidle')
        for width in [320,390,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            check(f'{route}: {width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.set_viewport_size({'width':390,'height':844});page.goto(url+'about.html',wait_until='networkidle')
    page.screenshot(path=str(out/'association-about-mobile.png'),full_page=True)

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    fallback=nojs.new_page();fallback.goto(url+'about.html',wait_until='domcontentloaded')
    check('about no-JS: profile and nine photos remain readable',fallback.locator('img[data-association-image]').count()==9 and fallback.locator('.association-story-copy').is_visible())
    fallback.goto(url+'gallery.html',wait_until='domcontentloaded')
    check('gallery no-JS: all thirty-five entries remain readable',fallback.locator('[data-gallery-page-item]').count()==35)
    check('association: no uncaught JavaScript errors',not errors)
    nojs.close();browser.close()

(out/'association-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} association browser checks passed',flush=True)
