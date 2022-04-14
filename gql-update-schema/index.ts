import fs from 'fs';
import path from 'path';
import util from 'util';

// This module supposed to update local schema by fetching from remote.
// For demo purposes it just reads from local files.

const GENERATED_SCHEMA_NAME = 'schema.local.graphql';
const appRoot = process.cwd();

function formatMessage(msg: string) {
  return `[gql-update-schema]: ${msg}`;
}

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

async function main() {
  try {
    const schemaBuffer = await readFile('./schema.remote.graphql');
    const schema = schemaBuffer.toString('utf8');
    await writeFile(path.resolve(appRoot, GENERATED_SCHEMA_NAME), schema);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(formatMessage(e.message));
    }
    throw e;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

console.log(formatMessage('GraphQL schema was successfully updated!'));
