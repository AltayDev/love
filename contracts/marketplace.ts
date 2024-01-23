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
  createSC,
  generateEvent,
  transferCoins,
} from '@massalabs/massa-as-sdk';
import { SellOffer, BuyTokenOperation } from '../utilities/marketplace-complex';

const ONE_UNIT = 10 ** 9;
const ONE_TENTH = 10 ** 8;

export const ownerKey = 'marketplaceOwner';
export const marketplaceFeeKey = 'marketplaceFee';

export const sellOfferKey = 'sellOffer_';
export const buyOfferKey = 'buyOffer_';

export const nftContractCodeKey = stringToBytes('nft_contract_code');
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

  generateEvent('Massa Marketplace SC Deployed');
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

/*
 ADMIN FEATURES
*/

export function setNftContractCode(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  let nft_contract_code = args
    .nextFixedSizeArray<u8>()
    .expect('nft_contract_code argument is missing or invalid');

  Storage.set(nftContractCodeKey, StaticArray.fromArray(nft_contract_code));
}

export function addCollection(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const collectionSCAddress = args.nextString().expect('');
  const key = userCollectionsKey + collectionSCAddress;
  Storage.set(key, collectionSCAddress);
}

export function dellCollection(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const collectionSCAddress = args.nextString().expect('');
  const key = userCollectionsKey + collectionSCAddress;
  Storage.del(key);
}

export function changeMarketplaceOwner(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const newAdmin = args.nextString().unwrap();
  Storage.set(ownerKey, newAdmin);
}

export function sendAllCoinsToAddress(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const address = args.nextString().unwrap();

  transferCoins(new Address(address), balance());
}

export function changeMarketplaceFee(binaryArgs: StaticArray<u8>): void {
  assert(_onlyOwner(), 'The caller is not the owner of the contract');
  const args = new Args(binaryArgs);
  const newMarketplaceFee = args.nextU64().unwrap();

  Storage.set(marketplaceFeeKey, bytesToString(u64ToBytes(newMarketplaceFee)));
}

/**
 * @returns create a brand new NFT Collection
 */
export function createNftCollection(args: StaticArray<u8>): void {
  const nft_contract_code = Storage.get(nftContractCodeKey);
  const addr = createSC(nft_contract_code);
  call(addr, 'constructor', new Args(args), 1 * ONE_UNIT);

  generateEvent(`NFT created at ${addr.toString()}`);
  generateEvent(`CREATE: ${Context.caller().toString()}`);
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
  assert(
    weHaveCollection(collectionAddress),
    'Collection not found in marketplace',
  );
  const key = sellOfferKey + collectionAddress + '_' + nftTokenId.toString();
  assert(!Storage.has(key), 'Sell offer already exist');

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

  // Transfer nft to Marketplace
  call(
    new Address(collectionAddress),
    'nft1_transferFrom',
    new Args().add(owner).add(Context.callee().toString()).add(nftTokenId),
    1 * ONE_UNIT,
  );

  const newSellOffer = new SellOffer(
    collectionAddress,
    nftTokenId.toString(),
    price,
    creatorAddress,
    expirationTime.toString(),
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
      owner == Context.callee().toString(),
      'Marketplace does not own this NFT',
    );

    //Transfer nft to Address
    const address = sellOfferData.creatorAddress;

    //Approve again seller creator addres
    call(
      new Address(collectionAddress),
      'nft1_approve',
      new Args().add(nftTokenId).add(address),
      ONE_TENTH,
    );
    //Transfer token to seller address
    call(
      new Address(collectionAddress),
      'nft1_transferFrom',
      new Args().add(owner).add(address).add(nftTokenId),
      1 * ONE_UNIT,
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
    const marketplacefee = bytesToU64(
      stringToBytes(Storage.get(marketplaceFeeKey)),
    );
    const acoountCoins = Context.transferredCoins() - marketplacefee; // PAY US

    assert(Context.timestamp() <= expirationTime, 'Sell offer has expired');
    assert(
      acoountCoins >= sellOfferData.price,
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
      'nft1_approve',
      new Args().add(nftTokenId).add(address),
      ONE_TENTH,
    );

    call(
      new Address(collectionAddress),
      'nft1_transferFrom',
      new Args().add(owner).add(address).add(nftTokenId),
      1 * ONE_UNIT,
    );
    transferCoins(new Address(owner), sellOfferData.price);
    generateEvent(
      `${Context.caller().toString()} bought this ${nftTokenId.toString()} at this ${sellOfferData.price.toString()}`,
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
