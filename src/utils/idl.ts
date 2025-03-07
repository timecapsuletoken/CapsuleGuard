import { IdlAccounts, IdlInstruction } from '@project-serum/anchor';
import rawIdl from '../idl/token_locker.json';

export function getTokenLockerIdl(): any {
  // Create a properly formatted IDL object that Anchor can use
  const formattedIdl = {
    version: '0.1.0',
    name: 'token_locker',
    instructions: rawIdl.instructions.map((ix: any) => ({
      name: ix.name,
      accounts: ix.accounts.map((acc: any) => ({
        name: acc.name,
        isMut: acc.writable || false,
        isSigner: acc.signer || false,
      })),
      args: ix.args.map((arg: any) => ({
        name: arg.name,
        type: arg.type,
      })),
    })),
    accounts: rawIdl.accounts.map((account: any) => ({
      name: account.name,
      type: {
        kind: 'struct',
        fields: rawIdl.types.find((t: any) => t.name === account.name)?.type?.fields || [],
      },
    })),
    types: rawIdl.types.map((type: any) => ({
      name: type.name,
      type: type.type,
    })),
    errors: rawIdl.errors.map((error: any) => ({
      code: error.code,
      name: error.name,
      msg: error.msg,
    })),
    metadata: rawIdl.metadata,
  };

  return formattedIdl;
} 