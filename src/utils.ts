import { ethereum, BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { Country, Transaction, Token, User, Artwork } from '../generated/schema'
import { IERC721 } from '../generated/IERC721/IERC721'
import { SEGMENTS } from "./segmentsList"

export let ZERO_INT = BigInt.fromI32(0)
export let ZERO_DEC = BigDecimal.fromString('0')
export let EMPTY_STRING_ARRAY = new Array<string>()
export let ONE_INT = BigInt.fromI32(1)
export let ONE_DEC = BigDecimal.fromString('1')
export let PRECISION = new BigDecimal(tenPow(18))
export let ETH_ADDR = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
export let ZERO_ADDR = '0x0000000000000000000000000000000000000000'
export let NFT_ADDRESS = Address.fromString('0x0894C8287975Bb24967d54475D1E8e9A6CDbEEC3')
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
  if (tokenId.notEqual(BigInt.fromString('0')) && isSpecial(tokenId)) {
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
  let artworkCountries = EMPTY_STRING_ARRAY

  for (let i = 0; i < SEGMENTS.length; i++) {
    let segment = SEGMENTS[i]

    // Init country entity
    let entity = getCountry(segment.country, artworkName)
    entity.totalSegments = entity.totalSegments.plus(ONE_INT)
    entity.availableSegments = entity.availableSegments.plus(ONE_INT)
    entity.save()

    // Push segment country if not exists
    if (artworkCountries.indexOf(entity.id) === -1) {
      artworkCountries.push(entity.id)
    }
  }

  return artworkCountries
}

export function isSpecial(id: BigInt): boolean {
  let try_isSpecialSegment = getNftInstance().try_isSpecialSegment(id)
  let isSpecial = try_isSpecialSegment.reverted ? false : try_isSpecialSegment.value
  return isSpecial
}

export function getCountryByTokenId(id: BigInt): string {
  let country = SEGMENTS[parseInt(id.toString()) - 1 as i32].country

  return country;
}

export function getCoordinateByTokenId(id: BigInt): string {
  let coordinate = SEGMENTS[parseInt(id.toString()) - 1 as i32].coordinates

  return coordinate;
}

export function segmentMintHandler(id: BigInt): void {
  let artwork = getArtwork(id)
  let token = getToken(id)

  // Artwork updates
  let tokens = artwork.tokens
  tokens.push(id.toString())
  artwork.tokens = tokens

  // Token coordinate
  let coordinate = getCoordinateByTokenId(id)
  token.coordinate = coordinate

  if (isSpecial(id)) {
    // Claimable PIECE for special tokens
    token.claimablePiece = getPieceReward(artwork.soldSegmentsCount, id)
    artwork.soldSpecialSegmentsCount = artwork.soldSpecialSegmentsCount.plus(ONE_INT)
  } else {
    artwork.soldSimpleSegmentsCount = artwork.soldSimpleSegmentsCount.plus(ONE_INT)
  }

  token.save()
  artwork.save()

  // Country updates

  let countryName = getCountryByTokenId(id)
  let countryEntity = getCountry(countryName, artwork.name)
  countryEntity.availableSegments = countryEntity.availableSegments.minus(ONE_INT)
  countryEntity.save()
}

// Entities

export function getTransaction(event: ethereum.Event): Transaction {
  let tx = new Transaction(event.transaction.hash.toHex())
  tx.timestamp = event.block.timestamp
  tx.blockNumber = event.block.number
  tx.value = event.transaction.value
  tx.gasUsed = event.transaction.gasUsed
  tx.gasPrice = event.transaction.gasPrice
  tx.save()

  return tx
}

export function getToken(tokenId: BigInt): Token {
  let entity = Token.load(tokenId.toString())

  if (!entity) {
    entity = new Token(tokenId.toString())
    entity.identifier = tokenId
    entity.isBigSegment = false
    entity.claimablePiece = ZERO_INT
    entity.saleOrder = ZERO_INT
    entity.owner = ZERO_ADDR
    entity.transfers = EMPTY_STRING_ARRAY
    entity.coordinate = ''

    let try_tokenURI = getNftInstance().try_tokenURI(tokenId)
    entity.uri = try_tokenURI.reverted ? '' : try_tokenURI.value
  }

  return entity as Token
}

export function getUser(address: string): User {
  let entity = User.load(address)

  if (entity == null) {
    entity = new User(address)
    entity.claimablePiece = ZERO_INT
  }

  return entity as User
}

export function getCountry(countryName: string, artworkName: String): Country {
  let id = countryName + "-" + artworkName
  let entity = Country.load(id)

  if (entity == null) {
    entity = new Country(id)
    entity.name = countryName
    entity.totalSegments = ZERO_INT
    entity.availableSegments = ZERO_INT
  }

  return entity as Country
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
