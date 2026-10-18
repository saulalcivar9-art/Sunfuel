const fmt = n=>Number(n).toLocaleString('es-EC',{maximumFractionDigits:1});
export function generatorChart(rows){
  if(!rows.length)return '<p class="muted">Selecciona al menos un generador.</p>';
  const max=Math.max(1,...rows.map(r=>r.gph));
  return `<div class="bars">${rows.map((r,i)=>`<div class="barline"><div class="bar-head"><span>${r.name}</span><b>${fmt(r.gph)} gal/h</b></div><div class="bartrack"><div class="barfill tone-${i}" style="width:${Math.min(100,r.gph/max*100)}%"></div></div></div>`).join('')}</div>`;
}
export function fuelCostChart(premium,g2){
  const max=Math.max(1,premium,g2);
  return `<div class="bars"><div class="barline"><div class="bar-head"><span>Premium</span><b>$${fmt(premium)}</b></div><div class="bartrack"><div class="barfill tone-0" style="width:${premium/max*100}%"></div></div></div><div class="barline"><div class="bar-head"><span>G2</span><b>$${fmt(g2)}</b></div><div class="bartrack"><div class="barfill tone-1" style="width:${g2/max*100}%"></div></div></div></div>`;
}
