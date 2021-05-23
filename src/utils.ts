import { ethereum, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { Country, Transaction, Token, User, Artwork } from '../generated/schema'
import { IERC721 } from '../generated/IERC721/IERC721'
import { COUNTRIES } from "./countryList"

export let ZERO_INT = BigInt.fromI32(0)
export let ZERO_DEC = BigDecimal.fromString('0')
export let EMPTY_STRING_ARRAY = new Array<string>()
export let ONE_INT = BigInt.fromI32(1)
export let ONE_DEC = BigDecimal.fromString('1')
export let PRECISION = new BigDecimal(tenPow(18))
export let ETH_ADDR = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
export let ZERO_ADDR = '0x0000000000000000000000000000000000000000'
export let NFT_ADDRESS = '0x0A6e9A7652416F02d5a8c1beF1E376b24a2cC01A'
export let ARTWORK_SEGMENTS = new BigInt(10000)

export function tenPow(exponent: number): BigInt {
  let result = BigInt.fromI32(1)

  for (let i = 0; i < exponent; i++) {
    result = result.times(BigInt.fromI32(10))
  }

  return result
}

export function getArrItem<T>(arr: Array<T>, idx: i32): T {
  let a = new Array<T>()
  a = a.concat(arr)

  return a[idx]
}

export function normalize(i: BigInt, decimals: number = 18): BigDecimal {
  return i.toBigDecimal().div(tenPow(decimals).toBigDecimal())
}

export function getPieceReward(nextSegmentPlace: BigInt): BigDecimal {
  // (150*0.999216459** 6751 + 50).toFixed()
  let numericSegmentPlace = nextSegmentPlace.toString()
  let amount = BigDecimal.fromString('150').times(powDecimal(BigDecimal.fromString('0.999216459'), parseInt(numericSegmentPlace))).plus(BigDecimal.fromString('50'))
  return amount
}

export function powDecimal(amount: BigDecimal, count: number): BigDecimal {
  let result = BigDecimal.fromString('1')

  if (count === 0) return result
  if (count === 1) return amount


  for (let i = 0; i < count; i++) {
    result = amount.times(result)
  }

  return result
}

export function getInitialCountries(artworkName: String): string[] {
  let artworkCountries = EMPTY_STRING_ARRAY;

  for (let i = 0; i < COUNTRIES.length; i++) {
    let country = COUNTRIES[i];
    let name = country.name;
    let segmentsCount = country.segments.length;

    // Create country entity
    let entity = new Country(name + "-" + artworkName);
    entity.name = name;
    entity.availableSegments = BigInt.fromI32(segmentsCount);
    entity.save();

    artworkCountries.push(entity.id);
  }

  return artworkCountries;
}

export function getCountryByTokenId(id: number): string {
  let country = '';

  for (let i = 0; i < COUNTRIES.length; i++) {
    let countryData = COUNTRIES[i];
    let segments = countryData.segments;
    if (segments.includes(id)) {
      country = countryData.name;
      break;
    }
  }

  return country;
}

// Entities


export function getTransaction(event: ethereum.Event): Transaction {
  let tx = new Transaction(event.transaction.hash.toHex());
  tx.timestamp = event.block.timestamp;
  tx.blockNumber = event.block.number;
  tx.value = event.transaction.value;
  tx.gasUsed = event.transaction.gasUsed;
  tx.gasPrice = event.transaction.gasPrice;
  tx.save();

  return tx;
}

export function getToken(tokenId: BigInt): Token {
  let token = Token.load(tokenId.toString())

  if (!token) {
    token = new Token(tokenId.toString())
    token.identifier = tokenId
    token.isBigSegment = false

    let erc721 = IERC721.bind(Address.fromString(NFT_ADDRESS))
    let try_tokenURI = erc721.try_tokenURI(tokenId)
    token.uri = try_tokenURI.reverted ? '' : try_tokenURI.value
  }

  return token as Token;
}

export function getUser(address: string): User {
  let user = User.load(address)

  if (user == null) {
    user = new User(address)
    user.claimablePiece = ZERO_DEC
    user.tokens = EMPTY_STRING_ARRAY
    user.transfersFrom = EMPTY_STRING_ARRAY
    user.transfersTo = EMPTY_STRING_ARRAY
    user.save()
  }

  return user as User
}

export function getArtwork(tokenId: BigInt): Artwork {
  let artworkId = ZERO_INT

  // TODO for next Artworks
  // if (tokenId.ge(Utils.ARTWORK_SEGMENTS)) {
  //   artworkId = tokenId.div(Utils.ARTWORK_SEGMENTS)
  // }

  let artwork = Artwork.load(artworkId.toString())

  return artwork as Artwork
}