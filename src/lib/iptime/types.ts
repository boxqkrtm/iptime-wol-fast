export type IptimeConfig = {
  endpoint: string;
  username: string;
  password: string;
};

export type WolDevice = {
  id: string;
  name: string;
  mac: string;
};

export type IptimeServiceError = {
  code: number;
  message: string;
  data?: unknown;
};

export type IptimeServiceResponse<T> = {
  result: T;
  error?: IptimeServiceError | null;
};
