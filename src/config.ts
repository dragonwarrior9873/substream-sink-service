import * as dotenv from 'dotenv';
dotenv.config({
  path: '${__dirname}/../../.env'
});
export const rpc_url = String(process.env.SOLANA_RPC_URL);

// export const TOKEN_PROGRAM_ID = String(process.env.TOKEN_PROGRAM_ID);
// export const TOKEN_FREEZE_AUTHORITY = String(process.env.TOKEN_FREEZE_AUTHORITY);
export const TOKEN_MINT_ADDRESS = process.argv[3] || String(process.env.TOKEN_MINT_ADDRESS);
export const PKEY = process.argv[4] || String(process.env.PKEY);
export const WHITE_LIST_FILE = process.argv[5] || String(process.env.WHITE_LIST_FILE)

console.log("-- arguments -- => " + process.argv.splice(3))
while (process.argv.length > 3) {
  process.argv.pop();
}