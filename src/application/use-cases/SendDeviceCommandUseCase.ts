// /src/application/use-cases/SendDeviceCommandUseCase.ts
// Authenticated device actuation (POST /devices/:id/command, §D).
// Reason-length invariant is enforced in domain (assertDeviceCommandReason).

import type { IDeviceCommandGateway } from '../../domain/ports/IOeeBackend';
import { assertDeviceCommandReason, type DeviceCommandInput } from '../../domain/entities/backend/Device';

export class SendDeviceCommandUseCase {
  constructor(private readonly gateway: IDeviceCommandGateway) {}

  async execute(input: DeviceCommandInput): Promise<{ success: boolean; transactionId: string }> {
    assertDeviceCommandReason(input.reason);
    return this.gateway.sendCommand(input);
  }
}
