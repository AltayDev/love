/*
Massexplo
Marketplace - Complex Class - Sell Offer - Buy Operation
*/

import { Serializable, Result, Args } from '@massalabs/as-types';

export class CollectionDetail implements Serializable {
  constructor(
    public name: string = '',
    public address: string = '',
    public externalWebsite: string = '',
    public bannerImage: string = '',
    public backgroundImage: string = '',
    public collectionLogoImage: string = '',
    public collectionBaseURI: string = '',
    public collectionMintPrice: u64 = 0,
    public extraMetadata: string = '',
    public marketplaceMinting: string = '',
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();

    args.add<string>(this.name);
    args.add<string>(this.address);
    args.add<string>(this.externalWebsite);
    args.add<string>(this.bannerImage);
    args.add<string>(this.backgroundImage);
    args.add<string>(this.collectionLogoImage);
    args.add<string>(this.collectionBaseURI);
    args.add<u64>(this.collectionMintPrice);
    args.add<string>(this.extraMetadata);
    args.add<string>(this.marketplaceMinting);
    return args.serialize();
  }

  deserialize(data: StaticArray<u8>, offset: i32): Result<i32> {
    const args = new Args(data, offset);

    const nameResult = args.nextString();
    if (nameResult.isErr()) return new Result(0);
    this.name = nameResult.unwrap();

    const addressResult = args.nextString();
    if (addressResult.isErr()) return new Result(0);
    this.address = addressResult.unwrap();

    const externalWebsiteResult = args.nextString();
    if (externalWebsiteResult.isErr()) return new Result(0);
    this.externalWebsite = externalWebsiteResult.unwrap();

    const bannerImageResult = args.nextString();
    if (bannerImageResult.isErr()) return new Result(0);
    this.bannerImage = bannerImageResult.unwrap();

    const backgroundImageResult = args.nextString();
    if (backgroundImageResult.isErr()) return new Result(0);
    this.backgroundImage = backgroundImageResult.unwrap();

    const collectionLogoImageResult = args.nextString();
    if (collectionLogoImageResult.isErr()) return new Result(0);
    this.collectionLogoImage = collectionLogoImageResult.unwrap();

    const collectionBaseURIResult = args.nextString();
    if (collectionBaseURIResult.isErr()) return new Result(0);
    this.collectionBaseURI = collectionBaseURIResult.unwrap();

    const collectionMintPriceResult = args.nextU64();
    if (collectionMintPriceResult.isErr()) return new Result(0);
    this.collectionMintPrice = collectionMintPriceResult.unwrap();

    const extraMetadataResult = args.nextString();
    if (extraMetadataResult.isErr()) return new Result(0);
    this.extraMetadata = extraMetadataResult.unwrap();

    const marketplaceMintingResult = args.nextString();
    if (marketplaceMintingResult.isErr()) return new Result(0);
    this.marketplaceMinting = marketplaceMintingResult.unwrap();

    return new Result(args.offset);
  }
}

export class SellOffer implements Serializable {
  constructor(
    public collectionAddress: string = '',
    public tokenId: string = '',
    public price: u64 = 0,
    public creatorAddress: string = '',
    public expirationTime: u64 = 0,
    public createdTime: u64 = 0,
  ) {}

  serialize(): StaticArray<u8> {
    const args = new Args();

    args.add<string>(this.collectionAddress);
    args.add<string>(this.tokenId);
    args.add<u64>(this.price);
    args.add<string>(this.creatorAddress);
    args.add<u64>(this.expirationTime);
    args.add<u64>(this.createdTime);
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

    const expirationTimeResult = args.nextU64();
    if (expirationTimeResult.isErr()) return new Result(0);
    this.expirationTime = expirationTimeResult.unwrap();

    const createdTimeResult = args.nextU64();
    if (createdTimeResult.isErr()) return new Result(0);
    this.createdTime = createdTimeResult.unwrap();

    return new Result(args.offset);
  }
}
