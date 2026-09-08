import os
from playwright.sync_api import sync_playwright
url=os.getenv('SITE_URL','http://127.0.0.1:4173/cqupt-zyfx/')
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name);print('PASS',name,flush=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    page.goto(url+'about.html',wait_until='networkidle')
    check('about: standalone page and active navigation',page.locator('h1').inner_text().startswith('从跑完一圈') and page.locator('#main-nav [aria-current]').inner_text()=='协会介绍')
    check('about: chairman statement is attributed', '胡钢' in page.locator('.association-quote').inner_text() and '2025级' in page.locator('.association-quote').inner_text())
    check('about: supplied association photographs load',page.locator('img[src*="assets/association/"]').count()>=3 and page.locator('img[src*="assets/association/"]').evaluate_all("ims=>ims.every(i=>i.complete&&i.naturalWidth>0)"))
    check('about: activity model has four concrete entries',page.locator('.association-value-grid article').count()==4)
    check('about: attachment archive acknowledges all supplied scenes', '长嘉汇奖牌合照' in page.locator('.association-archive-note').inner_text())
    page.locator('.association-hero-photo img').first.click()
    check('about: supplied photograph opens global lightbox',page.locator('.motion-lightbox[open]').count()==1)
    page.keyboard.press('Escape')
    page.goto(url,wait_until='networkidle')
    check('home: association teaser links to standalone page',page.locator('a[href="about.html"]').count()>=2 and page.locator('.association-home').count()==1)
    check('home: old generic gate-based about copy is replaced',page.locator('.about-band').count()==0)
    page.goto(url+'club.html',wait_until='networkidle')
    check('club: association supplied photo strip is integrated',page.locator('.association-club-strip img').count()==2)
    page.goto(url+'gallery.html',wait_until='networkidle')
    check('gallery: association filter exists',page.locator('[data-gallery-page-filter="association"]').count()==1)
    page.locator('[data-gallery-page-filter="association"]').click()
    check('gallery: association filter reveals three supplied photos',page.locator('[data-gallery-page-item]:visible').count()==3)
    page.locator('[data-gallery-page-item]:visible').first.locator('[data-gallery-photo]').click()
    check('gallery: supplied photo opens dedicated viewer',page.locator('.running-gallery-dialog[open]').count()==1)
    page.keyboard.press('Escape')
    for width in [320,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900});page.goto(url+'about.html',wait_until='networkidle')
        check(f'about: {width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    fallback=nojs.new_page();fallback.goto(url+'about.html',wait_until='domcontentloaded')
    check('about no JS: statement and photographs remain readable',fallback.locator('.association-quote').is_visible() and fallback.locator('img[src*="assets/association/"]').count()>=3)
    nojs.close();browser.close()
print(f'{len(checks)} association browser checks passed',flush=True)
