// /src/application/index.ts
// Canonical application barrel — use-cases + hooks + DTO mappers.

// Use Cases (simulation lane)
export * from './use-cases/CalculateOeeUseCase';
export * from './use-cases/GetMachinesUseCase';
export * from './use-cases/UpdateMachineStatusUseCase';
export * from './use-cases/LogDowntimeUseCase';
export * from './use-cases/LogRejectUseCase';
export * from './simulation/use-cases/SimulateMachinePulseUseCase';
export * from './use-cases/ManageAlarmsUseCase';
export * from './use-cases/MqttEdgeCommandUseCase';

// Use Cases (backend lane — REST + WS)
export * from './use-cases/ListWorkOrdersUseCase';
export * from './use-cases/GetDowntimeReasonsUseCase';
export * from './use-cases/GetTelemetryAggregateUseCase';
export * from './use-cases/GetTelemetryHistoryUseCase';
export * from './use-cases/GetActiveDowntimesUseCase';
export * from './use-cases/GetShiftSummaryUseCase';
export * from './use-cases/GetShiftTimelineUseCase';
export * from './use-cases/SubscribeTelemetryUseCase';
export * from './use-cases/ListLabelableDowntimesUseCase';
export * from './use-cases/LabelDowntimeReasonUseCase';
export * from './use-cases/ConfigureDeviceUseCase';

// Hooks
// NOTE: hooks must receive collaborators via arguments or via presentation
// providers — they must NOT import infrastructure/di or seed data directly.
export * from './hooks/useOeeDashboard';
export * from './hooks/useAuthSession';
export * from './hooks/useMachinesQuery';
export * from './hooks/useSupplementalSync';
export * from './hooks/useTelemetrySubscription';
export * from './hooks/useSimulationTicker';
export * from './hooks/useMachineActions';
export * from './hooks/useLiveTrend';
export * from './hooks/useShiftServerData';
export * from './hooks/useDeviceRegistry';
export * from './hooks/useWorkOrders';
export * from './hooks/useDashboardUi';
