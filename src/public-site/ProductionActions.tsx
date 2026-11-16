import {Link} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,Building2,Layers3,CalendarDays,Info} from 'lucide-react';
export const trainingUrl='https://www.superaoposiciones.es/';
export function TrainingLink({label='Conocer la formación de Supera',small=false}:{label?:string;small?:boolean}){
 return <a className={'button'+(small?' button-small':'')} href={trainingUrl} target="_blank" rel="noopener noreferrer">{label}<ArrowUpRight size={16}/></a>;
}
export function PublicSuperadmin(){return <div className="container page-section">
 <nav className="breadcrumbs" aria-label="Ruta de navegación"><Link to="/">Inicio</Link><span>Superadmin</span></nav>
 <section className="superadmin-hero"><span className="eyebrow">UNA PREPARACIÓN. MÁS DE UN CAMINO.</span><h1>Elige tu convocatoria.<br/><em>Prepara lo que te falta.</em></h1><p>Explora oposiciones de Administrativo y Auxiliar y consulta con Supera cómo combinar tu preparación para la AGE con opciones locales.</p><div className="action-row"><TrainingLink/><Link className="hero-secondary" to="/alternativas-age">Ya preparo AGE: explorar alternativas</Link></div></section>
 <div className="how-grid program-features"><div><Building2 size={28}/><h2>Elige con información</h2><p>Consulta plazas, turno y documentos. Comprueba en las bases si cumples los requisitos del proceso.</p></div><div><Layers3 size={28}/><h2>Parte de tu convocatoria</h2><p>Identifica el programa concreto y consulta qué preparación necesitas, sin asumir que todos los temarios son iguales.</p></div><div><CalendarDays size={28}/><h2>Confirma las condiciones</h2><p>Consulta con Supera disponibilidad, alcance, plazos y actualización del material antes de contratar.</p></div></div>
 <div className="evidence-note"><Info size={18}/><p>Explorar una ficha no inicia una matrícula ni la creación de material. La inscripción al proceso selectivo se realiza por los medios oficiales indicados en sus bases.</p></div>
 <Link className="text-link" to="/convocatorias">Buscar mi convocatoria <ArrowRight size={16}/></Link></div>;}

