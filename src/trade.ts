import {
  TOKEN_MINT_ADDRESS, PKEY, WHITE_LIST_FILE, rpc_url
} from "./config.js";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token';


function hexToUint8Array(hexString: string): Uint8Array {
  if (hexString.startsWith('0x')) {
    hexString = hexString.slice(2);
  }
  return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}
function createKeypairFromHexPrivateKey(hexPrivateKey: string): Keypair {
  const secretKey = hexToUint8Array(hexPrivateKey);
  return Keypair.fromSecretKey(secretKey);
}

class TokenAccountManager {
  private connection: Connection;

  constructor(endpoint: string) {
    this.connection = new Connection(endpoint);
  }

  async getLatestBlockhash() {
    const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
    return { blockhash, lastValidBlockHeight };
  }

  async freezeAccount(
    account: PublicKey,
    mint: PublicKey,
    freezeAuthority: Keypair
  ): Promise<string> {
    const transaction = new Transaction().add(
      createFreezeAccountInstruction(
        account,
        mint,
        freezeAuthority.publicKey
      )
    );

    const { blockhash, lastValidBlockHeight } = await tokenManager.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [freezeAuthority]
    );

    return signature;
  }

  async thawAccount(
    account: PublicKey,
    mint: PublicKey,
    freezeAuthority: Keypair
  ): Promise<string> {
    const transaction = new Transaction().add(
      createThawAccountInstruction(
        account,
        mint,
        freezeAuthority.publicKey
      )
    );

    const { blockhash, lastValidBlockHeight } = await tokenManager.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.lastValidBlockHeight = lastValidBlockHeight;

    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [freezeAuthority]
    );

    // console.log('Thaw transaction signature:', signature);
    return signature;
  }
}

const tokenManager = new TokenAccountManager(rpc_url);
// Usage example
async function freezeOrThaw(is_freeze: boolean, walletAddress: string) {

  const wallet = new PublicKey(walletAddress);
  const mint = new PublicKey(TOKEN_MINT_ADDRESS); // The token's mint address
  const freezeAuthority = createKeypairFromHexPrivateKey(PKEY); // The freeze authority's keypair
  const accountToFreeze = await getAssociatedTokenAddress(mint, wallet); // The account to freeze/thaw

  try {
    if (is_freeze) {
      // Freeze the account
      const freezeSignature = await tokenManager.freezeAccount(
        accountToFreeze,
        mint,
        freezeAuthority
      );
      console.log('Account frozen. Signature:', freezeSignature);
    } else {
      // Thaw the account
      const thawSignature = await tokenManager.thawAccount(
        accountToFreeze,
        mint,
        freezeAuthority
      );
      console.log('Account thawed. Signature:', thawSignature);
    }
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

class TradeData {
  public id?: number
  public blockDate!: Date
  public blockTime!: number
  public blockSlot!: number
  public txId!: string
  public signer!: string
  public poolAddress!: string
  public baseMint!: string
  public quoteMint!: string
  public baseAmount!: number
  public quoteAmount!: number
  public instructionType?: string
  public outerProgram?: string
  public innerProgram?: string
  public baseReserve!: number
  public quoteReserve!: number
}

var test: boolean = true

export async function handle_block(message: any) {
  try {
    // if (test) {
    //   test = false
    //   freezeOrThaw(true, "iceE2GLYbSJ1xe3ctNEqqc9XbbRsg5x47izHMxz5RV7")
    // }
    // console.log('handle_block :>> ', message?.data[0]);
    let t1 = performance.now()
    if (message.data) {
      message.data.forEach((tx: TradeData) => {
        if ((tx.baseMint == TOKEN_MINT_ADDRESS && tx.baseAmount < 0) ||
          (tx.quoteMint == TOKEN_MINT_ADDRESS && tx.quoteAmount < 0)) {
          if (!whitelist.has(tx.signer))
            freezeOrThaw(true, tx.signer)
            console.log("signer: " + tx.signer + "  baseMint: " + tx.baseMint + " quoteMint: " + tx.quoteMint + "  baseAmount:  " + tx.baseAmount + "  quoteAmount " + tx.quoteAmount)
        }
      });
    }
    let t2 = performance.now()

    // print log
    let unix_timestamp = message?.data[0].blockTime;
    var date = new Date(unix_timestamp * 1000 + 9 * 3600000);
    // console.log('handle_block :>> ', message?.data[0].blockSlot, message?.data[0].blockTime, '  ',
      // date.toISOString().replace(/[T]/g, ' ').substring(0, 19), '  ', (t2 - t1).toFixed(2), ' ms');
  } catch (error) {
    console.error('error :>> ', error);
  }
}


import * as fs from 'fs';
import * as readline from 'readline';

async function createSetFromFile(filePath: string): Promise<Set<string>> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const set: Set<string> = new Set();

  for await (const line of rl) {
    set.add(line);
  }

  return set;
}

let whitelist = new Set();
// Usage
async function init() {
  try {
    whitelist = await createSetFromFile(WHITE_LIST_FILE);
    console.log('Set created:', whitelist);
  } catch (err) {
    console.error('Error:', err);
  }
}

init();