import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ApiConfigService {
  constructor(private readonly configService: ConfigService) {}

  getItheumSdkEnvironment(): string {
    const environment = this.configService.get<string>("itheumSdk.environment");
    if (!environment) {
      throw new Error("No itheumSdk.environment present");
    }

    return environment;
  }

  getApiUrl(): string {
    const apiUrl = this.configService.get<string>("urls.api");
    if (!apiUrl) {
      throw new Error("No API url present");
    }

    return apiUrl;
  }

  getSwaggerUrls(): string[] {
    const swaggerUrls = this.configService.get<string[]>("urls.swagger");
    if (!swaggerUrls) {
      throw new Error("No swagger urls present");
    }

    return swaggerUrls;
  }

  getRedisHost(): string {
    const redisUrl = this.configService.get<string>("redis.host");
    if (!redisUrl) {
      throw new Error("No redisUrl present");
    }
    return redisUrl;
  }

  getRedisPort(): number {
    const redisPort = this.configService.get<number>("redis.port");
    if (!redisPort) {
      throw new Error("No redisPort present");
    }
    return redisPort;
  }

  getRedisPassword(): string {
    const redisPassword = this.configService.get<string>("redis.password");
    if (!redisPassword) {
      throw new Error("No redisPassword present");
    }
    return redisPassword;
  }

  getRedisUsername(): string {
    const redisUsername = this.configService.get<string>("redis.username");
    if (!redisUsername) {
      throw new Error("No redis username present");
    }
    return redisUsername;
  }

  getDatabaseHost(): string {
    const databaseHost = this.configService.get<string>("database.host");
    if (!databaseHost) {
      throw new Error("No database.host present");
    }

    return databaseHost;
  }

  getDatabasePort(): number {
    const databasePort = this.configService.get<number>("database.port");
    if (!databasePort) {
      throw new Error("No database.port present");
    }

    return databasePort;
  }

  getDatabaseUsername(): string {
    const databaseUsername = this.configService.get<string>("database.username");
    if (!databaseUsername) {
      throw new Error("No database.username present");
    }

    return databaseUsername;
  }

  getDatabasePassword(): string {
    const databasePassword = this.configService.get<string>("database.password");
    if (!databasePassword) {
      throw new Error("No database.password present");
    }

    return databasePassword;
  }

  getDatabaseName(): string {
    const databaseName = this.configService.get<string>("database.name");
    if (!databaseName) {
      throw new Error("No database.name present");
    }

    return databaseName;
  }

  getIsPublicApiFeatureActive(): boolean {
    const isApiActive = this.configService.get<boolean>("features.publicApi.enabled");
    if (isApiActive === undefined) {
      throw new Error("No public api feature flag present");
    }

    return isApiActive;
  }

  getPublicApiFeaturePort(): number {
    const featurePort = this.configService.get<number>("features.publicApi.port");
    if (featurePort === undefined) {
      throw new Error("No public api port present");
    }

    return featurePort;
  }

  getSecurityAdmins(): string[] {
    const admins = this.configService.get<string[]>("security.admins");
    if (admins === undefined) {
      throw new Error("No security admins value present");
    }

    return admins;
  }

  getRateLimiterSecret(): string | undefined {
    return this.configService.get<string>("rateLimiterSecret");
  }

  getAxiosTimeout(): number {
    return this.configService.get<number>("keepAliveTimeout.downstream") ?? 61000;
  }

  getIsKeepAliveAgentFeatureActive(): boolean {
    return this.configService.get<boolean>("keepAliveAgent.enabled") ?? true;
  }

  getServerTimeout(): number {
    return this.configService.get<number>("keepAliveTimeout.upstream") ?? 60000;
  }

  getHeadersTimeout(): number {
    return this.getServerTimeout() + 1000;
  }

  getUseCachingInterceptor(): boolean {
    return this.configService.get<boolean>("useCachingInterceptor") ?? false;
  }

  getElasticUrl(): string {
    const elasticUrls = this.configService.get<string[]>("urls.elastic");
    if (!elasticUrls) {
      throw new Error("No elastic urls present");
    }

    return elasticUrls[Math.floor(Math.random() * elasticUrls.length)];
  }

  getPoolLimit(): number {
    return this.configService.get<number>("caching.poolLimit") ?? 100;
  }

  getProcessTtl(): number {
    return this.configService.get<number>("caching.processTtl") ?? 60;
  }

  getUseKeepAliveAgentFlag(): boolean {
    return this.configService.get<boolean>("flags.useKeepAliveAgent") ?? true;
  }

  getIsAuthActive(): boolean {
    return this.configService.get<boolean>("api.auth") ?? false;
  }

  getNativeAuthMaxExpirySeconds(): number {
    return this.configService.get<number>("nativeAuth.maxExpirySeconds") ?? 86400;
  }

  getNativeAuthAcceptedOrigins(): string[] {
    return this.configService.get<string[]>("nativeAuth.acceptedOrigins") ?? [""];
  }
}
