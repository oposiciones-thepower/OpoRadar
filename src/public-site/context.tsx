import {createContext, useContext} from 'react';
export type Intent = 'zone' | 'process' | 'preparation';
export type Intake = {kind:Intent; city?:string; processId?:string; student?:boolean};
export type Metric = 'search'|'process_view'|'compare'|'age_view'|'zone_open'|'process_open'|'preparation_open'|'zone_demo'|'process_demo'|'preparation_demo'|'student_demo'|'source_click';
export type SiteContextType = {
 saved:string[]; toggle:(id:string)=>void; alert:(city?:string)=>void;
 intake:(value:Intake)=>void; compared:string[]; compare:(id:string)=>void; clearCompared:()=>void;
 counts:Partial<Record<Metric,number>>; track:(event:Metric)=>void; resetMetrics:()=>void;
};
export const SiteContext=createContext<SiteContextType>({saved:[],toggle:()=>{},alert:()=>{},intake:()=>{},compared:[],compare:()=>{},clearCompared:()=>{},counts:{},track:()=>{},resetMetrics:()=>{}});
export const useSite=()=>useContext(SiteContext);
