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

def wait_images(page,selector='img[data-running-photo]'):
    loc=page.locator(selector)
    if loc.count():
        loc.evaluate_all("ims=>ims.forEach(i=>i.loading='eager')")
        page.wait_for_function("s=>[...document.querySelectorAll(s)].every(i=>i.complete&&i.naturalWidth>0)",arg=selector,timeout=20000)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000},reduced_motion='no-preference')
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))

    page.goto(url+'club.html',wait_until='networkidle');wait_images(page)
    check('motion: runtime and stylesheet are attached',page.locator('script[src$="assets/motion.js"]').count()==1 and page.locator('link[href$="assets/motion.css"]').count()==1)
    check('motion: culture page receives reveal targets',page.locator('[data-reveal]').count()>=10)
    page.wait_for_timeout(400)
    check('motion: above-fold content becomes visible',page.locator('[data-reveal].is-visible').count()>=2)
    check('zoom: running photos receive zoom affordances',page.locator('.motion-zoom-shell img[data-running-photo]').count()>=10 and page.locator('.motion-zoom-hint').count()>=10)
    first=page.locator('.culture-photo-mosaic img[data-running-photo]').first
    first.scroll_into_view_if_needed();first.click()
    dialog=page.locator('.motion-lightbox[open]')
    check('zoom: culture photo opens global lightbox',dialog.count()==1 and dialog.locator('img').get_attribute('src') is not None)
    check('zoom: title and position are exposed',dialog.locator('#motion-lightbox-title').inner_text().strip()!='' and '/' in dialog.locator('.motion-lightbox-count').inner_text())
    page.screenshot(path=str(out/'motion-lightbox-desktop.png'))
    position=dialog.locator('.motion-lightbox-count').inner_text()
    page.keyboard.press('ArrowRight');page.wait_for_timeout(80)
    check('zoom: keyboard arrows move through visible photos',dialog.locator('.motion-lightbox-count').inner_text()!=position)
    page.keyboard.press('Home');check('zoom: Home jumps to first photo',dialog.locator('.motion-lightbox-count').inner_text().startswith('1 /'))
    page.keyboard.press('End');check('zoom: End jumps to final photo',not dialog.locator('.motion-lightbox-count').inner_text().startswith('1 /'))
    page.keyboard.press('Escape');check('zoom: Escape closes global lightbox',page.locator('.motion-lightbox[open]').count()==0)
    check('zoom: focus returns to photo trigger',page.evaluate("document.activeElement?.querySelector?.('img[data-running-photo]')!==null || document.activeElement?.matches?.('img[data-running-photo]')"))

    page.goto(url,wait_until='networkidle');wait_images(page)
    home_photo=page.locator('img[data-running-photo]').first
    home_photo.scroll_into_view_if_needed();home_photo.click()
    check('zoom: homepage running photography is also enlargeable',page.locator('.motion-lightbox[open]').count()==1)
    page.locator('.motion-lightbox-close').click()

    page.goto(url+'gallery.html',wait_until='networkidle');wait_images(page,'[data-gallery-page-item] img')
    check('zoom: gallery keeps its richer dedicated viewer',page.locator('.running-gallery-dialog').count()==1 and page.locator('.motion-lightbox').count()==0)
    gallery_trigger=page.locator('[data-gallery-photo]').first;gallery_trigger.click()
    check('zoom: gallery image opens dedicated dialog',page.locator('.running-gallery-dialog[open]').count()==1)
    gallery_position=page.locator('#running-gallery-position').inner_text();page.keyboard.press('ArrowRight');page.wait_for_timeout(80)
    check('zoom: dedicated gallery supports keyboard next',page.locator('#running-gallery-position').inner_text()!=gallery_position)
    page.keyboard.press('Escape');check('zoom: gallery Escape closes',page.locator('.running-gallery-dialog[open]').count()==0)

    page.set_viewport_size({'width':390,'height':844});page.goto(url+'club.html',wait_until='networkidle');wait_images(page)
    mobile=page.locator('.culture-photo-mosaic img[data-running-photo]').first;mobile.scroll_into_view_if_needed();mobile.click()
    metrics=page.locator('.motion-lightbox').evaluate("d=>{const r=d.getBoundingClientRect();return {width:r.width,height:r.height,innerWidth,innerHeight}}")
    print('MOBILE_DIALOG_METRICS',metrics,flush=True)
    check('zoom: mobile viewer covers nearly the full viewport',page.locator('.motion-lightbox[open]').count()==1 and metrics['width']>=metrics['innerWidth']*.94 and metrics['height']>=metrics['innerHeight']*.94)
    check('zoom: mobile viewer keeps previous and next controls',page.locator('.motion-lightbox-step:visible').count()==2)
    check('zoom: mobile image stays contained in viewport',page.locator('.motion-lightbox-stage img').evaluate("i=>{const r=i.getBoundingClientRect();return r.width<=innerWidth&&r.height<=innerHeight}"))
    page.screenshot(path=str(out/'motion-lightbox-mobile.png'))
    page.keyboard.press('Escape')

    reduced=browser.new_context(reduced_motion='reduce',viewport={'width':1280,'height':800})
    rpage=reduced.new_page();rpage.goto(url+'club.html',wait_until='networkidle')
    check('motion: reduced-motion users never get hidden reveal content',rpage.locator('[data-reveal]').count()>0 and rpage.locator('[data-reveal]').evaluate_all("els=>els.every(el=>getComputedStyle(el).opacity==='1'&&getComputedStyle(el).transform==='none')"))
    check('motion: reduced-motion removes reveal transitions',rpage.locator('[data-reveal]').first.evaluate("el=>getComputedStyle(el).transitionDuration==='0s'"))
    reduced.close()

    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    fallback=nojs.new_page();fallback.goto(url+'club.html',wait_until='domcontentloaded')
    check('no JS: photos remain visible without reveal runtime',fallback.locator('img[data-running-photo]').count()>=10 and fallback.locator('.motion-lightbox').count()==0)
    check('motion: no uncaught JavaScript errors',not errors)
    nojs.close();browser.close()

(out/'motion-browser-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks},ensure_ascii=False,indent=2))
print(f'{len(checks)} motion/lightbox browser checks passed',flush=True)
