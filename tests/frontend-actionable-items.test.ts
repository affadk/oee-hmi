import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/infrastructure/backend/api-clients/endpoints';
import { ExportTelemetryUseCase } from '../src/application/use-cases/ExportTelemetryUseCase';
import { GetHealthUseCase } from '../src/application/use-cases/GetHealthUseCase';
import { ConfigureDeviceUseCase } from '../src/application/use-cases/ConfigureDeviceUseCase';

describe('frontend actionable contracts', () => {
  it('exposes telemetry export and health paths', () => {
    expect(endpoints.telemetryExport('STM32-OEE-01')).toBe('/api/v1/telemetry/STM32-OEE-01/export');
    expect(endpoints.health()).toBe('/health');
    expect(endpoints.workOrderDetail('WO-1')).toBe('/api/v1/work-orders/WO-1');
    expect(endpoints.products()).toBe('/api/v1/products');
    expect(endpoints.operators()).toBe('/api/v1/operators');
  });

  it('validates export device id', () => {
    const useCase = new ExportTelemetryUseCase({ getExport: async () => new Blob() } as never);
    expect(() => useCase.execute('')).toThrow(/deviceId/);
  });

  it('passes health through without fabrication', async () => {
    const health = { status: 'ok', wsClients: 2, bufferPending: 0, uptimeSec: 3600 };
    const useCase = new GetHealthUseCase({ getHealth: async () => health } as never);
    await expect(useCase.execute()).resolves.toBe(health);
  });

  it('falls back to empty catalog when backend lists fail', async () => {
    const useCase = new ConfigureDeviceUseCase({
      listProducts: async () => { throw new Error('down'); },
      listOperators: async () => [],
    } as never);
    await expect(useCase.loadCatalog()).resolves.toEqual({ products: [], operators: [] });
  });
});
