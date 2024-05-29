import { Disposable, window, workspace } from "vscode";
import { Address, Chain, PublicClient, createPublicClient, http, webSocket } from 'viem';
import { mainnet } from "viem/chains";

export class RpcService implements Disposable {
  private client: PublicClient | null = null;
  private confObserver: Disposable;

  constructor(private chain: string) {
    this._load();
    this.confObserver = workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('contracts-voyager')) {
        this._load();
      }
    });
  }

  public async getPropertyValue(contract: Address, property: string, type: string): Promise<any | null> {
    const abi = [
      {
        "inputs": [],
        "name": property,
        "outputs": [
          {
            "internalType": type,
            "name": "",
            "type": type
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]

    return this.client?.readContract({
      address: contract,
      abi,
      functionName: property,
    })
  }

  private _load() {
    try {
      const rpcUrl = workspace.getConfiguration('contracts-voyager').get<string>(`${this.chain.toLowerCase()}Rpc`);
      this.client = createPublicClient({
        transport: rpcUrl?.startsWith('http') ? http(rpcUrl) : webSocket(rpcUrl),
        chain: this._getChain(this.chain)
      })
    } catch (error) {
      window.showErrorMessage('Failed to connect to the RPC server');
    }
  }

  private _getChain(chainStr: string): Chain {
    switch (chainStr) {
      case 'mainnet':
        return mainnet;
      default:
        return mainnet;
    }
  }

  dispose() {
    this.confObserver.dispose();
  }
}