import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import { returnAPIEndpoint } from "src/utils";

@Injectable()
export class PreAccessService {
  async preaccess(chainId: string): Promise<{ nonce: string }> {
    /*
    we use the blockchain state to generate a nonce that can then be used for
    time based access limits. By doing this we make the data marshal ephemeral and stateless
    The risk is that if the Elrond API is down then the data marshal goes offline.
    We need to have an alternate way to proceed in this event @TODO
  */

    const api = returnAPIEndpoint(chainId);

    if (api === "") {
      throw new HttpException("MP-2-1: chainId not supported", HttpStatus.BAD_REQUEST);
    } else {
      const getBlockchainStats = `${api}/stats`;

      try {
        const response = await axios.get(getBlockchainStats);

        const payload = response.data as {
          epoch: number | null | undefined;
          roundsPassed: number | null | undefined;
          roundsPerEpoch: number | null | undefined;
        };

        if (
          payload &&
          Object.keys(payload).length > 0 &&
          payload.epoch !== undefined &&
          payload.roundsPassed !== undefined &&
          payload.roundsPerEpoch !== undefined
        ) {
          return {
            nonce: Buffer.from(`${payload.epoch}:${payload.roundsPassed}:${payload.roundsPerEpoch}`).toString("base64"),
          };
        } else {
          throw new HttpException(
            "MP-2-3-CR: Blockchain service not responding accurately for nonce generation.",
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      } catch (error) {
        throw new HttpException("MP-2-4-CR: Unknown error during nonce generation", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
