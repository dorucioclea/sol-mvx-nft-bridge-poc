import { Injectable, InternalServerErrorException } from "@nestjs/common";

@Injectable()
export class HealthService {
  constructor() {}

  async checkHealth() {
    return "OK";
  }
}
