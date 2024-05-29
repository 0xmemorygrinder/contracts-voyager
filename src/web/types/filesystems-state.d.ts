import { Address } from "./address";
import { FileSource } from "./file-source";

export type FilesystemsState = Map<Address, { sources: FileSource[], adapter: number }>;