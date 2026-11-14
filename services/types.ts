export type Patient = { name: string; age: string; weightKg: string; gender: string; pregnant: boolean; allergies: string; kidneyDisease: boolean; liverDisease: boolean };
export type Medicine = { id: string; name: string; strength: string; dose: string; unit: 'mg'|'mcg'|'g'|'mL'|'unknown'; frequency: string; duration: string; instructions: string; confidence?: number; needsReview: boolean };
export type Finding = { severity: 'high'|'moderate'|'low'|'unknown'; title: string; detail: string; source?: string };
export const emptyPatient: Patient = { name:'', age:'', weightKg:'', gender:'', pregnant:false, allergies:'', kidneyDisease:false, liverDisease:false };
