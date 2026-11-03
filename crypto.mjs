import {randomBytes,createCipheriv,createDecipheriv,createHmac} from 'node:crypto';
export class Vault {
 constructor(key){this.key=Buffer.from(key||'','base64');if(this.key.length!==32)throw Error('KEY_INVALID');}
 id(value){return createHmac('sha256',this.key).update(String(value)).digest('hex');}
 seal(value,context){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',this.key,iv);c.setAAD(Buffer.from(context));const body=Buffer.concat([c.update(JSON.stringify(value)),c.final()]);return Buffer.concat([iv,c.getAuthTag(),body]);}
 open(b,context){const d=createDecipheriv('aes-256-gcm',this.key,b.subarray(0,12));d.setAAD(Buffer.from(context));d.setAuthTag(b.subarray(12,28));return JSON.parse(Buffer.concat([d.update(b.subarray(28)),d.final()]).toString());}
}
