import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BridgeModule } from "./bridge/bridge.module";
import { HealthModule } from "./health-check/health-check.module";

@Module({
  imports: [DynamicModuleUtils.getCachingModule(), HealthModule, BridgeModule],
  exports: [HealthModule, BridgeModule],
})
export class EndpointsServicesModule {}
