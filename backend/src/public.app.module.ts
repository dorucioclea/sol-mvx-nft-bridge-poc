import { LoggingModule } from "@multiversx/sdk-nestjs-common";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { EndpointsControllersModule } from "./endpoints/endpoints.controllers.module";
import { EndpointsServicesModule } from "./endpoints/endpoints.services.module";
import { DynamicModuleUtils } from "./utils/dynamic.module.utils";

@Module({
  imports: [LoggingModule, EndpointsServicesModule, EndpointsControllersModule, ScheduleModule.forRoot()],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  exports: [EndpointsServicesModule],
})
export class PublicAppModule {}
