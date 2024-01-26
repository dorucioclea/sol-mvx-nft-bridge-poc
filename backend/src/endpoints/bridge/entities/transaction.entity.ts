import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TransactionB {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ unique: true })
  txHash: string;
  @Column()
  timestamp: number;
}
