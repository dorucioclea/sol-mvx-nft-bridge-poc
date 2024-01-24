import { LoggerInitializer } from "@multiversx/sdk-nestjs-common";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class BridgeService {
  private logger = new Logger(BridgeService.name);
  constructor() {
    LoggerInitializer.initialize(this.logger);
  }

  async process(txHash: string) {
    return txHash;
  }
}
