import {test} from 'node:test';import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';import {Vault} from './crypto.mjs';
test('database encryption is authenticated and bound to row identity',()=>{
 const key=randomBytes(32).toString('base64'),v=new Vault(key),value={chat:12345,title:'Private film'};
 const blob=v.seal(value,'row:a');assert.equal(blob.includes(Buffer.from('Private film')),false);assert.deepEqual(v.open(blob,'row:a'),value);
 assert.throws(()=>v.open(blob,'row:b'));assert.throws(()=>new Vault(randomBytes(32).toString('base64')).open(blob,'row:a'));
 blob[30]^=1;assert.throws(()=>v.open(blob,'row:a'));
});
