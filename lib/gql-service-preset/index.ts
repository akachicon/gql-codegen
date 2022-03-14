import { relative, resolve } from 'path';
import { preset as nearOperationFilePreset } from '@graphql-codegen/near-operation-file-preset';
import { validateSingleOperation } from '../utils';
import {
  PACKAGE_NAME as SERVICE_PLUGIN_NAME,
  plugin as servicePlugin,
  validate as servicePluginValidate,
} from '../gql-service-plugin';
import { changeExtension, getPluginName, formatMessage } from './utils';

import type { Types } from '@graphql-codegen/plugin-helpers';
import type {
  ServiceFileExt,
  GqlServiceRawPluginConfig as GqlServicePluginConfig,
  QueryImpl,
} from '../gql-service-plugin/types';
import type { GqlServicePresetConfig } from './types';

type PluginMap = Types.GenerateOptions['pluginMap'];

function ensurePresetOptions(
  options: Types.PresetFnArgs<GqlServicePresetConfig>,
): {
  cwd: string;
  serviceFileExt: ServiceFileExt;
  queryImpl: QueryImpl;
  serviceDir: string;
} {
  const cwd = options.presetConfig.cwd ?? process.cwd();

  const serviceFileExt = options.presetConfig.serviceFileExt;
  if (!serviceFileExt) {
    throw new Error(formatMessage('serviceFileExt config should be specified'));
  }
  const availableServiceFileExts: ServiceFileExt[] = ['.graphql'];
  if (!availableServiceFileExts.includes(serviceFileExt)) {
    throw new Error(formatMessage('Provided fileExt value is not supported'));
  }

  const queryImpl = options.presetConfig.queryImpl;
  if (!queryImpl) {
    throw new Error(formatMessage('queryImpl config should be specified'));
  }
  const availableQueryImpls: QueryImpl[] = ['local', 'service'];
  if (!availableQueryImpls.includes(queryImpl)) {
    throw new Error(formatMessage('Provided queryImpl value is not supported'));
  }

  if (!options.presetConfig.serviceDir) {
    throw new Error(formatMessage('serviceDir config should be specified'));
  }
  const resolvedServiceDir = resolve(
    cwd,
    options.baseOutputDir,
    options.presetConfig.serviceDir,
  );

  return {
    cwd,
    serviceFileExt,
    queryImpl,
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

function createServiceOutput({
  fromOutput,
  cwd,
  fileExt,
  serviceConfig,
  serviceDir,
}: {
  fromOutput: Types.GenerateOptions;
  cwd: string;
  fileExt: ServiceFileExt;
  serviceConfig: GqlServicePluginConfig;
  serviceDir: string;
}): Types.GenerateOptions {
  const relativeFilename = relative(cwd, fromOutput.filename);
  const serviceFilenameWithExt = resolve(serviceDir, relativeFilename);
  const serviceFilename = changeExtension(serviceFilenameWithExt, fileExt);

  const servicePlugins = fromOutput.plugins.filter(
    (plugin) =>
      getPluginName(plugin) !== SERVICE_PLUGIN_NAME &&
      getPluginName(plugin) !== 'typescript-operations' &&
      getPluginName(plugin) !== 'add',
  );
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
    const { cwd, serviceFileExt, queryImpl, serviceDir } =
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
        cwd,
        fileExt: serviceFileExt,
        serviceConfig: {
          domain: 'service',
          queryImpl,
          serviceFileExt,
          skipValidation: true,
        },
        serviceDir,
      });
      addServicePlugin(generateOptions, {
        domain: 'local',
        queryImpl,
        skipValidation: true,
      });
      serviceOutputs.push(serviceOutput);
    });

    return [...generatedOutputs, ...serviceOutputs];
  },
};
