import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { EndpointsServicesModule } from "./endpoints.services.module";
import { HealthController } from "./health-check/health-check.controller";

@Module({
  imports: [EndpointsServicesModule],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  controllers: [HealthController],
})
export class EndpointsControllersModule {}
