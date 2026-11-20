// /src/domain/ports/IAuthTokenStorage.ts
// Port for operator API token persistence. Implementations live in
// infrastructure/storage. Keeps the token key + storage access in one place
// instead of scattered direct calls across api/*.

export interface IAuthTokenStorage {
  getToken(): string | null;
  setToken(token: string): void;
  clearToken(): void;
  /** Station context kiosk (deviceId); persist lintas sesi, bukan kredensial. */
  getStationId(): string | null;
  setStationId(stationId: string): void;
}
