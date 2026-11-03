import pg from 'pg';
import {Vault} from './crypto.mjs';
import {fail} from './diagnostics.mjs';
export class PostgresStore {
 constructor(url,key){
  this.vault=new Vault(key);const parsed=new URL(url);const internal=parsed.hostname.endsWith('.railway.internal')||['localhost','127.0.0.1','::1'].includes(parsed.hostname);
  if(!internal){for(const field of ['sslmode','sslcert','sslkey','sslrootcert'])parsed.searchParams.delete(field);}
  this.pool=new pg.Pool({connectionString:parsed.toString(),...(!internal?{ssl:{rejectUnauthorized:true}}:{}),max:12,connectionTimeoutMillis:10000,statement_timeout:30000});
  this.pool.on('error',error=>fail(error,'DATABASE'));this.dirty=new Set();this.chain=Promise.resolve();
 }
 id(uid){return this.vault.id('user:'+uid);}
 async init(){
  this.lock=await this.pool.connect();this.lock.on('error',error=>fail(error,'DATABASE'));
  const locked=await this.lock.query('SELECT pg_try_advisory_lock(719346281) AS ok');if(!locked.rows[0].ok)throw Error('ALREADY_RUNNING');
  await this.pool.query(`CREATE TABLE IF NOT EXISTS kino_records (kind text NOT NULL, key text NOT NULL, payload bytea NOT NULL, PRIMARY KEY(kind,key));
   CREATE TABLE IF NOT EXISTS kino_jobs (id bigserial PRIMARY KEY, dedup text UNIQUE, lane text NOT NULL, owner text NOT NULL, payload bytea NOT NULL, attempts integer NOT NULL DEFAULT 0, available timestamptz NOT NULL DEFAULT now(), running boolean NOT NULL DEFAULT false);
   CREATE INDEX IF NOT EXISTS kino_jobs_ready ON kino_jobs(lane,available,id);
   CREATE INDEX IF NOT EXISTS kino_jobs_owner ON kino_jobs(owner,id);`);
  await this.pool.query('UPDATE kino_jobs SET running=false');
  const raw={movies:{},users:{},channels:[],subscription:false,offset:0};
  const {rows}=await this.pool.query('SELECT kind,key,payload FROM kino_records');
  for(const r of rows){const v=this.vault.open(r.payload,r.kind+':'+r.key);if(r.kind==='movies'||r.kind==='users')raw[r.kind][v.key]=v.value;else if(r.kind==='meta')raw[r.key]=v;}
  const wrap=(value,mark)=>{if(!value||typeof value!=='object')return value;const cache=new WeakMap();const deep=o=>{if(!o||typeof o!=='object')return o;if(cache.has(o))return cache.get(o);const p=new Proxy(o,{get:(t,k)=>deep(t[k]),set:(t,k,v)=>{t[k]=v;mark();return true;},deleteProperty:(t,k)=>{delete t[k];mark();return true;}});cache.set(o,p);return p;};return deep(value);};
  for(const kind of ['movies','users']){
   for(const key of Object.keys(raw[kind]))raw[kind][key]=wrap(raw[kind][key],()=>this.dirty.add(kind+':'+key));
   raw[kind]=new Proxy(raw[kind],{set:(t,k,v)=>{t[k]=wrap(v,()=>this.dirty.add(kind+':'+k));this.dirty.add(kind+':'+k);return true;},deleteProperty:(t,k)=>{delete t[k];this.dirty.add(kind+':'+k);return true;}});
  }
  raw.channels=wrap(raw.channels,()=>this.dirty.add('meta:channels'));
  this.data=new Proxy(raw,{set:(t,k,v)=>{t[k]=k==='channels'?wrap(v,()=>this.dirty.add('meta:channels')):v;this.dirty.add('meta:'+k);return true;}});
  if(!rows.length){this.data.keycheck='kino-v2';await this.save();}
  return this;
 }
 save(){
  const run=async()=>{
   const keys=[...this.dirty];if(!keys.length)return;this.dirty.clear();
   const items=keys.map(item=>{const pos=item.indexOf(':'),kind=item.slice(0,pos),key=item.slice(pos+1),value=kind==='meta'?this.data[key]:this.data[kind][key],index=kind==='meta'?key:this.vault.id(kind+':'+key);return {kind,key:index,payload:value===undefined?null:this.vault.seal(kind==='meta'?value:{key,value},kind+':'+index)};});
   const c=await this.pool.connect();try{await c.query('BEGIN');for(let i=0;i<items.length;i+=500){const batch=items.slice(i,i+500),put=batch.filter(r=>r.payload),del=batch.filter(r=>!r.payload);if(put.length)await c.query('INSERT INTO kino_records(kind,key,payload) SELECT * FROM unnest($1::text[],$2::text[],$3::bytea[]) ON CONFLICT(kind,key) DO UPDATE SET payload=EXCLUDED.payload',[put.map(r=>r.kind),put.map(r=>r.key),put.map(r=>r.payload)]);for(const r of del)await c.query('DELETE FROM kino_records WHERE kind=$1 AND key=$2',[r.kind,r.key]);}await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');for(const key of keys)this.dirty.add(key);throw e;}finally{c.release();}
  };
  const result=this.chain.then(run);this.chain=result.catch(()=>{});return result;
 }
 async enqueue(updates){
  const c=await this.pool.connect();try{await c.query('BEGIN');for(const u of updates){const from=u.callback_query?.from||u.message?.from;const owner=this.id(from?.id||0);const dedup='update:'+u.update_id;await c.query('INSERT INTO kino_jobs(dedup,lane,owner,payload) VALUES($1,$2,$3,$4) ON CONFLICT(dedup) DO NOTHING',[dedup,'update',owner,this.vault.seal(u,'job:'+owner)]);}if(updates.length){const offset=updates.at(-1).update_id+1;await c.query("INSERT INTO kino_records(kind,key,payload) VALUES('meta','offset',$1) ON CONFLICT(kind,key) DO UPDATE SET payload=EXCLUDED.payload",[this.vault.seal(offset,'meta:offset')]);await c.query('COMMIT');this.data.offset=offset;this.dirty.delete('meta:offset');}else await c.query('COMMIT');}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 async claim(lane){const {rows}=await this.pool.query(`UPDATE kino_jobs SET running=true WHERE id=(SELECT j.id FROM kino_jobs j WHERE j.lane=$1 AND NOT j.running AND j.available<=now() AND NOT EXISTS(SELECT 1 FROM kino_jobs earlier WHERE earlier.owner=j.owner AND earlier.lane=j.lane AND earlier.id<j.id) ORDER BY j.id LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *`,[lane]);const r=rows[0];return r?{...r,value:this.vault.open(r.payload,'job:'+r.owner)}:null;}
 async finish(id){await this.pool.query('DELETE FROM kino_jobs WHERE id=$1',[id]);}
 async retry(job){await this.pool.query("UPDATE kino_jobs SET running=false,attempts=attempts+1,available=now()+($2 * interval '1 second') WHERE id=$1",[job.id,Math.min(300,2**Math.min(job.attempts+1,8))]);}
 async broadcast(text,jobId){
  // One transaction: confirmation cannot leave a half-created broadcast.
  const c=await this.pool.connect();let count=0;
  try{await c.query('BEGIN');for(const [key,u] of Object.entries(this.data.users)){if(!u.chat||u.blocked)continue;const dedup='broadcast:'+jobId+':'+key;await c.query('INSERT INTO kino_jobs(dedup,lane,owner,payload) VALUES($1,$2,$3,$4) ON CONFLICT(dedup) DO NOTHING',[dedup,'broadcast',key,this.vault.seal({chat:u.chat,text},'job:'+key)]);count++;}await c.query('COMMIT');return count;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
 }
 async close(){await this.save();this.lock.release();await this.pool.end();}
}
