const scope=document.querySelector('.running-gallery-page');
if(scope){
  const filters=[...scope.querySelectorAll('[data-gallery-page-filter]')];
  const items=[...scope.querySelectorAll('[data-gallery-page-item]')];
  const status=scope.querySelector('#running-gallery-status');
  if(filters.length){
    scope.querySelector('.running-gallery-filters')?.removeAttribute('hidden');
    filters.forEach(button=>button.hidden=false);
    filters.forEach(button=>button.addEventListener('click',()=>{
      const value=button.dataset.galleryPageFilter;
      filters.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      items.forEach(item=>{item.hidden=value!=='all'&&item.dataset.category!==value;});
      if(status)status.textContent=`显示 ${items.filter(item=>!item.hidden).length} 张照片`;
    }));
  }
  const dialog=scope.querySelector('#running-gallery-dialog');
  const dataElement=scope.querySelector('#running-gallery-data');
  if(dialog&&dataElement&&typeof dialog.showModal==='function'){
    const all=JSON.parse(dataElement.textContent);
    let visible=[];
    let index=0;
    let trigger=null;
    const image=scope.querySelector('#running-gallery-dialog-image');
    const title=scope.querySelector('#running-gallery-dialog-title');
    const credit=scope.querySelector('#running-gallery-dialog-credit');
    const source=scope.querySelector('#running-gallery-dialog-source');
    const position=scope.querySelector('#running-gallery-position');
    const render=next=>{
      index=(next%visible.length+visible.length)%visible.length;
      const photo=visible[index];
      image.src=photo.src;
      image.alt=photo.title;
      title.textContent=photo.title;
      credit.textContent=photo.credit;
      source.href=photo.source;
      position.textContent=`${index+1} / ${visible.length}`;
    };
    scope.querySelectorAll('[data-gallery-photo]').forEach(link=>link.addEventListener('click',event=>{
      if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
      event.preventDefault();
      trigger=link;
      const ids=items.filter(item=>!item.hidden).map(item=>item.querySelector('[data-gallery-photo]').dataset.galleryPhoto);
      visible=all.filter(photo=>ids.includes(photo.id));
      render(visible.findIndex(photo=>photo.id===link.dataset.galleryPhoto));
      document.body.classList.add('dialog-open');
      dialog.showModal();
    }));
    scope.querySelector('[data-running-gallery-close]')?.addEventListener('click',()=>dialog.close());
    scope.querySelectorAll('[data-running-gallery-step]').forEach(button=>button.addEventListener('click',()=>render(index+Number(button.dataset.runningGalleryStep))));
    dialog.addEventListener('keydown',event=>{
      if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
        event.preventDefault();
        render(index+(event.key==='ArrowLeft'?-1:1));
      }
    });
    dialog.addEventListener('click',event=>{
      const rect=dialog.getBoundingClientRect();
      if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom))dialog.close();
    });
    dialog.addEventListener('close',()=>{
      document.body.classList.remove('dialog-open');
      trigger?.focus({preventScroll:true});
    });
  }
}
