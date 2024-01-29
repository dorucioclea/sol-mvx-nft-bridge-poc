import { Module } from "@nestjs/common";
import { PreAccessService } from "./preaccess.service";
import { PreAccessController } from "./preaccess.controller";

@Module({
  imports: [],
  controllers: [PreAccessController],
  providers: [PreAccessService],
  exports: [PreAccessService],
})
export class PreAccessModule {}
