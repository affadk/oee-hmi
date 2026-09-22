// /src/infrastructure/api/endpoints.ts
// Central catalogue of backend REST paths (see API_DOCUMENTATION.md §1–§3).
// No fetch here — pure path builders so tests never touch the network.

export const endpoints = {
  health: () => '/health',
  liveStateAll: () => '/api/v1/live-state',
  liveStateByDevice: (deviceId: string) => `/api/v1/live-state/${encodeURIComponent(deviceId)}`,
  workOrders: () => '/api/v1/work-orders',
  workOrderDetail: (woId: string) => `/api/v1/work-orders/${encodeURIComponent(woId)}`,
  workOrderResolve: (woId: string, deviceId: string) =>
    `/api/v1/work-orders/${encodeURIComponent(woId)}/resolve?device_id=${encodeURIComponent(deviceId)}`,
  workOrderDispatch: (woId: string) => `/api/v1/work-orders/${encodeURIComponent(woId)}/dispatch`,
  workOrderComplete: (woId: string) => `/api/v1/work-orders/${encodeURIComponent(woId)}/complete`,
  workOrderCancel: (woId: string) => `/api/v1/work-orders/${encodeURIComponent(woId)}/cancel`,
  deviceCommand: (deviceId: string) => `/api/v1/devices/${encodeURIComponent(deviceId)}/command`,
  devices: () => '/api/v1/devices',
  deviceDetail: (deviceId: string) => `/api/v1/devices/${encodeURIComponent(deviceId)}`,
  machines: () => '/api/v1/machines',
  machineDetail: (machineId: string) => `/api/v1/machines/${encodeURIComponent(machineId)}`,
  machineBind: (machineId: string) => `/api/v1/machines/${encodeURIComponent(machineId)}/bind`,
  machineUnbind: (machineId: string) => `/api/v1/machines/${encodeURIComponent(machineId)}/unbind`,
  products: () => '/api/v1/products',
  operators: () => '/api/v1/operators',
  telemetryHistory: (deviceId: string) => `/api/v1/telemetry/${encodeURIComponent(deviceId)}`,
  telemetryAggregate: (deviceId: string) => `/api/v1/telemetry/${encodeURIComponent(deviceId)}/aggregate`,
  telemetryHourly: (deviceId: string) => `/api/v1/telemetry/${encodeURIComponent(deviceId)}/hourly`,
  telemetryExport: (deviceId: string) => `/api/v1/telemetry/${encodeURIComponent(deviceId)}/export`,
  downtimeActive: () => '/api/v1/downtime-events/active',
  downtimesByDevice: (deviceId: string) => `/api/v1/downtime-events/${encodeURIComponent(deviceId)}`,
  downtimeReason: (id: number) => `/api/v1/downtime-events/${id}/reason`,
  operationalEvents: (deviceId: string) => `/api/v1/operational-events/${encodeURIComponent(deviceId)}`,
  authOperatorPin: () => '/api/v1/auth/operator-pin',
} as const;
