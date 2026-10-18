import { GAL_L } from './data.js';
export const round = (value,d=1)=>Number(value.toFixed(d));
export const totalCapacity = (tanks,kind='reserva') => tanks.filter(t=>t.kind===kind).reduce((a,t)=>a+t.capacityGal,0);
export function reserveStats(tanks,kind='reserva') {
  const selected=tanks.filter(t=>t.kind===kind);
  return { capacity: selected.reduce((n,t)=>n+t.capacityGal,0),
    known: selected.filter(t=>t.currentGal!==null).reduce((n,t)=>n+t.currentGal,0),
    unknown: selected.filter(t=>t.currentGal===null).length,
    filled: selected.length-selected.filter(t=>t.currentGal===null).length };
}
export function gphAt(generator,load) {
  const entries=Object.entries(generator.curve).filter(([,val])=>Number.isFinite(val)&&val>=0).map(([key,val])=>[Number(key),val]).sort((a,b)=>a[0]-b[0]);
  const exact=entries.find(([level])=>level===Number(load));
  if(exact) return {gph:exact[1],quality:'ficha/usuario'};
  if(entries.length===0) return {gph:0,quality:'sin datos'};
  const lower=entries.filter(([level])=>level<load).at(-1);
  const upper=entries.find(([level])=>level>load);
  if(lower&&upper) return {gph:lower[1]+(upper[1]-lower[1])*(load-lower[0])/(upper[0]-lower[0]),quality:'interpolado'};
  // A single reference point cannot establish the true fuel curve. Display a cautious estimated proportional extrapolation.
  const nearest=lower||upper;
  return {gph:nearest[1]*load/nearest[0],quality:'aproximación proporcional'};
}
export function runSimulation(state) {
  const rows=state.generators.filter(g=>state.simulation.generators[g.id]?.enabled).map(g=>{
    const load=Number(state.simulation.generators[g.id].load);
    const {gph,quality}=gphAt(g,load);
    return {id:g.id,name:g.name,load,kva:g.kva,kw:g.kva*g.pf*load/100,gph,quality,gal:gph*state.simulation.hours};
  });
  const hours=Number(state.simulation.hours)||0;
  const gph=rows.reduce((a,r)=>a+r.gph,0);
  const kwh=rows.reduce((a,r)=>a+r.kw*hours,0);
  const gallons=gph*hours;
  const warning=rows.some(r=>r.quality==='aproximación proporcional'||r.quality==='sin datos');
  const premium=gallons*state.settings.premium;
  const g2=gallons*state.settings.g2;
  return {rows,hours,gph,kwh,gallons,premium,g2,warning,compensation:kwh*state.settings.cnelRate,
    saved:premium-g2, pricePerKwh: kwh>0?premium/kwh:null};
}
export function projectedReorder(state) {
  const result=runSimulation(state);
  const reserve=reserveStats(state.tanks);
  const dailyUse=result.gph*state.settings.dailyHours;
  const beforeDelivery=dailyUse*state.settings.leadDays;
  const safety=dailyUse*state.settings.safetyDays;
  const reorder=beforeDelivery+safety;
  const timeDays=dailyUse?reserve.known/dailyUse:null;
  return {reserve,dailyUse,beforeDelivery,safety,reorder,timeDays,
    deficit:Math.max(0,reorder-reserve.known),
    reliable:reserve.unknown===0 && result.gph>0,
    requiresOrder:reserve.known<=reorder};
}
export function sourceTankForGenerator(id){return `${id}T`}
export function transferFuel(state,{tankId,generatorId,gallons,notes='',timestamp}) {
  const qty=Number(gallons);
  const from=state.tanks.find(t=>t.id===tankId&&t.kind==='reserva');
  const to=state.tanks.find(t=>t.id===sourceTankForGenerator(generatorId));
  if(!from||!to) throw new Error('Selecciona un depósito de origen y un generador válidos.');
  if(!Number.isFinite(qty)||qty<=0) throw new Error('Indica una cantidad válida mayor que cero.');
  if(from.currentGal===null||to.currentGal===null) throw new Error('Primero registra el nivel inicial de ambos tanques en Reservas.');
  if(qty>from.currentGal+1e-6) throw new Error('El tanque de origen no dispone de ese combustible.');
  if(qty>to.capacityGal-to.currentGal+1e-6) throw new Error('El tanque del generador no tiene capacidad suficiente.');
  from.currentGal=round(from.currentGal-qty,3);
  to.currentGal=round(to.currentGal+qty,3);
  state.transfers.unshift({id:`t-${Date.now()}`,tankId,generatorId,gallons:qty,notes:notes.trim(),timestamp:timestamp||new Date().toISOString()});
  if(state.transfers.length>500)state.transfers.length=500;
  return state;
}
export const tankUnit = (generator) => generator.tankLiters / GAL_L;
