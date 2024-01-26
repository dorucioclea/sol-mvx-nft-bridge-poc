import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/common/database/database.module";
import { BridgeService } from "./bridge.service";
import { ApiConfigModule } from "src/common/api-config/api.config.module";

@Module({
  imports: [DatabaseModule, ApiConfigModule],
  providers: [BridgeService],
  exports: [BridgeService],
})
export class BridgeModule {}
