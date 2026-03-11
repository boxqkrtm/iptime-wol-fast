import 'server-only';

import { z } from 'zod';

import type { IptimeConfig } from './iptime/types';

const envSchema = z.object({
  iptime_end_point: z.string().url().optional(),
  iptime_id: z.string().min(1).optional(),
  iptime_pw: z.string().min(1).optional(),
  IPTIME_ENDPOINT: z.string().url().optional(),
  IPTIME_ID: z.string().min(1).optional(),
  IPTIME_PW: z.string().min(1).optional(),
});

export function readIptimeConfig(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): IptimeConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.path.join('.') + ': ' + issue.message).join(', '));
  }

  const endpoint = parsed.data.iptime_end_point ?? parsed.data.IPTIME_ENDPOINT;
  const username = parsed.data.iptime_id ?? parsed.data.IPTIME_ID;
  const password = parsed.data.iptime_pw ?? parsed.data.IPTIME_PW;

  const missing = [
    !endpoint ? 'iptime_end_point' : null,
    !username ? 'iptime_id' : null,
    !password ? 'iptime_pw' : null,
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(`Missing required ipTIME environment variables: ${missing.join(', ')}`);
  }

  return {
    endpoint: endpoint!,
    username: username!,
    password: password!,
  };
}
