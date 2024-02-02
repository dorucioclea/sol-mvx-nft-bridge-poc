import {
  AbiRegistry,
  Address,
  AddressValue,
  BigUIntValue,
  BinaryCodec,
  ContractCallPayloadBuilder,
  ContractFunction,
  ResultsParser,
  SmartContract,
  TokenIdentifierValue,
  Transaction,
  U64Value,
  VariadicValue,
} from "@multiversx/sdk-core/out";
import { X25519EncryptedData } from "@multiversx/sdk-wallet/out/crypto/x25519EncryptedData";
import { HttpException, HttpStatus } from "@nestjs/common";
import { hookGetSecretKeyContent } from "./hooks";
import { PubkeyDecryptor, PubkeyEncryptor } from "@multiversx/sdk-wallet/out/crypto";
import { UserSecretKey } from "@multiversx/sdk-wallet/out/";

export function replaceLastSegment(url, newSegment) {
  // Split the URL by '/'
  const parts = url.split("/");

  // Replace the last segment with the new one
  parts[parts.length - 1] = newSegment;

  // Join the parts back to form the modified URL
  const modifiedUrl = parts.join("/");

  return modifiedUrl;
}

export function returnAPIEndpoint(chainId: string) {
  let api = "";

  switch (chainId) {
    case "E1":
    case "1":
      api = "https://api.multiversx.com";
      break;
    case "ED":
    case "D":
      api = "https://devnet-api.multiversx.com";
      break;
  }

  return api;
}

export function hydrateEncryptedMessage(encryptedMessage: any) {
  // temp solution to support old payloads until we reboot the smart contract @TODO remove
  if (!encryptedMessage["A"] || typeof encryptedMessage["A"] === "undefined") {
    return encryptedMessage;
  }

  // step 1 - swap back fake key names to real key names + add non-essential constant props back
  const swappedBackPropNamePayload = {
    version: 1,
    nonce: encryptedMessage["A"],
    identities: {
      // recipient: encryptedMessage['B'],
      ephemeralPubKey: encryptedMessage["B"],
      originatorPubKey: encryptedMessage["C"],
    },
    crypto: {
      ciphertext: encryptedMessage["D"],
      cipher: "x25519-xsalsa20-poly1305",
      mac: encryptedMessage["E"],
    },
  };

  return swappedBackPropNamePayload;
}

export function dehydrateEncryptedMessage(encryptedData: any) {
  // step 1 - swap key names to hide real key name + remove non-essential props from encryptedData
  const swappedPropNamePayload: any = {};
  swappedPropNamePayload["A"] = encryptedData["nonce"];
  // swappedPropNamePayload['B'] = encryptedData['identities']['recipient']; // not needed for decrypt as per MX comment
  swappedPropNamePayload["B"] = encryptedData["identities"]["ephemeralPubKey"];
  swappedPropNamePayload["C"] = encryptedData["identities"]["originatorPubKey"];
  swappedPropNamePayload["D"] = encryptedData["crypto"]["ciphertext"];
  swappedPropNamePayload["E"] = encryptedData["crypto"]["mac"];

  return Buffer.from(JSON.stringify(swappedPropNamePayload)).toString("base64");
}

export async function decryptDataStreamUrl(decryptDataStreamUrlParam: {
  onChainNFTPayload: { dataStream: string };
  errCodePrefix: string;
}): Promise<string> {
  const { onChainNFTPayload, errCodePrefix } = decryptDataStreamUrlParam;

  const encryptedMessageToString = Buffer.from(onChainNFTPayload.dataStream, "base64").toString("ascii");

  const encryptedData = X25519EncryptedData.fromJSON(hydrateEncryptedMessage(JSON.parse(encryptedMessageToString)));
  try {
    const decryptedDataBuffer = (await decryptData(encryptedData)).toString();
    const decodedString = Buffer.from(decryptedDataBuffer, "base64").toString("ascii");
    const decodedObject = JSON.parse(decodedString);
    const zValue = decodedObject.Z;
    return zValue;
  } catch (e: any) {
    if (e.message?.toLowerCase().indexOf("failed authentication") > -1) {
      throw new HttpException(`${errCodePrefix}-1-CR: Decryption service has failed`, HttpStatus.PRECONDITION_FAILED);
    } else {
      throw new HttpException(
        `${errCodePrefix}-2-CR: Decryption service has failed - ${e.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export async function decryptData(data: X25519EncryptedData): Promise<Buffer> {
  const secretKey = await getSecretKeyFromPemFilePath();
  const decryptedData = PubkeyDecryptor.decrypt(data, secretKey);
  return decryptedData;
}

async function getSecretKeyFromPemFilePath(): Promise<UserSecretKey> {
  const fileContent = await hookGetSecretKeyContent();
  const userWallet = UserSecretKey.fromPem(fileContent); // 1
  return userWallet;
}

export async function encryptData(data: string): Promise<X25519EncryptedData> {
  const secretKey = await getSecretKeyFromPemFilePath();
  const publicKey = secretKey.generatePublicKey();

  const encryptedData = PubkeyEncryptor.encrypt(Buffer.from(data), publicKey, secretKey);

  return encryptedData;
}

export const unlockTx = (
  senderAddress: string,
  contractAddress: string,
  addressToUnlock: string,
  tokenIdentifier: string,
  tokenNonce: number,
  tokenAmount: number,
  chainID: string
) => {
  const unlock = new Transaction({
    value: 0,
    data: new ContractCallPayloadBuilder()
      .setFunction(new ContractFunction("unlockForAddress"))
      .addArg(new AddressValue(new Address(addressToUnlock)))
      .addArg(new TokenIdentifierValue(tokenIdentifier))
      .addArg(new U64Value(tokenNonce))
      .addArg(new BigUIntValue(tokenAmount))
      .build(),
    receiver: new Address(contractAddress),
    sender: new Address(senderAddress),
    gasLimit: 20000000,
    chainID: chainID,
  });

  return unlock;
};
