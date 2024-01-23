import { Module } from "@nestjs/common";
import { DatabaseModule } from "src/common/database/database.module";
import { HealthService } from "./health-check.service";

@Module({
  imports: [DatabaseModule],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
