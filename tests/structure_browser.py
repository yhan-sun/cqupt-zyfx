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
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='reduce')
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))

    page.goto(url,wait_until='networkidle')
    check('home: six primary destinations',page.locator('#main-nav a').all_inner_texts()==['首页','协会介绍','赛事与足迹','跑步影像','科学跑步','加入我们'])
    check('home: association now has a standalone entry',page.locator('#main-nav a[href="about.html"]').count()==1 and page.locator('.association-home-teaser a[href="about.html"]').count()==1)
    check('home: running service remains removed',page.locator('.service-band,#running,#pace').count()==0)
    check('home: culture and verified join remain','一起训练，也一起出发' in page.locator('#footprints').inner_text() and '468686951' in page.locator('.home-join-band').inner_text())
    wait_images(page,'.association-home-teaser img,#footprints img')
    check('home: supplied association photos are local',page.locator('.association-home-teaser img').count()==2 and page.locator('.association-home-teaser img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    page.screenshot(path=str(out/'association-home.png'),full_page=True)

    page.goto(url+'about.html',wait_until='networkidle');wait_images(page,'.association-page img')
    check('about: standalone page and active nav',page.locator('.association-page').count()==1 and page.locator('#main-nav [aria-current="page"]').inner_text()=='协会介绍')
    check('about: captain story is explicit first-person supplied copy','胡钢' in page.locator('.association-story').inner_text() and '跑完一圈便气喘乏力' in page.locator('.association-story').inner_text())
    check('about: four association identities are explained',page.locator('.association-aliases>div').count()==4)
    check('about: nine supplied photographs are archived',page.locator('.association-photo-grid article').count()==9 and page.locator('.association-photo-grid img').count()==9)
    check('about: all supplied photographs load locally',page.locator('.association-photo-grid img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    check('about: evidence boundaries remain scoped','不是协会团体成绩' in page.locator('.association-proof').inner_text() and '不代表协会主办赛事' in page.locator('.association-proof').inner_text())
    check('about: current QQ join route is present','468686951' in page.locator('.association-join').inner_text() and page.locator('.association-join a[href="join.html"]').count()==1)
    page.screenshot(path=str(out/'association-about.png'),full_page=True);page.screenshot(path=str(out/'association-about-top.png'))

    page.goto(url+'club.html',wait_until='networkidle');wait_images(page,'img[data-official-image],.association-member-strip img')
    check('events: eight official records and three campus events remain',page.locator('[data-official-post]').count()==8 and page.locator('.culture-campus-card').count()==3)
    check('events: three year chapters remain',page.locator('.culture-year-rail strong').all_inner_texts()==['2026','2025','2024'])
    check('events: four new association scenes bridge into archive',page.locator('.association-member-strip img').count()==4)
    check('events: historical training remains non-current','不代表当前训练时间' in page.locator('#training-history').inner_text())

    page.goto(url+'news.html',wait_until='networkidle')
    check('legacy event index still points to merged archive','已并入「赛事与足迹」' in page.locator('h1').inner_text() and page.locator('.merged-event-card').count()==3)
    page.goto(url+'news/marathon-2025.html',wait_until='networkidle')
    check('legacy event article remains readable',page.locator('.article-body').is_visible() and page.locator('.article-photo img').evaluate('i=>i.naturalWidth>0'))

    page.goto(url+'gallery.html',wait_until='networkidle');wait_images(page,'[data-gallery-page-item] img')
    check('gallery: 20 official + 9 supplied + 6 campus photos',page.locator('[data-gallery-page-item]').count()==35)
    check('gallery: supplied association filter exists',page.locator('[data-gallery-page-filter="member"]').count()==1)
    page.locator('[data-gallery-page-filter="member"]').click()
    check('gallery filter: association shows nine photos',page.locator('[data-gallery-page-item]:visible').count()==9)
    page.locator('[data-gallery-page-filter="training"]').click()
    check('gallery filter: training remains five photos',page.locator('[data-gallery-page-item]:visible').count()==5)
    page.locator('[data-gallery-page-filter="social"]').click()
    check('gallery filter: social remains four photos',page.locator('[data-gallery-page-item]:visible').count()==4)
    page.locator('[data-gallery-page-filter="all"]').click()
    check('gallery filter: all restores thirty-five photos',page.locator('[data-gallery-page-item]:visible').count()==35)
    check('gallery: every image is same-origin',page.locator('[data-gallery-page-item] img').evaluate_all("ims=>ims.every(i=>new URL(i.src).origin===location.origin&&i.naturalWidth>0)"))
    trigger=page.locator('[data-gallery-page-item] [data-gallery-photo]').nth(20);trigger.click()
    check('gallery: supplied image opens in dedicated viewer',page.locator('#running-gallery-dialog').is_visible() and page.locator('#running-gallery-dialog-image').evaluate('i=>i.naturalWidth>0'))
    page.keyboard.press('Escape');check('gallery: Escape closes and returns focus',not page.locator('#running-gallery-dialog').is_visible() and trigger.evaluate('el=>el===document.activeElement'))
    page.screenshot(path=str(out/'association-gallery.png'),full_page=True)

    page.goto(url+'sources.html',wait_until='networkidle')
    check('sources: official WeChat ledger remains twenty images',page.locator('#official-wechat .official-media-source-grid>div').count()==20)
    check('sources: supplied media has a separate disclosure',page.locator('#association-supplied-media').count()==1 and '9 张' in page.locator('#association-supplied-media').inner_text())

    page.goto(url+'science.html',wait_until='networkidle')
    check('science: six chapters and search index remain',page.locator('.sc-chapter').count()==6 and page.locator('[data-resource]').count()==30)
    page.goto(url+'join.html',wait_until='networkidle')
    check('join: verified QQ path remains',page.get_by_text('468686951',exact=True).count()>=3 and page.locator('a[href="https://qm.qq.com/q/9rKOuWR8Ag"]').count()>=3)

    for route in ['', 'about.html','club.html','gallery.html','science.html','join.html']:
        page.goto(url+route,wait_until='networkidle')
        for width in [320,390,768,1024,1440]:
            page.set_viewport_size({'width':width,'height':900})
            check(f'{route or "home"}: {width}px no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
        page.set_viewport_size({'width':390,'height':844});page.locator('.menu-toggle').click()
        check(f'{route or "home"}: mobile menu has six items',page.locator('#main-nav a:visible').count()==6)
        page.keyboard.press('Escape');check(f'{route or "home"}: Escape closes menu',page.locator('.menu-toggle').get_attribute('aria-expanded')=='false')

    page.goto(url+'about.html',wait_until='networkidle');page.set_viewport_size({'width':390,'height':844});wait_images(page,'.association-page img')
    page.screenshot(path=str(out/'association-about-mobile.png'),full_page=True);page.screenshot(path=str(out/'association-about-mobile-top.png'))

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});fallback=nojs.new_page()
    fallback.goto(url+'about.html',wait_until='domcontentloaded');wait_images(fallback,'.association-page img')
    check('no JS: association page and nine images remain readable',fallback.locator('.association-page').count()==1 and fallback.locator('.association-photo-grid img').count()==9)
    fallback.goto(url+'gallery.html',wait_until='domcontentloaded');wait_images(fallback,'[data-gallery-page-item] img')
    check('no JS: all thirty-five gallery photos remain readable',fallback.locator('[data-gallery-page-item]:visible').count()==35)
    check('no JS: filter buttons remain hidden',fallback.locator('[data-gallery-page-filter]:visible').count()==0)
    fallback.goto(url+'club.html',wait_until='domcontentloaded')
    check('no JS: club archive remains readable',fallback.locator('[data-official-post]').count()==8 and fallback.locator('.association-member-strip img').count()==4)
    check('site: no uncaught JavaScript errors',not errors)
    nojs.close();browser.close()

(out/'structure-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} structure browser checks passed',flush=True)
