import { DataNft } from "@itheum/sdk-mx-data-nft";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

// You have to generate your projectId using https://cloud.walletconnect.com/ website
export const walletConnectV2ProjectId = "";

export const apiTimeout = 6000;

export const solNetwork = WalletAdapterNetwork.Devnet;

// set network config of DataNft class
DataNft.setNetworkConfig("devnet");
