import {useEffect,useRef,useState,type PointerEvent} from 'react';
import type * as Leaflet from 'leaflet';
import {Check,ChevronLeft,Compass,Expand,MapPin,MousePointer2,Pencil,Undo2,X} from 'lucide-react';
import {type Process} from './catalogue';
import {pointFor,validZone,simplifyTrace,spainBounds as SPAIN_BOUNDS,spainRings,type GeoPoint} from './geo';
import 'leaflet/dist/leaflet.css';


type Props={items:Process[];zone:GeoPoint[]|null;selected:string;onSelect:(id:string)=>void;onZone:(p:GeoPoint[]|null)=>void;onView:(b:[number,number,number,number])=>void;fitKey:string;};
export function GeoSearchMap(props:Props){
 const container=useRef<HTMLDivElement>(null),map=useRef<Leaflet.Map|null>(null),lib=useRef<typeof Leaflet|null>(null),pins=useRef<Leaflet.LayerGroup|null>(null),shape=useRef<Leaflet.LayerGroup|null>(null),live=useRef(props);live.current=props;
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[tileWarning,setTileWarning]=useState(false),[moving,setMoving]=useState(false),[revision,setRevision]=useState(0),[mode,setMode]=useState<'free'|'points'|null>(null),[draft,setDraft]=useState<GeoPoint[]>([]),[error,setError]=useState('');
 const tracing=useRef<GeoPoint[]|null>(null),draftRef=useRef(draft);draftRef.current=draft;
 useEffect(()=>{let disposed=false;let observer:ResizeObserver|undefined;
  import('leaflet').then(L=>{if(disposed||!container.current)return;lib.current=L;const m=L.map(container.current,{zoomControl:false,scrollWheelZoom:true,attributionControl:true,minZoom:5,maxZoom:15,worldCopyJump:false,maxBounds:SPAIN_BOUNDS,maxBoundsViscosity:1});map.current=m;
   L.control.zoom({position:'bottomright',zoomInTitle:'Acercar mapa',zoomOutTitle:'Alejar mapa'}).addTo(m);m.attributionControl.setPrefix(false);
   const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{bounds:SPAIN_BOUNDS,maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a>',crossOrigin:true,referrerPolicy:'strict-origin-when-cross-origin'}).addTo(m);
   const pane=m.createPane('spain-mask');pane.style.zIndex='300';pane.style.pointerEvents='none';
   const rings=spainRings;
   const world:GeoPoint[]=[[-85,-180],[-85,180],[85,180],[85,-180]];
   L.polygon([world,...rings],{pane:'spain-mask',stroke:false,fillColor:'#edf2ee',fillOpacity:1,fillRule:'evenodd',interactive:false}).addTo(m);
   rings.forEach(r=>L.polygon(r,{pane:'spain-mask',fill:false,color:'#bbcdbf',weight:1,interactive:false}).addTo(m));
   tiles.on('tileerror',()=>setTileWarning(true));tiles.on('tileload',()=>setTileWarning(false));
   pins.current=L.layerGroup().addTo(m);shape.current=L.layerGroup().addTo(m);
   m.setView([39.5,-4.5],5);m.on('moveend',()=>{setMoving(true);setRevision(n=>n+1);});
   observer=new ResizeObserver(()=>m.invalidateSize({animate:false}));observer.observe(container.current);setReady(true);
  }).catch(()=>setFailed(true));
  return()=>{disposed=true;observer?.disconnect();map.current?.remove();map.current=null;};
 },[]);
 useEffect(()=>{if(!ready||!map.current||!lib.current)return;const m=map.current,L=lib.current;const p=props.zone??props.items.flatMap(v=>{const c=pointFor(v);return c?[c]:[];});
  if(p.length)m.fitBounds(L.latLngBounds(p),{padding:[55,55],maxZoom:11,animate:false});else m.setView([39.5,-4.5],5);
  setMoving(false);
 },[ready,props.fitKey]); // A pin selection never resets the view.
 useEffect(()=>{if(!ready||!map.current||!lib.current||!pins.current)return;const m=map.current,L=lib.current,g=pins.current;g.clearLayers();
  const clusters=new Map<string,{items:Process[];p:GeoPoint[]}>();
  for(const item of props.items){const p=pointFor(item);if(!p)continue;const projected=m.project(p,m.getZoom());const k=`${Math.floor(projected.x/46)}:${Math.floor(projected.y/46)}`;const c=clusters.get(k)??{items:[],p:[]};c.items.push(item);c.p.push(p);clusters.set(k,c);}
  for(const c of clusters.values()){
   const center:GeoPoint=[c.p.reduce((n,p)=>n+p[0],0)/c.p.length,c.p.reduce((n,p)=>n+p[1],0)/c.p.length];const active=c.items.some(p=>p.id===props.selected);const names=[...new Set(c.items.map(p=>p.municipality))];
   const icon=L.divIcon({className:`geo-pin ${active?'geo-pin-selected':''}`,html:`<span>${c.items.length}</span>`,iconSize:[44,44],iconAnchor:[22,22]});const marker=L.marker(center,{icon,keyboard:true,title:`${names.join(', ')} · ${c.items.length} ${c.items.length===1?'ficha':'fichas'}`,alt:`${c.items.length} ${c.items.length===1?'ficha':'fichas'} en ${names.join(', ')}`}).addTo(g);
   const label=document.createElement('span');label.textContent=names.join(', ');marker.bindTooltip(label,{direction:'top'});
   const el=marker.getElement();el?.setAttribute('role','button');el?.setAttribute('aria-label',`Ver ${c.items.length} ${c.items.length===1?'ficha':'fichas'} de ${names.join(', ')}`);
   marker.on('click',()=>{if(names.length>1&&m.getZoom()<12)m.fitBounds(L.latLngBounds(c.p),{padding:[70,70],maxZoom:m.getZoom()+3});live.current.onSelect(c.items[0].id);});
  }
 },[ready,props.items,props.selected,revision]);
 useEffect(()=>{if(!ready||!lib.current||!shape.current)return;const g=shape.current,L=lib.current;g.clearLayers();const p=mode?draft:props.zone;if(p&&p.length){const options={color:'#148357',weight:2,fillColor:'#1cb879',fillOpacity:.13,dashArray:mode?'6 6':undefined};if(p.length>2)L.polygon(p,{...options,interactive:false}).addTo(g);else L.polyline(p,{...options,interactive:false}).addTo(g);if(mode)p.forEach((v,i)=>L.circleMarker(v,{radius:4,color:'#fff',weight:2,fillColor:i===0?'#092b24':'#148357',fillOpacity:1,interactive:false}).addTo(g));}},[ready,props.zone,mode,draft]);
 useEffect(()=>{if(!map.current)return;if(mode)map.current.dragging.disable();else map.current.dragging.enable();},[mode,ready]);
 useEffect(()=>{if(!ready||!props.selected)return;const p=props.items.find(p=>p.id===props.selected),v=p&&pointFor(p);if(v&&map.current)map.current.setView(v,Math.max(10,map.current.getZoom()),{animate:false});},[props.selected,ready]);
 const start=()=>{setDraft([]);setError('');setMode('free');container.current?.closest('.geo-map-shell')?.scrollIntoView({block:'center',behavior:'auto'});};
 const stop=()=>{setMode(null);setDraft([]);setError('');tracing.current=null;};
 const apply=()=>{const p=decodeRounded(draft);if(!validZone(p)){setError('La zona debe tener al menos 3 puntos, no cruzarse y estar en España. Prueba a dibujarla de nuevo.');return;}props.onZone(p);stop();};
 const position=(e:{clientX:number;clientY:number}):GeoPoint|null=>{const m=map.current;if(!m||!container.current)return null;const r=container.current.getBoundingClientRect(),p=m.containerPointToLatLng([e.clientX-r.left,e.clientY-r.top]);return [p.lat,p.lng];};
 const down=(e:PointerEvent<HTMLDivElement>)=>{if(mode!=='free'||e.button!==0)return;const p=position(e);if(!p)return;e.currentTarget.setPointerCapture(e.pointerId);tracing.current=[p];setDraft([p]);setError('');};
 const move=(e:PointerEvent)=>{if(!tracing.current||!map.current)return;const p=position(e);if(!p)return;const last=tracing.current[tracing.current.length-1];const a=map.current.latLngToContainerPoint(last),b=map.current.latLngToContainerPoint(p);if(a.distanceTo(b)>3){tracing.current.push(p);if(tracing.current.length>800)tracing.current=tracing.current.filter((_,i)=>i%2===0||i===tracing.current!.length-1);setDraft(simplifyTrace(tracing.current));}};
 const up=(e:PointerEvent<HTMLDivElement>)=>{if(!tracing.current)return;const p=position(e);if(p)tracing.current.push(p);setDraft(simplifyTrace(tracing.current));tracing.current=null;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);};
 return <section className={`geo-map-shell ${mode?'geo-map-drawing':''}`} aria-label="Mapa de las convocatorias">
  <div ref={container} className="geo-leaflet" aria-label="Mapa geográfico interactivo"/>
  {(!ready||failed)&&<div className="geo-loading"><MapPin size={25}/><strong>{failed?'No se ha podido cargar el mapa':'Preparando el mapa…'}</strong><span>El listado y sus filtros siguen disponibles.</span></div>}
  {ready&&<><div className="geo-map-tools">{!mode?<><button onClick={start}><Pencil size={16}/>Dibujar zona</button><button className="geo-icon-button" aria-label="Ver toda España" onClick={()=>map.current?.fitBounds(SPAIN_BOUNDS,{padding:[20,20],animate:false})}><Expand size={17}/></button>{props.zone&&<button onClick={()=>props.onZone(null)}><X size={15}/>Borrar zona</button>}</>:<><button aria-pressed={mode==='free'} onClick={()=>{setMode('free');setDraft([]);}}><Pencil size={15}/>Trazo libre</button><button aria-pressed={mode==='points'} onClick={()=>{setMode('points');setDraft([]);}}><MousePointer2 size={15}/>Por puntos</button><button aria-label="Cancelar dibujo de zona" onClick={stop}><X size={17}/></button></>}</div>
   {mode&&<div className="geo-draw-layer" role="application" aria-label={mode==='free'?'Mantén pulsado y dibuja tu zona':'Haz clic para añadir los vértices de la zona'} tabIndex={0} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{tracing.current=null;}} onClick={e=>{if(mode==='points'){const p=position(e);if(p){setDraft(d=>d.length<80?[...d,p]:d);setError('');}}}} onKeyDown={e=>{if(e.key==='Escape')stop();if(e.key==='Enter')apply();}}/>}
   {mode?<div className="geo-draw-panel"><strong>{mode==='free'?'Dibuja alrededor de donde quieres buscar':'Marca los puntos del perímetro'}</strong><span>{mode==='free'?'Arrastra con el ratón o el dedo. Después, aplica la zona.':'Haz clic al menos en tres puntos y aplica la zona.'}</span>{error&&<p role="alert">{error}</p>}<div><button onClick={()=>setDraft(d=>d.slice(0,-1))} disabled={!draft.length}><Undo2 size={15}/>Deshacer</button><button onClick={stop}>Cancelar</button><button className="geo-apply" onClick={apply} disabled={draft.length<3}><Check size={16}/>Aplicar zona</button></div></div>:moving&&<button className="geo-search-view" onClick={()=>{const b=map.current!.getBounds();props.onView([b.getSouth(),b.getWest(),b.getNorth(),b.getEast()]);setMoving(false);}}><SearchIcon/>Buscar en esta vista</button>}
   <div className="geo-map-caption"><Compass size={13}/><span>España · ubicación municipal, no sede de examen</span></div>
   {tileWarning&&<div className="geo-tile-warning" role="status">Cartografía temporalmente no disponible. Los puntos y el listado siguen funcionando.</div>}
  </>}
 </section>;
}
function decodeRounded(p:GeoPoint[]):GeoPoint[]{return p.map(v=>[Number(v[0].toFixed(5)),Number(v[1].toFixed(5))]);}
function SearchIcon(){return <MapPin size={16}/>;}
