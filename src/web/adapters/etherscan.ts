import { FileSource } from "../types";
import { Adapter } from "./adapter";

export class Etherscan implements Adapter {
  chain = 'Ethereum';
  explorer = 'Etherscan';

  async getSources(address: string): Promise<FileSource[]> {
    const url = `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}`;
    const response = await fetch(url);
    const result = await response.json();

    
    if (result.status !== '1') {
      throw new Error(result.result);
    }
    const parsedResults: {name: string, contents: Record<string, { content: string }> }[] = result.result.map((source: any) => ({
        name: source.ContractName,
        contents: JSON.parse(source.SourceCode.slice(1, -1)).sources,
      })
    );
    const ret: FileSource[] = [];
    for (const parsedResult of parsedResults) {
      Object.entries(parsedResult.contents).forEach(([key, val]) => {
        ret.push({
          path: `${parsedResult.name}/${key}`,
          name: key.toLowerCase().includes(parsedResult.name.toLowerCase()) || val.content.includes(parsedResult.name) ? parsedResult.name : null,
          content: val.content,
        });
      });
    }

    return ret;
  }
}