import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { BridgeModule } from "./bridge/bridge.module";
import { HealthModule } from "./health-check/health-check.module";
import { PreAccessModule } from "./preaccess/preaccess.module";

@Module({
  imports: [DynamicModuleUtils.getCachingModule(), HealthModule, BridgeModule, PreAccessModule],
  exports: [HealthModule, BridgeModule, PreAccessModule],
})
export class EndpointsServicesModule {}
