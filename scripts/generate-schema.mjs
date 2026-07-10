import { writeFile } from "node:fs/promises";

import protocol from "../dist/index.js";

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  ...protocol.Me3ProfileSchema,
};

await writeFile(
  new URL("../schema.json", import.meta.url),
  `${JSON.stringify(schema, null, 2)}\n`,
);
