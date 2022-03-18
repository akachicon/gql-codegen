import { concatAST, Kind } from 'graphql';
import { oldVisit } from '@graphql-codegen/plugin-helpers';
import { FileBuilderVisitor } from '../file-builder-visitor';
import type { DocumentNode, FragmentDefinitionNode } from 'graphql';
import type { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import type { LocalContentBuilder } from '../types';

function isDocumentNode(node: DocumentNode | undefined): node is DocumentNode {
  return node !== undefined;
}

export const fileBuilder: LocalContentBuilder = (
  schema,
  documents,
  config,
  info,
) => {
  const documentASTs = documents
    .map<DocumentNode | undefined>((v) => v.document)
    .filter<DocumentNode>(isDocumentNode);

  // To collect all fragments we merge the fragments from the documents
  // passed to the plugin (configured by the preset) and external fragments.
  // External fragments are populated internally by near-operation-file-preset,
  // near-operation-file-preset recursively collects fragments external to every
  // document and provides them as `externalFragments` to the generated output.
  // https://github.com/dotansimha/graphql-code-generator/blob/a3b348cd796c10adb914c4769e0eaa95c0c02ad3/packages/presets/near-operation-file/src/index.ts#L211
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

  const { content, hash, name, type, variablesName } =
    visitor.getCompiledOperation();

  return [
    '// __NAME__',
    `// ${name}`,
    '\n',
    '// __TYPE__',
    `// ${type}`,
    '\n',
    '// __VARIABLES__',
    `// ${variablesName ?? 'null'}`,
  ].join('\n');
};
