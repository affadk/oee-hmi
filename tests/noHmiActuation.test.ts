// Operator directive: HMI tidak mengaktuasi mesin. START/STOP/PAUSE/RESET hanya
// dari tombol fisik Edge OEE. Guard ini gagal bila ada elemen presentasi yang
// mengirim perintah aktuasi (RESET_COUNTER / RESUME / PAUSE / dispatchMachineCommand).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = join(process.cwd(), 'src/presentation');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

describe('HMI tidak mengaktuasi mesin', () => {
  it('tidak ada sumber presentasi yang mengirim perintah aktuasi', () => {
    const banned = /(dispatchMachineCommand|onDispatchMachineCommand|sendCmd\()/;
    const offenders = walk(ROOT)
      .filter((file) => banned.test(readFileSync(file, 'utf8')))
      .map((file) => file.replace(process.cwd() + '/', ''));
    expect(offenders).toEqual([]);
  });
});