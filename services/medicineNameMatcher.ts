export function cleanOcrMedicineName(value: string): string {
  return value.trim().replace(/^\s*(?:[iIl1][.)]\s*)/,'').replace(/^\s*(?:tab(?:let)?s?|cap(?:sule)?s?|syp(?:rup)?|inj(?:ection)?)\.?\s+/i,'').replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|µg|g|ml|iu|units?)\b/ig,'').replace(/[^a-zA-Z0-9 -]/g,' ').replace(/\s+/g,' ').trim();
}
const normal = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g,'');
export function editDistance(a:string,b:string):number {
  const left=normal(a), right=normal(b);
  const row=Array.from({length:right.length+1},(_,i)=>i);
  for(let i=1;i<=left.length;i++){let diagonal=row[0];row[0]=i;for(let j=1;j<=right.length;j++){const above=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,diagonal+(left[i-1]===right[j-1]?0:1));diagonal=above;}}
  return row[right.length];
}
export function findClosestMedicineName(value:string,candidates:string[]):string|null {
  const cleaned=cleanOcrMedicineName(value); if(normal(cleaned).length<5)return null;
  const ranked=candidates.map(name=>({name,distance:editDistance(cleaned,name)})).sort((a,b)=>a.distance-b.distance);
  const best=ranked[0]; if(!best||best.distance===0||best.distance>2)return null;
  if(ranked[1]&&ranked[1].distance===best.distance)return null;
  return best.name;
}
