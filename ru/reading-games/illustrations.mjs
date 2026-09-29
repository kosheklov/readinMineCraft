// Neutral subject art for stories; visual support for word and logic practice.
const objects = ['fox','vase','oak','poppy','hat','spoon','scarf','coat','ball','pear','table','plum','fish','chair','wardrobe','hand','boot','moon','cheese','river','bread','cow','crow','owl','bus','train','banana','album','lamp','backpack','apple','umbrella','clock','broom','pencil','mittens'];
const stories = ['cat','shovel','branch','bowl','rain','berries','book','drawing','boy','tea','watering','ball'];
export const illustrations = {
 'naydi-lishnee': ['cat','oak','hat','scarf','pear','fish','hand','bread','cow','bus'],
 'otgaday-po-opisaniyu': ['album','lamp','ball','spoon','backpack','apple','umbrella','scarf','clock','broom'],
 'pravda-ili-net': ['ball','cat','pear','book','watering','oak','hat','drawing','spoon','hand'],
 'zakonchi-predlozhenie': ['rain','fish','spoon','pencil','hand','mittens','branch','train','clock','bread'],
 'naydi-protivopolozhnoe': ['oak','scarf','tea','oak','umbrella','backpack','river','boot','train','house'],
 'prochitay-i-otvet': ['cat','shovel','branch','bowl','rain','berries','book','drawing','boy','tea'],
};
export function illustrationFrame(route,index) {
 let name=illustrations[route]?.[index];
 if(name==='house')name='drawing';
 const storyIndex=stories.indexOf(name);
 const cell=storyIndex>=0?storyIndex:objects.indexOf(name);
 if(cell<0)throw new Error('Missing illustration');
 return { sheet:storyIndex>=0?'stories':'objects',cell,columns:storyIndex>=0?4:6,rows:storyIndex>=0?3:6 };
}
export function paintIllustration(route,index) {
 const node=document.getElementById('task-illustration');
 const frame=illustrationFrame(route,index);
 node.style.backgroundImage=`url("${new URL(`./images/${frame.sheet}.png`,import.meta.url).href}")`;
 node.style.backgroundSize=`${frame.columns*100}% ${frame.rows*100}%`;
 node.style.backgroundPosition=`${frame.cell%frame.columns*100/(frame.columns-1)}% ${frame.sheet==='stories' && frame.cell===8 ? 94 : Math.floor(frame.cell/frame.columns)*100/(frame.rows-1)}%`;
 node.style.clipPath=frame.sheet==='objects' && frame.cell===27 ? 'inset(0 0 20% 0)' : ''; 
}
