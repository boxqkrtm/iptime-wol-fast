import { beforeEach, describe, expect, it, vi } from 'vitest';

import { IptimeClient } from '../src/lib/iptime/client';

describe('IptimeClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('logs in, lists devices, and reuses the session cookie', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: 'done' }), {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'set-cookie': 'efm_session_id=abc123; Path=/; SameSite=Strict',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: [{ mac: '70:85:C2:F9:7D:5E', pcname: 'pc 데탑 1660' }],
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json; charset=utf-8' },
          },
        ),
      );

    const client = new IptimeClient(
      {
        endpoint: 'http://router.local:9999',
        username: 'admin',
        password: 'secret',
      },
      fetchMock,
    );

    await expect(client.listWolDevices()).resolves.toEqual([
      { id: '70-85-C2-F9-7D-5E', mac: '70:85:C2:F9:7D:5E', name: 'pc 데탑 1660' },
    ]);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://router.local:9999/cgi/service.cgi',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'content-type': 'application/json; charset=utf-8',
          referer: 'http://router.local:9999/ui/',
        }),
        body: JSON.stringify({
          method: 'session/login',
          params: {
            id: 'admin',
            pw: 'secret',
          },
        }),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://router.local:9999/cgi/service.cgi',
      expect.objectContaining({
        headers: expect.objectContaining({
          cookie: 'efm_session_id=abc123',
        }),
        body: JSON.stringify({ method: 'wol/show' }),
      }),
    );
  });

  it('normalizes the MAC address when sending a wake request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: 'done' }), {
          status: 200,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'set-cookie': 'efm_session_id=abc123; Path=/; SameSite=Strict',
          },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ result: 'done' }), {
          status: 200,
          headers: { 'content-type': 'application/json; charset=utf-8' },
        }),
      );

    const client = new IptimeClient(
      {
        endpoint: 'http://router.local:9999',
        username: 'admin',
        password: 'secret',
      },
      fetchMock,
    );

    await expect(client.wakeDevice('70:85:C2:F9:7D:5E')).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://router.local:9999/cgi/service.cgi',
      expect.objectContaining({
        body: JSON.stringify({
          method: 'wol/signal',
          params: ['70-85-C2-F9-7D-5E'],
        }),
      }),
    );
  });
});
