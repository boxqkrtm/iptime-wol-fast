import net from 'node:net';
import tls from 'node:tls';

export type TransportResponse = {
  status: number;
  ok: boolean;
  headers: Headers & { getSetCookie?: () => string[] };
  text: () => Promise<string>;
  json: () => Promise<unknown>;
};

export type TransportInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  cache?: RequestCache;
};

export type Transport = (url: string, init?: TransportInit) => Promise<TransportResponse>;

export type ParsedRawHttpResponse = {
  status: number;
  headers: Record<string, string[]>;
  body: string;
};

export async function lenientFetch(url: string, init: TransportInit = {}): Promise<TransportResponse> {
  const target = new URL(url);
  const method = init.method ?? 'GET';
  const body = init.body ?? '';
  const headers = normalizeHeaders(init.headers ?? {}, target, body);
  const requestPayload = `${method} ${target.pathname}${target.search} HTTP/1.1\r\n${headers}\r\n\r\n${body}`;
  const rawResponse = await sendRawHttpRequest(target, requestPayload);
  const parsed = parseRawHttpResponse(rawResponse);
  const responseHeaders = new Headers();

  for (const [name, values] of Object.entries(parsed.headers)) {
    responseHeaders.set(name, values.join(', '));
  }

  responseHeaders.getSetCookie = () => parsed.headers['set-cookie'] ?? [];

  return {
    status: parsed.status,
    ok: parsed.status >= 200 && parsed.status < 300,
    headers: responseHeaders,
    text: async () => parsed.body,
    json: async () => JSON.parse(parsed.body),
  };
}

export function parseRawHttpResponse(raw: string): ParsedRawHttpResponse {
  const separator = raw.match(/\r?\n\r?\n/);
  if (!separator || separator.index === undefined) {
    throw new Error('Invalid HTTP response: header/body separator not found');
  }

  const headerBlock = raw.slice(0, separator.index);
  let body = raw.slice(separator.index + separator[0].length);
  const lines = headerBlock.split(/\r?\n/).map((line) => line.replace(/\r$/, ''));
  const statusLine = lines.shift();

  if (!statusLine) {
    throw new Error('Invalid HTTP response: missing status line');
  }

  const statusMatch = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})/i);
  if (!statusMatch) {
    throw new Error(`Invalid HTTP status line: ${statusLine}`);
  }

  const headers: Record<string, string[]> = {};
  for (const line of lines) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const name = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    headers[name] = [...(headers[name] ?? []), value];
  }

  if ((headers['transfer-encoding'] ?? []).some((value) => value.toLowerCase().includes('chunked'))) {
    body = decodeChunkedBody(body);
  }

  return {
    status: Number(statusMatch[1]),
    headers,
    body,
  };
}

function normalizeHeaders(headers: Record<string, string>, target: URL, body: string): string {
  const nextHeaders = new Map<string, string>();

  for (const [name, value] of Object.entries(headers)) {
    nextHeaders.set(name.toLowerCase(), value);
  }

  if (!nextHeaders.has('host')) {
    nextHeaders.set('host', target.host);
  }

  if (!nextHeaders.has('connection')) {
    nextHeaders.set('connection', 'close');
  }

  if (body.length > 0 && !nextHeaders.has('content-length')) {
    nextHeaders.set('content-length', Buffer.byteLength(body).toString());
  }

  return [...nextHeaders.entries()].map(([name, value]) => `${name}: ${value}`).join('\r\n');
}

function sendRawHttpRequest(target: URL, payload: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const port = Number(target.port || (target.protocol === 'https:' ? '443' : '80'));
    const socket = target.protocol === 'https:'
      ? tls.connect({ host: target.hostname, port, servername: target.hostname })
      : net.createConnection({ host: target.hostname, port });

    socket.setTimeout(15000, () => {
      socket.destroy(new Error('ipTIME request timed out'));
    });

    socket.on('connect', () => {
      socket.write(payload);
    });

    socket.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    socket.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    socket.on('error', (error) => {
      reject(error);
    });
  });
}

function decodeChunkedBody(body: string): string {
  let cursor = 0;
  let output = '';

  while (cursor < body.length) {
    const lineEnd = body.indexOf('\n', cursor);
    if (lineEnd === -1) {
      break;
    }

    const sizeLine = body.slice(cursor, lineEnd).trim();
    const size = Number.parseInt(sizeLine, 16);
    if (!Number.isFinite(size) || size <= 0) {
      break;
    }

    const chunkStart = lineEnd + 1;
    output += body.slice(chunkStart, chunkStart + size);
    cursor = chunkStart + size + 2;
  }

  return output;
}
