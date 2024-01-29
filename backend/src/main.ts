import { Logger } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { readFileSync } from "fs";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { join } from "path";
import { ApiConfigService } from "./common/api-config/api.config.service";
import { PublicAppModule } from "./public.app.module";
import { LoggerInitializer } from "@multiversx/sdk-nestjs-common";

async function bootstrap() {
  const publicApp = await NestFactory.create(PublicAppModule);
  publicApp.use(bodyParser.json({ limit: "1mb" }));
  publicApp.enableCors();
  publicApp.useLogger(publicApp.get(WINSTON_MODULE_NEST_PROVIDER));
  publicApp.use(cookieParser());

  const apiConfigService = publicApp.get<ApiConfigService>(ApiConfigService);

  const httpAdapterHostService = publicApp.get<HttpAdapterHost>(HttpAdapterHost);

  // if (apiConfigService.getIsAuthActive()) {
  //   publicApp.useGlobalGuards(
  //     new NativeAuthGuard(
  //       new SdkNestjsConfigServiceImpl(apiConfigService),
  //     ),
  //   );
  // }

  const httpServer = httpAdapterHostService.httpAdapter.getHttpServer();
  httpServer.keepAliveTimeout = apiConfigService.getServerTimeout();
  httpServer.headersTimeout = apiConfigService.getHeadersTimeout(); //`keepAliveTimeout + server's expected response time`

  const description = readFileSync(join(__dirname, "..", "docs", "swagger.md"), "utf8");

  let documentBuilder = new DocumentBuilder().setTitle("Itheum Bridge").setDescription(description).setVersion("1.0.0");

  const apiUrls = apiConfigService.getSwaggerUrls();
  for (const apiUrl of apiUrls) {
    documentBuilder = documentBuilder.addServer(apiUrl);
  }

  const config = documentBuilder.build();

  const document = SwaggerModule.createDocument(publicApp, config);
  SwaggerModule.setup("", publicApp, document);

  if (apiConfigService.getIsPublicApiFeatureActive()) {
    //  await publicApp.listen(apiConfigService.getPublicApiFeaturePort());
    await publicApp.listen(process.env.PORT || 3000, "0.0.0.0"); // railway setup
  }

  const logger = new Logger("Bootstrapper");

  LoggerInitializer.initialize(logger);

  logger.log(`Public API active: ${apiConfigService.getIsPublicApiFeatureActive()}`);
}

bootstrap();
