export function extractCookieHeader(headers: Headers): string | null {
  const getSetCookie = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const setCookieValues = typeof getSetCookie === 'function' ? getSetCookie.call(headers) : [headers.get('set-cookie')].filter(Boolean) as string[];

  const cookies = setCookieValues
    .flatMap((value) => value.split(/,(?=[^;]+=)/))
    .map((value) => value.split(';', 1)[0]?.trim())
    .filter(Boolean);

  return cookies.length > 0 ? cookies.join('; ') : null;
}
