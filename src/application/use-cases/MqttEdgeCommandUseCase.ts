// /src/application/use-cases/MqttEdgeCommandUseCase.ts

import { IMqttGateway, MqttEdgeCommand } from '../../domain/ports/IMqttGateway';
import { IMachineRepository } from '../../domain/ports/IMachineRepository';
import { MqttJobConfigPayload } from '../../domain/entities/MqttContracts';
import { MachineConfig } from '../../domain/entities/Machine';

export class MqttEdgeCommandUseCase {
  constructor(
    private readonly mqttGateway: IMqttGateway,
    private readonly machineRepo: IMachineRepository
  ) {}

  public async dispatchCommand(
    machineId: string,
    command: MqttEdgeCommand
  ): Promise<{ message: string; updatedMachine?: MachineConfig }> {
    const result = await this.mqttGateway.sendCommand(machineId, command);

    let updatedMachine: MachineConfig | undefined;
    if (command === 'RESET_COUNTER') {
      updatedMachine = await this.machineRepo.resetCounters(machineId);
    } else if (command === 'PAUSE') {
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedMachine = await this.machineRepo.updateMachineStatus(machineId, 'DOWN', `${timeNow} (Paused via Edge)`);
    } else if (command === 'RESUME') {
      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      updatedMachine = await this.machineRepo.updateMachineStatus(machineId, 'RUNNING', `${timeNow} (Resumed via Edge)`);
    }

    return {
      message: result.message,
      updatedMachine,
    };
  }

  public async setJobConfig(
    machineId: string,
    payload: MqttJobConfigPayload
  ): Promise<{ transactionId: string; updatedMachine: MachineConfig }> {
    const result = await this.mqttGateway.sendJobConfig(payload);
    const updatedMachine = await this.machineRepo.setJobConfig(
      machineId,
      payload
    );

    return {
      transactionId: result.transactionId,
      updatedMachine,
    };
  }
}
