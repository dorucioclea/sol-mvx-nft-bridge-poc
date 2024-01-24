import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/common/database/database.module";
import { BridgeService } from "./bridge.service";

@Module({
  imports: [DatabaseModule],
  providers: [BridgeService],
  exports: [BridgeService],
})
export class BridgeModule {}
