const $=s=>document.querySelector(s);
const T={en:{brand:"NammaTrip AI",tag:"Your Budget. Your Journey. Your Karnataka.",start:"Starting city",days:"Number of days",trav:"Travellers",bud:"Total budget (₹)",int:"Interests",heritage:"Heritage",temple:"Temples",nature:"Nature",coast:"Coast",pace:"Travel pace",r:"Relaxed",b:"Balanced",p:"Packed",go:"Plan my journey",saved:"Saved trips",save:"Save",share:"Share link",print:"Print",copy:"Copy text",day:"Day",est:"Estimated cost",within:"Within your budget",over:"Over budget by",trip:"Your Karnataka plan",pick:"Pick at least one interest.",copied:"Copied",savedok:"Saved",none:"No saved trips yet",del:"Delete",load:"Open",stay:"Stay, food and local travel",tran:"Travel between places (estimate)",tip:"Tip over budget: choose fewer days, a slower pace, or cheaper places.",note:"All costs are planning estimates, not live prices. Verify before you travel. Plans come from a transparent rule-based engine (interest match, budget fit, distance), not hidden AI. Weather is live from Open-Meteo. Data reviewed: "+DATA_REVIEWED+".",from:"from",now:"now"},
kn:{brand:"ನಮ್ಮ ಟ್ರಿಪ್ AI",tag:"ನಿಮ್ಮ ಬಜೆಟ್. ನಿಮ್ಮ ಪ್ರಯಾಣ. ನಿಮ್ಮ ಕರ್ನಾಟಕ.",start:"ಆರಂಭದ ನಗರ",days:"ದಿನಗಳ ಸಂಖ್ಯೆ",trav:"ಪ್ರಯಾಣಿಕರು",bud:"ಒಟ್ಟು ಬಜೆಟ್ (₹)",int:"ಆಸಕ್ತಿಗಳು",heritage:"ಪರಂಪರೆ",temple:"ದೇವಾಲಯ",nature:"ಪ್ರಕೃತಿ",coast:"ಕರಾವಳಿ",pace:"ಪ್ರಯಾಣದ ವೇಗ",r:"ಆರಾಮ",b:"ಸಮತೋಲನ",p:"ಬಿಡುವಿಲ್ಲದ",go:"ನನ್ನ ಪ್ರವಾಸ ರೂಪಿಸಿ",saved:"ಉಳಿಸಿದ ಪ್ರವಾಸಗಳು",save:"ಉಳಿಸಿ",share:"ಲಿಂಕ್ ಹಂಚಿ",print:"ಮುದ್ರಿಸಿ",copy:"ಪಠ್ಯ ನಕಲಿಸಿ",day:"ದಿನ",est:"ಅಂದಾಜು ವೆಚ್ಚ",within:"ನಿಮ್ಮ ಬಜೆಟ್ ಒಳಗೆ",over:"ಬಜೆಟ್‌ಗಿಂತ ಹೆಚ್ಚು",trip:"ನಿಮ್ಮ ಕರ್ನಾಟಕ ಪ್ರವಾಸ",pick:"ಕನಿಷ್ಠ ಒಂದು ಆಸಕ್ತಿ ಆರಿಸಿ.",copied:"ನಕಲಿಸಲಾಗಿದೆ",savedok:"ಉಳಿಸಲಾಗಿದೆ",none:"ಇನ್ನೂ ಉಳಿಸಿದ ಪ್ರವಾಸಗಳಿಲ್ಲ",del:"ಅಳಿಸಿ",load:"ತೆರೆಯಿರಿ",stay:"ವಾಸ, ಊಟ, ಸ್ಥಳೀಯ ಪ್ರಯಾಣ",tran:"ಸ್ಥಳಗಳ ನಡುವಿನ ಪ್ರಯಾಣ (ಅಂದಾಜು)",tip:"ಬಜೆಟ್ ಮೀರಿದರೆ: ಕಡಿಮೆ ದಿನ, ನಿಧಾನ ವೇಗ ಅಥವಾ ಕಡಿಮೆ ವೆಚ್ಚದ ಸ್ಥಳಗಳನ್ನು ಆರಿಸಿ.",note:"ವೆಚ್ಚಗಳು ಅಂದಾಜು ಮಾತ್ರ, ನೇರ ಬೆಲೆಗಳಲ್ಲ. ಪ್ರಯಾಣದ ಮುನ್ನ ಪರಿಶೀಲಿಸಿ. ಯೋಜನೆ ಪಾರದರ್ಶಕ ನಿಯಮ ಆಧಾರಿತ (ಆಸಕ್ತಿ, ಬಜೆಟ್, ದೂರ); ಗುಪ್ತ AI ಅಲ್ಲ. ಹವಾಮಾನ Open-Meteo ನಿಂದ ನೇರ. ದತ್ತಾಂಶ ಪರಿಶೀಲನೆ: "+DATA_REVIEWED+".",from:"ಇಂದ",now:"ಈಗ"}};
let lang=localStorage.getItem("nt_l")||"en",map,last;
const t=k=>T[lang][k]||k,ix=()=>lang==="kn"?1:0,esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const inr=n=>"₹"+Math.round(n).toLocaleString("en-IN");
function toast(m){const e=$("#toast");e.textContent=m;e.classList.add("on");setTimeout(()=>e.classList.remove("on"),1800)}
function applyLang(){document.documentElement.lang=lang==="kn"?"kn":"en";document.querySelectorAll("[data-i]").forEach(e=>e.textContent=t(e.dataset.i));$(".note").textContent=t("note");$("#lang").textContent=lang==="kn"?"English":"ಕನ್ನಡ";if(last)render(last);list()}
const km=(a,b)=>{const r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]),h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return Math.round(12742*Math.asin(Math.sqrt(h))*1.3)};
function plan(o){
 const s=CITIES[o.s],per=o.b/(o.d*o.n),N=Math.max(1,Math.min(PLACES.length,Math.round(o.d*{r:.5,b:.75,p:1}[o.p])));
 let pick=PLACES.map(p=>({p,v:3*p.t.filter(x=>o.i.includes(x)).length+(p.c<=per*.7?1:-2)-km(s,p.ll)/250})).sort((a,b)=>b.v-a.v).slice(0,N).map(x=>x.p);
 const ord=[];let cur=s;while(pick.length){pick.sort((a,b)=>km(cur,a.ll)-km(cur,b.ll));const x=pick.shift();ord.push(x);cur=x.ll}
 const dd=ord.map(()=>1);let left=o.d-ord.length;
 for(let j=0;left>0&&j<ord.length*2;j++){const k=j%ord.length;if(ord[k].d>dd[k]){dd[k]++;left--}}
 for(let k=0;left>0;k=(k+1)%ord.length,left--)dd[k]++;
 let prev=s,day=1,tk=0,stay=0;
 const stops=ord.map((p,i)=>{const leg=km(prev,p.ll);tk+=leg;prev=p.ll;const r={p,leg,from:day,to:day+dd[i]-1};day+=dd[i];stay+=p.c*dd[i]*o.n;return r});
 tk+=km(prev,s);const trans=tk*4*o.n;
 return{o,stops,stay,trans,total:stay+trans,tk};
}
function render(r){last=r;const o=r.o,diff=r.total-o.b,pct=Math.min(100,r.total/o.b*100);
 $("#out").hidden=false;
 $("#sum").innerHTML=`<b>${t("est")}: ${inr(r.total)}</b> / ${inr(o.b)}<div class="bar ${diff>0?"over":""}"><i style="width:${pct}%"></i></div><span class="${diff>0?"bad":"ok"}">${diff>0?t("over")+" "+inr(diff):t("within")}</span><p class="mu">${t("stay")}: ${inr(r.stay)}<br>${t("tran")}: ${inr(r.trans)} (~${r.tk} km)</p>${diff>0?`<p class="mu">${t("tip")}</p>`:""}`;
 $("#days").innerHTML=r.stops.map((s,i)=>`<div class="card day"><div class="dn">${t("day")}<br>${s.from===s.to?s.from:s.from+"–"+s.to}</div><div><h3>${i+1}. ${esc(s.p.n[ix()])}</h3>${s.p.t.map(x=>`<span class="tag">${t(x)}</span>`).join("")}<p>${esc(s.p.tip[ix()])}</p><p class="mu">~${s.leg} km ${t("from")} ${i?esc(r.stops[i-1].p.n[ix()]):esc(o.s)} · ${inr(s.p.c*(s.to-s.from+1)*o.n)} · <span class="wx" data-i2="${i}">…</span></p></div></div>`).join("");
 drawMap(r);weather(r);
}
function drawMap(r){if(typeof L==="undefined"||!window.L||!L.map){$("#map").hidden=true;return}$("#map").hidden=false;
 if(!map){map=L.map("map");L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:"© OpenStreetMap contributors"}).addTo(map)}
 if(map._g)map._g.remove();const g=L.layerGroup().addTo(map);map._g=g;const s=CITIES[r.o.s],pts=[s];
 L.marker(s).addTo(g).bindPopup(r.o.s);
 r.stops.forEach((x,i)=>{pts.push(x.p.ll);L.marker(x.p.ll,{icon:L.divIcon({className:"",html:`<div style="background:#0F3D2E;color:#fff;border-radius:50%;width:26px;height:26px;text-align:center;line-height:26px;font-weight:700;border:2px solid #F2A33A">${i+1}</div>`,iconSize:[26,26]})}).addTo(g).bindPopup(x.p.n[ix()])});
 L.polyline(pts,{color:"#1B6B4F",dashArray:"6 6"}).addTo(g);map.fitBounds(pts,{padding:[30,30]});setTimeout(()=>map.invalidateSize(),150)}
const ico=c=>c===0?"☀️":c<4?"⛅":c<50?"🌫️":c<70?"🌧️":c<90?"🌦️":"⛈️";
function weather(r){r.stops.forEach((s,i)=>{const e=document.querySelector(`[data-i2="${i}"]`);
 fetch(`https://api.open-meteo.com/v1/forecast?latitude=${s.p.ll[0]}&longitude=${s.p.ll[1]}&current=temperature_2m,weather_code`).then(x=>x.json()).then(j=>{e.textContent=`${ico(j.current.weather_code)} ${Math.round(j.current.temperature_2m)}°C ${t("now")}`}).catch(()=>{e.textContent="—"})})}
function text(r){return t("trip")+" ("+r.o.s+", "+r.o.d+" "+t("day")+")\n"+r.stops.map((s,i)=>`${t("day")} ${s.from}${s.to>s.from?"-"+s.to:""}: ${s.p.n[ix()]} (~${s.leg} km)`).join("\n")+`\n${t("est")}: ${inr(r.total)} / ${inr(r.o.b)}\n`+location.origin+location.pathname}
const getO=()=>({s:$("#s").value,d:+$("#d").value,n:+$("#n").value,b:+$("#b").value,p:$("#p").value,i:[...document.querySelectorAll("[name=i]:checked")].map(x=>x.value)});
const setO=o=>{$("#s").value=o.s;$("#d").value=o.d;$("#n").value=o.n;$("#b").value=o.b;$("#p").value=o.p;document.querySelectorAll("[name=i]").forEach(x=>x.checked=o.i.includes(x.value))};
const store=()=>{try{return JSON.parse(localStorage.getItem("nt_trips")||"[]")}catch(e){return[]}};
function list(){const a=store();$("#list").innerHTML=a.length?a.map((o,i)=>`<div class="sv"><span>${esc(o.s)} · ${o.d} ${t("day")} · ${inr(o.b)}</span><span><button data-o="${i}">${t("load")}</button> <button data-x="${i}">${t("del")}</button></span></div>`).join(""):`<p class="mu">${t("none")}</p>`}
function go(o){if(!o.i.length){toast(t("pick"));return}setO(o);render(plan(o))}
$("#f").addEventListener("submit",e=>{e.preventDefault();go(getO());$("#out").scrollIntoView({behavior:"smooth"})});
$("#lang").onclick=()=>{lang=lang==="kn"?"en":"kn";localStorage.setItem("nt_l",lang);applyLang()};
$("#save").onclick=()=>{const a=store();a.push(last.o);localStorage.setItem("nt_trips",JSON.stringify(a.slice(-10)));list();toast(t("savedok"))};
$("#share").onclick=async()=>{const u=location.origin+location.pathname+"#t="+btoa(unescape(encodeURIComponent(JSON.stringify(last.o))));try{await navigator.clipboard.writeText(u);toast(t("copied"))}catch(e){prompt("Link",u)}};
$("#copy").onclick=async()=>{try{await navigator.clipboard.writeText(text(last));toast(t("copied"))}catch(e){prompt("Text",text(last))}};
$("#print").onclick=()=>print();
$("#list").addEventListener("click",e=>{const a=store(),b=e.target;if(b.dataset.o!==undefined)go(a[b.dataset.o]);if(b.dataset.x!==undefined){a.splice(b.dataset.x,1);localStorage.setItem("nt_trips",JSON.stringify(a));list()}});
$("#s").innerHTML=Object.keys(CITIES).map(c=>`<option>${c}</option>`).join("");
applyLang();
if(location.hash.startsWith("#t=")){try{go(JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3))))))}catch(e){}}
