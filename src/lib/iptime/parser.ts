import { load } from 'cheerio';

import type { WolDevice } from './types';

const MAC_PATTERN = /(?:[0-9A-F]{2}[:-]){5}[0-9A-F]{2}/i;

export function normalizeMacAddress(mac: string): string {
  const compact = mac.toUpperCase().replace(/[^0-9A-F]/g, '');

  if (compact.length !== 12) {
    throw new Error(`Invalid MAC address: ${mac}`);
  }

  return compact.match(/.{1,2}/g)?.join(':') ?? mac.toUpperCase();
}

export function macToSignalFormat(mac: string): string {
  return normalizeMacAddress(mac).replace(/:/g, '-');
}

export function parseWolDevices(input: unknown): WolDevice[] {
  if (Array.isArray(input)) {
    return dedupeDevices(input.flatMap(parseDeviceLike));
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return parseWolDevices(JSON.parse(trimmed));
      } catch {
        // fall through to HTML parsing
      }
    }

    return parseWolDevicesFromHtml(trimmed);
  }

  if (input && typeof input === 'object') {
    const record = input as Record<string, unknown>;

    if (Array.isArray(record.result)) {
      return parseWolDevices(record.result);
    }

    if (typeof record.result === 'string') {
      return parseWolDevices(record.result);
    }
  }

  return [];
}

function parseDeviceLike(entry: unknown): WolDevice[] {
  if (!entry || typeof entry !== 'object') {
    return [];
  }

  const record = entry as Record<string, unknown>;
  const macValue = [record.mac, record.macaddr, record.addr].find((value): value is string => typeof value === 'string' && MAC_PATTERN.test(value));

  if (!macValue) {
    return [];
  }

  const nameValue = [record.pcname, record.name, record.hostname, record.host].find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  const mac = normalizeMacAddress(macValue);

  return [
    {
      id: macToSignalFormat(mac),
      mac,
      name: nameValue?.trim() || mac,
    },
  ];
}

function parseWolDevicesFromHtml(html: string): WolDevice[] {
  const $ = load(html);
  const devices: WolDevice[] = [];

  $('tr').each((_, row) => {
    const cells = $(row)
      .find('td, th')
      .map((__, cell) => $(cell).text().trim())
      .get()
      .filter(Boolean);

    const macValue = cells.find((cell) => MAC_PATTERN.test(cell));
    if (!macValue) {
      return;
    }

    const mac = normalizeMacAddress(macValue);
    const name = cells.find((cell) => cell !== macValue)?.trim() || mac;

    devices.push({
      id: macToSignalFormat(mac),
      mac,
      name,
    });
  });

  if (devices.length > 0) {
    return dedupeDevices(devices);
  }

  const matches = html.match(new RegExp(MAC_PATTERN.source, 'gi')) ?? [];
  return dedupeDevices(
    matches.map((macValue) => {
      const mac = normalizeMacAddress(macValue);
      return {
        id: macToSignalFormat(mac),
        mac,
        name: mac,
      };
    }),
  );
}

function dedupeDevices(devices: WolDevice[]): WolDevice[] {
  const unique = new Map<string, WolDevice>();

  for (const device of devices) {
    unique.set(device.id, device);
  }

  return [...unique.values()];
}
