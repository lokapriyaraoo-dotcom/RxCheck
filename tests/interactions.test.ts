import { describe,it,expect } from 'vitest';
import { checkInteractions,doseReview } from '../services/interactions';
import type { Medicine } from '../services/types';
const med:Medicine={id:'1',name:'Example',strength:'500 mg tablet',dose:'1',unit:'mg',frequency:'as prescribed',duration:'',instructions:'',needsReview:true};
describe('conservative medication review',()=>{
 it('never declares a multi-medicine list safe without a source',()=>expect(checkInteractions([med,{...med,id:'2'}])[0].severity).toBe('unknown'));
 it('asks for verification of unconfirmed entries',()=>expect(doseReview(med).some(x=>x.title==='Manual verification required')).toBe(true));
 it('flags a missing medicine name',()=>expect(doseReview({...med,name:''}).some(x=>x.title==='Medicine name missing')).toBe(true));
});
