import {randomBytes,createCipheriv,createDecipheriv,createHmac} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,mkdirSync,existsSync} from 'node:fs';
import {dirname} from 'node:path';
export class Store {
 constructor(path,key) {
  this.path=path; this.key=Buffer.from(key||'', 'base64');
  if(this.key.length!==32) throw Error('KEY_INVALID');
  mkdirSync(dirname(path),{recursive:true,mode:0o700});
  this.data={movies:{},users:{},channels:[],subscription:false,offset:0};
  if(existsSync(path)) {
   const b=readFileSync(path); if(b.subarray(0,4).toString()!=='KINO') throw Error('STORE_INVALID');
   const d=createDecipheriv('aes-256-gcm',this.key,b.subarray(4,16));d.setAuthTag(b.subarray(16,32));
   this.data=JSON.parse(Buffer.concat([d.update(b.subarray(32)),d.final()]).toString());
  }
 }
 id(uid){return createHmac('sha256',this.key).update('user:'+uid).digest('hex');}
 save(){
  const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',this.key,iv);
  const encrypted=Buffer.concat([c.update(JSON.stringify(this.data)),c.final()]);
  writeFileSync(this.path+'.tmp',Buffer.concat([Buffer.from('KINO'),iv,c.getAuthTag(),encrypted]),{mode:0o600});
  renameSync(this.path+'.tmp',this.path);
 }
}
