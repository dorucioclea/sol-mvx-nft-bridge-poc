import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { NativeAuth, NativeAuthGuard } from "@multiversx/sdk-nestjs-auth";
import { ApiBody, ApiTags } from "@nestjs/swagger";
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

  @Post("/process_back")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        tokenAddress: {
          type: "string",
        },
      },
    },
  })
  async process_back(@Body("tokenAddress") tokenAddress: string) {
    return "ok";
  }
}
