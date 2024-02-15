import * as internals from './NFT-internals';
import {
  boolToByte,
  stringToBytes,
  u256ToBytes,
  u32ToBytes,
  bytesToString,
  bytesToU256,
  byteToBool,
  bytesToU64,
  u64ToBytes,
} from '@massalabs/as-types';
import { Address, Context, Storage } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { u256 } from 'as-bignum/assembly';

export const OWNABLE_KEY = 'OWNABLE';
export const BASE_URI_KEY = stringToBytes('BASE_URI');
export const TOKEN_URI_KEY = stringToBytes('TOKEN_URI');
export const TOTAL_SUPPLY_KEY = stringToBytes('TOTAL_SUPPLY');
export const COUNTER_KEY = stringToBytes('COUNTER');
export const MINT_PRICE_KEY = stringToBytes('PRICE_PER_TOKEN');
export const START_TIME_KEY = stringToBytes('START_TIME');
export const MINT_PAUSED_KEY = stringToBytes('MINT_PAUSED');

// @custom:security-contact altailabs
// init price = 0.036 MAS
// mint price = 0.016 MAS
// approve = 0.007 MAS

export function constructor(_args: StaticArray<u8>): void {
  assert(Context.isDeployingContract());
  const args = new Args(_args);

  const name = args.nextString().expect('name argument is missing or invalid');
  const symbol = args
    .nextString()
    .expect('symbol argument is missing or invalid');
  const totalSupply = args
    .nextU256()
    .expect('totalSupply argument is missing or invalid');
  const baseURI = args
    .nextString()
    .expect('baseURI argument is missing or invalid');
  const tokenURI = args
    .nextString()
    .expect('tokenURI argument is missing or invalid');
  const mintPrice = args
    .nextU64()
    .expect('mintPrice argument is missing or invalid');
  const startTime = args
    .nextU64()
    .expect('startTime argument is missing or invalid');

  const constructorArgs = new Args().add(name).add(symbol).serialize();
  internals._constructor(constructorArgs);

  Storage.set(TOTAL_SUPPLY_KEY, u256ToBytes(totalSupply));
  Storage.set(BASE_URI_KEY, stringToBytes(baseURI));
  Storage.set(TOKEN_URI_KEY, stringToBytes(tokenURI));
  Storage.set(MINT_PRICE_KEY, u64ToBytes(mintPrice));
  Storage.set(START_TIME_KEY, u64ToBytes(startTime));
  Storage.set(MINT_PAUSED_KEY, boolToByte(false));
  Storage.set(OWNABLE_KEY, Context.caller().toString());
  Storage.set(COUNTER_KEY, u256ToBytes(u256.Zero));
}

export function name(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(internals.NAME_KEY);
}

export function symbol(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(internals.SYMBOL_KEY);
}

export function totalSupply(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(TOTAL_SUPPLY_KEY);
}

export function currentSupply(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(COUNTER_KEY);
}

export function mint(_args: StaticArray<u8>): void {
  assert(
    bytesToU256(Storage.get(TOTAL_SUPPLY_KEY)) > bytesToU256(currentSupply()),
    'Max supply reached',
  );
  assert(!byteToBool(Storage.get(MINT_PAUSED_KEY)), 'Mint process paused');
  assert(
    Context.timestamp() >= bytesToU64(Storage.get(START_TIME_KEY)),
    'Mint has not started yet',
  );
  assert(
    Context.transferredCoins() >= bytesToU64(Storage.get(MINT_PRICE_KEY)),
    'Not enough sent coins to mint this NFT',
  );
  const args = new Args(_args);
  const mintAddress = new Address(
    args.nextString().expect('mintAddress argument is missing or invalid'),
  );

  const increment = bytesToU256(currentSupply()) + u256.One;
  Storage.set(COUNTER_KEY, u256ToBytes(increment));
  internals._update(mintAddress, increment, new Address());
}

export function tokenURI(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const tokenId = args
    .nextU256()
    .expect('token id argument is missing or invalid')
    .toString();

  const uri = bytesToString(Storage.get(TOKEN_URI_KEY));
  const key = uri + tokenId;
  return stringToBytes(key);
}

export function _setTokenURI(_args: StaticArray<u8>): void {
  assert(_onlyOwner(), 'only sc owner can access');
  const args = new Args(_args);
  const newTokenURI = args
    .nextString()
    .expect('tokenUri argument is missing or invalid');

  Storage.set(TOKEN_URI_KEY, stringToBytes(newTokenURI));
}

export function baseURI(
  _: StaticArray<u8> = new StaticArray<u8>(0),
): StaticArray<u8> {
  return Storage.get(BASE_URI_KEY);
}

export function _setBaseURI(_args: StaticArray<u8>): void {
  assert(_onlyOwner(), 'only sc owner can access');
  const args = new Args(_args);
  const newBaseURI = args
    .nextString()
    .expect('tokenUri argument is missing or invalid');

  Storage.set(BASE_URI_KEY, stringToBytes(newBaseURI));
}

export function balanceOf(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const address = args
    .nextString()
    .expect('address argument is missing or invalid');
  return u256ToBytes(internals._balanceOf(new Address(address)));
}

export function ownerOf(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const tokenId = args
    .nextU256()
    .expect('token id argument is missing or invalid');

  return stringToBytes(internals._ownerOf(tokenId).toString());
}

export function safeTransferFrom(_args: StaticArray<u8>): void {
  const args = new Args(_args);
  const from = args.nextString().expect('from argument is missing or invalid');
  const to = args.nextString().expect('to argument is missing or invalid');
  const tokenId = args
    .nextU256()
    .expect('token id argument is missing or invalid');

  internals._safeTransferFrom(new Address(from), new Address(to), tokenId);
}

export function approve(_args: StaticArray<u8>): void {
  const args = new Args(_args);
  const toAddress = new Address(args.nextString().expect(''));
  const tokenId = args
    .nextU256()
    .expect('token id argument is missing or invalid');

  internals._approve(toAddress, tokenId);
}

export function setApprovalForAll(_args: StaticArray<u8>): void {
  const args = new Args(_args);
  const operatorAddress = new Address(
    args.nextString().expect('operatorAddress argument is missing or invalid'),
  );
  const approved = args
    .nextBool()
    .expect('approved argument is missing or invalid');

  internals._setApprovalForAll(operatorAddress, approved);
}

export function getApproved(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const tokenId = args
    .nextU256()
    .expect('token id argument is missing or invalid');

  return stringToBytes(internals._getApproved(tokenId).toString());
}

export function isApprovedForAll(_args: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(_args);
  const ownerAddress = new Address(
    args.nextString().expect('ownerAddress argument is missing or invalid'),
  );
  const operatorAddress = new Address(
    args.nextString().expect('operatorAddress argument is missing or invalid'),
  );
  return internals._isApprovedForAll(ownerAddress, operatorAddress)
    ? u32ToBytes(1)
    : u32ToBytes(0);
}

export function _onlyOwner(): bool {
  return Context.caller().toString() == Storage.get(OWNABLE_KEY);
}

export function _changePauseStatus(_args: StaticArray<u8>): void {
  assert(_onlyOwner(), 'only sc owner can access');
  const args = new Args(_args);
  const pause = args.nextBool().expect('pause argument is missing or invalid');
  Storage.set(MINT_PAUSED_KEY, boolToByte(pause));
}
