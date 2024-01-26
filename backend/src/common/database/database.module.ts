import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApiConfigModule } from "../api-config/api.config.module";
import { ApiConfigService } from "../api-config/api.config.service";
import { CollectionB } from "src/endpoints/bridge/entities/collection.entity";
import { TransactionB } from "src/endpoints/bridge/entities/transaction.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: () => ({
        type: "mysql",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [CollectionB, TransactionB], // Entity
        keepConnectionAlive: true,
        synchronize: true,
      }),
      inject: [ApiConfigService],
    }),
    TypeOrmModule.forFeature([CollectionB]),
    TypeOrmModule.forFeature([TransactionB]),
  ],
  exports: [TypeOrmModule.forFeature([TransactionB]), TypeOrmModule.forFeature([CollectionB])],
})
export class DatabaseModule {}
