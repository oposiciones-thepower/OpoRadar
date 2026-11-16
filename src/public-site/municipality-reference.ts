import reference from './data/municipality-reference.json';
export type MunicipalityReference={lat:number;lon:number;province:string;officialName:string;municipalityCode:string;source:string;precision:string};
const normal=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const provinceVariants:Record<string,string>={guipuzcoa:'gipuzkoa',vizcaya:'bizkaia',orense:'ourense',gerona:'girona',lerida:'lleida',baleares:'illes balears',rioja:'la rioja'};
function aliases(value:string,province=false):string[]{
 const names=new Set<string>();for(const name of [value,...value.split('/')]){
  names.add(normal(name));
  const match=name.match(/^(.+),\s*(el|la|los|las|a|o|as|os|l['’]?)$/i);
  if(match)names.add(normal(match[2]+' '+match[1]));
 }
 if(province)for(const name of [...names])if(provinceVariants[name])names.add(provinceVariants[name]);
 return [...names].filter(Boolean);
}
const index=new Map<string,Map<string,MunicipalityReference>>();
for(const [code,name,province,lat,lon] of reference.entries as [string,string,string,number,number][]){
 const point={lat,lon,province,officialName:name,municipalityCode:code,source:reference.source,precision:reference.precision};
 for(const p of aliases(province,true))for(const n of aliases(name)){
  const key=p+'|'+n,found=index.get(key)??new Map<string,MunicipalityReference>();found.set(code,point);index.set(key,found);
 }
}
export function municipalityReference(municipality:string,province:string):MunicipalityReference|null{
 if(!municipality||!province)return null;
 const found=new Map<string,MunicipalityReference>();
 for(const p of aliases(province,true))for(const n of aliases(municipality))for(const [code,point] of index.get(p+'|'+n)??[])found.set(code,point);
 return found.size===1?[...found.values()][0]:null;
}
export const municipalityReferenceMetadata={source:reference.source,description:reference.description,license:reference.license,licenseId:reference.licenseId,sourceLastModified:reference.sourceLastModified,sourceSha256:reference.sourceSha256,count:reference.entries.length,precision:reference.precision};

