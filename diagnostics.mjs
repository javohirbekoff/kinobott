const codes=new Map([
 ['CONFIG','CONFIG_MISSING'],['KEY_INVALID','KEY_INVALID'],['VOLUME_REQUIRED','VOLUME_MISSING'],['DATABASE_REQUIRED','DATABASE_URL_MISSING'],
 ['ERR_INVALID_URL','DATABASE_URL_INVALID'],['ALREADY_RUNNING','SECOND_INSTANCE'],
 ['28P01','DATABASE_PASSWORD'],['3D000','DATABASE_NAME'],['42501','DATABASE_PERMISSION'],
 ['ENOTFOUND','DATABASE_DNS'],['ECONNREFUSED','CONNECTION_REFUSED'],['ETIMEDOUT','CONNECTION_TIMEOUT'],
 ['EADDRINUSE','PORT_BUSY'],['ERR_OSSL_BAD_DECRYPT','KEY_OR_DATA_INVALID'],
 ['ERR_OSSL_EVP_BAD_DECRYPT','KEY_OR_DATA_INVALID']
]);
export function diagnosticCode(error,stage){
 if(codes.has(error?.code))return codes.get(error.code);
 if(codes.has(error?.message))return codes.get(error.message);
 if(error?.status===401||error?.status===404)return 'TELEGRAM_TOKEN';
 if(error?.status===409)return 'TELEGRAM_OTHER_INSTANCE';
 if(error?.message==='Unsupported state or unable to authenticate data')return 'KEY_OR_DATA_INVALID';
 return ['CONFIG','STORAGE','DATABASE','TELEGRAM','RUNNING','HTTP'].includes(stage)?stage+'_FAILED':'START_FAILED';
}
export function fail(error,stage){
 if(process.env.SAFE_DIAGNOSTICS==='true')process.stderr.write('BOT_STATUS='+diagnosticCode(error,stage)+'\n');
 process.exit(1);
}
