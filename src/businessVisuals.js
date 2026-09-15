'use strict';
const { THEME, baseCard, fillRoundRect, rtlText, centerText } = require('./bankVisualBase');
const { money, formatDuration } = require('./bankUtils');

function icon(ctx,code,x,y,size=54){
 ctx.save();ctx.translate(x,y);ctx.lineWidth=2;ctx.strokeStyle=THEME.cyan;ctx.fillStyle='rgba(255,255,255,.92)';
 if(code==='EGG'){ctx.beginPath();ctx.ellipse(0,2,size*.25,size*.34,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 else if(code==='WHEAT'){ctx.strokeStyle=THEME.gold;ctx.beginPath();ctx.moveTo(0,20);ctx.lineTo(0,-20);ctx.stroke();for(let i=-14;i<=8;i+=7){ctx.beginPath();ctx.ellipse(-7,i,7,3,-.5,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(7,i,7,3,.5,0,Math.PI*2);ctx.stroke();}}
 else {const label=({FLOUR:'FLR',BREAD:'BRD',MILK:'MLK',FEED:'FED',IRON:'Fe',PARTS:'PRT',FUEL:'FUEL',JEWEL:'GEM',MEAL:'MEAL',BATTERY:'BAT'})[code]||code;fillRoundRect(ctx,-size/2,-size/2,size,size,14,'rgba(90,168,255,.10)',THEME.strokeSoft,1);centerText(ctx,label,0,5,'800 12px "Neverless Latin"',THEME.silver);}
 ctx.restore();
}
function metricBox(ctx,x,y,w,label,value,color){
 fillRoundRect(ctx,x,y,w,82,16,'rgba(10,23,38,.94)',THEME.strokeSoft,1.2);
 rtlText(ctx,label,x+w-16,y+25,'600 13px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);
 rtlText(ctx,value,x+w-16,y+58,'800 20px "Noto Sans Arabic", "Neverless Latin"',color);
}
function itemCell(ctx,item,qty,price,x,y,w=220,h=145){
 fillRoundRect(ctx,x,y,w,h,18,'rgba(10,23,38,.94)',THEME.strokeSoft,1.4); icon(ctx,item.code,x+42,y+43);
 rtlText(ctx,item.name,x+w-16,y+34,'800 17px "Noto Sans Arabic", "Neverless Latin"',THEME.text);
 rtlText(ctx,'x'+qty,x+w-16,y+68,'800 18px "Neverless Latin", "Noto Sans Arabic"',THEME.cyan);
 fillRoundRect(ctx,x+15,y+h-43,w-30,29,12,'rgba(57,227,159,.08)','rgba(57,227,159,.25)',1);
 centerText(ctx,price==null?'INVENTORY':money(price),x+w/2,y+h-23,'800 14px "Neverless Latin", "Noto Sans Arabic"',price==null?THEME.muted:THEME.green);
}
function catalogCard(catalog){
 const items=Object.values(catalog),{canvas,ctx}=baseCard('NEVERLESS INDUSTRIES','المشاريع وسلاسل الإنتاج',1120,720,THEME.gold);
 items.forEach((p,i)=>{const col=i%2,row=Math.floor(i/2),x=55+col*515,y=145+row*130;
 fillRoundRect(ctx,x,y,485,112,18,'rgba(10,23,38,.94)',THEME.strokeSoft,1.3);
 rtlText(ctx,p.name,x+455,y+31,'800 18px "Noto Sans Arabic", "Neverless Latin"',THEME.text);
 rtlText(ctx,'إنشاء '+money(p.cost)+' • إنتاج '+p.outputQty+' '+p.outputName,x+455,y+59,'600 14px "Noto Sans Arabic", "Neverless Latin"',THEME.cyan);
 rtlText(ctx,p.inputsText||'إنتاج أساسي',x+455,y+86,'600 13px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);});
 return canvas.toBuffer('image/png');
}
function businessCard(business,project,inv,status={}){
 const {canvas,ctx}=baseCard('NEVERLESS INDUSTRIES',business.name,1080,650,THEME.gold),ready=Math.max(0,status.ready||0),cap=Math.max(1,status.cap||project.outputQty),pct=Math.min(1,ready/cap);
 metricBox(ctx,55,145,300,'المشروع',project.name,THEME.gold);metricBox(ctx,390,145,300,'المستوى','LV. '+business.level,THEME.cyan);metricBox(ctx,725,145,300,'خطوط الإنتاج',String(business.lines),THEME.green);
 metricBox(ctx,55,250,300,'خانات المخزن',String(business.storageSlots),THEME.silver);metricBox(ctx,390,250,300,'جاهز للاستلام',ready+' / '+cap,THEME.green);metricBox(ctx,725,250,300,'التطوير القادم',money(status.upgradeCost||0),THEME.gold);
 fillRoundRect(ctx,55,365,970,190,20,'rgba(10,23,38,.94)',THEME.strokeSoft,1.4);icon(ctx,project.output,100,418,64);
 rtlText(ctx,project.outputName+' • '+project.outputQty+' وحدة لكل دورة',995,400,'800 18px "Noto Sans Arabic", "Neverless Latin"',THEME.text);
 rtlText(ctx,'معدل الإنتاج: '+Number(status.rate||project.outputQty/15).toFixed(1)+' وحدة/دقيقة',995,438,'700 15px "Noto Sans Arabic", "Neverless Latin"',THEME.cyan);
 fillRoundRect(ctx,160,466,800,18,9,'rgba(255,255,255,.07)',null,0);fillRoundRect(ctx,160,466,800*pct,18,9,THEME.green,null,0);
 rtlText(ctx,pct>=1?'الإنتاج ممتلئ وجاهز للاستلام':'يمتلئ المخزون الإنتاجي خلال 15 دقيقة',995,520,'600 14px "Noto Sans Arabic", "Neverless Latin"',pct>=1?THEME.green:THEME.muted);
 rtlText(ctx,'سرعة x'+Number(business.speed||1).toFixed(2)+' • دفعة x'+business.batch+' • جودة '+business.quality+' • مشروع '+((status.index||0)+1)+'/'+(status.total||1),995,548,'600 14px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);
 return canvas.toBuffer('image/png');
}
function projectsSummaryCard(businesses,catalog){
 const rows=Math.max(1,businesses.length),{canvas,ctx}=baseCard('NEVERLESS INDUSTRIES','مشاريعي',1060,180+rows*88,THEME.gold);
 businesses.forEach((b,i)=>{const p=catalog[b.type],y=135+i*88;fillRoundRect(ctx,55,y,950,70,16,'rgba(10,23,38,.94)',THEME.strokeSoft,1.2);icon(ctx,p.output,90,y+35,42);rtlText(ctx,b.name,980,y+28,'800 16px "Noto Sans Arabic", "Neverless Latin"',THEME.text);rtlText(ctx,p.name+' • LV.'+b.level+' • خطوط '+b.lines+' • دفعة x'+b.batch,980,y+53,'600 13px "Noto Sans Arabic", "Neverless Latin"',THEME.cyan);});
 return canvas.toBuffer('image/png');
}
function npcStoreCard(rows,next){
 const r=Math.ceil(rows.length/4),{canvas,ctx}=baseCard('NEVERLESS SUPPLY','متجر المواد الأولية • تحديث كل 15 دقيقة',1040,220+r*165,THEME.cyan);
 rows.forEach((it,i)=>itemCell(ctx,it,it.qty,it.price,55+(i%4)*240,145+Math.floor(i/4)*165));
 rtlText(ctx,'التحديث القادم بعد '+formatDuration(next),985,190+r*165,'600 14px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);return canvas.toBuffer('image/png');
}
function inventoryCard(inventory,items){
 const entries=Object.entries(inventory||{}).filter(([,q])=>Number(q)>0),rows=Math.max(1,Math.ceil(entries.length/4));
 const {canvas,ctx}=baseCard('NEVERLESS WAREHOUSE','مخزني',1040,190+rows*165,THEME.cyan);
 if(!entries.length) centerText(ctx,'المخزن فارغ',520,260,'800 24px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);
 entries.forEach(([code,q],i)=>itemCell(ctx,items[code]||{code,name:code},Math.floor(q),null,55+(i%4)*240,145+Math.floor(i/4)*165)); return canvas.toBuffer('image/png');
}
function storeCard(ownerName,store,listings,items){
 const rows=Math.max(1,Math.ceil(listings.length/4)),{canvas,ctx}=baseCard(String(store.name||ownerName||'STORE').toUpperCase(),'متجر عضو • NEVERLESS MARKETPLACE',1040,250+rows*165,THEME.green);
 rtlText(ctx,'المبيعات '+(store.sales||0)+' • الإيرادات '+money(store.revenue||0),985,132,'700 14px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);
 if(!listings.length) centerText(ctx,'لا توجد منتجات معروضة حالياً',520,260,'800 23px "Noto Sans Arabic", "Neverless Latin"',THEME.muted);
 listings.forEach((l,i)=>itemCell(ctx,items[l.code]||{code:l.code,name:l.code},l.qty,l.price,55+(i%4)*240,165+Math.floor(i/4)*165)); return canvas.toBuffer('image/png');
}
function incomeCard(store,businesses){
 const revenue=Number(store?.revenue||0)+businesses.reduce((a,b)=>a+Number(b.revenue||0),0),expenses=Number(store?.expenses||0)+businesses.reduce((a,b)=>a+Number(b.expenses||0),0),profit=revenue-expenses;
 const {canvas,ctx}=baseCard('NEVERLESS BUSINESS','دخل المتجر والمشاريع',1050,560,profit>=0?THEME.green:THEME.red);
 metricBox(ctx,65,150,285,'إجمالي الإيرادات',money(revenue),THEME.green); metricBox(ctx,382,150,285,'إجمالي المصاريف',money(expenses),THEME.red); metricBox(ctx,699,150,285,'صافي الربح',money(profit),profit>=0?THEME.green:THEME.red);
 metricBox(ctx,65,265,285,'مبيعات المتجر',String(store?.sales||0),THEME.cyan); metricBox(ctx,382,265,285,'عدد المشاريع',String(businesses.length),THEME.gold); metricBox(ctx,699,265,285,'خانات المتجر',String(store?.slots||3),THEME.silver);
 fillRoundRect(ctx,65,385,919,90,18,'rgba(10,23,38,.94)',THEME.strokeSoft,1.3); rtlText(ctx,'الأرباح = المبيعات - إنشاء المشاريع - التطوير - تكاليف الإنتاج',950,425,'700 15px "Noto Sans Arabic", "Neverless Latin"',THEME.text); rtlText(ctx,'كل عملية شراء بين الأعضاء تنتقل قيمتها مباشرة لصاحب المتجر',950,455,'600 14px "Noto Sans Arabic", "Neverless Latin"',THEME.muted); return canvas.toBuffer('image/png');
}
module.exports={catalogCard,businessCard,projectsSummaryCard,inventoryCard,storeCard,incomeCard,npcStoreCard};
