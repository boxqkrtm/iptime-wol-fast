import { describe, expect, it } from 'vitest';

import { parseRawHttpResponse } from '../src/lib/iptime/http-client';

describe('parseRawHttpResponse', () => {
  it('parses LF-only headers from ipTIME responses', () => {
    const raw = [
      'HTTP/1.0 200 OK\r',
      'Date: Sat, 07 Mar 2026 01:15:07 GMT\nServer: Httpd/1.0\nConnection: close\nCache-Control: no-store\nContent-type: application/json; charset=utf-8\nSet-Cookie: efm_session_id=abc123; SameSite=Strict; Path=/\n',
      '{"result":"done"}',
    ].join('\n');

    const response = parseRawHttpResponse(raw);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toEqual(['application/json; charset=utf-8']);
    expect(response.headers['set-cookie']).toEqual(['efm_session_id=abc123; SameSite=Strict; Path=/']);
    expect(response.body).toBe('{"result":"done"}');
  });
});
