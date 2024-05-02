# Temporal Money Transfer example in TypeScript

This is the companion code for the tutorial [Run your first Temporal Application with TypeScript](https://learn.temporal.io/getting_started/typescript/first_program_in_typescript).

### Running this sample:

- Make sure Temporal Server is running locally (see the [quick install guide](https://docs.temporal.io/server/quick-install/)).
- `bun install` to install dependencies.
- `bun run server:dev` to start the Temporal server.
- `bun run start:worker` to start the Worker.
- In another shell, `bun run start:client` to run the Workflow Client.

The Workflow will return:

```bash
Started Workflow workflow-OyIhuWr6X4opgqtYnhxuX with RunID a85055c8-3fce-466e-b4f6-8f66c16614e6
Transfer complete (transaction IDs: w1328871163, d0590412617)
```
