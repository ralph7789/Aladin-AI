import { OCRStrategy } from 'aladin-data-provider';
import type { TCustomConfig } from 'aladin-data-provider';

export function loadOCRConfig(config?: TCustomConfig['ocr']): TCustomConfig['ocr'] | undefined {
  if (!config) return;
  const baseURL = config?.baseURL ?? '';
  const apiKey = config?.apiKey ?? '';
  const mistralModel = config?.mistralModel ?? '';
  return {
    apiKey,
    baseURL,
    mistralModel,
    strategy: config?.strategy ?? OCRStrategy.MISTRAL_OCR,
  };
}
