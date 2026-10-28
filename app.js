const $=id=>document.getElementById(id);
const IDS=["st","en","aht","sl","thr","occ","shr"];
const base=[8,15,28,45,60,72,80,75,68,70,78,85,90,82,70,65,68,72,75,70,60,48,38,30,22,15,10,6];
let calls=new Array(48).fill(0),prog=new Array(48).fill(null);
base.forEach((v,i)=>calls[14+i]=v);
const lab=i=>String(Math.floor(i/2)).padStart(2,"0")+":"+(i%2?"30":"00");
const f=(x,d=1)=>isFinite(x)?x.toFixed(d):"—";

function metrics(N,A,aht,T){
  let B=1;for(let i=1;i<=N;i++)B=A*B/(i+A*B);
  const C=N>A?B/(1-(A/N)*(1-B)):1;
  return{C,sl:N>A?1-C*Math.exp(-(N-A)*T/aht):0,asa:N>A?C*aht/(N-A):Infinity,occ:A/N};
}
function solve(c,q){
  const A=c*q.aht/1800;
  if(A<=0)return{A:0,N:0,sched:0,sl:1,asa:0,occ:0};
  let N=Math.floor(A)+1,m;
  for(;N<5000;N++){m=metrics(N,A,q.aht,q.thr);if(m.sl>=q.sl&&m.occ<=q.occ)break}
  return{A,N,sched:Math.ceil(N/(1-q.shr)),...m};
}
function P(){return{st:+$("st").value,en:+$("en").value,aht:Math.max(1,+$("aht").value||1),sl:(+$("sl").value||0)/100,thr:+$("thr").value||1,occ:(+$("occ").value||100)/100,shr:Math.min(.9,(+$("shr").value||0)/100)}}
function range(q){const a=q.st*2,b=Math.max(a+1,q.en*2);const r=[];for(let i=a;i<b&&i<48;i++)r.push(i);return r}

function render(){
  const q=P(),rows=range(q);
  let h=`<tr><th>Franja</th><th>Llamadas</th><th>Erlangs</th><th>En línea</th><th>Cupos</th><th>NS</th><th>Ocupación</th><th>Programados</th><th>Diferencia</th></tr>`;
  rows.forEach(i=>{
    h+=`<tr id="r${i}"><td>${lab(i)}–${lab(i+1>47?0:i+1)}</td><td><input type="number" min="0" value="${calls[i]}" oninput="setC(${i},this.value)"></td><td></td><td></td><td></td><td></td><td></td><td><input type="number" min="0" value="${prog[i]??""}" oninput="setP(${i},this.value)"></td><td></td></tr>`;
  });
  h+=`<tr class="tot" id="rt"><td>Total</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
  $("tbl").innerHTML=h;
  calc();
}
function calc(){
  const q=P(),rows=range(q);
  let tc=0,hh=0,pk=0,pkL="",slW=0,gapN=0;
  const res={};
  rows.forEach(i=>{
    const r=solve(calls[i],q);res[i]=r;
    tc+=calls[i];hh+=r.sched*0.5;slW+=r.sl*calls[i];
    if(r.sched>pk){pk=r.sched;pkL=lab(i)}
    const c=$("r"+i).cells;
    c[2].textContent=f(r.A,2);c[3].textContent=r.N;c[4].innerHTML=`<b>${r.sched}</b>`;
    c[5].textContent=f(r.sl*100,0)+"%";c[6].textContent=f(r.occ*100,0)+"%";
    const g=prog[i];
    if(g==null||g===""){c[8].textContent=""}
    else{const d=g-r.sched;c[8].innerHTML=`<span class="${d>=0?"ok":"bad"}">${d>0?"+":""}${d}</span>`;}
  });
  const t=$("rt").cells;t[1].textContent=tc;t[4].textContent=pk+" (pico)";
  const avg=rows.length?hh/(rows.length*0.5):0;
  $("kpis").innerHTML=
   `<div class="kpi main"><b>${pk}</b><span>Cupos en la hora pico (${pkL||"—"})</span></div>`+
   `<div class="kpi"><b>${tc}</b><span>Llamadas del día</span></div>`+
   `<div class="kpi"><b>${f(hh,1)}</b><span>Horas-agente requeridas</span></div>`+
   `<div class="kpi"><b>${f(avg,1)}</b><span>Cupos promedio</span></div>`+
   `<div class="kpi"><b>${f(tc?slW/tc*100:0,0)}%</b><span>Nivel de servicio ponderado</span></div>`;
  chart(rows,res);save();
}
function chart(rows,res){
  const n=rows.length,w=Math.max(n*26+40,320),H=170,pad=22;
  const mx=Math.max(1,...rows.map(i=>Math.max(res[i].sched,+prog[i]||0)));
  let s=`<svg viewBox="0 0 ${w} ${H+pad}" width="${w}" height="${H+pad}" role="img" aria-label="Cupos por franja">`;
  rows.forEach((i,k)=>{
    const x=30+k*26,h1=res[i].sched/mx*(H-18),pg=+prog[i]||0,h2=pg/mx*(H-18);
    if(pg)s+=`<rect class="bar2" x="${x}" y="${H-h2}" width="20" height="${h2}"/>`;
    s+=`<rect class="bar" x="${x+(pg?4:0)}" y="${H-h1}" width="${pg?12:20}" height="${h1}"/>`;
    s+=`<text x="${x+10}" y="${H-h1-3}" text-anchor="middle">${res[i].sched}</text>`;
    if(k%2===0)s+=`<text x="${x+10}" y="${H+14}" text-anchor="middle">${lab(i)}</text>`;
  });
  $("chart").innerHTML=s+"</svg>";
}
function setC(i,v){calls[i]=Math.max(0,+v||0);calc()}
function setP(i,v){prog[i]=v===""?null:Math.max(0,+v||0);calc()}
function clearAll(){const q=P();range(q).forEach(i=>calls[i]=0);render()}
function doPaste(){
  const q=P(),nums=$("paste").value.split(/[\s,;]+/).filter(x=>x!=="").map(x=>Math.max(0,Math.round(+x)||0));
  nums.forEach((v,k)=>{if(q.st*2+k<48)calls[q.st*2+k]=v});$("paste").value="";render();
}
async function copyTbl(){
  const q=P();let t="Franja\tLlamadas\tEn linea\tCupos\n";
  range(q).forEach(i=>{const r=solve(calls[i],q);t+=`${lab(i)}\t${calls[i]}\t${r.N}\t${r.sched}\n`});
  try{await navigator.clipboard.writeText(t);alert("Copiado. Ya puedes pegarlo en Excel.")}
  catch(e){$("paste").value=t;alert("No se pudo copiar automáticamente. El texto quedó en el cuadro de pegar.")}
}
function save(){try{const o={calls,prog};IDS.forEach(i=>o[i]=$(i).value);localStorage.setItem("erlang-cupos-v2",JSON.stringify(o))}catch(e){}}
function load(){try{const o=JSON.parse(localStorage.getItem("erlang-cupos-v2")||"null");if(!o)return;
  IDS.forEach(i=>{if(o[i]!=null)$(i).value=o[i]});
  if(Array.isArray(o.calls)&&o.calls.length===48)calls=o.calls;
  if(Array.isArray(o.prog)&&o.prog.length===48)prog=o.prog}catch(e){}}
for(let h=0;h<=24;h++){const t=String(h).padStart(2,"0")+":00";
  if(h<24)$("st").add(new Option(t,h));$("en").add(new Option(t,h))}
$("st").value=7;$("en").value=21;
load();IDS.forEach(i=>$(i).addEventListener("input",render));render();

if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('./service-worker.js').catch(()=>{})})}
