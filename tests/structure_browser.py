import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url=os.getenv('SITE_URL','http://127.0.0.1:4173/cqupt-zyfx/')
out=Path('test-results');out.mkdir(exist_ok=True)
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name);print('PASS',name,flush=True)
def wait_images(page,selector):
    loc=page.locator(selector)
    if loc.count():
        loc.evaluate_all("ims=>ims.forEach(i=>i.loading='eager')")
        page.wait_for_function("s=>[...document.querySelectorAll(s)].every(i=>i.complete&&i.naturalWidth>0)",arg=selector,timeout=20000)

with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.getenv('CHROMIUM_PATH')
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))

    page.goto(url,wait_until='networkidle')
    check('home: navigation simplified to six destinations',page.locator('#main-nav a').all_inner_texts()==['首页','协会介绍','赛事与足迹','跑步影像','科学跑步','加入我们'])
    check('home: running service is removed',page.locator('.service-band,#running,#pace').count()==0 and '跑步服务' not in page.locator('#main-nav').inner_text())
    check('home: old full gallery is removed',page.locator('#gallery .gallery-grid').count()==0)
    check('home: running photo teaser has four real images',page.locator('.running-gallery-teaser-grid>a').count()==4)
    check('home: footprints and campus-event archive share one module',page.locator('#footprints').count()==1 and page.locator('.merged-home-events a').count()>=4)
    check('home: four quick links follow new structure',page.locator('.structure-quick-links>a').count()==4)
    check('home: verified join path survives','468686951' in page.locator('.home-join-band').inner_text())
    wait_images(page,'.running-gallery-teaser img,#footprints img,.home-join-band img[data-join-qr]')
    check('home: local images load',page.locator('.running-gallery-teaser img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    page.screenshot(path=str(out/'structure-home.png'),full_page=True);page.screenshot(path=str(out/'structure-home-top.png'))

    page.goto(url+'club.html',wait_until='networkidle');wait_images(page,'img[data-official-image],.merged-campus-events img')
    check('events: eight run-club records remain',page.locator('[data-official-post]').count()==8)
    check('events: three campus marathon archives are merged in',page.locator('.merged-campus-events .merged-event-card').count()==3)
    check('events: merged nav is active once',page.locator('#main-nav [aria-current="page"]').count()==1 and page.locator('#main-nav [aria-current="page"]').inner_text()=='赛事与足迹')
    check('events: page keeps source-backed club records',page.locator('.club-timeline .official-source').count()==8)
    check('events: campus event source boundary is visible','赛事并不等同于跑团主办活动' in page.locator('.merged-campus-events').inner_text())
    check('events: historical training remains non-current','不代表当前训练时间' in page.locator('#training-history').inner_text())
    page.locator('[data-club-year="2025"]').click();check('events: footprint year filter still works',page.locator('[data-official-post]:visible').count()==4)
    page.locator('[data-club-year="all"]').click();check('events: year filter resets',page.locator('[data-official-post]:visible').count()==8)
    page.screenshot(path=str(out/'events-footprints.png'),full_page=True);page.screenshot(path=str(out/'events-footprints-top.png'))

    page.goto(url+'news.html',wait_until='networkidle')
    check('events legacy route: clearly points to merged page','已并入「赛事与足迹」' in page.locator('h1').inner_text())
    check('events legacy route: three direct article cards remain',page.locator('.merged-event-card').count()==3)
    page.goto(url+'news/marathon-2025.html',wait_until='networkidle')
    check('event article: old deep link remains readable',page.locator('.article-body').is_visible() and page.locator('.article-photo img').evaluate('i=>i.naturalWidth>0'))
    check('event article: merged navigation active',page.locator('#main-nav [aria-current="page"]').inner_text()=='赛事与足迹')

    page.goto(url+'gallery.html',wait_until='networkidle');wait_images(page,'[data-gallery-page-item] img')
    check('gallery: standalone page contains fourteen photos',page.locator('[data-gallery-page-item]').count()==14)
    check('gallery: eight公众号 photos included',page.locator('[data-gallery-page-item][data-category="club"],[data-gallery-page-item][data-category="training"]').count()==8)
    check('gallery: six campus-event photos included',page.locator('[data-gallery-page-item][data-category="campus"]').count()==6)
    check('gallery: every photo has an introduction',page.locator('.running-gallery-card>div>p:not(:first-child)').count()==14)
    check('gallery: every photo has an original source link',page.locator('.running-gallery-card>div>a').count()==14)
    check('gallery: all images are served locally',page.locator('[data-gallery-page-item] img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    check('gallery: rights note remains explicit','版权归原权利人' in page.locator('.running-gallery-rights').inner_text())
    check('gallery: nav active state is correct',page.locator('#main-nav [aria-current="page"]').inner_text()=='跑步影像')
    page.screenshot(path=str(out/'running-gallery.png'),full_page=True);page.screenshot(path=str(out/'running-gallery-top.png'))

    page.goto(url+'science.html',wait_until='networkidle')
    check('science: six knowledge chapters remain',page.locator('.sc-chapter').count()==6)
    check('science: search index remains',page.locator('[data-resource]').count()==30)
    check('science: new navigation active',page.locator('#main-nav [aria-current="page"]').inner_text()=='科学跑步' and page.locator('#main-nav a').count()==6)
    page.goto(url+'science/strength.html',wait_until='networkidle');check('science: ten strength/movement cards remain',page.locator('.sc-exercise').count()==10)

    page.goto(url+'join.html',wait_until='networkidle')
    check('join: verified QQ number remains',page.get_by_text('468686951',exact=True).count()>=3)
    check('join: direct QQ invitation remains',page.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)
    check('join: running-service link replaced with gallery','看跑步影像' in page.locator('.join-fit-grid').inner_text() and page.locator('a[href$="#running"]').count()==0)
    wait_images(page,'img[data-join-qr]');check('join: QR remains local',page.locator('img[data-join-qr]').first.evaluate('i=>new URL(i.src).origin===location.origin'))

    for route in ['', 'club.html','gallery.html','science.html','join.html']:
        page.goto(url+route,wait_until='networkidle')
        for width in [320,390,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            check(f'{route or "home"}: {width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.set_viewport_size({'width':390,'height':844});page.locator('.menu-toggle').click()
        check(f'{route or "home"}: mobile menu has six items',page.locator('#main-nav a:visible').count()==6)
        page.keyboard.press('Escape');check(f'{route or "home"}: Escape closes menu',page.locator('.menu-toggle').get_attribute('aria-expanded')=='false')
    page.goto(url+'gallery.html',wait_until='networkidle');page.set_viewport_size({'width':390,'height':844});wait_images(page,'[data-gallery-page-item] img')
    page.screenshot(path=str(out/'running-gallery-mobile.png'),full_page=True);page.screenshot(path=str(out/'running-gallery-mobile-top.png'))

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});fallback=nojs.new_page()
    fallback.goto(url+'gallery.html',wait_until='domcontentloaded');wait_images(fallback,'[data-gallery-page-item] img')
    check('no JS: all fourteen photos remain readable',fallback.locator('[data-gallery-page-item]:visible').count()==14)
    check('no JS: each photo keeps a native source link',fallback.locator('[data-gallery-page-item] a[href^="https://"]').count()>=14)
    fallback.goto(url+'club.html',wait_until='domcontentloaded');check('no JS: merged archive remains readable',fallback.locator('[data-official-post]:visible').count()==8 and fallback.locator('.merged-event-card').count()==3)
    fallback.goto(url+'join.html',wait_until='domcontentloaded');check('no JS: join path remains usable',fallback.locator('img[data-join-qr]').count()>=1 and fallback.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)
    check('site: no uncaught JavaScript errors',not errors)
    nojs.close();browser.close()

(out/'structure-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} structure browser checks passed',flush=True)
