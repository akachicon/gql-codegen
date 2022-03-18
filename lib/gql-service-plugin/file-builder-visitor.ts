import { createHash } from 'crypto';
import { Kind, print } from 'graphql';
import { BaseVisitor } from '@graphql-codegen/visitor-plugin-common';
import { oldVisit } from '@graphql-codegen/plugin-helpers';
import autoBind from 'auto-bind';
import { pascalCase } from 'change-case-all';
import { formatMessage } from './utils';

import type {
  FragmentDefinitionNode,
  FragmentSpreadNode,
  OperationDefinitionNode,
  GraphQLSchema,
} from 'graphql';
import type {
  ParsedConfig,
  LoadedFragment,
} from '@graphql-codegen/visitor-plugin-common';
import type { GqlServicePluginConfig } from './types';

export type CompiledOperation = {
  content: string;
  hash: string;
  name: string;
  type: string;
  variablesName: string | null;
};

export type GqlServiceParsedConfigBase = {
  filename: string;
};

// Represents internal config structure of the visitor.
export type GqlServiceParsedConfig = Omit<
  ParsedConfig,
  keyof GqlServiceParsedConfigBase
> &
  GqlServiceParsedConfigBase;

const hash = (content: string): string =>
  createHash('sha1').update(content).digest('base64url');

export class FileBuilderVisitor<
  TPluginConfig extends GqlServicePluginConfig = GqlServicePluginConfig,
  TParsedConfig extends GqlServiceParsedConfig = GqlServiceParsedConfig,
> extends BaseVisitor<TPluginConfig, TParsedConfig> {
  private _fragmentDefinitionMap: Map<string, FragmentDefinitionNode> =
    new Map();
  private _operationDefinition: OperationDefinitionNode | null = null;
  private _compiledOperation: CompiledOperation | null = null;
  private _operationCount = 0;

  constructor(
    protected _schema: GraphQLSchema,
    protected _fragments: LoadedFragment[],
    config: TPluginConfig,
  ) {
    super(config, {});
    autoBind(this);
  }

  private _addFragmentDefinitions(inputFragment: FragmentDefinitionNode) {
    this._fragmentDefinitionMap.set(inputFragment.name.value, inputFragment);

    oldVisit(inputFragment, {
      enter: {
        [Kind.FRAGMENT_SPREAD]: (node: FragmentSpreadNode) => {
          const fragmentName = node.name.value;
          if (this._fragmentDefinitionMap.get(fragmentName)) {
            return false;
          }
          const fragment = this._findFragment(fragmentName);
          if (!fragment) {
            throw new Error(
              formatMessage(
                `Cannot find fragment definition for fragment ${fragmentName}`,
              ),
            );
          }
          this._addFragmentDefinitions(fragment.node);
          return false;
        },
      },
    });
  }

  private _findFragment(fragmentName: string) {
    return this._fragments.find((f) => f.name === fragmentName);
  }

  private _ensureOperationDefinition(): OperationDefinitionNode {
    if (this._operationCount > 1) {
      throw new Error(
        formatMessage(
          `File ${this.config.filename} can only contain one operation`,
        ),
      );
    }
    if (this._operationDefinition === null) {
      throw new Error(
        formatMessage(`File ${this.config.filename} should contain operation`),
      );
    }
    return this._operationDefinition;
  }

  getCompiledOperation(): CompiledOperation {
    if (this._compiledOperation) return this._compiledOperation;

    const operationDefinition = this._ensureOperationDefinition();
    const allDefinitions = [
      operationDefinition,
      ...Array.from(this._fragmentDefinitionMap.values()),
    ];
    const operationContent = allDefinitions
      .map((operation) => {
        return print(operation);
      })
      .join('\n');

    // TODO: Find better approach to sync type names.
    // NOTE: We need to keep namings in sync with operations plugin to
    // reference types in query implementation.
    // https://github.com/dotansimha/graphql-code-generator/blob/337fd4f77f82774c78de5c415a407b27d2927368/packages/plugins/other/visitor-plugin-common/src/base-documents-visitor.ts#L243

    // TODO: Respect operationResultSuffix
    // https://github.com/dotansimha/graphql-code-generator/blob/337fd4f77f82774c78de5c415a407b27d2927368/packages/plugins/other/visitor-plugin-common/src/base-documents-visitor.ts#L244

    const operationType = pascalCase(operationDefinition.operation);
    const operationTypeSuffix = this.getOperationSuffix(
      operationDefinition,
      operationType,
    );
    const operationName = this.convertName(operationDefinition, {
      suffix: operationTypeSuffix,
    });
    const variablesName = this.convertName(operationDefinition, {
      suffix: operationTypeSuffix + 'Variables',
    });
    const hasVariables = operationDefinition.variableDefinitions?.length;

    const compiledOperation = {
      content: operationContent,
      hash: hash(operationContent),
      name: operationName,
      type: operationType,
      variablesName: hasVariables ? variablesName : null,
    };
    this._compiledOperation = compiledOperation;

    return compiledOperation;
  }

  getOperationDefinition(): OperationDefinitionNode {
    return this._ensureOperationDefinition();
  }

  [Kind.FRAGMENT_SPREAD](node: FragmentSpreadNode) {
    const fragmentName = node.name.value;
    const visitedFragment = this._findFragment(fragmentName);
    if (!visitedFragment) {
      throw new Error(
        formatMessage(
          `Cannot find fragment definition for fragment ${fragmentName}`,
        ),
      );
    }
    this._addFragmentDefinitions(visitedFragment.node);
    return false;
  }

  [Kind.OPERATION_DEFINITION](node: OperationDefinitionNode) {
    this._operationDefinition = node;
    this._operationCount += 1;
  }
}
