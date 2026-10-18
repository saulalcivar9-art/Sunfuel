import {GAL_L} from './data.js';
import {loadState,saveState,exportBackup,importBackup} from './storage.js';
import {runSimulation,projectedReorder,reserveStats,transferFuel,round} from './engine.js';
import {generatorChart,fuelCostChart} from './charts.js';
let state=loadState();let page='inicio';let notifyTimer;
const root=document.querySelector('#content');
const money=n=>Number(n).toLocaleString('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:2});
const fmt=(n,d=1)=>Number(n).toLocaleString('es-EC',{maximumFractionDigits:d});
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pct=n=>Math.max(0,Math.min(100,n));
const card=(label,value,tone='',foot='')=>`<article class="card"><div class="label-top">${label}</div><div class="value ${tone} numbers">${value}</div>${foot?`<div class="foot">${foot}</div>`:''}</article>`;
const notice=(text,tone='')=>`<div class="note ${tone}">${text}</div>`;
const head=(tag,title,sub)=>`<div class="page-head"><div class="eyebrow">${tag}</div><h1>${title}</h1><p class="section-lead">${sub}</p></div>`;
const title=(text,end='')=>`<h2>${text}${end}</h2>`;
function toast(msg,error=false){const element=document.querySelector('#toast');element.textContent=msg;element.className=`toast show${error?' error':''}`;clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>element.className='toast',3700)}
function persist(){saveState(state)}
function render(){
 const views={inicio:renderInicio,simulador:renderSim,cnel:renderCnel,reservas:renderReservas,tanqueadas:renderTanqueadas,ajustes:renderAjustes};
 root.innerHTML=views[page]();
 document.querySelectorAll('.nav-btn').forEach(button=>{const selected=button.dataset.page===page;button.classList.toggle('active',selected);button.setAttribute('aria-current',selected?'page':'false')});
}
function renderInicio(){
 const sim=runSimulation(state),res=projectedReorder(state);
 const levelLabel=res.reserve.unknown?`${res.reserve.unknown} sin registrar`:`${fmt(res.reserve.known)} gal disponibles`;
 return `${head('Panel general','Control energético','Consumo estimado, costos comparados y disponibilidad de diésel de la planta.')}
 <section class="hero"><span class="pill yellow">⚡ ESCENARIO ACTIVO · ${fmt(sim.hours,0)} HORAS</span><div class="metric">${fmt(sim.gallons)} <span>galones</span></div><div class="caption">Consumo proyectado con ${sim.rows.length} generador(es) · ${fmt(sim.gph)} gal/h</div></section>
 <div class="grid three">${card('Costo Premium',money(sim.premium),'yellow')}${card('Costo G2',money(sim.g2),'blue')}${card('Diferencia bruta',money(sim.saved),sim.saved>=0?'green':'red')}</div>
 <div class="split" style="margin-top:16px"><section class="card">${title('Consumo por generador')} ${generatorChart(sim.rows)}<button data-go="simulador" class="btn secondary block">Modificar escenario →</button></section>
 <section class="card">${title('Reserva central + IVT')}<div class="value yellow">${res.reserve.unknown?'Incompleta':`${fmt(res.reserve.known)} gal`}</div><p class="foot">Capacidad nominal: ${fmt(res.reserve.capacity)} gal · ${levelLabel}</p>
 <div class="progress"><i style="width:${pct(res.reserve.known/res.reserve.capacity*100)}%"></i></div>
 <p class="foot">Plazo de proveedor: ${fmt(state.settings.leadDays)} días · Reserva de seguridad: ${fmt(state.settings.safetyDays)} días.</p>
 ${res.reserve.unknown?notice('Registra el nivel real de los 7 depósitos para calcular la fecha de reabastecimiento.','blue'):(res.requiresOrder?notice('Según el consumo y el plazo configurados, se alcanzó el punto de reposición.','alert'):notice('El inventario supera el punto de reposición del escenario activo.','blue'))}
 <button data-go="reservas" class="btn ghost block" style="margin-top:13px">Actualizar inventario →</button></section></div>
 <section class="card" style="margin-top:16px">${title('Enfoque de la aplicación')}<p class="foot">La producción eléctrica estimada se calcula con kVA × factor de potencia × porcentaje de carga × horas. Para la compensación CNEL se puede ingresar la energía medida. Las cifras mostradas no sustituyen los medidores ni la liquidación aprobada por CNEL.</p></section>`;
}
function renderSim(){
 const sim=runSimulation(state);const premiumSelected=state.simulation.fuel==='premium';
 return `${head('Simulación de operación','Calculadora de diésel','Define qué generadores operan, su porcentaje de carga y las horas. Puedes ajustar las curvas de consumo en Ajustes.')}
 <div class="split"><section class="card">${title('Condiciones de operación')}
 <div class="form-group"><label for="s-hours">Duración del escenario (horas)</label><input id="s-hours" type="number" min="0.1" max="744" step="0.5" data-simulation="hours" value="${sim.hours}"></div>
 <div class="stack">${state.generators.map(g=>{const s=state.simulation.generators[g.id];const rate=sim.rows.find(r=>r.id===g.id);return `<div class="generator ${s.enabled?'':'off'}"><div class="row"><div><div class="gen-title">${g.name}</div><div class="gen-meta">${g.model} · ${fmt(g.kva*g.pf*s.load/100,0)} kW previstos</div></div><label class="toggle" aria-label="Activar ${g.name}"><input type="checkbox" data-enabled="${g.id}" ${s.enabled?'checked':''}></label></div>
 <div class="load-controls">${[25,50,75,100].map(load=>`<button data-load-gen="${g.id}" data-load="${load}" class="chip ${s.load===load?'selected':''}">${load}%</button>`).join('')}</div>
 <div class="foot">${rate?`${fmt(rate.gph)} gal/h · ${rate.quality}`:'Activar para incluir en totales'}</div></div>`}).join('')}</div>
 <div class="form-group" style="margin-top:17px"><label>Precio utilizado para el costo principal</label><div class="field-row"><button class="btn ${premiumSelected?'primary':'ghost'}" data-fuel="premium">Premium</button><button class="btn ${premiumSelected?'ghost':'secondary'}" data-fuel="g2">Diésel G2</button></div></div>
 </section><div class="stack"><section class="card">${title('Resumen · '+fmt(sim.hours,0)+' h')}<div class="grid">${card('Consumo',''+fmt(sim.gallons)+' gal','yellow')}${card('Generación',''+fmt(sim.kwh,0)+' kWh','blue')}</div>
 <div class="divider"></div><div class="row"><span class="muted small">Costo ${premiumSelected?'Premium':'G2'}</span><div class="value">${money(premiumSelected?sim.premium:sim.g2)}</div></div><p class="foot">Potencia activa conjunta: ${fmt(sim.rows.reduce((v,r)=>v+r.kw,0))} kW · ${fmt(sim.gph)} gal/h.</p></section>
 <section class="card">${title('Comparación por combustible')}${fuelCostChart(sim.premium,sim.g2)}<p class="foot">Precios de referencia: Premium ${money(state.settings.premium)}/gal · G2 ${money(state.settings.g2)}/gal.</p></section>
 ${sim.warning?notice('Algunas curvas no están medidas. Para los motores de 500 kVA solo se conoce provisionalmente el consumo de 20 gal/h al 75%; otras cargas utilizan extrapolación proporcional orientativa.','alert'):notice('Los consumos provienen de puntos de ficha o introducidos por el usuario. Verifica que la carga y la ficha correspondan a las condiciones reales.','blue')}
 </div></div>`;
}
function renderCnel(){
 const sim=runSimulation(state);
 const meter=state.measuredKwh===null||state.measuredKwh===''?null:Number(state.measuredKwh);
 const kwh=meter===null?sim.kwh:meter;
 const amount=kwh*state.settings.cnelRate;
 const diffPremium=amount-sim.premium;
 const diffG2=amount-sim.g2;
 return `${head('Compensación','Proyección CNEL','Separación entre energía registrada por medidor y estimada por carga del generador. La tarifa es editable.')}
 <div class="split"><section class="card">${title('Datos de liquidación')}
 <div class="form-group"><label for="c-rate">Tasa ingresada por CNEL (USD/kWh)</label><input id="c-rate" data-setting="cnelRate" type="number" min="0" step="0.0001" value="${state.settings.cnelRate}"></div>
 <div class="form-group"><label for="c-kwh">Energía medida (kWh) — opcional</label><input id="c-kwh" data-measured-kwh type="number" min="0" step="0.1" placeholder="Vacío = calcular con potencia y horas" value="${meter===null?'':meter}"></div>
 <p class="foot">Si no tienes el dato del medidor, se usan ${fmt(sim.kwh,0)} kWh calculados por potencia nominal, factor de potencia y carga seleccionada. Si conoces los kW reales del tablero, introduce la energía calculada a partir de ellos.</p>
 ${notice('La energía estimada no acredita que CNEL reconozca exactamente esos kWh. El resultado no incorpora reglas adicionales de elegibilidad, pérdidas, impuestos ni límites contractuales.','blue')}</section>
 <div class="stack"><section class="card"><span class="pill ${meter===null?'yellow':'green'}">${meter===null?'ESTIMACIÓN · NO MEDIDA':'ENERGÍA INTRODUCIDA'}</span><div class="label-top" style="margin-top:14px">Energía para cálculo</div><div class="value blue">${fmt(kwh,1)} kWh</div><div class="divider"></div><div class="label-top">Compensación bruta teórica</div><div class="value green">${money(amount)}</div></section>
 <section class="card">${title('Compensación menos diésel')}<div class="line-items"><div class="line-item"><span>Con Premium</span><b style="color:${diffPremium<0?'var(--red)':'var(--green)'}">${money(diffPremium)}</b></div><div class="line-item"><span>Con G2</span><b style="color:${diffG2<0?'var(--red)':'var(--green)'}">${money(diffG2)}</b></div></div><p class="foot">No son utilidades netas: faltan mantenimiento, transporte, otros consumibles y costos de tratamiento del G2.</p></section></div></div>`;
}
function tankCard(t){const known=t.currentGal!==null;const percent=known?pct(t.currentGal/t.capacityGal*100):null;const isGen=t.kind==='generador';const alert=known&&isGen&&percent<=state.settings.refillAt;
 return `<article class="tank" data-tank-card="${t.id}"><div class="row"><div><div class="tank-label">${t.name}</div><div class="tank-amount">${known?`${fmt(t.currentGal)} / ${fmt(t.capacityGal)} gal`:`Capacidad ${fmt(t.capacityGal)} gal`}</div></div><span class="${alert?'pill red':known?'pill blue':'pill yellow'}">${known?`${fmt(percent,0)}%`:'Sin dato'}</span></div>
 <div class="progress"><i style="width:${known?percent:0}%;background:${alert?'var(--red)':'var(--yellow)'}"></i></div>
 <div class="tank-controls">${[0,50,100].map(percentButton=>`<button class="chip ${known&&Math.abs(percent-percentButton)<.001?'selected':''}" data-tank="${t.id}" data-percent="${percentButton}">${percentButton===0?'Vacío':percentButton===50?'Mitad':'Lleno'}</button>`).join('')}</div>
 <div class="row"><span class="muted tiny">Nivel manual (%)</span><input aria-label="Porcentaje actual de ${t.name}" type="number" min="0" max="100" step="0.1" class="percent-input" data-tank-level="${t.id}" placeholder="—" value="${known?round(percent,1):''}"></div>
 ${alert?'<p class="foot" style="color:var(--red)">Nivel ≤ umbral de tanqueada</p>':''}</article>`;
}
function renderReservas(){const res=projectedReorder(state);const simulated=runSimulation(state);
 return `${head('Almacenamiento','Control de reservas','Registra el nivel real de cada depósito. Los siete tanques de reserva están separados de los tres tanques de servicio.')}
 <div class="grid three">${card('Reserva confirmada',`${fmt(res.reserve.known)} gal`,'yellow',res.reserve.unknown?`${res.reserve.unknown} depósitos pendientes de medir`:'Los siete niveles están registrados')}
 ${card('Capacidad total',`${fmt(res.reserve.capacity)} gal`,'blue','Dos reservorios y cinco IVT')}
 ${card('Consumo diario simulado',`${fmt(res.dailyUse)} gal`,'','Según los equipos activos y las horas diarias')}</div>
 <section class="card" style="margin-top:15px">${title('Reposición según proveedor')}
 <div class="field-row three"><div><label>Días para despacho</label><input type="number" data-setting="leadDays" min="0" step="0.5" value="${state.settings.leadDays}"></div><div><label>Horas de uso por día</label><input type="number" data-setting="dailyHours" min="0" max="24" step="0.5" value="${state.settings.dailyHours}"></div><div><label>Días de seguridad</label><input type="number" data-setting="safetyDays" min="0" step="0.5" value="${state.settings.safetyDays}"></div></div>
 <div class="grid"><div><div class="label-top">Punto teórico para volver a pedir</div><div class="value yellow">${fmt(res.reorder)} gal</div></div><div><div class="label-top">Autonomía del combustible registrado</div><div class="value">${res.timeDays===null?'—':`${fmt(res.timeDays,2)} días`}</div></div></div>
 <div class="divider"></div>${res.reserve.unknown?notice('Faltan niveles. La autonomía y la decisión de compra no son confiables hasta registrar todos los depósitos.','alert'):res.requiresOrder?notice('⚠ Es momento de programar pedido: la reserva está en/bajo el punto de reposición.','alert'):notice('Con el escenario actual, el inventario supera el punto de reposición.','blue')}
 <p class="foot">La reserva necesaria se calcula: consumo diario × (días del proveedor + días de seguridad). Considera las horas/día seleccionadas, no asume uso continuo si no lo configuras.</p></section>
 <h2 style="margin-top:23px">Almacenamiento central e IVT <span class="muted small">(7 depósitos)</span></h2><div class="grid">${state.tanks.filter(t=>t.kind==='reserva').map(tankCard).join('')}</div>
 <h2 style="margin-top:23px">Tanques individuales <span class="muted small">(3 generadores)</span></h2><div class="grid three">${state.tanks.filter(t=>t.kind==='generador').map(tankCard).join('')}</div>
 ${notice(`Aviso de tanqueada: al ${fmt(state.settings.refillAt,0)}% de capacidad. Objetivo recomendado de llenado: ${fmt(state.settings.topupAt,0)}%, sujeto a las protecciones reales. En esta versión los niveles se actualizan manualmente o al registrar trasvases.`, 'blue')}`;
}
function renderTanqueadas(){
 const sim=runSimulation(state);
 const usable=reserveStats(state.tanks);
 return `${head('Operaciones','Registro de tanqueadas','Documenta cada trasvase a GEN-01, GEN-02 o GEN-03. El sistema descuenta del depósito elegido y añade al tanque del generador.')}
 <div class="split"><section class="card">${title('Nueva tanqueada')}
 <form id="transfer-form" class="stack">
 <div><label for="source-tank">Depósito de origen</label><select id="source-tank" name="tankId" required>${state.tanks.filter(t=>t.kind==='reserva').map(t=>`<option value="${t.id}">${t.name} (${t.currentGal===null?'sin dato':fmt(t.currentGal)+' gal'})</option>`).join('')}</select></div>
 <div><label for="gen-to">Generador destinatario</label><select id="gen-to" name="generatorId">${state.generators.map(g=>`<option value="${g.id}">${g.name}</option>`).join('')}</select></div>
 <div><label for="transfer-amount">Galones transferidos</label><input id="transfer-amount" name="gallons" required type="number" min="0.1" step="0.01" placeholder="Ej.: 75"></div>
 <div><label for="transfer-notes">Observación (opcional)</label><input id="transfer-notes" name="notes" maxlength="180" placeholder="Ej.: Tanqueada turno nocturno"></div>
 <button type="submit" class="btn primary block">+ Registrar tanqueada</button></form>
 <p class="foot">Para evitar inventarios ficticios, registra primero el nivel inicial de origen y destino en Reservas. No se permite transferir más del stock disponible ni exceder la capacidad del receptor.</p></section>
 <section class="stack"><article class="card">${title('Previsión máxima de 24 h')}<div class="value yellow">${fmt(sim.gph*24)} gal</div><p class="foot">Basado en el escenario actual. Reserva externa registrada: ${fmt(usable.known)} gal.</p>${usable.unknown?notice('Todavía falta registrar inventario de uno o más tanques de reserva.','alert'):''}</article>
 <article class="card">${title('Registrar una jornada')}<form id="operation-form" class="stack"><div><label>Horas efectivamente operadas</label><input type="number" name="hours" min="0.1" max="24" step="0.1" value="8" required></div><div><label>Descripción</label><input name="notes" placeholder="Ej.: Turno mañana" maxlength="140"></div><button class="btn secondary block" type="submit">Guardar consumo estimado</button></form><p class="foot">Registra la jornada con los generadores activos y cargas que hayas seleccionado en Simular. Este registro no descuenta combustible de los tanques automáticamente: debes conciliar el nivel real para evitar duplicar consumos y trasvases.</p></article></section></div>
 <section class="card" style="margin-top:18px">${title('Últimas tanqueadas')}${state.transfers.length?`<div class="line-items">${state.transfers.slice(0,12).map(t=>`<div class="line-item"><div><strong>${escapeHtml(t.tankId)} → ${escapeHtml(t.generatorId)}</strong><div class="sub">${new Date(t.timestamp).toLocaleString('es-EC')} · ${escapeHtml(t.notes||'Sin observación')}</div></div><b class="yellow">${fmt(t.gallons)} gal</b></div>`).join('')}</div>`:'<div class="empty">Aún no se han registrado tanqueadas.</div>'}</section>
 <section class="card" style="margin-top:18px">${title('Jornadas registradas')}${state.operations.length?`<div class="line-items">${state.operations.slice(0,8).map(t=>`<div class="line-item"><div><strong>${fmt(t.hours)} h · ${fmt(t.gallons)} gal estimados</strong><div class="sub">${new Date(t.timestamp).toLocaleString('es-EC')} · ${escapeHtml(t.notes||'Sin notas')}</div></div><b>${fmt(t.kwh)} kWh</b></div>`).join('')}</div>`:'<div class="empty">Sin jornadas registradas.</div>'}</section>`;
}
function renderAjustes(){return `${head('Personalización','Parámetros y respaldo','Personaliza los costos y las curvas de combustible. Los cambios se guardan localmente en este dispositivo.')}
 <div class="split"><div class="stack"><section class="card">${title('Precios y control')}
 <div class="field-row"><div><label>Premium (USD/gal)</label><input type="number" data-setting="premium" min="0" step="0.01" value="${state.settings.premium}"></div><div><label>G2 (USD/gal)</label><input type="number" data-setting="g2" min="0" step="0.01" value="${state.settings.g2}"></div></div>
 <div class="field-row"><div><label>Tasa CNEL (USD/kWh)</label><input type="number" data-setting="cnelRate" min="0" step="0.0001" value="${state.settings.cnelRate}"></div><div><label>Alarma de nivel (%)</label><input type="number" data-setting="refillAt" min="1" max="90" step="1" value="${state.settings.refillAt}"></div></div>
 ${notice('El precio Premium USD 4,60 es una referencia histórica; el G2 USD 4,00 y la tasa CNEL USD 0,10 son ejemplos editables, no valores confirmados.','blue')}</section>
 <section class="card">${title('Datos y copias de seguridad')}<div class="stack"><button id="export-data" class="btn primary block">↓ Descargar respaldo JSON</button><label for="backup-file">Restaurar un respaldo:</label><input id="backup-file" class="backup-file" type="file" accept="application/json,.json"><p class="foot">La versión inicial guarda datos mediante localStorage del navegador. No hay cuentas, nube ni sincronización. Eliminar datos del sitio puede borrar tus registros. Realiza copias periódicas.</p></div></section></div>
 <section class="card">${title('Curvas de consumo por carga')}<p class="foot">Galones por hora a carga 25%, 50%, 75% y 100%. El Cummins viene con la ficha de fábrica; Baudouin cuenta inicialmente solo con 20 gal/h reportados al 75%. Deja en blanco si no conoces el valor.</p>
 ${state.generators.map(g=>`<div class="generator" style="margin-top:12px"><div class="gen-title">${g.name}</div><div class="gen-meta">${g.model} · ${fmt(g.tankLiters)} litros de tanque</div><div class="field-row" style="margin-top:14px">${[25,50,75,100].map(load=>`<div><label>${load}% (gal/h)</label><input aria-label="Consumo ${g.name} al ${load}%" type="number" data-curve-gen="${g.id}" data-curve-load="${load}" min="0" step="0.01" value="${g.curve[load]===null?'':round(g.curve[load],3)}" placeholder="No medido"></div>`).join('')}</div></div>`).join('')}
 <p class="foot">Si falta un valor se interpola entre dos cargas conocidas. Fuera del rango disponible se calcula una aproximación proporcional, que puede diferir sustancialmente del consumo real.</p></section></div>`;}
function handleAction(button){
 if(button.dataset.go){page=button.dataset.go;render();window.scrollTo({top:0,behavior:'smooth'});return}
 if(button.dataset.page){page=button.dataset.page;render();window.scrollTo({top:0,behavior:'smooth'});return}
 if(button.dataset.loadGen){state.simulation.generators[button.dataset.loadGen].load=Number(button.dataset.load);persist();render();return}
 if(button.dataset.fuel){state.simulation.fuel=button.dataset.fuel;persist();render();return}
 if(button.dataset.tank){const tank=state.tanks.find(t=>t.id===button.dataset.tank);if(tank){tank.currentGal=round(tank.capacityGal*Number(button.dataset.percent)/100,3);persist();render();toast(`${tank.name} actualizado a ${button.dataset.percent}%`)}return}
 if(button.id==='export-data'){exportBackup(state);toast('Respaldo generado. Guárdalo fuera del navegador.');return}
}
function handleChange(element){
 if(element.dataset.enabled){state.simulation.generators[element.dataset.enabled].enabled=element.checked;persist();render();return}
 if(element.dataset.simulation==='hours'){
  const value=Number(element.value);if(!Number.isFinite(value)||value<=0||value>744){toast('Utiliza entre 0,1 y 744 horas.',true);render();return}
  state.simulation.hours=value;persist();render();return;
 }
 if(element.dataset.setting){const key=element.dataset.setting;const value=Number(element.value);
  if(element.value.trim()===''||!Number.isFinite(value)||value<0||(key==='dailyHours'&&value>24)||(key==='refillAt'&&value>90)){toast('Revisa el valor introducido.',true);render();return}
  state.settings[key]=value;persist();render();return}
 if(element.hasAttribute('data-measured-kwh')){if(element.value.trim()===''){state.measuredKwh=null}else{const val=Number(element.value);if(!Number.isFinite(val)||val<0){toast('La energía debe ser un número positivo.',true);render();return}state.measuredKwh=val}persist();render();return}
 if(element.dataset.tankLevel){const tank=state.tanks.find(t=>t.id===element.dataset.tankLevel);
  if(element.value.trim()==='')tank.currentGal=null;
  else{const v=Number(element.value);if(!Number.isFinite(v)||v<0||v>100){toast('Nivel permitido: de 0% a 100%.',true);render();return}tank.currentGal=round(tank.capacityGal*v/100,3)}
  persist();render();return}
 if(element.dataset.curveGen){const g=state.generators.find(x=>x.id===element.dataset.curveGen);const value=element.value.trim()===''?null:Number(element.value);
  if(value!==null&&(!Number.isFinite(value)||value<0)){toast('Indica galones/hora positivos.',true);render();return}
  g.curve[element.dataset.curveLoad]=value;persist();render();toast(`Curva de ${g.name} actualizada`);return}
 if(element.id==='backup-file'&&element.files[0]){importBackup(element.files[0]).then(recovered=>{state=recovered;persist();render();toast('Respaldo importado correctamente.')}).catch(err=>toast(err.message,true));return}
}
root.addEventListener('click',event=>{const button=event.target.closest('button');if(button&&(!button.closest('form')||button.type!=='submit'))handleAction(button)});
document.querySelector('#nav').addEventListener('click',event=>{const button=event.target.closest('button');if(button)handleAction(button)});
root.addEventListener('change',event=>handleChange(event.target));
root.addEventListener('submit',event=>{
 event.preventDefault();const form=event.target;
 if(form.id==='transfer-form'){
  const fields=Object.fromEntries(new FormData(form));
  try{transferFuel(state,fields);persist();render();toast('Tanqueada registrada. Inventarios actualizados.')}catch(error){toast(error.message,true)}
 }else if(form.id==='operation-form'){
  const fields=Object.fromEntries(new FormData(form));const hours=Number(fields.hours);
  if(!Number.isFinite(hours)||hours<=0||hours>24){toast('Cada jornada debe tener entre 0,1 y 24 horas.',true);return}
  const copy=structuredClone(state);copy.simulation.hours=hours;const calc=runSimulation(copy);
  if(!calc.rows.length){toast('Selecciona al menos un generador en Simular.',true);return}
  state.operations.unshift({id:`o-${Date.now()}`,timestamp:new Date().toISOString(),hours,gallons:round(calc.gallons,3),kwh:round(calc.kwh,3),items:calc.rows.map(r=>({id:r.id,load:r.load,gph:r.gph})),notes:String(fields.notes||'').slice(0,140)});
  if(state.operations.length>500)state.operations.length=500;
  persist();render();toast('Jornada registrada (consumo estimado).');
 }
});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
window.addEventListener('online',()=>{const el=document.querySelector('#status-pill');if(el)el.innerHTML='<i></i> LOCAL'});
window.addEventListener('offline',()=>{const el=document.querySelector('#status-pill');if(el)el.innerHTML='<i></i> SIN RED'});
render();
