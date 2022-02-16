import { join, relative, resolve } from 'path';
import { preset as nearOperationFilePreset } from '@graphql-codegen/near-operation-file-preset';
import { generateImportStatement } from '@graphql-codegen/visitor-plugin-common';
import { validateSingleOperation } from '../utils';
import { getPluginName, formatMessage } from './utils';
import {
  PACKAGE_NAME as SERVICE_PLUGIN_NAME,
  plugin as servicePlugin,
  validate as servicePluginValidate,
} from '../gql-service-plugin';

import type { Types } from '@graphql-codegen/plugin-helpers';
import type { NearOperationFileConfig } from '@graphql-codegen/near-operation-file-preset';
import type { ImportDeclaration } from '@graphql-codegen/visitor-plugin-common';
import type { GqlServicePluginConfig } from '../gql-service-plugin/types';
import type { GqlServicePresetConfig } from './types';

type PluginMap = Types.GenerateOptions['pluginMap'];

function ensurePresetOptions(
  options: Types.PresetFnArgs<GqlServicePresetConfig>,
): {
  baseTypesPath: string;
  cwd: string;
  importTypesNamespace: string;
  serviceDir: string;
} {
  if (!options.presetConfig.baseTypesPath) {
    throw new Error(formatMessage('baseTypesPath config should be specified'));
  }
  const baseTypesPath = options.presetConfig.baseTypesPath;
  let resolvedBaseTypesPath = join(options.baseOutputDir, baseTypesPath);
  // https://github.com/dotansimha/graphql-code-generator/blob/8c7a49ba30ac6d5f86d6c4e5e298231e3159d748/packages/presets/near-operation-file/src/index.ts#L173
  if (options.presetConfig.baseTypesPath.startsWith('~')) {
    resolvedBaseTypesPath = options.presetConfig.baseTypesPath;
  }

  const cwd = options.presetConfig.cwd ?? process.cwd();

  if (!options.presetConfig.importTypesNamespace) {
    throw new Error(
      formatMessage('importTypesNamespace config should be specified'),
    );
  }
  const importTypesNamespace = options.presetConfig.importTypesNamespace;

  if (!options.presetConfig.serviceDir) {
    throw new Error(formatMessage('serviceDir config should be specified'));
  }
  const resolvedServiceDir = resolve(
    cwd,
    options.baseOutputDir,
    options.presetConfig.serviceDir,
  );

  return {
    baseTypesPath: resolvedBaseTypesPath,
    cwd,
    importTypesNamespace,
    serviceDir: resolvedServiceDir,
  };
}

function extendPluginMap(pluginMap: PluginMap): PluginMap {
  return {
    ...pluginMap,
    [SERVICE_PLUGIN_NAME]: {
      plugin: servicePlugin,
      validate: servicePluginValidate,
    },
  };
}

function checkImportStatementEquality(statement1: string, statement2: string) {
  return statement1.trim() === statement2.trim();
}

function createServiceOutput({
  fromOutput,
  nearOperationFileOptions,
  serviceConfig,
  baseTypesPath,
  cwd,
  importTypesNamespace,
  serviceDir,
}: {
  fromOutput: Types.GenerateOptions;
  nearOperationFileOptions: Types.PresetFnArgs<NearOperationFileConfig>;
  serviceConfig: GqlServicePluginConfig;
  baseTypesPath: string;
  cwd: string;
  importTypesNamespace: string;
  serviceDir: string;
}): Types.GenerateOptions {
  const relativeFilename = relative(cwd, fromOutput.filename);
  const serviceFilename = resolve(serviceDir, relativeFilename);

  // Mirror near-operation-file-preset logic.
  // https://github.com/dotansimha/graphql-code-generator/blob/8c7a49ba30ac6d5f86d6c4e5e298231e3159d748/packages/presets/near-operation-file/src/index.ts#L176
  const typesImport = nearOperationFileOptions.config.useTypeImports ?? false;

  const importTypesSharedOptions: Omit<ImportDeclaration, 'outputPath'> = {
    baseDir: cwd,
    importSource: {
      path: baseTypesPath,
      namespace: importTypesNamespace,
    },
    baseOutputDir: nearOperationFileOptions.baseOutputDir,
    typesImport,
  };
  const serviceSchemaTypesImportStatement = generateImportStatement({
    ...importTypesSharedOptions,
    outputPath: serviceFilename,
  });
  const generatedSchemaTypesImportStatement = generateImportStatement({
    ...importTypesSharedOptions,
    outputPath: fromOutput.filename,
  });

  const refinedPlugins = fromOutput.plugins.filter(
    (plugin) => getPluginName(plugin) !== SERVICE_PLUGIN_NAME,
  );
  const servicePlugins = refinedPlugins.map((plugin) => {
    if (
      getPluginName(plugin) === 'add' &&
      checkImportStatementEquality(
        plugin.add.content,
        generatedSchemaTypesImportStatement,
      )
    ) {
      return {
        add: {
          content: serviceSchemaTypesImportStatement,
        },
      };
    }
    return plugin;
  });
  servicePlugins.push({ [SERVICE_PLUGIN_NAME]: serviceConfig });

  return {
    ...fromOutput,
    filename: serviceFilename,
    pluginMap: extendPluginMap(fromOutput.pluginMap),
    plugins: servicePlugins,
  };
}

function addServicePlugin(
  output: Types.GenerateOptions,
  config: GqlServicePluginConfig,
) {
  output.plugins = [...output.plugins, { [SERVICE_PLUGIN_NAME]: config }];
  output.pluginMap = extendPluginMap(output.pluginMap);
}

// This validation is enough since we know that near-operation-file-preset
// will generate an output for each file containing operations and won't
// concatenate operation definitions in any way.
function checkOutputDocumentsOperations(documents: Types.DocumentFile[]) {
  return documents.reduce((acc, doc) => {
    const { isValid, hasOperation } = validateSingleOperation(doc);
    if (!isValid) {
      throw new Error(
        formatMessage(
          `More than one operation definition found in ${doc.location}`,
        ),
      );
    }
    return acc || hasOperation;
  }, false);
}

export const preset: Types.OutputPreset<GqlServicePresetConfig> = {
  buildGeneratesSection: async (options) => {
    const { baseTypesPath, cwd, importTypesNamespace, serviceDir } =
      ensurePresetOptions(options);

    const nearOperationFileResult =
      nearOperationFilePreset.buildGeneratesSection(options);

    let generatedOutputs: Types.GenerateOptions[] =
      nearOperationFileResult instanceof Promise
        ? await nearOperationFileResult
        : nearOperationFileResult;

    let serviceOutputs: Types.GenerateOptions[] = [];

    generatedOutputs.forEach((generateOptions) => {
      const hasOperation = checkOutputDocumentsOperations(
        generateOptions.documents,
      );
      if (!hasOperation) return;

      const serviceOutput = createServiceOutput({
        fromOutput: generateOptions,
        nearOperationFileOptions: options,
        serviceConfig: { domain: 'service', skipValidation: true },
        baseTypesPath,
        cwd,
        importTypesNamespace,
        serviceDir,
      });
      addServicePlugin(generateOptions, {
        domain: 'local',
        skipValidation: true,
      });
      serviceOutputs.push(serviceOutput);
    });

    return [...generatedOutputs, ...serviceOutputs];
  },
};
