import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CollectionB {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  tokenIdentifier: string;
  @Column()
  nonce: number;
  @Column({ length: 10000 })
  sftPrivateKey: string;
}
