import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const script = readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
function page(search = '', hash = '', fetcher = async () => ({ok:true})) {
  const elements = Object.fromEntries(['title','message','icon','confirm'].map(id => [id,{hidden:id==='confirm',addEventListener(_, fn){this.click=fn;}}]));
  let calls = 0, clean;
  vm.runInNewContext(script, {URLSearchParams, location:{search,hash,pathname:'/Gestion-Negocio/'},history:{replaceState(_,__,path){clean=path;}},document:{getElementById(id){return elements[id];}},fetch(...args){calls++;return fetcher(...args);}});
  return {elements,get calls(){return calls;},get clean(){return clean;}};
}
test('no token does not report success; errors are translated and URL is cleaned', () => {
  for(const hash of ['', '#error=access_denied&error_code=otp_expired']){
    const p=page('',hash);assert.equal(p.calls,0);assert.equal(p.clean,'/Gestion-Negocio/');assert.equal(p.elements.confirm.hidden,true);assert.doesNotMatch(p.elements.title.textContent,/¡Correo confirmado!/);
  }
});
test('verification requires a click and successful server response', async () => {
  const p=page('?token_hash=test-token','',async (url,options)=>{assert.match(url,/\/auth\/v1\/verify$/);assert.equal(options.method,'POST');assert.deepEqual(JSON.parse(options.body),{token_hash:'test-token',type:'signup'});return {ok:true};});
  assert.equal(p.calls,0);await p.elements.confirm.click();assert.equal(p.calls,1);assert.equal(p.elements.title.textContent,'¡Correo confirmado!');assert.equal(p.elements.confirm.hidden,true);
});
test('expired or reused token does not report success',async()=>{
  const p=page('?token_hash=test-token','',async()=>({ok:false,status:403}));await p.elements.confirm.click();assert.equal(p.elements.title.textContent,'Este enlace ya no está disponible');assert.equal(p.elements.confirm.hidden,true);
});
test('network or server failures preserve retry',async()=>{
  for(const fetcher of [async()=>{throw Error('offline');},async()=>({ok:false,status:500}),async()=>({ok:false,status:429})]){
    const p=page('?token_hash=test-token','',fetcher);await p.elements.confirm.click();assert.equal(p.elements.confirm.hidden,false);assert.equal(p.elements.confirm.disabled,false);assert.doesNotMatch(p.elements.title.textContent,/¡Correo confirmado!/);
  }
});

test('default email redirect validates the user before showing success',async()=>{
  let resolve; const result=new Promise(r=>resolve=r);
  const p=page('', '#access_token=test-access&type=signup',async(url,options)=>{assert.match(url,/\/auth\/v1\/user$/);assert.equal(options.headers.Authorization,'Bearer test-access');await result;return {ok:true,json:async()=>({email_confirmed_at:'2026-10-02'})};});
  assert.equal(p.calls,1);assert.equal(p.clean,'/Gestion-Negocio/');assert.equal(p.elements.title.textContent,'Comprobando tu correo…');resolve();await new Promise(r=>setImmediate(r));assert.equal(p.elements.title.textContent,'¡Correo confirmado!');
});
test('default redirect never treats an unconfirmed user as success',async()=>{
  const p=page('', '#access_token=test-access&type=signup',async()=>({ok:true,json:async()=>({email_confirmed_at:null})}));await new Promise(r=>setImmediate(r));assert.equal(p.elements.title.textContent,'Este enlace ya no está disponible');
});
test('recovery is not labelled as email confirmation',()=>{
  const p=page('', '#access_token=test-access&type=recovery');assert.equal(p.calls,0);assert.equal(p.elements.title.textContent,'Recuperación de contraseña');
});
