import {test} from 'node:test';import assert from 'node:assert/strict';import {diagnosticCode} from './diagnostics.mjs';
test('diagnostics expose only fixed codes, never server error text or credentials',()=>{
 assert.equal(diagnosticCode({code:'28P01',message:'secret password'},'DATABASE'),'DATABASE_PASSWORD');
 assert.equal(diagnosticCode({status:401},'TELEGRAM'),'TELEGRAM_TOKEN');
 assert.equal(diagnosticCode({message:'postgres://secret@example/token'},'DATABASE'),'DATABASE_FAILED');
 assert.equal(diagnosticCode({message:'Unsupported state or unable to authenticate data'},'DATABASE'),'KEY_OR_DATA_INVALID');
});
