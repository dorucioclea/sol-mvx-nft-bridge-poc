import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import BigNumber from "bignumber.js";

export class SolDataNft extends DataNft {
  mintAddress: string;
  metadata: any;
  balance: number;
  tokenAccount: string;

  constructor(dataNft: DataNft, mintAddress: string, metadata: any, solBalance: number, tokenAccount: string) {
    super(dataNft);
    this.mintAddress = mintAddress;
    this.metadata = metadata;
    this.balance = solBalance;
    this.tokenAccount = tokenAccount;
  }
}
