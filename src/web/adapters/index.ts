import { Adapter } from "./adapter";
import { Etherscan } from "./etherscan";

const adapter: Adapter[] = [
  new Etherscan(),
];

export function getAdapter(idx: number): Adapter | undefined {
  return adapter[idx];
}

export default adapter;
export { Adapter as IAdapter } from "./adapter";