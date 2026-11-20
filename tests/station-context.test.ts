// Unit 001 Fase 1 (T004/T008): station context picker (OQ-001 resolved).
import { describe, expect, it } from 'vitest';
import { pickStationId } from '../src/application/stationContext';

const REGISTERED = ['STM32-OEE-01', 'STM32-OEE-02'];

describe('pickStationId — rantai query → store → env, validasi registry', () => {
  it('query commissioning menang atas store dan env', () => {
    expect(pickStationId(['STM32-OEE-02', 'STM32-OEE-01', 'STM32-OEE-01'], REGISTERED)).toBe('STM32-OEE-02');
  });

  it('store override menang atas env bila query absen', () => {
    expect(pickStationId([null, 'STM32-OEE-02', 'STM32-OEE-01'], REGISTERED)).toBe('STM32-OEE-02');
  });

  it('env deployment dipakai bila query/store absen', () => {
    expect(pickStationId([null, null, 'STM32-OEE-01'], REGISTERED)).toBe('STM32-OEE-01');
  });

  it('kandidat tak terdaftar dilewati (bukan dikirim buta)', () => {
    expect(pickStationId(['CNC-MILLING-01', 'STM32-OEE-02'], REGISTERED)).toBe('STM32-OEE-02');
  });

  it('machineId tidak pernah lolos sebagai station', () => {
    expect(pickStationId(['CNC-MILLING-01'], REGISTERED)).toBe('');
  });

  it('registry kosong (belum termuat/gagal) = konteks tak tervalidasi → kosong', () => {
    expect(pickStationId(['STM32-OEE-01'], [])).toBe('');
  });

  it('semua kandidat absen → kosong', () => {
    expect(pickStationId([null, undefined, '  '], REGISTERED)).toBe('');
  });
});
