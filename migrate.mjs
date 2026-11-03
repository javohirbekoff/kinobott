import {Store} from './store.mjs';
import {PostgresStore} from './postgres.mjs';
import {existsSync} from 'node:fs';
const path=process.argv[2]||'./data/catalog.enc';
try{
 if(!process.env.DATABASE_URL||!existsSync(path))throw Error();
 const source=new Store(path,process.env.DATA_KEY);
 const target=await new PostgresStore(process.env.DATABASE_URL,process.env.DATA_KEY).init();
 try{
  if(Object.keys(target.data.movies).length||Object.keys(target.data.users).length||target.data.channels.length)throw Error();
  for(const kind of ['movies','users'])for(const [key,value] of Object.entries(source.data[kind]))target.data[kind][key]=value;
  target.data.channels=source.data.channels;target.data.subscription=source.data.subscription;target.data.offset=source.data.offset;
  await target.save();
 }finally{await target.close();}
 process.stdout.write('Ko‘chirish yakunlandi.\n');
}catch{process.stderr.write('Ko‘chirish bajarilmadi. Botni to‘xtating, bo‘sh bazani va mavjud kalitni tekshiring.\n');process.exit(1);}
