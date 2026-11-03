// Optional one-off export ONLY. The bot itself never connects to PostgreSQL.
import pg from 'pg';import {Vault} from './crypto.mjs';import {Store} from './store.mjs';import {join} from 'node:path';
const client=new pg.Client({connectionString:process.env.DATABASE_URL,...(process.env.DATABASE_URL?.includes('.railway.internal:')?{}:{ssl:{rejectUnauthorized:true}})});
try{
 if(!process.env.DATABASE_URL)throw Error();
 const vault=new Vault(process.env.DATA_KEY);await client.connect();
 const {rows}=await client.query("SELECT key,payload FROM kino_records WHERE kind='movies'");
 const store=new Store(join(process.env.RAILWAY_VOLUME_MOUNT_PATH||process.env.DATA_DIR||'./data','catalog.enc'),process.env.DATA_KEY);
 for(const row of rows){const record=vault.open(row.payload,'movies:'+row.key);if(Object.hasOwn(store.data.movies,record.key))throw Error();store.data.movies[record.key]=record.value;}
 store.save();process.stdout.write('Kinolar eksport qilindi.\n');
}catch{process.stderr.write('Eksport bajarilmadi. Ulanish, kalit va takroriy kino kodlarini tekshiring.\n');process.exitCode=1;}finally{await client.end().catch(()=>{});}
