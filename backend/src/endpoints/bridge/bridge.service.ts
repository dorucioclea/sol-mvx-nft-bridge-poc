import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import lighthouse from "@lighthouse-web3/sdk";
import { Address } from "@multiversx/sdk-core/out";
import { LoggerInitializer } from "@multiversx/sdk-nestjs-common";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { replaceLastSegment } from "src/utils";
import { LockEvent } from "./bridge.interfaces";

import {
  TokenStandard,
  burnV1,
  createFungibleAsset,
  mintV1,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, generateSigner, keypairIdentity, percentAmount } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { InjectRepository } from "@nestjs/typeorm";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Repository } from "typeorm";
import { CollectionDto } from "./dto/collection.dto";
import { TransactionDto } from "./dto/transaction.entity";
import { CollectionB } from "./entities/collection.entity";
import { TransactionB } from "./entities/transaction.entity";

@Injectable()
export class BridgeService {
  private logger = new Logger(BridgeService.name);
  constructor(
    private readonly apiConfigService: ApiConfigService,
    @InjectRepository(CollectionB)
    private readonly collectionRepository: Repository<CollectionB>,
    @InjectRepository(TransactionB)
    private readonly transactionRepository: Repository<TransactionB>
  ) {
    LoggerInitializer.initialize(this.logger);
  }

  async createCollection(collectionDto: CollectionDto): Promise<CollectionB> {
    const collection = this.collectionRepository.create(collectionDto);
    return this.collectionRepository.save(collection);
  }

  async createTransaction(transactionDto: TransactionDto): Promise<TransactionB> {
    const transaction = this.transactionRepository.create(transactionDto);
    return this.transactionRepository.save(transaction);
  }

  async findCollectionByTokenIdentifierAndNonce(tokenIdentifier: string, nonce: number): Promise<CollectionB> {
    return this.collectionRepository.findOne({ where: { tokenIdentifier, nonce } });
  }

  async findTransactionByHash(hash: string): Promise<TransactionB> {
    return this.transactionRepository.findOne({ where: { txHash: hash } });
  }

  // process method

  async process(txHash: string, address: string) {
    DataNft.setNetworkConfig(this.apiConfigService.getItheumSdkEnvironment());

    const alreadyProcessed = await this.findTransactionByHash(txHash);

    if (alreadyProcessed) {
      throw new HttpException("Already processed", HttpStatus.BAD_REQUEST);
    }

    const query = `${this.apiConfigService.getApiUrl()}/transactions?hashes=${txHash}&status=success&withScResults=true&withLogs=true
    `;

    const response = await axios.get(query);

    if (response.data[0].sender != address) {
      throw new HttpException("Not authorized", HttpStatus.UNAUTHORIZED);
    }

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

    const umi = createUmi(process.env.SOLANA_API_KEY);

    const mintPKString = process.env.PRIVATE_KEY;
    const mintPKArray = mintPKString.split(",").map(Number);

    const myMintKeypair = Keypair.fromSecretKey(Uint8Array.from(mintPKArray));

    console.log(myMintKeypair.publicKey.toString());

    const keypair = umi.eddsa.createKeypairFromSecretKey(myMintKeypair.secretKey);

    const signerKp = createSignerFromKeypair(umi, fromWeb3JsKeypair(myMintKeypair));

    umi.use(keypairIdentity(keypair)).use(mplTokenMetadata());

    let collection: CollectionB = await this.findCollectionByTokenIdentifierAndNonce(
      lockEvent.tokenIdentifier,
      lockEvent.nonce
    );

    const recipientPubkey = new PublicKey(lockEvent.recipient);

    if (!collection) {
      const nftMint = generateSigner(umi);

      await createFungibleAsset(umi, {
        mint: nftMint,
        name: dataNft.tokenName,
        uri: lightHouseGateway,
        sellerFeeBasisPoints: percentAmount(isNaN(dataNft.royalties) ? 0 : dataNft.royalties),
        authority: signerKp,
        creators: [
          {
            address: fromWeb3JsPublicKey(recipientPubkey),
            verified: false,
            share: 100,
          },
        ],
      }).sendAndConfirm(umi);

      const collectionDto: CollectionDto = {
        tokenIdentifier: lockEvent.tokenIdentifier,
        nonce: lockEvent.nonce,
        sftPrivateKey: Array.from(nftMint.secretKey).join(","), // [to do] store the public key, because the private key is not needed
      };

      const storedCollection = await this.createCollection(collectionDto);

      console.log(storedCollection);

      if (!storedCollection) {
        throw new HttpException("Error storing collection", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    collection = await this.findCollectionByTokenIdentifierAndNonce(lockEvent.tokenIdentifier, lockEvent.nonce);
    const sftPrivateKeyArray = collection.sftPrivateKey.split(",").map(Number);
    const sftKeyPair = umi.eddsa.createKeypairFromSecretKey(Uint8Array.from(sftPrivateKeyArray));

    await mintV1(umi, {
      mint: sftKeyPair.publicKey,
      authority: signerKp,
      amount: lockEvent.amount,
      tokenOwner: fromWeb3JsPublicKey(recipientPubkey),
      tokenStandard: TokenStandard.FungibleAsset,
    }).sendAndConfirm(umi);

    const tx = await this.createTransaction({
      txHash: txHash,
      timestamp: Math.floor(Date.now() / 1000),
      address: address,
    });

    this.logger.log(
      `Transaction ${txHash} processed successfully. Collection created: ${collection.id}, ${
        collection.tokenIdentifier
      }, ${collection.nonce}, Solana mint: ${sftKeyPair.publicKey.toString()}  `
    );
    return collection;
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
      "seller_fee_basis_points": `${isNaN(dataNft.royalties) ? 0 : dataNft.royalties}`,
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
