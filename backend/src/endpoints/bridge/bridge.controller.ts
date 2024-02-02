import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { NativeAuth, NativeAuthGuard } from "@multiversx/sdk-nestjs-auth";
import { ApiBody, ApiParam, ApiTags } from "@nestjs/swagger";
import { BridgeService } from "./bridge.service";

@ApiTags("bridge")
@Controller()
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  @UseGuards(NativeAuthGuard)
  @Post("/process")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        txHash: {
          type: "string",
        },
      },
    },
  })
  async process(@Body("txHash") txHash: string, @NativeAuth("address") address: string) {
    await this.bridgeService.process(txHash, address);
  }

  @Get("/getNonceToSign/:pubKey")
  @ApiParam({
    name: "pubKey",
    required: true,
    type: "string",
  })
  async getNonceForBridge(@Param("pubKey") pubKey: string) {
    return this.bridgeService.getNonceToSign(pubKey);
  }

  @Post("/process_back")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        signature: {
          type: "string",
        },
        sftAddress: {
          type: "string",
        },
        amount: {
          type: "number",
        },
        accessRequesterAddr: {
          type: "string",
        },
        mvxAddress: {
          type: "string",
        },
      },
    },
  })
  async process_back(
    @Body("signature") signature: string,
    @Body("sftAddress") sftAddress: string,
    @Body("amount") amount: number,
    @Body("accessRequesterAddr") accessRequesterAddr: string,
    @Body("mvxAddress") mvxAddress: string
  ) {
    return await this.bridgeService.process_back(signature, sftAddress, amount, accessRequesterAddr, mvxAddress);
  }
}
