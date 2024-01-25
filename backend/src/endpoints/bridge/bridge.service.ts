import { LoggerInitializer } from "@multiversx/sdk-nestjs-common";
import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { DataNft } from "@itheum/sdk-mx-data-nft/out";
import axios from "axios";
import { LockEvent } from "./bridge.interfaces";
import { Address } from "@multiversx/sdk-core/out";
import { replaceLastSegment } from "src/utils";
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

    // upload to Ipfs
    // trigger mint on solana (same supply that was added to contract)
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
}
