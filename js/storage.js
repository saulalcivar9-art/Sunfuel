import { makeDefaultState } from './data.js';
const STORAGE_KEY='sunchodesa-fuel-v1';
export function loadState(){
 try {
  const stored=localStorage.getItem(STORAGE_KEY);
  if(!stored)return makeDefaultState();
  const value=JSON.parse(stored);
  if(value.version!==1||!Array.isArray(value.generators)||!Array.isArray(value.tanks))throw Error('Estructura inválida');
  return value;
 } catch {return makeDefaultState()}
}
export const saveState=state=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
export function exportBackup(state){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`SUNFUEL_respaldo_${new Date().toISOString().slice(0,10)}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
export async function importBackup(file){
  const content=JSON.parse(await file.text());
  if(content.version!==1||!content.settings||!content.simulation||!content.simulation.generators||!Array.isArray(content.tanks)||!Array.isArray(content.generators)||!Array.isArray(content.transfers)||!Array.isArray(content.operations))throw new Error('El archivo no contiene un respaldo válido de SUN Fuel.');
  return content;
}
