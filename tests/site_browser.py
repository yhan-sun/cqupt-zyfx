import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url=os.getenv('SITE_URL','http://127.0.0.1:4173/cqupt-zyfx/')
out=Path('test-results');out.mkdir(exist_ok=True)
checks=[]
def check(name,condition):
    assert condition,name
    checks.append(name)
    print('PASS',name,flush=True)

def wait_images(page,selector='img'):
    loc=page.locator(selector)
    if loc.count():
        loc.evaluate_all("ims=>ims.forEach(i=>i.loading='eager')")
        page.wait_for_function("selector=>[...document.querySelectorAll(selector)].every(i=>i.complete&&i.naturalWidth>0)",arg=selector,timeout=20000)

with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.getenv('CHROMIUM_PATH')
    browser=p.chromium.launch(**options)
    context=browser.new_context(viewport={'width':1440,'height':1000},reduced_motion='reduce',permissions=['clipboard-read','clipboard-write'])
    page=context.new_page();page.set_default_timeout(15000);page.set_default_navigation_timeout(25000)
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))

    page.goto(url,wait_until='networkidle')
    check('home: six-item information architecture',page.locator('#main-nav a').all_inner_texts()==['首页','协会介绍','赛事与足迹','跑步影像','科学跑步','加入我们'])
    check('home: old running-service navigation removed',page.locator('#main-nav').filter(has_text='跑步服务').count()==0)
    check('home: old campus-event standalone navigation removed',page.locator('#main-nav').filter(has_text='校园赛事').count()==0)
    check('home: no running service section remains',page.locator('.service-band,#running,#pace').count()==0)
    check('home: full old gallery removed',page.locator('#gallery .gallery-grid').count()==0)
    check('home: compact running gallery teaser exists',page.locator('.running-gallery-teaser').is_visible() and page.locator('.running-gallery-teaser-grid>a').count()==4)
    check('home: merged event and footprint module remains',page.locator('#footprints').is_visible() and '校园赛事档案' in page.locator('#footprints').inner_text())
    check('home: three campus marathon links live inside merged module',page.locator('.merged-home-events>div:last-child>a').count()==3)
    check('home: four quick destinations match new structure',page.locator('.structure-quick-links>a').count()==4)
    check('home: join QR and group remain available','468686951' in page.locator('.home-join-band').inner_text() and page.locator('.home-join-band img[data-join-qr]').count()==1)
    wait_images(page,'.running-gallery-teaser img,.home-join-band img[data-join-qr],#footprints img')
    check('home: no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    page.screenshot(path=str(out/'structure-home.png'),full_page=True)
    page.screenshot(path=str(out/'structure-home-top.png'))

    page.goto(url+'club.html',wait_until='networkidle')
    wait_images(page,'img[data-official-image],.merged-campus-events img')
    check('events: single page combines footprints and campus events',page.locator('[data-official-post]').count()==8 and page.locator('.merged-campus-events .merged-event-card').count()==3)
    check('events: breadcrumb uses merged label','赛事与足迹' in page.locator('.breadcrumbs').inner_text())
    check('events: navigation marks one merged destination',page.locator('#main-nav [aria-current="page"]').count()==1 and page.locator('#main-nav [aria-current="page"]').inner_text()=='赛事与足迹')
    check('events: all eight official sources preserved',page.locator('.club-timeline .official-source').count()==8)
    check('events: campus event cards link to three static articles',page.locator('.merged-campus-events a[href^="news/"][href$=".html"]').count()>=3)
    check('events: campus/running archive distinction remains explicit','赛事并不等同于跑团主办活动' in page.locator('.merged-campus-events').inner_text())
    check('events: historic training still marked non-current','不代表当前训练时间' in page.locator('#training-history').inner_text())
    page.locator('[data-club-year="2025"]').click()
    check('events: year filter still works',page.locator('[data-official-post]:visible').count()==4)
    page.locator('[data-club-year="all"]').click()
    check('events: all footprint records restore',page.locator('[data-official-post]:visible').count()==8)
    page.screenshot(path=str(out/'events-footprints.png'),full_page=True)
    page.screenshot(path=str(out/'events-footprints-top.png'))

    page.goto(url+'news.html',wait_until='networkidle')
    check('legacy events route: explains merge','已并入「赛事与足迹」' in page.locator('h1').inner_text())
    check('legacy events route: preserves three article links',page.locator('.merged-event-card').count()==3)
    check('legacy events route: no duplicate nav destination',page.locator('#main-nav a').count()==6)
    page.goto(url+'news/marathon-2025.html',wait_until='networkidle')
    check('article: old direct URL remains readable',page.locator('.article-body').is_visible() and page.locator('.article-photo img').evaluate('i=>i.naturalWidth>0'))
    check('article: merged nav is active',page.locator('#main-nav [aria-current="page"]').inner_text()=='赛事与足迹')

    page.goto(url+'gallery.html',wait_until='networkidle')
    wait_images(page,'[data-gallery-page-item] img')
    check('gallery: standalone route has fourteen running photos',page.locator('[data-gallery-page-item]').count()==14)
    check('gallery: eight official-account photos and six campus-event photos',page.locator('[data-gallery-page-item][data-category="club"],[data-gallery-page-item][data-category="training"]').count()==8 and page.locator('[data-gallery-page-item][data-category="campus"]').count()==6)
    check('gallery: navigation marks running imagery',page.locator('#main-nav [aria-current="page"]').inner_text()=='跑步影像')
    check('gallery: all photos load same-origin',page.locator('[data-gallery-page-item] img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    check('gallery: source and rights note visible','版权归原权利人' in page.locator('.running-gallery-rights').inner_text())
    page.locator('[data-gallery-page-filter="training"]').click()
    check('gallery: training filter shows two images',page.locator('[data-gallery-page-item]:visible').count()==2)
    page.locator('[data-gallery-page-filter="campus"]').click()
    check('gallery: campus-event filter shows six images',page.locator('[data-gallery-page-item]:visible').count()==6)
    trigger=page.locator('[data-gallery-page-item]:visible [data-gallery-photo]').first
    trigger.click()
    check('gallery: lightbox opens',page.locator('#running-gallery-dialog').is_visible())
    old=page.locator('#running-gallery-dialog-title').inner_text();page.keyboard.press('ArrowRight')
    check('gallery: keyboard next works',page.locator('#running-gallery-dialog-title').inner_text()!=old)
    page.keyboard.press('Escape')
    check('gallery: Escape closes and restores focus',not page.locator('#running-gallery-dialog').is_visible() and trigger.evaluate('el=>el===document.activeElement'))
    page.locator('[data-gallery-page-filter="all"]').click()
    check('gallery: reset shows all fourteen',page.locator('[data-gallery-page-item]:visible').count()==14)
    page.screenshot(path=str(out/'running-gallery.png'),full_page=True)
    page.screenshot(path=str(out/'running-gallery-top.png'))

    page.goto(url+'science.html',wait_until='networkidle')
    check('science: core content remains intact',page.locator('.sc-chapter').count()==6 and page.locator('[data-resource]').count()==30)
    check('science: simplified nav visible',page.locator('#main-nav a').count()==6 and page.locator('#main-nav [aria-current="page"]').inner_text()=='科学跑步')
    search=page.locator('#science-search');search.fill('FARTLEK')
    check('science: search still resolves Fartlek',page.locator('[data-resource]:visible').count()>=1)
    page.goto(url+'science/strength.html',wait_until='networkidle')
    check('science: movement library survives',page.locator('.sc-exercise').count()==10)
    first=page.locator('[data-motion]').first
    first.click();check('science: GIF remains click-to-play',first.get_attribute('aria-pressed')=='true')
    first.click()

    page.goto(url+'join.html',wait_until='networkidle')
    check('join: verified QQ path remains',page.get_by_text('468686951',exact=True).count()>=3 and page.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)
    check('join: page uses simplified navigation',page.locator('#main-nav a').count()==6 and page.locator('#main-nav [aria-current="page"]').inner_text()=='加入我们')
    check('join: old running-service link is gone',page.locator('a[href$="#running"]').count()==0 and '看跑步影像' in page.locator('.join-fit-grid').inner_text())
    check('join: QR stays local',page.locator('img[data-join-qr]').first.evaluate('i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0'))

    for path in ['', 'club.html','gallery.html','science.html','join.html']:
        page.goto(url+path,wait_until='networkidle')
        for width in [320,390,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            check(f'{path or "home"}: {width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.set_viewport_size({'width':390,'height':844})
        page.locator('.menu-toggle').click()
        check(f'{path or "home"}: mobile menu exposes six entries',page.locator('#main-nav a:visible').count()==6)
        page.keyboard.press('Escape')
        check(f'{path or "home"}: Escape closes mobile menu',page.locator('.menu-toggle').get_attribute('aria-expanded')=='false')
    page.goto(url+'gallery.html',wait_until='networkidle');page.set_viewport_size({'width':390,'height':844});wait_images(page,'[data-gallery-page-item] img')
    page.screenshot(path=str(out/'running-gallery-mobile.png'),full_page=True);page.screenshot(path=str(out/'running-gallery-mobile-top.png'))

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    fallback=nojs.new_page();fallback.set_default_timeout(15000)
    fallback.goto(url+'gallery.html',wait_until='domcontentloaded');wait_images(fallback,'[data-gallery-page-item] img')
    check('no JS: all gallery photos and source links remain readable',fallback.locator('[data-gallery-page-item]:visible').count()==14 and fallback.locator('[data-gallery-photo]').count()==14)
    check('no JS: gallery filter controls stay hidden',fallback.locator('[data-gallery-page-filter]:visible').count()==0)
    fallback.goto(url+'club.html',wait_until='domcontentloaded')
    check('no JS: footprints and campus events both remain',fallback.locator('[data-official-post]:visible').count()==8 and fallback.locator('.merged-event-card').count()==3)
    fallback.goto(url+'science.html',wait_until='domcontentloaded')
    check('no JS: science remains readable',fallback.locator('.sc-chapter').count()==6)
    fallback.goto(url+'join.html',wait_until='domcontentloaded')
    check('no JS: join QR and direct QQ link remain',fallback.locator('img[data-join-qr]').count()>=1 and fallback.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)
    check('site: no uncaught JavaScript errors',not errors)
    nojs.close();context.close();browser.close()

(out/'site-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} site browser checks passed',flush=True)
