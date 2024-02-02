import { LoggingModule } from "@multiversx/sdk-nestjs-common";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { EndpointsControllersModule } from "./endpoints/endpoints.controllers.module";
import { EndpointsServicesModule } from "./endpoints/endpoints.services.module";
import { DynamicModuleUtils } from "./utils/dynamic.module.utils";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [
    LoggingModule,
    EndpointsServicesModule,
    EndpointsControllersModule,
    ScheduleModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
  ],
  providers: [DynamicModuleUtils.getNestJsApiConfigService()],
  exports: [EndpointsServicesModule],
})
export class PublicAppModule {}
