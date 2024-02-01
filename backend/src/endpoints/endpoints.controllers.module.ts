import { Module } from "@nestjs/common";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { EndpointsServicesModule } from "./endpoints.services.module";
import { HealthController } from "./health-check/health-check.controller";
import { BridgeController } from "./bridge/bridge.controller";
import { PreAccessController } from "./preaccess/preaccess.controller";
import { AccessController } from "./access/access.controller";

@Module({
  imports: [EndpointsServicesModule],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  controllers: [HealthController, BridgeController, PreAccessController, AccessController],
})
export class EndpointsControllersModule {}
