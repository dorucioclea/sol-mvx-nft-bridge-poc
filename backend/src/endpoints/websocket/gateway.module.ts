import { Module } from "@nestjs/common";
import { SolanaVerifyGateway } from "./gateway";

@Module({
  imports: [],
  controllers: [],
  providers: [SolanaVerifyGateway],
  exports: [SolanaVerifyGateway],
})
export class GatewayModule {}
