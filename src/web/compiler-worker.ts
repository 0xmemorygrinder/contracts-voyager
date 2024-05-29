import wrapper from 'solc/wrapper';

declare var self: WorkerGlobalScope & typeof globalThis & { Module: any };

self.addEventListener('message', async (event: Event & { data: { binaryPath: string, content: string}}) => {
  try {
    const { binaryPath, content } = event.data;

    console.log('binaryPath', binaryPath);

    importScripts(binaryPath);

    console.log('Module', self.Module);

    const ast = extractAST(content);

    postMessage({ data: ast });
    //postMessage({ error: 'Not implemented yet' });
  } catch (e: any) {
    console.error(e);
    postMessage({ error: e});
  }
});

function extractAST(content: string): any {
  const solc = wrapper(self.Module); // 
  const input: any = {
    language: 'Solidity',
    sources: {
      'file.sol': {
        content
      }
    },
    settings: {
      stopAfter: 'parsing',
      outputSelection: {
        '*': {
          '' : ['ast']
        }
      }
    }
  };
  const solcOutput = solc.compile(JSON.stringify(input))
  console.debug("solcOutput", solcOutput);
  const output = JSON.parse(solcOutput);
  console.debug("output", output);
  return output.sources['file.sol'].ast;
}

export = {};