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
export let NFT_ADDRESS = Address.fromString('0x32A984F84E056b6E553cD0C3729fDDd2d897769c')
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

export function getPieceReward(currentSegmentPlace: BigInt, tokenId: BigInt): BigInt {
  // Big cities have 500
  if (isSpecial(tokenId)) {
    return BigInt.fromString('500')
  }

  if (currentSegmentPlace.equals(ZERO_INT)) {
    return BigInt.fromString('200')
  }

  // eg (150 * 0.999487762**6751 + 50).toFixed()
  let amount = BigDecimal.fromString('150').times(powDecimal(BigDecimal.fromString('0.999487762'), parseInt(currentSegmentPlace.toString()))).plus(BigDecimal.fromString('50'))
  let rounded = BigInt.fromString(amount.toString().split('.')[0])

  // round to closer side (eg: 149.51 => 150 and 149.49 => 149)
  if (BigDecimal.fromString(rounded.toString()).plus(BigDecimal.fromString('0.5')).gt(amount)) {
    return rounded
  } else {
    return rounded.plus(ONE_INT)
  }
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
    entity.totalSegments = BigInt.fromI32(segmentsCount);
    entity.availableSegments = BigInt.fromI32(segmentsCount);
    entity.save();

    artworkCountries.push(entity.id);
  }

  return artworkCountries;
}

export function isSpecial(id: BigInt): boolean {
  let try_isSpecialSegment = getNftInstance().try_isSpecialSegment(id)
  let isSpecial = try_isSpecialSegment.reverted ? false : try_isSpecialSegment.value
  return isSpecial
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
    token.claimablePiece = ZERO_INT
    token.saleOrder = ZERO_INT

    let try_tokenURI = getNftInstance().try_tokenURI(tokenId)
    token.uri = try_tokenURI.reverted ? '' : try_tokenURI.value
  }

  return token as Token;
}

export function getUser(address: string): User {
  let user = User.load(address)

  if (user == null) {
    user = new User(address)
    user.claimablePiece = ZERO_INT
  }

  return user as User
}

export function getNftInstance(): IERC721 {
  return IERC721.bind(NFT_ADDRESS)
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