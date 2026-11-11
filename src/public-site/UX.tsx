import {useEffect,useState,type ReactNode} from 'react';
import {ArrowUpRight,CalendarDays,ChevronDown} from 'lucide-react';
import {type Process} from './catalogue';
import {applicationText} from './journey';

export function DetailSection({id,title,children}:{id:string;title:string;children:ReactNode}){
 const [open,setOpen]=useState(true);
 useEffect(()=>{const media=window.matchMedia('(max-width: 640px)');setOpen(!media.matches);const change=()=>setOpen(!media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 return <details id={id} className="detail-disclosure" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary><h2>{title}</h2><ChevronDown size={20}/></summary><div>{children}</div></details>;
}
export function DetailNavigation(){
 useEffect(()=>{const reveal=()=>{if(!location.hash)return;let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}requestAnimationFrame(()=>{const target=document.getElementById(id);if(!target)return;if(target instanceof HTMLDetailsElement)target.open=true;const parent=target.closest('details.detail-disclosure');if(parent instanceof HTMLDetailsElement)parent.open=true;requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));});};reveal();window.addEventListener('hashchange',reveal);return()=>window.removeEventListener('hashchange',reveal);},[]);
 return <nav className="detail-index" aria-label="Secciones de la ficha">{[['documentos','Bases y documentos'],['plazos','Plazo'],['requisitos','Requisitos'],['recorrido','Fechas y fases'],['temario','Temario'],['resumen','Resumen']].map(([id,label])=><a key={id} href={'#'+id} onClick={()=>{const section=document.getElementById(id);if(section instanceof HTMLDetailsElement)section.open=true;}}>{label}</a>)}</nav>;}
export function DeadlineCallout({process:p,mobile=false}:{process:Process;mobile?:boolean}){
 const label=p.type==='oferta'?'Consultar oferta oficial':'Consultar plazo e inscripción';
 return <section id={mobile?undefined:'plazos'} className={mobile?'detail-mobile-action':'deadline-callout'} aria-label={mobile?'Acción principal de la ficha':'Plazo y siguiente paso'}>{mobile?<span>{p.type==='oferta'?'Oferta · no es una convocatoria':'Confirma el plazo en el organismo'}</span>:<div><span className="eyebrow muted"><CalendarDays size={18}/>{p.type==='oferta'?'OFERTA: PENDIENTE DE CONVOCATORIA':'PLAZO DE SOLICITUD REGISTRADO'}</span><strong>{applicationText(p)}</strong><p>Dato de la muestra. Comprueba posibles cambios y la vigencia en la fuente oficial antes de inscribirte.</p></div>}<a className="button" href={p.portal} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={18}/></a></section>;
}
