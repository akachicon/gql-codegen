import { concatAST, visit, Kind } from 'graphql';
import { QueryImplVisitor } from './visitor';
import type { ASTVisitor, DocumentNode, FragmentDefinitionNode } from 'graphql';
import type { LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import type { LocalContentBuilder } from '../types';

function isDocumentNode(node: DocumentNode | undefined): node is DocumentNode {
  return node !== undefined;
}

export const contentBuilder: LocalContentBuilder = (
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
  const visitor = new QueryImplVisitor(schema, allFragments, config, documents);

  const operationVisitor: ASTVisitor = {
    [Kind.OPERATION_DEFINITION]: {
      enter(node) {
        console.log(visitor.OperationDefinition(node));
        return false;
      },
    },
  };

  documents.forEach((document) => {
    // const allFragmentNodes = visitor.allFragments.map((f) => f.node);
    // const docFragmentNodes = allFragmentNodes.filter((node) =>
    //   visitor.extractFragments(document.document).includes(node.name.value),
    // );
    // docFragmentNodes.forEach((node) => {
    //   console.log(visitor.generateFragment(node));
    // });
    // -
    if (isDocumentNode(document.document)) {
      visit(document.document, operationVisitor);
    }
    // -
  });

  // console.log(visitor.getImports());

  // @ts-ignore
  // console.log(print(documentASTs));

  return '// local content';
};
