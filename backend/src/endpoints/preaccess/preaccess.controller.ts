import { Controller, Get, Header, HttpException, HttpStatus, Query } from "@nestjs/common";
import { PreAccessService } from "./preaccess.service";
import { ApiQuery } from "@nestjs/swagger";

@Controller()
export class PreAccessController {
  constructor(private readonly preAccessService: PreAccessService) {}

  @Get("/preaccess")
  @Header("Cache-Control", "no-store")
  @ApiQuery({ name: "chainId", type: String, description: "Chain ID" })
  async access(@Query("chainId") chainId: string) {
    if (!chainId) {
      throw new HttpException("MP-1-1: min required params are missing", HttpStatus.BAD_REQUEST);
    }
    try {
      const { nonce } = await this.preAccessService.preaccess(chainId);
      return { nonce };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException("MP-1-2: execution error on catch", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
