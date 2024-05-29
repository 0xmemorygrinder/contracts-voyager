import { Address, FileSource } from "../types";

export abstract class Adapter {
  chain: string | null = null;
  explorer: string | null = null;
  description?: string | null = null;

  abstract getSources(address: Address): Promise<FileSource[]>;
}