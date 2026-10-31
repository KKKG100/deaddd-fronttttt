/* ---------------- SHARED RULES (server + client) ---------------- */
// A "player" here is any object with: id, res{c,m,f}, done:Set, allies:Set
const PL=o=>G&&G.players?G.players.get(o):null;
const isFriend=(a,b)=>{if(a===b)return true;const p=PL(a);return !!(p&&p.allies&&p.allies.has(b))};
function ucostP(p,t){const c=U[t].cost,k=p.done.has('logistics')?.85:1,o={};for(const a in c)o[a]=Math.ceil(c[a]*k);return o}
function affordP(p,c){for(const k in c)if(p.res[k]<c[k]-1e-6)return false;return true}
function spendP(p,c){for(const k in c)p.res[k]-=c[k]}
function refundP(p,c,f){for(const k in c)p.res[k]+=c[k]*(f||1)}
function uMaxHpP(p,t){const d=U[t];let h=d.hp;if(d.cls==='inf'&&p.done.has('kevlar'))h*=1.25;if(d.cls==='veh'&&p.done.has('composite'))h*=1.2;return h}
function uArmorP(p,u){const d=u.d;let a=d.armor||0;if(d.cls==='inf'&&p.done.has('kevlar'))a+=1;if(d.cls==='veh'&&p.done.has('composite'))a+=1;return a}
function bMaxHpP(p,t){const d=B[t];let h=d.hp;if(p.done.has('fortify')){h*=d.wall?1.5:d.weapon?1.25:1}return h}
function unitAvailP(p,t){const d=U[t];return !d.tech||p.done.has(d.tech)}
const SUPPLY_R=16, NEST_BUF=8;
function canPlaceP(p,type,tx,ty){const d=B[type],s=d.size;
 if(d.tech&&!p.done.has(d.tech))return'Requires research';
 for(let y=0;y<s;y++)for(let x=0;x<s;x++){const X=tx+x,Y=ty+y;if(!inMap(X,Y))return'Out of bounds';const i=Y*MW+X;if(occ[i])return'Tile occupied';const t=T[i];
  if(d.dep){const dp=depGrid[i];if(!dp)return'Needs a '+(d.dep==='ore'?'ore':'oil')+' deposit';const dep=WORLD.deposits[dp-1];if(dep.type!==d.dep)return'Wrong deposit type';if(dep.used)return'Deposit in use';if(dep.tx!==tx||dep.ty!==ty)return'Align with deposit'}
  else{if(depGrid[i])return'Resource deposit';if(t!==1)return t===0?'Cannot build on water':t===2?'Mountain':'Dense forest'}}
 const cx=(tx+s/2)*TILE,cy=(ty+s/2)*TILE;
 for(const n of G.nests)if(Math.abs(n.x-cx)<NEST_BUF*TILE+40&&Math.abs(n.y-cy)<NEST_BUF*TILE+40&&Math.hypot(n.x-cx,n.y-cy)<NEST_BUF*TILE)return'Too close to a nest';
 let sup=false;for(const b of G.buildings){if(!b.done||b.dead)continue;if(Math.abs(b.x-cx)>SUPPLY_R*TILE||Math.abs(b.y-cy)>SUPPLY_R*TILE)continue;if(!isFriend(p.id,b.o))continue;if(Math.hypot(b.x-cx,b.y-cy)<=SUPPLY_R*TILE){sup=true;break}}if(!sup)return'Outside supply range';
 if(d.coastal){let ok=false;for(let y=-1;y<=s;y++)for(let x=-1;x<=s;x++){if(x>=0&&x<s&&y>=0&&y<s)continue;const X=tx+x,Y=ty+y;if(inMap(X,Y)&&T[Y*MW+X]===0&&!occ[Y*MW+X])ok=true}if(!ok)return'Must be on the coast'}
 return null}
const compass=(a)=>['E','SE','S','SW','W','NW','N','NE'][Math.round(((a%TAU+TAU)%TAU)/(TAU/8))%8];
function nightAmt(h){if(h>=20||h<5)return 1;if(h>=18)return(h-18)/2;if(h<7)return(7-h)/2;return 0}
function gameHour(){return(6+(G.t%DAY_LEN)/DAY_LEN*24)%24}
function rectDist(b,x,y){const dx=Math.max(b.x-b.w/2-x,0,x-(b.x+b.w/2)),dy=Math.max(b.y-b.h/2-y,0,y-(b.y+b.h/2));return Math.hypot(dx,dy)}
const nestHp=l=>700+450*l;
