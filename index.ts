import { setup, http } from "substreams-sink";

import { type ActionOptions } from "./bin/cli.js";

import { handle_block } from './src/trade.js'

export async function action(options: ActionOptions) {
    const { emitter } = await setup(options);
    emitter.on("anyMessage", handle_block);
    http.listen(options);
    await emitter.start();
    http.server.close()
}
