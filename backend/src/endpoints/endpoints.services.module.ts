import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { HealthModule } from "./health-check/health-check.module";

@Module({
  imports: [DynamicModuleUtils.getCachingModule(), HealthModule],
  exports: [HealthModule],
})
export class EndpointsServicesModule {}
