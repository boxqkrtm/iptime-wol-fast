import { describe, expect, it } from 'vitest';

import { parseWolDevices } from '../src/lib/iptime/parser';

describe('parseWolDevices', () => {
  it('parses JSON list responses from ipTIME', () => {
    const devices = parseWolDevices([
      { mac: '70:85:C2:F9:7D:5E', pcname: 'pc 데탑 1660' },
      { mac: 'AA-BB-CC-DD-EE-FF', pcname: 'NAS' },
    ]);

    expect(devices).toEqual([
      { id: '70-85-C2-F9-7D-5E', mac: '70:85:C2:F9:7D:5E', name: 'pc 데탑 1660' },
      { id: 'AA-BB-CC-DD-EE-FF', mac: 'AA:BB:CC:DD:EE:FF', name: 'NAS' },
    ]);
  });

  it('falls back to HTML parsing when the router returns markup', () => {
    const html = `
      <table>
        <tr><th>PC Name</th><th>MAC</th></tr>
        <tr><td>Gaming PC</td><td>70-85-C2-F9-7D-5E</td></tr>
        <tr><td>Office</td><td>AA:BB:CC:DD:EE:FF</td></tr>
      </table>
    `;

    expect(parseWolDevices(html)).toEqual([
      { id: '70-85-C2-F9-7D-5E', mac: '70:85:C2:F9:7D:5E', name: 'Gaming PC' },
      { id: 'AA-BB-CC-DD-EE-FF', mac: 'AA:BB:CC:DD:EE:FF', name: 'Office' },
    ]);
  });
});
