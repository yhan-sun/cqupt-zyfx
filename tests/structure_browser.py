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
        page.wait_for_function("s=>[...document.querySelectorAll(s)].every(i=>i.complete&&i.naturalWidth>0)",arg=selector,timeout=25000)

with sync_playwright() as p:
    options={'headless':True,'args':['--no-sandbox']}
    if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.getenv('CHROMIUM_PATH')
    browser=p.chromium.launch(**options)
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))

    page.goto(url,wait_until='networkidle')
    check('home: navigation remains six destinations',page.locator('#main-nav a').all_inner_texts()==['首页','协会介绍','赛事与足迹','跑步影像','科学跑步','加入我们'])
    check('home: old running service remains removed',page.locator('.service-band,#running,#pace').count()==0 and '跑步服务' not in page.locator('#main-nav').inner_text())
    check('home: culture module replaces generic footprint cards',page.locator('#footprints.culture-home').count()==1 and page.locator('.club-footprints-home').count()==0)
    check('home: culture module leads with training, travel and people','一起训练，也一起出发' in page.locator('#footprints').inner_text())
    check('home: culture module exposes three genuine club images',page.locator('#footprints img[data-official-image]').count()==3)
    check('home: official archive count and expanded photo count are visible','8' in page.locator('.culture-home-stats').inner_text() and '20' in page.locator('.culture-home-stats').inner_text())
    check('home: verified join path survives','468686951' in page.locator('.home-join-band').inner_text())
    wait_images(page,'#footprints img,.home-join-band img[data-join-qr]')
    check('home: culture images stay same-origin',page.locator('#footprints img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    page.screenshot(path=str(out/'culture-home.png'),full_page=True);page.screenshot(path=str(out/'culture-home-top.png'))

    page.goto(url+'club.html',wait_until='networkidle');wait_images(page,'img[data-official-image],.culture-campus-card img')
    check('events: hero is culture-led rather than a news archive',page.locator('.culture-hero').is_visible() and '一起训练' in page.locator('.culture-hero h1').inner_text())
    check('events: hero shows training, race and flag photography',page.locator('.culture-hero-photos img').count()==3)
    check('events: three years are distinct story chapters',page.locator('.culture-year').count()==3 and page.locator('.culture-year-rail strong').all_inner_texts()==['2026','2025','2024'])
    check('events: all eight supplied official records remain',page.locator('[data-official-post]').count()==8)
    check('events: each record retains its source link',page.locator('[data-official-post] .official-source').count()==8)
    check('events: twenty official photos are represented across the culture story',page.locator('img[data-official-image]').evaluate_all("ims=>new Set(ims.map(i=>i.dataset.officialImage)).size>=20"))
    check('events: three culture moments frame training, departure and post-race life',page.locator('.culture-moment').count()==3 and all(term in page.locator('.culture-moments').inner_text() for term in ['校园训练','一起出发','赛道之外']))
    check('events: campus marathons remain separated as a home-event archive',page.locator('.culture-campus-card').count()==3 and '不等同于自邮飞翔主办活动' in page.locator('#campus-events').inner_text())
    check('events: historical training is still explicitly non-current','不代表当前训练时间' in page.locator('#training-history').inner_text())
    check('events: merged navigation active once',page.locator('#main-nav [aria-current="page"]').count()==1 and page.locator('#main-nav [aria-current="page"]').inner_text()=='赛事与足迹')
    page.screenshot(path=str(out/'culture-events.png'),full_page=True);page.screenshot(path=str(out/'culture-events-top.png'))

    page.goto(url+'news.html',wait_until='networkidle')
    check('events legacy route: still points to merged archive','已并入「赛事与足迹」' in page.locator('h1').inner_text())
    check('events legacy route: three direct article cards remain',page.locator('.merged-event-card').count()==3)
    page.goto(url+'news/marathon-2025.html',wait_until='networkidle')
    check('event article: old deep link remains readable',page.locator('.article-body').is_visible() and page.locator('.article-photo img').evaluate('i=>i.naturalWidth>0'))

    page.goto(url+'gallery.html',wait_until='networkidle');wait_images(page,'[data-gallery-page-item] img')
    check('gallery: expanded archive has twenty club photos plus six campus photos',page.locator('[data-gallery-page-item]').count()==26)
    check('gallery: twenty self-flying official-account photos come first',page.locator('.culture-gallery-body>.culture-gallery-grid [data-gallery-page-item]').count()==20)
    check('gallery: six campus-event photos remain separately labeled',page.locator('#campus-running [data-gallery-page-item]').count()==6)
    check('gallery: all images are served locally',page.locator('[data-gallery-page-item] img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    check('gallery: rights boundary remains explicit','未发现开放许可' in page.locator('.culture-gallery-rights').inner_text())
    check('gallery: nav active state is correct',page.locator('#main-nav [aria-current="page"]').inner_text()=='跑步影像')
    page.locator('[data-gallery-page-filter="training"]').click()
    check('gallery filter: training reveals five self-flying training photos',page.locator('[data-gallery-page-item]:visible').count()==5)
    page.locator('[data-gallery-page-filter="social"]').click()
    check('gallery filter: social reveals four post-race/community photos',page.locator('[data-gallery-page-item]:visible').count()==4)
    page.locator('[data-gallery-page-filter="all"]').click()
    check('gallery filter: all restores twenty-six photos',page.locator('[data-gallery-page-item]:visible').count()==26)
    trigger=page.locator('[data-gallery-page-item] [data-gallery-photo]').first
    trigger.click();check('gallery: lightbox opens on real photograph',page.locator('#running-gallery-dialog').is_visible() and page.locator('#running-gallery-dialog-image').evaluate('i=>i.naturalWidth>0'))
    first_title=page.locator('#running-gallery-dialog-title').inner_text();page.keyboard.press('ArrowRight')
    check('gallery: keyboard arrow advances photo',page.locator('#running-gallery-dialog-title').inner_text()!=first_title)
    page.keyboard.press('Escape');check('gallery: Escape closes and restores focus',not page.locator('#running-gallery-dialog').is_visible() and trigger.evaluate('el=>el===document.activeElement'))
    page.screenshot(path=str(out/'culture-gallery.png'),full_page=True);page.screenshot(path=str(out/'culture-gallery-top.png'))

    page.goto(url+'sources.html',wait_until='networkidle')
    check('sources: expanded official media ledger contains twenty entries',page.locator('#official-wechat .official-media-source-grid>div').count()==20)
    check('sources: all media still carry explicit non-open-license wording','未发现开放许可' in page.locator('#official-wechat').inner_text())

    page.goto(url+'science.html',wait_until='networkidle')
    check('science: six knowledge chapters remain',page.locator('.sc-chapter').count()==6)
    check('science: search index remains',page.locator('[data-resource]').count()==30)
    page.goto(url+'join.html',wait_until='networkidle')
    check('join: verified QQ number remains',page.get_by_text('468686951',exact=True).count()>=3)
    check('join: direct QQ invitation remains',page.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)

    for route in ['', 'club.html','gallery.html','science.html','join.html']:
        page.goto(url+route,wait_until='networkidle')
        for width in [320,390,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            check(f'{route or "home"}: {width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.set_viewport_size({'width':390,'height':844});page.locator('.menu-toggle').click()
        check(f'{route or "home"}: mobile menu has six items',page.locator('#main-nav a:visible').count()==6)
        page.keyboard.press('Escape');check(f'{route or "home"}: Escape closes menu',page.locator('.menu-toggle').get_attribute('aria-expanded')=='false')

    page.goto(url+'club.html',wait_until='networkidle');page.set_viewport_size({'width':390,'height':844});wait_images(page,'img[data-official-image]')
    page.screenshot(path=str(out/'culture-events-mobile.png'),full_page=True);page.screenshot(path=str(out/'culture-events-mobile-top.png'))
    page.goto(url+'gallery.html',wait_until='networkidle');wait_images(page,'[data-gallery-page-item] img')
    page.screenshot(path=str(out/'culture-gallery-mobile.png'),full_page=True);page.screenshot(path=str(out/'culture-gallery-mobile-top.png'))

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});fallback=nojs.new_page()
    fallback.goto(url+'gallery.html',wait_until='domcontentloaded');wait_images(fallback,'[data-gallery-page-item] img')
    check('no JS: all twenty-six photos remain readable',fallback.locator('[data-gallery-page-item]:visible').count()==26)
    check('no JS: filter controls do not become dead UI',fallback.locator('[data-gallery-page-filter]:visible').count()==0)
    fallback.goto(url+'club.html',wait_until='domcontentloaded')
    check('no JS: all eight club records and three campus events remain readable',fallback.locator('[data-official-post]').count()==8 and fallback.locator('.culture-campus-card').count()==3)
    fallback.goto(url+'join.html',wait_until='domcontentloaded')
    check('no JS: join path remains usable',fallback.locator('img[data-join-qr]').count()>=1 and fallback.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)
    check('site: no uncaught JavaScript errors',not errors)
    nojs.close();browser.close()

(out/'culture-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} culture browser checks passed',flush=True)
