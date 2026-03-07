import { describe, expect, it } from 'vitest';

import { readIptimeConfig } from '../src/lib/env';

describe('readIptimeConfig', () => {
  it('reads lowercase env vars from .env-style input', () => {
    const config = readIptimeConfig({
      iptime_end_point: 'http://router.local:9999',
      iptime_id: 'admin',
      iptime_pw: 'secret',
    });

    expect(config).toEqual({
      endpoint: 'http://router.local:9999',
      username: 'admin',
      password: 'secret',
    });
  });

  it('supports uppercase fallbacks', () => {
    const config = readIptimeConfig({
      IPTIME_ENDPOINT: 'http://192.168.0.1',
      IPTIME_ID: 'upper-admin',
      IPTIME_PW: 'upper-secret',
    });

    expect(config).toEqual({
      endpoint: 'http://192.168.0.1',
      username: 'upper-admin',
      password: 'upper-secret',
    });
  });

  it('throws when required values are missing', () => {
    expect(() => readIptimeConfig({ iptime_end_point: 'http://router.local:9999' })).toThrow(
      /iptime_id/i,
    );
  });
});
