const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const revealSelectors=['.hero-inner>*','.structure-quick-links>a','.about-layout>*','.culture-home-head>*','.culture-home-lead>*','.culture-home-card','.science-entry .section-heading','.science-entry .science-entry-grid>a','.home-join-band>*','.culture-hero-copy>*','.culture-hero-photo>*','.culture-identity>*','.culture-moment','.culture-year-rail','.culture-event','.culture-campus-card','.running-gallery-hero .container>*','.running-gallery-card','.join-hero>*','.join-steps>*','.sc-hero-inner>*','.sc-chapter'];
const revealTargets=[...new Set(revealSelectors.flatMap(selector=>[...document.querySelectorAll(selector)]))];
revealTargets.forEach((element,index)=>{
  if(element.matches('.culture-event-reverse'))element.dataset.reveal='left';
  else if(element.matches('.culture-event'))element.dataset.reveal='right';
  else if(element.matches('.culture-hero-photo>*'))element.dataset.reveal='scale';
  else element.dataset.reveal='up';
  element.style.setProperty('--reveal-delay',`${Math.min(index%4,3)*55}ms`);
});
document.documentElement.classList.add('motion-ready');
if(reduceMotion.matches||!('IntersectionObserver'in window))revealTargets.forEach(element=>element.classList.add('is-visible'));
else{
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  },{rootMargin:'0px 0px -7% 0px',threshold:.08});
  revealTargets.forEach(element=>observer.observe(element));
}

if(!document.querySelector('.running-gallery-page')){
  const photos=[...document.querySelectorAll('img[data-running-photo]')];
  if(photos.length&&typeof HTMLDialogElement!=='undefined'){
    const dialog=document.createElement('dialog');
    dialog.className='motion-lightbox';
    dialog.setAttribute('aria-labelledby','motion-lightbox-title');
    dialog.innerHTML='<div class="motion-lightbox-head"><span class="motion-lightbox-count"></span><button class="motion-lightbox-close" type="button" aria-label="关闭大图">×</button></div><div class="motion-lightbox-stage"><img alt=""><button class="motion-lightbox-step motion-lightbox-prev" type="button" aria-label="上一张照片">‹</button><button class="motion-lightbox-step motion-lightbox-next" type="button" aria-label="下一张照片">›</button><span class="motion-lightbox-help">← → 切换 · Esc 关闭</span></div><div class="motion-lightbox-foot"><div class="motion-lightbox-copy"><h2 id="motion-lightbox-title"></h2><p></p></div><a class="motion-lightbox-source" target="_blank" rel="noopener noreferrer">查看原始出处 ↗</a></div>';
    document.body.append(dialog);
    const view=dialog.querySelector('.motion-lightbox-stage img');
    const title=dialog.querySelector('.motion-lightbox-copy h2');
    const meta=dialog.querySelector('.motion-lightbox-copy p');
    const count=dialog.querySelector('.motion-lightbox-count');
    const source=dialog.querySelector('.motion-lightbox-source');
    const stage=dialog.querySelector('.motion-lightbox-stage');
    let visible=[];
    let current=0;
    let returnFocus=null;
    let pointerStart=null;
    const closestText=(image,selector)=>image.closest('figure')?.querySelector(selector)?.textContent?.trim()||'';
    const sourceFor=image=>{
      const article=image.closest('article');
      const official=article?.querySelector('.official-source[href^="http"]');
      if(official)return official.href;
      const anchor=image.closest('a[href]');
      if(anchor){
        try{const parsed=new URL(anchor.href,location.href);if(parsed.origin!==location.origin)return parsed.href;}catch{}
      }
      return '';
    };
    const dataFor=image=>({image,src:image.currentSrc||image.src,title:image.alt||'跑步影像',meta:closestText(image,'figcaption'),source:sourceFor(image)});
    const refreshVisible=()=>photos.filter(image=>!image.closest('[hidden]')&&getComputedStyle(image).display!=='none').map(dataFor);
    const render=next=>{
      if(!visible.length)return;
      current=(next%visible.length+visible.length)%visible.length;
      const photo=visible[current];
      view.src=photo.src;
      view.alt=photo.title;
      title.textContent=photo.title;
      meta.textContent=photo.meta;
      meta.hidden=!photo.meta;
      count.textContent=`${current+1} / ${visible.length}`;
      source.hidden=!photo.source;
      if(photo.source)source.href=photo.source;
      if(!reduceMotion.matches&&view.animate)view.animate([{opacity:.45,transform:'scale(.992)'},{opacity:1,transform:'none'}],{duration:180,easing:'ease-out'});
    };
    const open=image=>{
      visible=refreshVisible();
      const index=visible.findIndex(item=>item.image===image);
      if(index<0)return;
      returnFocus=image.closest('a[href]')||image;
      render(index);
      document.body.classList.add('dialog-open');
      dialog.showModal();
      dialog.querySelector('.motion-lightbox-close').focus({preventScroll:true});
    };
    photos.forEach(image=>{
      const anchor=image.closest('a[href]');
      const trigger=anchor||image;
      const shell=anchor||image.parentElement;
      if(shell){
        shell.classList.add('motion-zoom-shell');
        if(!shell.querySelector(':scope > .motion-zoom-hint')){
          const hint=document.createElement('span');
          hint.className='motion-zoom-hint';
          hint.setAttribute('aria-hidden','true');
          hint.textContent='＋';
          shell.append(hint);
        }
      }
      if(!anchor){
        image.tabIndex=0;
        image.setAttribute('role','button');
        image.setAttribute('aria-label',`${image.alt||'跑步照片'}，点击放大查看`);
      }else if(!anchor.getAttribute('aria-label'))anchor.setAttribute('aria-label',`${image.alt||'跑步照片'}，点击放大查看`);
      trigger.addEventListener('click',event=>{
        if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
        if(anchor&&event.target!==image&&!event.target.closest('.motion-zoom-hint')&&event.detail>0)return;
        event.preventDefault();
        open(image);
      });
      if(!anchor)image.addEventListener('keydown',event=>{
        if(event.key!=='Enter'&&event.key!==' ')return;
        event.preventDefault();
        open(image);
      });
    });
    dialog.querySelector('.motion-lightbox-close').addEventListener('click',()=>dialog.close());
    dialog.querySelector('.motion-lightbox-prev').addEventListener('click',()=>render(current-1));
    dialog.querySelector('.motion-lightbox-next').addEventListener('click',()=>render(current+1));
    dialog.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'||event.key==='Home'||event.key==='End'){
        event.preventDefault();
        if(event.key==='ArrowLeft')render(current-1);
        if(event.key==='ArrowRight')render(current+1);
        if(event.key==='Home')render(0);
        if(event.key==='End')render(visible.length-1);
      }
    });
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    stage.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY,id:event.pointerId};});
    stage.addEventListener('pointerup',event=>{
      if(!pointerStart||pointerStart.id!==event.pointerId)return;
      const dx=event.clientX-pointerStart.x;
      const dy=event.clientY-pointerStart.y;
      pointerStart=null;
      if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.2)render(current+(dx<0?1:-1));
    });
    dialog.addEventListener('close',()=>{
      document.body.classList.remove('dialog-open');
      returnFocus?.focus({preventScroll:true});
    });
  }
}
