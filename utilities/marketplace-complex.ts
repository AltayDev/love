/*
Massexplo
Marketplace - Complex Class - Sell Offer - Buy Operation
*/

import { Serializable, Result, Args } from '@massalabs/as-types';

export class SellOffer implements Serializable {
  constructor(
    public collectionAddress: string = '',
    public tokenId: string = '',
    public price: u64 = 0,
    public creatorAddress: string = '',
    public expirationTime: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();

    args.add<string>(this.collectionAddress);
    args.add<string>(this.tokenId);
    args.add<u64>(this.price);
    args.add<string>(this.creatorAddress);
    args.add<string>(this.expirationTime);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);

    const collectionAddressResult = args.nextString();
    if (collectionAddressResult.isErr()) return new Result(0);
    this.collectionAddress = collectionAddressResult.unwrap();

    const tokenIdResult = args.nextString();
    if (tokenIdResult.isErr()) return new Result(0);
    this.tokenId = tokenIdResult.unwrap();

    const priceResult = args.nextU64();
    if (priceResult.isErr()) return new Result(0);
    this.price = priceResult.unwrap();

    const creatorAddressResult = args.nextString();
    if (creatorAddressResult.isErr()) return new Result(0);
    this.creatorAddress = creatorAddressResult.unwrap();

    const expirationTimeResult = args.nextString();
    if (expirationTimeResult.isErr()) return new Result(0);
    this.expirationTime = expirationTimeResult.unwrap();

    return new Result(args.offset);
  }
}

export class BuyTokenOperation implements Serializable {
  constructor(
    public collectionAddress: string = '',
    public tokenId: string = '',
    public price: u64 = 0,
    public buyerAddress: string = '',
    public sellerAddress: string = '',
    public timestamp: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();

    args.add<string>(this.collectionAddress);
    args.add<string>(this.tokenId);
    args.add<u64>(this.price);
    args.add<string>(this.buyerAddress);
    args.add<string>(this.sellerAddress);
    args.add<string>(this.timestamp);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);

    const collectionAddressResult = args.nextString();
    if (collectionAddressResult.isErr()) return new Result(0);
    this.collectionAddress = collectionAddressResult.unwrap();

    const tokenIdResult = args.nextString();
    if (tokenIdResult.isErr()) return new Result(0);
    this.tokenId = tokenIdResult.unwrap();

    const priceResult = args.nextU64();
    if (priceResult.isErr()) return new Result(0);
    this.price = priceResult.unwrap();

    const buyerAddressResult = args.nextString();
    if (buyerAddressResult.isErr()) return new Result(0);
    this.buyerAddress = buyerAddressResult.unwrap();

    const sellerAddressResult = args.nextString();
    if (sellerAddressResult.isErr()) return new Result(0);
    this.sellerAddress = sellerAddressResult.unwrap();

    const timestampResult = args.nextString();
    if (timestampResult.isErr()) return new Result(0);
    this.timestamp = timestampResult.unwrap();

    return new Result(args.offset);
  }
}
