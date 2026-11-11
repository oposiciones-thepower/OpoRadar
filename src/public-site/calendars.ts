import {validISO,toISO} from './dates';
export type Holiday = {date:string;name:string;scope:'nacional'|'autonómico'|'local'};
export type DeadlineCalendar = {id:string;municipality:string;region:string;years:number[];holidays:Holiday[];sources:{label:string;url:string}[];complete:boolean};
const regional2026:Holiday[] = [
  ['01-01','Año Nuevo','nacional'],['01-06','Epifanía','autonómico'],['02-28','Día de Andalucía','autonómico'],
  ['04-02','Jueves Santo','autonómico'],['04-03','Viernes Santo','nacional'],['05-01','Fiesta del Trabajo','nacional'],
  ['08-15','Asunción','nacional'],['10-12','Fiesta Nacional','nacional'],['11-02','Todos los Santos (traslado)','autonómico'],
  ['12-07','Constitución (traslado)','autonómico'],['12-08','Inmaculada','nacional'],['12-25','Navidad','nacional'],
].map(([day,name,scope])=>({date:'2026-'+day,name,scope:scope as Holiday['scope']}));
const sources=[{label:'Calendario administrativo 2026 · BOJA de 29/09/2025',url:'https://www.juntadeandalucia.es/boja/2025/187/26'},{label:'Calendario autonómico y sus modificaciones · Junta de Andalucía',url:'https://www.juntadeandalucia.es/servicios/tramites/presentacion-documentos/informacion-calendario.html'},{label:'Festivos locales · BOJA de 14/10/2025',url:'https://www.juntadeandalucia.es/boja/2025/197/28'}];
// Reference data, not an assertion about the calendar of a particular electronic registry.
export const referenceCalendars:DeadlineCalendar[]=[
  {id:'martos-2026',municipality:'Martos',region:'Andalucía',years:[2026],complete:true,sources,
    holidays:[...regional2026,{date:'2026-05-05',name:'Festivo de Martos',scope:'local'},{date:'2026-07-29',name:'Santa Marta',scope:'local'}]},
  {id:'fuerte-del-rey-2026',municipality:'Fuerte del Rey',region:'Andalucía',years:[2026],complete:true,sources,
    holidays:[...regional2026,{date:'2026-05-15',name:'Festivo local',scope:'local'},{date:'2026-10-07',name:'Festivo local',scope:'local'}]},
];
export const nextDate=(iso:string)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
export function dayReason(iso:string,calendar:DeadlineCalendar):string|null {
  const reasons=calendar.holidays.filter(d=>d.date===iso).map(d=>`${d.name} (${d.scope})`);
  const day=new Date(iso+'T12:00:00Z').getUTCDay();
  if(day===0||day===6)reasons.unshift(day===0?'Domingo':'Sábado');
  return reasons.length?reasons.join(' · '):null;
}
export function computeDeadline(input:{trigger:string;days:number;unit:'hábiles'|'naturales';includeTrigger?:boolean;calendar:DeadlineCalendar}):{end:string|null;start:string|null;excluded:{date:string;reason:string}[];error?:string} {
  const {trigger,days,unit,calendar}=input;
  const fail=(error:string)=>({end:null,start:null,excluded:[],error});
  if(!validISO(trigger)||!Number.isInteger(days)||days<1||days>366||!['hábiles','naturales'].includes(unit))return fail('Indica una fecha válida y un plazo de 1 a 366 días.');
  if(!calendar.complete||!calendar.sources.length)return fail('Falta un calendario completo con sus fuentes oficiales.');
  let date=input.includeTrigger?trigger:nextDate(trigger),start=date,count=0;const excluded:{date:string;reason:string}[]=[];
  while(count<days){
    if(!calendar.years.includes(Number(date.slice(0,4))))return fail('Falta el calendario del año '+date.slice(0,4)+'. No se calcula una fecha parcial.');
    const reason=dayReason(date,calendar);
    if(unit==='naturales'||!reason)count++;else excluded.push({date,reason});
    if(count<days)date=nextDate(date);
  }
  for(let i=0;i<370;i++){
    if(!calendar.years.includes(Number(date.slice(0,4))))return fail('Falta el calendario del año '+date.slice(0,4)+'. No se calcula una fecha parcial.');
    const reason=dayReason(date,calendar);
    if(!reason)return {end:date,start,excluded};
    excluded.push({date,reason:'Prórroga del vencimiento: '+reason});date=nextDate(date);
  }
  return fail('No se ha encontrado un vencimiento válido. Revisa el calendario.');
}
export function explicitRule(text:string):{trigger:string;days:number;unit:'hábiles'|'naturales'}|null {
  const normalized=text.replace(/\s+/g,' ');
  const m=normalized.match(/\b(\d{1,3}) días (hábiles|naturales) desde el día siguiente (?:a (?:la )?publicación|al BOE) de (\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
  const trigger=m&&toISO(m[3]);return m&&trigger?{trigger,days:Number(m[1]),unit:m[2].toLowerCase() as 'hábiles'|'naturales'}:null;
}
