import { Address, SignableMessage } from "@multiversx/sdk-core/out";
import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { decryptDataStreamUrl, returnAPIEndpoint } from "src/utils";
import { Readable } from "stream";
import { Keypair, PublicKey } from "@solana/web3.js";
import { fetchAllDigitalAsset, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import nacl from "tweetnacl";
import bs58 from "bs58";

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);
  async access(
    // mandatory
    nonce: string,
    SFTAddress: string,
    signature: string,
    chainId: string,
    accessRequesterAddr: string,

    // optionals
    streamInline: number | undefined,
    fwdAllHeaders: number | undefined,
    fwdHeaderKeys: string | undefined,

    // bypasses
    _bypassNonceValidation: boolean,
    _bypassSignatureValidation: boolean,

    clientRes: Response,
    clientReq: Request
  ) {
    if (process.env.ACCESS_BYPASS_ENABLE === "true") {
      _bypassNonceValidation = _bypassNonceValidation;
      _bypassSignatureValidation = _bypassSignatureValidation;
    } else {
      _bypassNonceValidation = false;
      _bypassSignatureValidation = false;
    }
    try {
      if (!nonce || !SFTAddress || !signature || !chainId || !accessRequesterAddr) {
        throw new HttpException("MA-1-1: min required params are missing", HttpStatus.BAD_REQUEST);
      }

      // S: run any format specific validation here so we can bypass any unnecessary compute
      const { allPassed, validationMessages } = this._validateSpecificParams(
        streamInline,
        fwdAllHeaders,
        fwdHeaderKeys
      );

      if (!allPassed) {
        throw new HttpException(`MA-1-4: params have validation issues ${validationMessages}`, HttpStatus.BAD_REQUEST);
      }
      // E: run any format specific validation...

      const api = "https://api.devnet.solana.com";
      const hoursPerEpoch: number = process.env.CHAIN_HOURS_PER_EPOCH
        ? parseInt(process.env.CHAIN_HOURS_PER_EPOCH, 10)
        : 24;

      await this.validateNonce(api, hoursPerEpoch, _bypassNonceValidation, nonce); // this is ok

      const { onChainNFTPayload } = (await this.checkOnChainNFTBalanceForRequester(
        accessRequesterAddr,
        api,
        SFTAddress
      )) as {
        onChainNFTPayload: {
          dataStream: string;
        };
      };

      await this.verifyOwnershipOfNFT(_bypassSignatureValidation, nonce, signature, accessRequesterAddr);

      const decryptedDataStreamURL = await decryptDataStreamUrl({
        onChainNFTPayload,
        errCodePrefix: "MA-5",
      });

      // client Stream Config
      const clientStreamConfig = {
        streamInline,
        fwdAllHeaders,
        fwdHeaderKeys,
      };

      await this.streamOutData(
        clientStreamConfig,
        SFTAddress,
        chainId,
        decryptedDataStreamURL,
        accessRequesterAddr,
        clientRes,
        clientReq
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException("MA-1-3-CR: unspecified execution error on catch", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async validateNonce(
    api: string,
    hoursPerEpoch: number,
    _bypassNonceValidation: boolean,
    nonce: string
  ): Promise<void> {
    if (_bypassNonceValidation) {
      return;
    }

    const decodeNonce = Buffer.from(nonce, "base64").toString();
    const nonceParts = decodeNonce.split(":");

    if (nonceParts.length === 3) {
      const epochN = parseInt(nonceParts[0], 10);
      const roundsPassedN = parseInt(nonceParts[1], 10);
      const roundsPerEpochN = parseInt(nonceParts[2], 10);

      let epoch: number | null = null;
      let roundsPassed: number | null = null;
      let roundsPerEpoch: number | null = null;

      const blockchainStatsUrl = `${api}/stats`;

      const response = await axios.get(blockchainStatsUrl).catch((error) => {
        throw new HttpException(
          "MA-2-1-CR: Blockchain service not responding with 200 OK.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });

      const payload = response.data;

      if (
        payload &&
        payload.epoch !== undefined &&
        payload.roundsPassed !== undefined &&
        payload.roundsPerEpoch !== undefined
      ) {
        epoch = payload.epoch;
        roundsPassed = payload.roundsPassed;
        roundsPerEpoch = payload.roundsPerEpoch;

        if (epoch !== null && roundsPerEpoch !== null && roundsPassed !== null) {
          const minsPerRound = (hoursPerEpoch * 60) / roundsPerEpoch;
          let roundsElapsed: number = 0;

          if (epoch === epochN) {
            roundsElapsed = roundsPassed - roundsPassedN;
          } else {
            const epochsElapsed = epoch - epochN;

            if (epochsElapsed === 1) {
              roundsElapsed = roundsPerEpochN - roundsPassedN + roundsPassed;
            } else {
              throw new HttpException("MA-2-2: Access requester needs to regenerate access link", HttpStatus.FORBIDDEN);
            }
          }

          const linkTTLMins = process.env.LINK_ACCESS_TTL_IN_MINS
            ? parseInt(process.env.LINK_ACCESS_TTL_IN_MINS, 10)
            : 5;

          if (roundsElapsed * minsPerRound > linkTTLMins) {
            throw new HttpException("MA-2-3: Access requester needs to regenerate access link", HttpStatus.FORBIDDEN);
          }
        } else {
          throw new HttpException(
            "MA-2-4-CR: Blockchain service not responding accurately for nonce check.",
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      } else {
        throw new HttpException(
          "MA-2-5-CR: Blockchain service not responding accurately for nonce check.",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } else {
      throw new HttpException(
        "MA-2-7-CR: Nonce validation cannot be done on malformed data.",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // check solana for onchain nft balance
  async checkOnChainNFTBalanceForRequester(
    accessRequesterAddr: string,
    api: string,
    tokenAddress: string
  ): Promise<any> {
    try {
      const query = `https://rpc.ironforge.network/devnet?apiKey=${process.env.IRON_FORGE_API_KEY}`;

      const POST = {
        "id": 1,
        "method": "getTokenAccountsByOwner",
        "params": [
          `${accessRequesterAddr}`,
          {
            "mint": `${tokenAddress}`,
          },
          {
            "encoding": "jsonParsed",
          },
        ],
      };

      const umi = createUmi(api);

      const mintPKString = process.env.PRIVATE_KEY;
      const mintPKArray = mintPKString.split(",").map(Number);

      const myMintKeypair = Keypair.fromSecretKey(Uint8Array.from(mintPKArray));

      const keypair = umi.eddsa.createKeypairFromSecretKey(myMintKeypair.secretKey);

      umi.use(keypairIdentity(keypair)).use(mplTokenMetadata());

      const [assetA] = await fetchAllDigitalAsset(umi, [fromWeb3JsPublicKey(new PublicKey(tokenAddress))]);

      assetA.metadata.uri;

      const dataStream = await this.fetchDataStreamUrl(assetA.metadata.uri);

      const response = await axios.post(query, POST).catch(() => {
        throw new HttpException(
          "MA-3-1: Access requester does not have rights to view Data Stream",
          HttpStatus.FORBIDDEN
        );
      });

      return {
        onChainNFTPayload: {
          dataStream: dataStream,
        },
      };
    } catch (e) {
      throw new HttpException("MA-3-4-CR: execution error on catch", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async fetchDataStreamUrl(metadataUri: string) {
    try {
      // Make a GET request to the metadata URI
      const response = await axios.get(metadataUri);

      // Check if the request was successful (status code 200)
      if (response.status === 200) {
        // Parse the response data as JSON
        const metadata = response.data;

        // Check if the "attributes" field exists and is an array
        if (metadata.attributes && Array.isArray(metadata.attributes)) {
          // Find the attribute with the "trait_type" equal to "Data Stream"
          const dataStreamAttribute = metadata.attributes.find((attribute) => attribute.trait_type === "Data Stream");

          // Check if the attribute was found
          if (dataStreamAttribute) {
            // Get the value of the "Data Stream" attribute
            const dataStreamUrl = dataStreamAttribute.value;

            // Log or return the dataStreamUrl
            console.log("Data Stream URL:", dataStreamUrl);
            return dataStreamUrl as string;
          } else {
            console.error('Attribute "Data Stream" not found.');
          }
        } else {
          console.error('Invalid metadata format. Missing or invalid "attributes" field.');
        }
      } else {
        console.error(`Failed to fetch metadata. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error.message);
    }
  }

  async verifyOwnershipOfNFT(
    _bypassSignatureValidation: boolean,
    nonce: string,
    signature: string,
    accessRequesterAddr: string
  ): Promise<void> {
    if (_bypassSignatureValidation) {
      return;
    }

    const signatureVerification = this.verifySignedMessage(nonce, signature, accessRequesterAddr);

    if (!signatureVerification.signatureValid) {
      const statusCode = signatureVerification.verificationIssueStatusCode || HttpStatus.PRECONDITION_FAILED;
      const errMsg =
        signatureVerification.verificationIssueErrMsg ||
        "MA-4-1: NFT ownership to access requester identity is not valid";

      throw new HttpException(errMsg, statusCode);
    }
  }

  // Needs solana change
  verifySignedMessage(
    message: string,
    sig: string,
    address: string
  ): {
    signatureValid: boolean;
    verificationIssueStatusCode?: number;
    verificationIssueErrMsg?: string;
    verificationIssueErrCause?: any;
  } {
    try {
      const publicKey = new PublicKey(address);
      const signatureBuffer = Buffer.from(bs58.decode(sig));
      const messageBuffer = Buffer.from(message);

      // Verify the signature
      const signatureValid = nacl.sign.detached.verify(messageBuffer, signatureBuffer, publicKey.toBuffer());

      this.logger.log(`Signature verification result: ${signatureValid}`);

      return { signatureValid };
    } catch (e) {
      return {
        signatureValid: false,
        verificationIssueStatusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        verificationIssueErrMsg: "Signature verification error",
        verificationIssueErrCause: e,
      };
    }
  }

  async streamOutData(
    clientStreamConfig: any,
    NFTId: string,
    chainId: string,
    decryptedDataStreamURL: string,
    accessRequesterAddr: string,
    clientRes: any,
    clientReq: any
  ): Promise<void> {
    try {
      /*
      HEADER FWDs: we setup custom Marshal Headers AND forward client sent headers to Origin server
      ... so origin can handle any client specific logic (e.g. auth) or personalization before responding with Data Stream
      ... design choice was made to let client to explicitly request FWD all clientReq.headers (via the fwdHeaderKeys param) 
      ... as the integrator (client side) should most likely be the entity running the origin server and therefore they should
      ... be given the flexibility to control request headers also, if a bad actor is trying to spoof or break into the origin server, 
      ... they need to first pass the previous steps like validateNonce & checkOnChainNFTBalanceForRequester and therefore it's not safe
      ... to assume it will filter out most attack vectors. 
      ... we also allow client to pick headers to forward (via fwdHeaderKeys), this is useful to cherry pick the headers the origin needs
      ... so it keeps the forward traffic light (as headers can clog) and to also deal with issues some external origin servers (e.g. AWS)
      ... have with auto headers like HOST or even Authorization (in the event the client does not control the origin server)
      ... Spoofing - i.e a valid user is trying to spoof the NFTId to try and see someone elses Data Stream (if the origin is using this)
      ... to customize personal data, should also not be possible as NFTId is being validated against the wallet (caller) in prev steps
      */

      console.log("All request Headers ------ S");
      console.log(JSON.stringify(clientReq.headers));
      console.log("All request Headers ------ E");

      let forwardRequestHeaders: any = {
        "itm-marshal-fwd-chainid": chainId,
        "itm-marshal-fwd-tokenid": NFTId,
      };

      console.log("clientStreamConfig", clientStreamConfig);

      if (clientStreamConfig?.fwdHeaderKeys) {
        // client wants selected headers to be forwarded
        forwardRequestHeaders = {
          ...forwardRequestHeaders,
        };

        // loop through the headers the client wanted to fwd and append them to forwardRequestHeaders
        clientStreamConfig.fwdHeaderKeys.split(",").map((headerKey: string) => {
          forwardRequestHeaders[headerKey] = clientReq.headers[headerKey];
        });
      } else if (clientStreamConfig?.fwdAllHeaders == 1) {
        // OR client wants to forward all headers to the origin
        forwardRequestHeaders = {
          ...forwardRequestHeaders,
          ...clientReq.headers,
        };
      }

      console.log("Final forwardRequestHeaders +++++ S");
      console.log(JSON.stringify(forwardRequestHeaders));
      console.log("Final forwardRequestHeaders +++++ E");

      const remoteResponse = await axios.get(decryptedDataStreamURL, {
        responseType: "stream",
        headers: forwardRequestHeaders,
      });

      let remoteStream: Readable;
      if (remoteResponse.data instanceof Readable) {
        remoteStream = remoteResponse.data;
      } else {
        remoteStream = new Readable();
        remoteStream.push(remoteResponse.data);
        remoteStream.push(null); // Signal the end of the stream
      }

      try {
        const erdAddress = new Address(accessRequesterAddr);
        const accessRequesterAddrInBech32 = erdAddress.bech32();

        // await hookReportStatusIssues(remoteResponse.status.toString(), NFTId, accessRequesterAddrInBech32);
      } catch (e) {
        console.log(e);
      }

      let isContentDispositionAttachment = true;
      const resPipeHeaders: any = {};

      if (remoteResponse.headers["content-length"]) {
        resPipeHeaders["content-length"] = remoteResponse.headers["content-length"];
      }

      if (remoteResponse.headers["content-type"]) {
        resPipeHeaders["content-type"] = remoteResponse.headers["content-type"];
      }

      if (remoteResponse.headers["x-datacattype"]) {
        resPipeHeaders["x-datacattype"] = remoteResponse.headers["x-datacattype"];
        isContentDispositionAttachment = false;
      }

      if (clientStreamConfig?.streamInline) {
        isContentDispositionAttachment = false;
        resPipeHeaders["x-sdk-inline"] = "true";
      }

      if (remoteResponse.headers["x-cache"]) {
        resPipeHeaders["x-cache"] = remoteResponse.headers["x-cache"];
      }

      if (isContentDispositionAttachment) {
        try {
          const originFilename = new URL(decryptedDataStreamURL).pathname.split("/").pop();

          if (originFilename !== undefined && originFilename.length > 4 && originFilename.includes(".")) {
            resPipeHeaders["content-disposition"] = `attachment;filename=${originFilename}`;
          } else {
            if (remoteResponse.headers["content-type"].includes("html")) {
              resPipeHeaders["content-disposition"] = "inline";
              resPipeHeaders["x-clouddoc"] = "1";
            } else {
              resPipeHeaders["content-disposition"] = "inline";
            }
          }
        } catch (e) {
          resPipeHeaders["content-disposition"] = "inline";
        }
      } else {
        resPipeHeaders["content-disposition"] = "inline";
      }

      clientRes.set(resPipeHeaders);

      remoteStream.pipe(clientRes);

      return;
    } catch (e) {
      throw new HttpException("MA-6-1-CR: Streaming out of data failed", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  _validateSpecificParams(
    streamInline: number | undefined,
    fwdAllHeaders: number | undefined,
    fwdHeaderKeys: string | undefined
  ) {
    let allPassed = true;
    let validationMessages = "";

    try {
      // streamInline test
      let streamInlineIsValid = true;

      if (typeof streamInline !== "undefined") {
        streamInlineIsValid = false; // it exists, so we need to validate

        if (streamInline == 0 || streamInline == 1) {
          streamInlineIsValid = true;
        } else {
          validationMessages += "[optional streamInline needs to be 1 or 0]";
        }
      }

      // fwdAllHeaders test
      let fwdAllHeadersValid = true;

      if (typeof fwdAllHeaders !== "undefined") {
        fwdAllHeadersValid = false; // it exists, so we need to validate

        if (fwdAllHeaders == 0 || fwdAllHeaders == 1) {
          fwdAllHeadersValid = true;
        } else {
          validationMessages += "[optional fwdAllHeaders needs to be 1 or 0]";
        }
      }

      // fwdHeaderKeys test
      let fwdHeaderKeysIsValid = true;

      if (typeof fwdHeaderKeys !== "undefined") {
        fwdHeaderKeysIsValid = false;

        if (
          typeof fwdHeaderKeys === "string" &&
          fwdHeaderKeys.trim() !== "" &&
          fwdHeaderKeys.split(",").length > 0 &&
          fwdHeaderKeys.split(",").length < 5
        ) {
          fwdHeaderKeysIsValid = true;
        } else {
          validationMessages +=
            "[optional fwdHeaderKeys needs to be a comma separated lowercase string with less than 5 items]";
        }
      }

      if (!streamInlineIsValid || !fwdAllHeadersValid || !fwdHeaderKeysIsValid) {
        allPassed = false;
      }
    } catch (e: any) {
      allPassed = false;
      validationMessages = e.toString();
    }

    return {
      allPassed,
      validationMessages,
    };
  }
}
function fromWeb3JsKeypair(myMintKeypair: Keypair): import("@metaplex-foundation/umi").Keypair {
  throw new Error("Function not implemented.");
}
function fromWeb3JsPublicKey(recipientPubkey: any): import("@metaplex-foundation/umi").PublicKey {
  throw new Error("Function not implemented.");
}
