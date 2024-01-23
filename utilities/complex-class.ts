/*
Massexplo
Public Name Tag - Complex Class
*/

import { Serializable, Result, Args } from '@massalabs/as-types';

class PublicNameTag implements Serializable {
  constructor(
    public address: string = '',
    public nameTag: string = '',
    public website: string = '',
    public description: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();

    args.add<string>(this.address);
    args.add<string>(this.nameTag);
    args.add<string>(this.website);
    args.add<string>(this.description);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);

    const playerAddressResult = args.nextString();
    if (playerAddressResult.isErr()) return new Result(0);
    this.address = playerAddressResult.unwrap();

    const nameTagResult = args.nextString();
    if (nameTagResult.isErr()) return new Result(0);
    this.nameTag = nameTagResult.unwrap();

    const websiteResult = args.nextString();
    if (websiteResult.isErr()) return new Result(0);
    this.website = websiteResult.unwrap();

    const descriptionResult = args.nextString();
    if (descriptionResult.isErr()) return new Result(0);
    this.description = descriptionResult.unwrap();

    return new Result(args.offset);
  }
}
function areUint8ArraysEqual(array1: Uint8Array, array2: Uint8Array): bool {
  if (array1.length !== array2.length) {
    return false;
  }

  for (let i: i32 = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }

  return true;
}

export { PublicNameTag, areUint8ArraysEqual };
