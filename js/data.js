export const GAL_L = 3.785411784;
const mkTank = (id, name, capacityGal, kind='reserva') => ({ id, name, capacityGal, currentGal: null, kind });
export function makeDefaultState() {
  return {
    version: 1,
    settings: { premium: 4.60, g2: 4.00, cnelRate: 0.10, leadDays: 2, safetyDays: 0.5, dailyHours: 24, refillAt: 50, topupAt: 95, serviceCostGal: 0, currency: 'USD' },
    simulation: { hours: 24, generators: { G1: {enabled:true, load:75}, G2: {enabled:true,load:75}, G3: {enabled:true,load:75} }, fuel: 'premium' },
    generators: [
      { id: 'G1', name:'GEN-01', model:'Baudouin · 500 kVA', kva: 500, pf: 0.8, tankLiters:900, curve:{25:null,50:null,75:20,100:null} },
      { id: 'G2', name:'GEN-02', model:'Baudouin · 500 kVA', kva: 500, pf: 0.8, tankLiters:900, curve:{25:null,50:null,75:20,100:null} },
      { id: 'G3', name:'GEN-03', model:'Cummins · 850 kVA', kva: 850, pf: 0.8, tankLiters:600,
        curve:{25:94/GAL_L,50:157/GAL_L,75:221/GAL_L,100:289/GAL_L} }
    ],
    tanks: [mkTank('R1','Reservorio 01',660),mkTank('R2','Reservorio 02',660),
       ...[1,2,3,4,5].map(n=>mkTank(`IVT${n}`,`IVT ${String(n).padStart(2,'0')}`,250)),
       mkTank('G1T','Tanque GEN-01',900/GAL_L,'generador'),
       mkTank('G2T','Tanque GEN-02',900/GAL_L,'generador'),
       mkTank('G3T','Tanque GEN-03',600/GAL_L,'generador')],
    transfers: [], operations: [], measuredKwh: null
  };
}
