import { LoggerInitializer } from "@multiversx/sdk-nestjs-common";
import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import axios from "axios";
import { LockEvent } from "./bridge.interfaces";
import { Address } from "@multiversx/sdk-core/out";
import { replaceLastSegment } from "src/utils";
import lighthouse from "@lighthouse-web3/sdk";

import { createSignerFromKeypair, keypairIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { percentAmount, generateSigner } from "@metaplex-foundation/umi";
import {
  TokenStandard,
  createFungibleAsset,
  fetchAllDigitalAsset,
  fetchDigitalAsset,
  mintV1,
  mplTokenMetadata,
  transferV1,
} from "@metaplex-foundation/mpl-token-metadata";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { PublicKey } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { receiveMessageOnPort } from "worker_threads";

@Injectable()
export class BridgeService {
  private logger = new Logger(BridgeService.name);
  constructor(private readonly apiConfigService: ApiConfigService) {
    LoggerInitializer.initialize(this.logger);
  }

  async process(txHash: string) {
    DataNft.setNetworkConfig(this.apiConfigService.getItheumSdkEnvironment());

    const query = `${this.apiConfigService.getApiUrl()}/transactions?hashes=${txHash}&status=success&withScResults=true&withLogs=true
    `;

    const response = await axios.get(query);

    const interestedTopic = this.mergeAndFilterLogs(response, "bG9ja0V2ZW50");

    const lockEvent: LockEvent = {
      caller: new Address(Buffer.from(interestedTopic.topics[1], "base64")).bech32(),
      tokenIdentifier: Buffer.from(interestedTopic.topics[2], "base64").toString("utf8"),
      nonce: parseInt(Buffer.from(interestedTopic.topics[3], "base64").toString("hex"), 16),
      amount: parseInt(Buffer.from(interestedTopic.topics[4], "base64").toString("hex"), 16),
      recipient: Buffer.from(interestedTopic.topics[5], "base64").toString("utf8"),
    };

    const dataNft = await DataNft.createFromApi({
      tokenIdentifier: lockEvent.tokenIdentifier,
      nonce: lockEvent.nonce,
    });

    const solOBject = await this.buildJsonObject(dataNft);

    const uploadResponse = await lighthouse.uploadText(JSON.stringify(solOBject), process.env.LIGHTHOUSE_API_KEY);

    this.pinIpfsHash(uploadResponse.data.Hash);

    const ipfsLink = `https://ipfs.io/ipfs/${uploadResponse.data.Hash}`;
    const lightHouseGateway = `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`;

    // trigger mint on solana (same supply that was added to contract)

    // solana

    const umi = createUmi("https://api.devnet.solana.com");

    const mintPK = [22, 143]; // private key of minter;

    // -------------------
    const myMintKeypair = Keypair.fromSecretKey(Uint8Array.from(mintPK));

    const pkMint = myMintKeypair.publicKey;

    const keypair = umi.eddsa.createKeypairFromSecretKey(myMintKeypair.secretKey);

    umi.use(keypairIdentity(keypair)).use(mplTokenMetadata());

    const signerKp = createSignerFromKeypair(umi, fromWeb3JsKeypair(myMintKeypair));

    const nftMint = generateSigner(umi);
    // store this binded with the tokenIdentifier and nonce from mvx (use this in mints)

    const recipientPubkey = new PublicKey(lockEvent.recipient);

    await createFungibleAsset(umi, {
      mint: nftMint,
      name: dataNft.tokenName,
      uri: lightHouseGateway,
      sellerFeeBasisPoints: percentAmount(dataNft.royalties),
      authority: signerKp,
      creators: [
        {
          address: fromWeb3JsPublicKey(recipientPubkey),
          verified: false,
          share: 100,
        },
      ],
    }).sendAndConfirm(umi);

    await mintV1(umi, {
      mint: nftMint.publicKey,
      authority: signerKp,
      amount: lockEvent.amount,
      tokenOwner: fromWeb3JsPublicKey(recipientPubkey),
      tokenStandard: TokenStandard.FungibleAsset,
    }).sendAndConfirm(umi);
  }

  private mergeAndFilterLogs(response, logIdentifier: String) {
    const eventsFromResponseLogs = response.data[0].logs.events;
    const transactionsWithLogs = response.data[0].results.filter((transaction) => transaction.logs);
    const eventsFromTransactionsWithLogs = transactionsWithLogs.flatMap((transaction) => transaction.logs.events);
    const allEvents = [...eventsFromResponseLogs, ...eventsFromTransactionsWithLogs];
    const interestedTopic = allEvents.find((event) => event.topics[0] === logIdentifier);
    return interestedTopic;
  }

  private async buildJsonObject(dataNft: DataNft): Promise<any> {
    const metadataUrl = replaceLastSegment(dataNft.nftImgUrl, "metadata.json");

    const responseMetadata = await axios.get(metadataUrl);

    const attributes = responseMetadata.data.attributes;

    const filteredAttributes = attributes.filter((attr) => attr.trait_type !== "Creator");

    const solJson = {
      "name": `${dataNft.tokenName}`,
      "symbol": `${dataNft.collection}`,
      "description": `${dataNft.description}`,
      "seller_fee_basis_points": `${dataNft.royalties}`,
      "image": `${dataNft.nftImgUrl}`,
      "animation_url": "",
      "external_url": "",
      "attributes": [
        ...filteredAttributes,
        {
          "trait_type": "Data Stream",
          "value": `${dataNft.dataStream}`,
        },
      ],
    };
    return solJson;
  }

  async pinIpfsHash(hash: string): Promise<void> {
    const pinningEndpoint = "https://api.lighthouse.storage/api/lighthouse/pin";
    const data = { cid: hash };
    const apiKey = process.env.LIGHTHOUSE_API_KEY;
    await axios.post(pinningEndpoint, data, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }
}
