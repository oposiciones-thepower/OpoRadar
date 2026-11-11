import data from './data/body-guides.json';
export type GuideBlock = {kind:string;text?:string;bullet?:boolean;rows?:string[][]};
export type BodyGuide = {slug:string;family:string;group:string;title:string;blocks:GuideBlock[]};
export const bodyGuides = data as BodyGuide[];
export const bodyGuidePath = (guide:BodyGuide) => '/oposiciones/'+guide.slug;
export const bodyDescription = (guide:BodyGuide) => `Requisitos, funciones, sueldo, examen y temario de ${guide.group==='C2'?'Auxiliar Administrativo':'Administrativo'} Local. Consulta las bases de cada entidad y explora las fichas de la muestra.`;
