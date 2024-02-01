/**
 * AltaiLabs
 * Nova Marketplace
 * Version: 0.1.0
 * */
import {
  Args,
  u64ToBytes,
  bytesToString,
  stringToBytes,
  bytesToU64,
} from '@massalabs/as-types';
import {
  Address,
  Context,
  Storage,
  balance,
  call,
  generateEvent,
  transferCoins,
} from '@massalabs/massa-as-sdk';
import {
  SellOffer,
  BuyTokenOperation,
  CollectionDetail,
} from '../utilities/marketplace-complex';

const ONE_UNIT = 10 ** 9;
const ONE_TENTH = 10 ** 8;

export const ownerKey = 'marketplaceOwner';
export const marketplaceFeeKey = 'marketplaceFee'; // STANDART FEE
export const sellOfferKey = 'sellOffer_';
export const buyOfferKey = 'buyOffer_';
export const userCollectionsKey = 'collection_';

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param args - The arguments to the constructor containing the message to be logged
 */

export function constructor(binaryArgs: StaticArray<u8>): void {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!Context.isDeployingContract()) {
    return;
  }
  const args = new Args(binaryArgs);
  const marketplaceOwner = args
    .nextString()
    .expect('marketplaceOwner argument is missing or invalid');
  const marketplaceFee = args
    .nextU64()
    .expect('marketplaceFee argumen is missing or invalid');

  Storage.set(ownerKey, marketplaceOwner);
  Storage.set(marketplaceFeeKey, bytesToString(u64ToBytes(marketplaceFee)));
  generateEvent('Nova Marketplace SC Deployed');
}

/**
 * @returns true if the caller is the creator of the SC
 */
function _onlyOwner(): bool {
  return Context.caller().toString() == Storage.get(ownerKey);
}

/**
 * @returns true if the collection is available
 */
function weHaveCollection(scAddr: string): bool {
  const key = userCollectionsKey + scAddr;
  return Storage.has(key);
}

export function addCollection(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const collectioName = args.nextString().expect('');
  const collectionAddress = args.nextString().expect('');
  const collectionWebsite = args.nextString().expect('');
  const bannerImage = args.nextString().expect('');
  const collectionBackgroundImage = args.nextString().expect('');
  const collectionLogoImage = args.nextString().expect('');
  const collectionBaseURI = args.nextString().expect('');
  const collectionMintPrice = args.nextU64().expect('');
  const extraMetadata = args.nextString().expect('');
  const marketplaceMintingEvent = args.nextString().expect('');

  const key = userCollectionsKey + collectionAddress;
  const collection = new CollectionDetail(
    collectioName,
    collectionAddress,
    collectionWebsite,
    bannerImage,
    collectionBackgroundImage,
    collectionLogoImage,
    collectionBaseURI,
    collectionMintPrice,
    extraMetadata,
    marketplaceMintingEvent,
  );
  Storage.set(stringToBytes(key), collection.serialize());
  generateEvent('Collection ' + collectionAddress + ' is added');
}

export function dellCollection(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const collectionSCAddress = args.nextString().expect('');
  const key = userCollectionsKey + collectionSCAddress;
  Storage.del(stringToBytes(key));
}

export function changeMarketplaceOwner(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const newAdmin = args.nextString().unwrap();
  Storage.set(ownerKey, newAdmin);
}

export function SCCoinsToAddress(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const address = args.nextString().unwrap();
  const amount = args.nextU64().unwrap();

  transferCoins(new Address(address), amount);
}

export function changeMarketplaceFee(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const newMarketplaceFee = args.nextU64().unwrap();

  Storage.set(marketplaceFeeKey, bytesToString(u64ToBytes(newMarketplaceFee)));
}

/**
 * @returns sell offer in marketplace
 */
export function sellOffer(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const collectionAddress = args.nextString().unwrap();
  const nftTokenId = args.nextU64().unwrap();
  const price = args.nextU64().unwrap();
  const expireIn = args.nextU64().unwrap();
  const expirationTime = Context.timestamp() + expireIn;
  const creatorAddress = Context.caller().toString();
  const createdTime = Context.timestamp().toString();

  assert(
    weHaveCollection(collectionAddress),
    'Collection not found in marketplace',
  );
  const key = sellOfferKey + collectionAddress + '_' + nftTokenId.toString();
  assert(!Storage.has(key), 'Sell offer already exist');
  const marketplacefee = bytesToU64(
    stringToBytes(Storage.get(marketplaceFeeKey)),
  );

  assert(
    Context.transferredCoins() >= marketplacefee,
    'Marketplace fee is not enough',
  );
  const owner = bytesToString(
    call(
      new Address(collectionAddress),
      'nft1_ownerOf',
      new Args().add(nftTokenId),
      ONE_TENTH,
    ),
  );
  assert(
    owner == creatorAddress,
    'You are not the owner of NFT owner:' +
      owner.toString() +
      ' callerAddress: ' +
      creatorAddress.toString(),
  );

  const approved = bytesToString(
    call(
      new Address(collectionAddress),
      'nft1_getApproved',
      new Args().add(nftTokenId),
      ONE_TENTH,
    ),
  );
  assert(
    approved == Context.callee().toString(),
    'Marketplace not approved for trading',
  );
  const newSellOffer = new SellOffer(
    collectionAddress,
    nftTokenId.toString(),
    price,
    creatorAddress,
    expirationTime.toString(),
    createdTime,
  );

  Storage.set(stringToBytes(key), newSellOffer.serialize());
  generateEvent('SELL_OFFER : ' + creatorAddress);
}

/**
 * @returns remove sell offer in marketplace
 */
export function removeSellOffer(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const collectionAddress = args.nextString().unwrap();
  const nftTokenId = args.nextU64().unwrap();
  assert(
    weHaveCollection(collectionAddress),
    'Collection not found in marketplace',
  );
  const key = sellOfferKey + collectionAddress + '_' + nftTokenId.toString();
  assert(Storage.has(key), 'Sell offer doesnt exist');

  const marketplacefee = bytesToU64(
    stringToBytes(Storage.get(marketplaceFeeKey)),
  );

  assert(
    Context.transferredCoins() >= marketplacefee,
    'Marketplace fee is not enough',
  );

  const storedData = Storage.get(stringToBytes(key));
  const offset: i32 = 0;
  const sellOfferData = new SellOffer('', '', 0, '', '');
  const deserializeResult = sellOfferData.deserialize(storedData, offset);

  if (deserializeResult.isOk()) {
    assert(
      sellOfferData.creatorAddress == Context.caller().toString(),
      'Only the creator can remove the sell offer',
    );
    let owner = bytesToString(
      call(
        new Address(collectionAddress),
        'nft1_ownerOf',
        new Args().add(nftTokenId),
        ONE_TENTH,
      ),
    );
    assert(
      owner == Context.caller().toString(),
      'You are not the owner of NFT',
    );
    Storage.del(stringToBytes(key));
    generateEvent('REMOVE_SELL_OFFER : ' + Context.caller().toString());
  } else {
    generateEvent('DESERIALIZATION_ERROR');
  }
}

/**
 * @returns buy offer in marketplace
 */
export function buyOffer(binaryArgs: StaticArray<u8>): void {
  const args = new Args(binaryArgs);
  const collectionAddress = args.nextString().unwrap();
  const nftTokenId = args.nextU64().unwrap();

  assert(
    weHaveCollection(collectionAddress),
    'Collection not found in marketplace',
  );
  const key = sellOfferKey + collectionAddress + '_' + nftTokenId.toString();
  assert(Storage.has(key), 'Sell offer doesnt exist');

  const storedData = Storage.get(stringToBytes(key));
  const offset: i32 = 0;
  const sellOfferData = new SellOffer('', '', 0, '', '');
  const deserializeResult = sellOfferData.deserialize(storedData, offset);

  if (deserializeResult.isOk()) {
    const expirationTime = U64.parseInt(sellOfferData.expirationTime);

    const pricePercentage = sellOfferData.price % 3;
    const requiredCoins = sellOfferData.price + pricePercentage;

    assert(Context.timestamp() <= expirationTime, 'Sell offer has expired');
    assert(
      Context.transferredCoins() >= requiredCoins,
      'Could not send enough money or marketplace fees to buy this NFT',
    );
    let owner = bytesToString(
      call(
        new Address(collectionAddress),
        'nft1_ownerOf',
        new Args().add(nftTokenId),
        ONE_TENTH,
      ),
    );
    const address = Context.caller().toString();

    call(
      new Address(collectionAddress),
      'nft1_transferFrom',
      new Args().add(owner).add(address).add(nftTokenId),
      1 * ONE_UNIT,
    );
    transferCoins(new Address(owner), sellOfferData.price);
    generateEvent(
      `${Context.caller().toString()} bought this ${nftTokenId.toString()} NFT at this ${sellOfferData.price.toString()} price`,
    );

    //Save History
    const buyKey =
      buyOfferKey +
      address +
      '_' +
      collectionAddress +
      '_' +
      nftTokenId.toString();

    const timestamp = Context.timestamp().toString();
    const buyOp = new BuyTokenOperation(
      collectionAddress,
      nftTokenId.toString(),
      sellOfferData.price,
      address,
      sellOfferData.creatorAddress,
      timestamp,
    );
    Storage.set(stringToBytes(buyKey), buyOp.serialize());

    //Delete seller offer key
    Storage.del(stringToBytes(key));
  } else {
    generateEvent('DESERIALIZATION_ERROR');
  }
}
