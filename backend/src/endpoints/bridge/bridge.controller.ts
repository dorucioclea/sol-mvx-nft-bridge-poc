import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { NativeAuth, NativeAuthGuard } from "@multiversx/sdk-nestjs-auth";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { BridgeService } from "./bridge.service";

@ApiTags("bridge")
@Controller()
export class BridgeController {
  constructor(private readonly bridgeService: BridgeService) {}

  // @UseGuards(NativeAuthGuard)
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
    address = "erd1w6ffeexmumd5qzme78grrvp33qngcgqk2prjyuuyawpc955gvcxqqrsrtw";
    await this.bridgeService.process(txHash, address);
  }
}
