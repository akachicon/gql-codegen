import fs from 'fs';
import path from 'path';
import util from 'util';

// This script supposed to update local schema by fetching from remote.
// For demo purposes it just reads from local files.

const PACKAGE_NAME = 'gql-update-schema';
const GENERATED_SCHEMA_NAME = 'schema.local.graphql';
const appRoot = process.cwd();

function formatMessage(text) {
  return `${PACKAGE_NAME}: ${text}`;
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

try {
  const schemaBuffer = await readFile('./schema.remote.graphql');
  const schema = schemaBuffer.toString('utf8');
  await writeFile(path.resolve(appRoot, GENERATED_SCHEMA_NAME), schema);
} catch (e) {
  throw new Error(formatMessage(e));
}

console.log(formatMessage('GraphQL schema was successfully updated!'));
