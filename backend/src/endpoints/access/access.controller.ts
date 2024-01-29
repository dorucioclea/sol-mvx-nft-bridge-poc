import { Controller, Get, Header, HttpException, HttpStatus, Query, Headers, Req, Res } from "@nestjs/common";
import { AccessService } from "./access.service";
import { ApiQuery } from "@nestjs/swagger";

@Controller()
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  @ApiQuery({ name: "nonce", type: String, description: "Nonce value" })
  @ApiQuery({ name: "NFTId", type: String, description: "NFT ID" })
  @ApiQuery({ name: "signature", type: String, description: "Signature" })
  @ApiQuery({ name: "chainId", type: String, description: "Chain ID" })
  @ApiQuery({
    name: "streamInline",
    type: Number,
    description: "Stream inline value",
  })
  @ApiQuery({
    name: "accessRequesterAddr",
    type: String,
    description: "Access requester address",
  })
  @ApiQuery({
    name: "_bypassNonceValidation",
    type: Boolean,
    description: "Bypass nonce validation",
    required: false,
  })
  @ApiQuery({
    name: "_bypassSignatureValidation",
    type: Boolean,
    description: "Bypass signature validation",
    required: false,
  })
  async access(
    @Query("nonce") nonce: string,
    @Query("NFTId") NFTId: string,
    @Query("signature") signature: string,
    @Query("chainId") chainId: string,
    @Query("accessRequesterAddr") accessRequesterAddr: string,
    @Query("streamInline") streamInline: number | undefined,
    @Query("fwdAllHeaders") fwdAllHeaders: number | undefined,
    @Query("fwdHeaderKeys") fwdHeaderKeys: string | undefined,
    @Query("_bypassNonceValidation")
    _bypassNonceValidation = false,
    @Query("_bypassSignatureValidation")
    _bypassSignatureValidation = false,

    @Res() clientRes,
    @Req() clientReq
  ) {
    try {
      // add nested streams
      await this.accessService.access(
        nonce,
        NFTId,
        signature,
        chainId,
        accessRequesterAddr,
        streamInline,
        fwdAllHeaders,
        fwdHeaderKeys,
        _bypassNonceValidation,
        _bypassSignatureValidation,
        clientRes,
        clientReq
      );
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      } else {
        throw new HttpException("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
