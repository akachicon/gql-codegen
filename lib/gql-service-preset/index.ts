import { join, relative, resolve } from 'path';
import { preset as nearOperationFilePreset } from '@graphql-codegen/near-operation-file-preset';
import { generateImportStatement } from '@graphql-codegen/visitor-plugin-common';
import { validateSingleOperation } from '../utils';
import { formatMessage } from './utils';
import {
  PACKAGE_NAME as SERVICE_PLUGIN_NAME,
  plugin,
  validate,
} from '../gql-service-plugin';

import type { Types } from '@graphql-codegen/plugin-helpers';
import type { GqlServicePluginConfig } from '../gql-service-plugin/types';
import type { GqlServicePresetConfig } from './types';

export const preset: Types.OutputPreset<GqlServicePresetConfig> = {
  buildGeneratesSection: async (options) => {
    const cwd = options.presetConfig.cwd ?? process.cwd();

    if (!options.presetConfig.serviceDir) {
      throw new Error(formatMessage('serviceDir config should be specified'));
    }
    const resolvedServiceDir = resolve(
      cwd,
      options.baseOutputDir,
      options.presetConfig.serviceDir,
    );

    if (!options.presetConfig.baseTypesPath) {
      throw new Error(
        formatMessage('baseTypesPath config should be specified'),
      );
    }
    const baseTypesPath = options.presetConfig.baseTypesPath;
    let resolvedBaseTypesPath = join(options.baseOutputDir, baseTypesPath);

    // https://github.com/dotansimha/graphql-code-generator/blob/8c7a49ba30ac6d5f86d6c4e5e298231e3159d748/packages/presets/near-operation-file/src/index.ts#L173
    if (options.presetConfig.baseTypesPath.startsWith('~')) {
      resolvedBaseTypesPath = options.presetConfig.baseTypesPath;
    }

    if (!options.presetConfig.importTypesNamespace) {
      throw new Error(
        formatMessage('importTypesNamespace config should be specified'),
      );
    }
    const importTypesNamespace = options.presetConfig.importTypesNamespace;

    let generatedOutputs: Types.GenerateOptions[] = [];
    let processedOutputs: Types.GenerateOptions[] = [];

    const nearOperationFileResult =
      nearOperationFilePreset.buildGeneratesSection(options);

    if (nearOperationFileResult instanceof Promise) {
      generatedOutputs = await nearOperationFileResult;
    } else {
      generatedOutputs = nearOperationFileResult;
    }

    // This validation is enough since we know that near-operation-file-preset
    // will generate an output for each file containing operations and won't
    // concatenate operation definitions in any way.
    generatedOutputs.forEach((generateOptions) => {
      const isOutputWithOperation = generateOptions.documents.reduce(
        (acc, doc) => {
          const { isValid, hasOperation } = validateSingleOperation(doc);
          if (!isValid) {
            throw new Error(
              formatMessage(
                `More than one operation definition found in ${doc.location}`,
              ),
            );
          }
          return acc || hasOperation;
        },
        false,
      );

      if (isOutputWithOperation) {
        const originalOutputPlugins = generateOptions.plugins;

        // Modify original output so that it's processed by the plugin.
        const servicePluginLocalConfig: GqlServicePluginConfig = {
          domain: 'local',
          skipValidation: true,
        };
        const servicePluginLocalPlugins = [
          ...originalOutputPlugins,
          { [SERVICE_PLUGIN_NAME]: servicePluginLocalConfig },
        ];
        generateOptions.plugins = servicePluginLocalPlugins;
        generateOptions.pluginMap[SERVICE_PLUGIN_NAME] = { plugin, validate };

        // Create new output for the service.
        const relativeFilename = relative(cwd, generateOptions.filename);
        const serviceFilename = resolve(resolvedServiceDir, relativeFilename);

        // Mirror near-operation-file-preset logic.
        // https://github.com/dotansimha/graphql-code-generator/blob/8c7a49ba30ac6d5f86d6c4e5e298231e3159d748/packages/presets/near-operation-file/src/index.ts#L176
        const typesImport = options.config.useTypeImports ?? false;

        // Generate schema types import statement for the service files.
        const serviceSchemaTypesImportStatement = generateImportStatement({
          baseDir: cwd,
          importSource: {
            path: resolvedBaseTypesPath,
            namespace: importTypesNamespace,
          },
          baseOutputDir: options.baseOutputDir,
          outputPath: serviceFilename,
          typesImport,
        });

        const generatedSchemaTypesImportStatement = generateImportStatement({
          baseDir: cwd,
          importSource: {
            path: resolvedBaseTypesPath,
            namespace: importTypesNamespace,
          },
          baseOutputDir: options.baseOutputDir,
          outputPath: generateOptions.filename,
          typesImport,
        });

        const servicePluginServiceConfig: GqlServicePluginConfig = {
          domain: 'service',
          skipValidation: true,
        };
        const servicePluginServicePlugins = [
          ...originalOutputPlugins,
          { [SERVICE_PLUGIN_NAME]: servicePluginServiceConfig },
        ].map((plugin) => {
          if (
            Object.keys(plugin)[0] === 'add' &&
            plugin.add.content.trim() ===
              generatedSchemaTypesImportStatement.trim()
          ) {
            return {
              add: {
                content: serviceSchemaTypesImportStatement,
              },
            };
          }
          return plugin;
        });

        const serviceOutput = {
          ...generateOptions,
          filename: serviceFilename,
          pluginMap: {
            ...generateOptions.pluginMap,
            [SERVICE_PLUGIN_NAME]: { plugin, validate },
          },
          plugins: servicePluginServicePlugins,
        };
        processedOutputs.push(serviceOutput);
      }
    });

    return [...generatedOutputs, ...processedOutputs];
  },
};
