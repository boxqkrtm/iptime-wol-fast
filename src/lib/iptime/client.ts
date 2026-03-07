import 'server-only';

import { lenientFetch, type Transport } from './http-client';
import { parseWolDevices, macToSignalFormat } from './parser';
import { extractCookieHeader } from './session';
import type { IptimeConfig, IptimeServiceResponse, WolDevice } from './types';

type RequestPayload = {
  method: string;
  params?: unknown;
};

type ServiceCallOptions = {
  allowTextResult?: boolean;
};

export class IptimeClient {
  private readonly endpoint: string;
  private readonly serviceUrl: string;
  private readonly transport: Transport;
  private cookieHeader: string | null = null;

  constructor(
    private readonly config: IptimeConfig,
    transport: Transport = lenientFetch,
  ) {
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.serviceUrl = `${this.endpoint}/cgi/service.cgi`;
    this.transport = transport;
  }

  async listWolDevices(): Promise<WolDevice[]> {
    await this.login();
    const response = await this.callService<unknown>({ method: 'wol/show' }, { allowTextResult: true });
    return parseWolDevices(response.result);
  }

  async wakeDevice(mac: string): Promise<{ ok: true }> {
    await this.login();
    await this.callService<string>({
      method: 'wol/signal',
      params: [macToSignalFormat(mac)],
    });

    return { ok: true };
  }

  async login(): Promise<void> {
    if (this.cookieHeader) {
      return;
    }

    const response = await this.callService<string>({
      method: 'session/login',
      params: {
        id: this.config.username,
        pw: this.config.password,
      },
    });

    if (response.result !== 'done') {
      throw new Error(`ipTIME login failed: ${String(response.result)}`);
    }

    if (!this.cookieHeader) {
      throw new Error('ipTIME login did not return a session cookie');
    }
  }

  private async callService<T>(
    payload: RequestPayload,
    options: ServiceCallOptions = {},
  ): Promise<IptimeServiceResponse<T | string>> {
    const response = await this.transport(this.serviceUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/plain, */*',
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8',
        origin: this.endpoint,
        referer: `${this.endpoint}/ui/`,
        ...(this.cookieHeader ? { cookie: this.cookieHeader } : {}),
      },
      body: JSON.stringify(payload.params === undefined ? { method: payload.method } : payload),
      cache: 'no-store',
    });

    const setCookieHeader = extractCookieHeader(response.headers);
    if (setCookieHeader) {
      this.cookieHeader = setCookieHeader;
    }

    if (!response.ok) {
      throw new Error(`ipTIME request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const responseBody = contentType.includes('application/json') ? await response.json() : await response.text();

    if (typeof responseBody === 'string') {
      if (options.allowTextResult) {
        return {
          result: responseBody,
        };
      }

      throw new Error(`Expected JSON from ipTIME but received HTML/text for ${payload.method}`);
    }

    const serviceResponse = responseBody as IptimeServiceResponse<T>;
    if (serviceResponse.error) {
      throw new Error(`ipTIME ${payload.method} failed: ${serviceResponse.error.message}`);
    }

    return serviceResponse;
  }
}
