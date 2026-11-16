import {parseApprovedCatalogue,type ApprovedCatalogue} from './approved-contract';
export type CatalogueState={status:'idle'|'loading'|'ready'|'error';hasData:boolean;generation:number;lastSuccess:string|null;error:string|null};
export class ApprovedCatalogueClient{
 private state:CatalogueState={status:'idle',hasData:false,generation:0,lastSuccess:null,error:null};
 private listeners=new Set<()=>void>();private pending:Promise<void>|null=null;private timer:ReturnType<typeof setInterval>|null=null;private controller:AbortController|null=null;private stopped=false;
 constructor(private endpoint:string,private apply:(data:ApprovedCatalogue)=>void,private request:typeof fetch=(input,init)=>fetch(input,init),private interval=300000){}
 snapshot=()=>this.state;subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
 private update(p:Partial<CatalogueState>){this.state={...this.state,...p};for(const fn of this.listeners)fn();}
 refresh=():Promise<void>=>{
  if(this.pending)return this.pending;this.stopped=false;
  this.update({status:this.state.hasData?this.state.status:'loading',error:null});
  const controller=new AbortController();this.controller=controller;
  const timeout=setTimeout(()=>controller.abort(),12000);
  this.pending=(async()=>{
   await Promise.resolve();
   try{
    const response=await this.request(this.endpoint,{method:'GET',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:controller.signal});
    if(!response.ok)throw Error('Catálogo temporalmente no disponible');
    const text=await response.text();if(text.length>12000000)throw Error('Respuesta demasiado grande');
    const data=parseApprovedCatalogue(JSON.parse(text));if(controller.signal.aborted)return;
    this.apply(data);this.update({status:'ready',hasData:true,generation:this.state.generation+1,lastSuccess:new Date().toISOString(),error:null});
   }catch{if(!this.stopped)this.update({status:'error',error:'No se ha podido consultar el catálogo aprobado. No se sustituye por fichas de muestra.'});}
   finally{clearTimeout(timeout);this.pending=null;this.controller=null;}
  })();return this.pending;
 };
 start(){void this.refresh();if(!this.timer)this.timer=setInterval(()=>void this.refresh(),this.interval);return()=>this.stop();}
 stop(){this.stopped=true;if(this.timer)clearInterval(this.timer);this.timer=null;this.controller?.abort();}
}
export const storedIds=(value:unknown):string[]=>Array.isArray(value)?[...new Set(value.filter((v):v is string=>typeof v==='string'&&v.length<=100))].slice(0,1000):[];
