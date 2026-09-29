// Read-only pixel analysis. No artwork is modified.
const sharp=require('sharp');
(async()=>{
for(const theme of ['dinosaurs','space','unicorns','fairies','garden']) {
  const {data,info}=await sharp(`assets/themes/${theme}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const {width:w,height:h,channels:c}=info, seen=new Uint8Array(w*h), components=[];
  for(let p=0;p<w*h;p++) {
    if(seen[p]||data[p*c+3]<180) continue;
    const queue=[p];seen[p]=1;let left=w,top=h,right=0,bottom=0;
    for(let at=0;at<queue.length;at++) {
      const q=queue[at],x=q%w,y=Math.floor(q/w);
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      for(const r of [x>0?q-1:-1,x<w-1?q+1:-1,q-w,q+w]) {
        if(r<0||r>=w*h||seen[r]||data[r*c+3]<180) continue;
        seen[r]=1;queue.push(r);
      }
    }
    if(queue.length>1200) components.push({left,top,right,bottom,pixels:queue.length});
  }
  console.log(theme,JSON.stringify(components.sort((a,b)=>a.top-b.top)));
}
})();
