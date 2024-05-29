import { SourceUnit, VariableDeclaration } from 'solidity-ast';

export function getPropertyDeclarations(ast: SourceUnit, name?: string): VariableDeclaration[] {
  const contractDeclarations = ast.nodes.filter((node: any) => node.nodeType === 'ContractDefinition' && (node.name === name || !name));

  return contractDeclarations.reduce((acc: any, contract: any) => {
    const properties = contract.nodes.filter((node: any) => node.nodeType === 'VariableDeclaration');
    return [...acc, ...properties];
  }, []);
}

export function getPrimitiveProperties(properties: VariableDeclaration[]): VariableDeclaration[] {
  return properties.filter((property: any) => property.typeName.nodeType === 'ElementaryTypeName');
}