import type { TConfig } from 'aladin-data-provider';

export type TCustomEndpointsConfig = Partial<{ [key: string]: Omit<TConfig, 'order'> }>;
