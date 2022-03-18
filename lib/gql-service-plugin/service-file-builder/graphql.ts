import { concatAST, Kind } from 'graphql';
import { oldVisit } from '@graphql-codegen/plugin-helpers';
import { FileBuilderVisitor } from '../file-builder-visitor';
import type { DocumentNode, FragmentDefinitionNode } from 'graphql';
import type { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import type { ServiceFileBuilder } from '../types';

function isDocumentNode(node: DocumentNode | undefined): node is DocumentNode {
  return node !== undefined;
}

export const fileBuilder: ServiceFileBuilder = (
  schema,
  documents,
  config,
  info,
) => {
  const documentASTs = documents
    .map<DocumentNode | undefined>((v) => v.document)
    .filter<DocumentNode>(isDocumentNode);

  const allAst = concatAST(documentASTs);
  const allFragments: LoadedFragment[] = [
    ...(
      allAst.definitions.filter(
        (d) => d.kind === Kind.FRAGMENT_DEFINITION,
      ) as FragmentDefinitionNode[]
    ).map((fragmentDef) => ({
      node: fragmentDef,
      name: fragmentDef.name.value,
      onType: fragmentDef.typeCondition.name.value,
      isExternal: false,
    })),
    ...(config.externalFragments || []),
  ];
  const visitor = new FileBuilderVisitor(schema, allFragments, config);
  oldVisit(allAst, { enter: visitor });
  const { content, hash } = visitor.getCompiledOperation();

  return ['# __HASH__', `# ${hash}`, '\n', '# __OPERATION__', content].join(
    '\n',
  );
};
