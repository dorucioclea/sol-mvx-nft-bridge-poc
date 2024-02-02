import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import BigNumber from "bignumber.js";

export class SolDataNft extends DataNft {
  mintAddress: string;
  metadata: any;
  balance: number;

  constructor(dataNft: DataNft, mintAddress: string, metadata: any, solBalance: number) {
    super(dataNft);
    this.mintAddress = mintAddress;
    this.metadata = metadata;
    this.balance = solBalance;
  }
}
