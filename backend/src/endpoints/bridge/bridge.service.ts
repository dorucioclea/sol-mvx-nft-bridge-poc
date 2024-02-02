import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import lighthouse from "@lighthouse-web3/sdk";
import { Address } from "@multiversx/sdk-core/out";
import { LoggerInitializer } from "@multiversx/sdk-nestjs-common";
import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { replaceLastSegment, returnAPIEndpoint, unlockTx } from "src/utils";
import { LockEvent } from "./bridge.interfaces";
import { ApiNetworkProvider } from "@multiversx/sdk-network-providers";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";
import nacl from "tweetnacl";

import {
  Data,
  TokenStandard,
  burnV1,
  createFungibleAsset,
  delegateAuthorityItemV1,
  delegateStandardV1,
  mintV1,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { fromWeb3JsKeypair, fromWeb3JsPublicKey } from "@metaplex-foundation/umi-web3js-adapters";
import { InjectRepository } from "@nestjs/typeorm";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Repository } from "typeorm";
import { CollectionDto } from "./dto/collection.dto";
import { TransactionDto } from "./dto/transaction.entity";
import { CollectionB } from "./entities/collection.entity";
import { TransactionB } from "./entities/transaction.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager"; // ! Don't forget this import
import { UserSecretKey, UserSigner } from "@multiversx/sdk-wallet/out";

@Injectable()
export class BridgeService {
  private logger = new Logger(BridgeService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

  async findCollectionBySftPublicKey(sftPublicKey: string): Promise<CollectionB> {
    return this.collectionRepository.findOne({ where: { sftPublicKey } });
  }

  async findTransactionByHash(hash: string): Promise<TransactionB> {
    return this.transactionRepository.findOne({ where: { txHash: hash } });
  }

  async getNonceToSign(pubKey: string) {
    // use redis cache to store the nonce for a specific address

    if (await this.cacheManager.get(`${pubKey}`)) {
      throw new HttpException("Message to sign already exists", HttpStatus.BAD_REQUEST);
    }

    // generate a random number
    const nonce = Math.floor(Math.random() * 1000);

    const generateTimestampInSeconds = Math.floor(Date.now() / 1000);

    const messageToSign = `${pubKey.slice(0, 16)}${nonce}${generateTimestampInSeconds}`;

    await this.cacheManager.set(`${pubKey}`, `${messageToSign}`, 60000);

    return { messageToSign: messageToSign };
  }

  // process_Back (sol -> mvx)

  async process_back(
    signature: string,
    SftAddress: string,
    amount: number,
    accessRequesterAddr: string,
    mvxAddress: string
  ) {
    // check message and signature where signed in time (valid)
    const realMessageToSign: string = await this.cacheManager.get(`${accessRequesterAddr}`);
    if (!realMessageToSign) {
      throw new HttpException("Message to sign not found. Time to sign the message expired", HttpStatus.BAD_REQUEST);
    }
    const publicKey = new PublicKey(accessRequesterAddr);
    const signatureBuffer = Buffer.from(bs58.decode(signature));
    const messageBuffer = Buffer.from(realMessageToSign);
    // Verify the signature
    const signatureValid = nacl.sign.detached.verify(messageBuffer, signatureBuffer, publicKey.toBuffer());
    if (!signatureValid) {
      throw new HttpException("Signature not valid", HttpStatus.BAD_REQUEST);
    }

    // check if the collection exists

    const collection = await this.findCollectionBySftPublicKey(SftAddress);

    if (!collection) {
      throw new HttpException("Collection not found", HttpStatus.BAD_REQUEST);
    }
    // check mvx sc has balance to unlock

    const query = `${returnAPIEndpoint("ED")}/accounts/erd1qqqqqqqqqqqqqpgq9nf40dfhg4c7z3arjamjrtxpw8fc7w4qw3wqrssw95/nfts`;

    const response = await axios.get(query);

    DataNft.setNetworkConfig(this.apiConfigService.getItheumSdkEnvironment());

    const dataNfts: DataNft[] = DataNft.createFromApiResponseOrBulk(response.data);

    const dataNft = dataNfts.find(
      (nft) =>
        nft.collection === collection.tokenIdentifier && nft.nonce === collection.nonce && Number(nft.balance) >= amount
    );

    // check accessRequesterAddr has in balance the amount of sft

    const solanaApiUrl = process.env.IRON_FORGE_API_URL;

    const postData = {
      jsonrpc: "2.0",
      id: 1,
      method: "getTokenAccountsByOwner",
      params: [
        accessRequesterAddr,
        {
          mint: SftAddress,
        },
        {
          encoding: "jsonParsed",
        },
      ],
    };

    const solanaBalanceResponse = await axios.post(`${solanaApiUrl}=${process.env.IRON_FORGE_API_KEY}`, postData);

    const solanaSftBalance: number =
      solanaBalanceResponse.data.result.value[0].account.data.parsed.info.tokenAmount.uiAmount;

    if (solanaSftBalance < amount) {
      throw new HttpException("Not enough balance", HttpStatus.BAD_REQUEST);
    }

    // burn on sol

    const umi = createUmi("https://api.devnet.solana.com");

    const mintPKString = process.env.PRIVATE_KEY;
    const mintPKArray = mintPKString.split(",").map(Number);

    const myMintKeypair = Keypair.fromSecretKey(Uint8Array.from(mintPKArray));

    console.log(myMintKeypair.publicKey.toString());

    const keypair = umi.eddsa.createKeypairFromSecretKey(myMintKeypair.secretKey);

    const signerKp = createSignerFromKeypair(umi, fromWeb3JsKeypair(myMintKeypair));

    umi.use(keypairIdentity(keypair)).use(mplTokenMetadata());

    // await delegateStandardV1(umi, {
    //   mint: publicKey(SftAddress),
    //   tokenOwner: publicKey(accessRequesterAddr),
    //   authority: signerKp,
    //   delegate: publicKey(signerKp.publicKey),
    //   tokenStandard: TokenStandard.NonFungible,
    // }).sendAndConfirm(umi);

    // await burnV1(umi, {
    //   mint: publicKey(SftAddress),
    //   authority: signerKp,
    //   tokenOwner: publicKey(accessRequesterAddr),
    //   tokenStandard: TokenStandard.NonFungible,
    // }).sendAndConfirm(umi);

    // trigger the unlock on mvx

    const array = Uint8Array.from(Buffer.from(process.env.ERD_ADMIN_ADDRESS, "hex"));

    const adminSecretKey = new UserSecretKey(array);
    const adminSigner = new UserSigner(adminSecretKey);

    const networkProvider = new ApiNetworkProvider(returnAPIEndpoint("ED"));

    const onlineAcc = await networkProvider.getAccount(adminSecretKey.generatePublicKey().toAddress());

    const tx = unlockTx(
      onlineAcc.address.bech32(),
      "erd1qqqqqqqqqqqqqpgq9nf40dfhg4c7z3arjamjrtxpw8fc7w4qw3wqrssw95",
      mvxAddress,
      dataNft.collection,
      dataNft.nonce,
      amount,
      "D"
    );

    tx.setNonce(onlineAcc.nonce);
    const serialized = tx.serializeForSigning();
    const signatureTx = await adminSigner.sign(serialized);
    tx.applySignature(signatureTx);

    const txHash = await networkProvider.sendTransaction(tx);
    return {
      Solana: {
        burned: amount,
      },
      Mvx: {
        unlocked: amount,
        txHash: txHash,
      },
    };
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

    const umi = createUmi("https://api.devnet.solana.com");

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
        updateAuthority: signerKp,
        symbol: "DATANFT",
        isMutable: true,
      }).sendAndConfirm(umi);

      const collectionDto: CollectionDto = {
        tokenIdentifier: lockEvent.tokenIdentifier,
        nonce: lockEvent.nonce,
        sftPrivateKey: Array.from(nftMint.secretKey).join(","), // [to do] store the public key, because the private key is not needed
        sftPublicKey: nftMint.publicKey.toString(),
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
        {
          "trait_type": "Token Identifier",
          "value": `${dataNft.collection}`,
        },
        {
          "trait_type": "Token Nonce",
          "value": `${dataNft.nonce}`,
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
