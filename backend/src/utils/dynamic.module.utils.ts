import { CacheModule, RedisCacheModuleOptions } from "@multiversx/sdk-nestjs-cache";
import { ERDNEST_CONFIG_SERVICE } from "@multiversx/sdk-nestjs-common";
import { ApiModule, ApiModuleOptions } from "@multiversx/sdk-nestjs-http";
import { DynamicModule, Provider } from "@nestjs/common";
import { ApiConfigModule } from "src/common/api-config/api.config.module";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { SdkNestjsConfigServiceImpl } from "src/common/api-config/sdk.nestjs.config.service.impl";

export class DynamicModuleUtils {
  static getCachingModule(): DynamicModule {
    return CacheModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new RedisCacheModuleOptions(
          {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            username: process.env.REDIS_USERNAME,
          },
          {
            poolLimit: apiConfigService.getPoolLimit(),
            processTtl: apiConfigService.getProcessTtl(),
          }
        ),
      inject: [ApiConfigService],
    });
  }

  static getApiModule(): DynamicModule {
    return ApiModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new ApiModuleOptions({
          axiosTimeout: apiConfigService.getAxiosTimeout(),
          rateLimiterSecret: apiConfigService.getRateLimiterSecret(),
          serverTimeout: apiConfigService.getServerTimeout(),
          useKeepAliveAgent: apiConfigService.getUseKeepAliveAgentFlag(),
        }),
      inject: [ApiConfigService],
    });
  }

  static getNestJsApiConfigService(): Provider {
    return {
      provide: ERDNEST_CONFIG_SERVICE,
      useClass: SdkNestjsConfigServiceImpl,
    };
  }
}
