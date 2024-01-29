import * as fs from "fs";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import axios from "axios";
import { Logger } from "@nestjs/common";

const genericHooksLogger = new Logger("GenericHooks");

async function readFile(filePath: string): Promise<string> {
  return await fs.promises.readFile(filePath, { encoding: "utf8" });
}

export async function hookGetSecretKeyContent(): Promise<string> {
  genericHooksLogger.log(
    `hookGetSecretKeyContent : is using the SECRET_LOAD_STRATEGY ${process.env.SECRET_LOAD_STRATEGY}`
  );

  if (process.env.SECRET_LOAD_STRATEGY === "1") {
    // option 1: get the identity locally via a pem file
    const filePath: string = "./wallet.pem";
    return await readFile(filePath);
  } else if (process.env.SECRET_LOAD_STRATEGY === "2") {
    // option 2: get the secret from AWS secret manager. Which can then be encrypted with another customer managed KMS key for more security
    const client = new SecretsManagerClient({
      region: process.env.SECRET_ASM_REGION,
    });

    let response;
    let secretKeyBase64 = null;

    try {
      response = await client.send(
        new GetSecretValueCommand({
          SecretId: process.env.SECRET_ASM_SECRET_NAME,
          VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
        })
      );

      const secret = response?.SecretString;

      if (secret) {
        secretKeyBase64 = JSON.parse(secret).marshal_operator_identity;
      }
    } catch (error) {
      // For a list of exceptions thrown, see
      // https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
      return Promise.reject(
        new Error(
          `hookGetSecretKeyContent AWS secret manager identity resolution failed cause:
          ${error}`
        )
      );
    }

    if (secretKeyBase64) {
      const secretKeyFromBase64 = (secretKeyBase64 && Buffer.from(secretKeyBase64, "base64").toString("ascii")) || "";
      return Promise.resolve(secretKeyFromBase64);
    } else {
      return Promise.reject(new Error("hookGetSecretKeyContent AWS secret manager failed to get value"));
    }
  } else {
    // option 3 default: get the secret unencrypted environment variable
    const secretKeyBase64 = process.env.SECRET_ENV;
    // convert back from base64
    const secretKeyFromBase64 = (secretKeyBase64 && Buffer.from(secretKeyBase64, "base64").toString("ascii")) || "";

    return Promise.resolve(secretKeyFromBase64);
  }
}

export async function hookReportStatusIssues(
  statusCode: number,
  NFTId: string,
  accessRequesterAddr?: string | undefined
): Promise<void> {
  try {
    const postBody: {
      sftId: string;
      when: number;
      httpStatus: number;
      who?: string;
    } = {
      sftId: NFTId,
      when: Date.now(),
      httpStatus: statusCode,
    };

    if (accessRequesterAddr) {
      postBody.who = accessRequesterAddr;
    }

    const response = await axios.post(`https://${process.env.DATADEX_API_HOST}/datadexapi/v1/sfts/uptime`, postBody, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: 'Basic TOKEN'
      },
    });

    if (response.status === 200 && Object.keys(response.data)?.length > 0) {
      return Promise.resolve();
    } else {
      return Promise.reject(
        new Error(
          `hookReportStatusIssues API returned non OK 200 error code or did not have an OK response body. i.e. ${response.status}`
        )
      );
    }
  } catch (e) {
    return Promise.reject(new Error(`hookReportStatusIssues hook threw a local catch block cause ${e}`));
  }
}
