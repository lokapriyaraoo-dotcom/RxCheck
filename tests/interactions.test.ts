import { describe,it,expect } from 'vitest';
import { checkInteractions,doseReview } from '../services/interactions';
import { interactionRecords, medicineIngredientAliases, INTERACTION_DATABASE_VERSION } from '../services/interactionDatabase';
import type { Medicine } from '../services/types';
const med:Medicine={id:'1',name:'Example',strength:'500 mg tablet',dose:'1',unit:'mg',frequency:'as prescribed',duration:'',instructions:'',needsReview:true};
describe('conservative medication review',()=>{
 it('never declares a multi-medicine list safe without a source',()=>expect(checkInteractions([med,{...med,id:'2'}])[0].severity).toBe('unknown'));
 it('asks for verification of unconfirmed entries',()=>expect(doseReview(med).some(x=>x.title==='Manual verification required')).toBe(true));
 it('flags a missing medicine name',()=>expect(doseReview({...med,name:''}).some(x=>x.title==='Medicine name missing')).toBe(true));
 it('ships a versioned database with no invented clinical records',()=>{expect(INTERACTION_DATABASE_VERSION).toBe('1.0.0');expect(interactionRecords).toHaveLength(0);expect(Object.keys(medicineIngredientAliases)).toHaveLength(0);});
 it('returns unknown when ingredient mapping is unavailable',()=>{const f=checkInteractions([{...med,name:'Metformin'},{...med,id:'2',name:'Azithromycin'}]);expect(f).toHaveLength(1);expect(f[0].severity).toBe('unknown');expect(f[0].detail.toLowerCase()).toContain('not evidence');});
 it('checks every pair in a list and keeps missing coverage unknown',()=>{const f=checkInteractions([med,{...med,id:'2',name:'Second'},{...med,id:'3',name:'Third'}]);expect(f).toHaveLength(3);expect(f.every(x=>x.severity==='unknown')).toBe(true);});
});
