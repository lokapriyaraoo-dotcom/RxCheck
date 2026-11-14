import { describe, it, expect } from 'vitest';
import { mapGatewayErrorMessage, validateImageBytes, OCR_REVIEW_WARNING, extractPatientDetails, extractMedicineCandidates } from '../services/ocr';

describe('OCR safety boundary', () => {
  it('accepts positive image sizes up to the cap', () => {
    expect(validateImageBytes(12 * 1024 * 1024 - 1)).toBe(true);
    expect(validateImageBytes(12 * 1024 * 1024)).toBe(true);
  });
  it('rejects images above the cap', () => expect(validateImageBytes(12 * 1024 * 1024 + 1)).toBe(false));
  it('rejects invalid sizes', () => {
    for (const size of [0, -1, NaN, 1.5, Infinity]) expect(validateImageBytes(size)).toBe(false);
  });
  it('does not expose internal gateway codes', () => {
    for (const code of ['NETWORK', 'TIMEOUT', 'INVALID_IMAGE', 'TOO_LARGE', 'UNAUTHORIZED', 'RATE_LIMIT']) {
      const message = mapGatewayErrorMessage(code);
      expect(message).not.toContain(code);
      expect(message.length).toBeGreaterThan(10);
    }
  });
  it('uses a generic safe fallback for unknown errors', () => {
    expect(mapGatewayErrorMessage('private stack trace')).toContain('manually');
  });
  it('always warns users to verify OCR output', () => {
    expect(OCR_REVIEW_WARNING).toMatch(/verify every character/i);
    expect(OCR_REVIEW_WARNING).toMatch(/decimal points/i);
  });
});

describe('prescription field extraction', () => {
  it('extracts patient demographics when OCR separates the weight value', () => {
    const result = extractPatientDetails('Patient Name : Rahul Sharma\nAge / Sex : 25 years / Male\nWeight\n: 60 kg');
    expect(result).toMatchObject({name:'Rahul Sharma',age:'25',gender:'Male',weightKg:'60'});
  });

  it('extracts weight when OCR reads the weight label before name and age', () => {
    const text = ['Weight','Patient Name : Rahul Sharma','Age / Sex : 25 years / Male',': 60 kg','Presenting Complaints: Fever'].join('\\n');
    expect(extractPatientDetails(text)).toMatchObject({name:'Rahul Sharma',age:'25',gender:'Male',weightKg:'60'});
  });

  it('reconstructs medicine rows from OCR table columns', () => {
    const text = [
      'Drug Name','Paracetamol','Chloroquine','Primaquine','Ibuprofen',
      'Strength','500 mg','250 mg','7.5 mg','400 mg',
      'Prescribed Dose','500 mg','500 mg','15 mg','800 mg',
      'Frequency','Every 2 hours','Three times daily','Daily','Three times daily',
      'Route','Oral','Oral','Oral','Oral'
    ].join('\n');
    const meds = extractMedicineCandidates(text);
    expect(meds).toHaveLength(4);
    expect(meds[0]).toMatchObject({name:'Paracetamol',strength:'500 mg',dose:'500 mg',frequency:'Every 2 hours',instructions:'Route: Oral'});
    expect(meds[2]).toMatchObject({name:'Primaquine',strength:'7.5 mg',dose:'15 mg'});
  });

  it('extracts patient and medicine fields from a multi-line hospital prescription OCR sample', () => {
    const text = [
      'Weight','Patient Name : Rahul Sharma','Age / Sex : 25 years / Male',': 60 kg',
      'Presenting Complaints:','Fever (102F), chills and sweating',
      'S.No.','R Prescription','ABC GENERAL HOSPITAL','Drug Name',
      'Paracetamol','Chloroquine','Primaquine','Ibuprofen','Povidone-iodine','6 Tetanus vaccine',
      'Additional Instructions:','Investigations Advised:',
      'Strength','500 mg','250 mg','7.5 mg','400 mg','5%',
      'Prescribed Dose','500 mg','500 mg','15 mg','800 mg',
      'Frequency','Every 2 hours','Three times daily','Daily','Three times daily',
      'Route','Oral','Oral','Oral','Oral'
    ].join('\n');
    expect(extractPatientDetails(text)).toMatchObject({name:'Rahul Sharma',age:'25',gender:'Male',weightKg:'60'});
    const meds=extractMedicineCandidates(text);
    expect(meds.length).toBeGreaterThanOrEqual(4);
    expect(meds[0]).toMatchObject({name:'Paracetamol',strength:'500 mg',dose:'500 mg',frequency:'Every 2 hours'});
    expect(meds[2]).toMatchObject({name:'Primaquine',strength:'7.5 mg',dose:'15 mg'});
  });

});
