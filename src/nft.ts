import { Transfer, Artwork, Country } from '../generated/schema'
import { Transfer as TransferEvent, NewArtworkCreated } from '../generated/IERC721/IERC721'
import * as Utils from './utils'

export function handleTransfer(event: TransferEvent): void {
  let token = Utils.getToken(event.params.tokenId)
  let from = Utils.getUser(event.params.from.toHex())
  let to = Utils.getUser(event.params.to.toHex())

  let transaction = Utils.getTransaction(event);
  let eventId = event.block.number.toString().concat('-').concat(event.logIndex.toString());
  let ev = new Transfer(eventId)
  ev.transaction = transaction.id
  ev.timestamp = event.block.timestamp
  ev.token = token.id
  ev.from = from.id
  ev.to = to.id
  ev.save()

  // Cases when admin minted tokens for giveaway
  if (from.id == Utils.ZERO_ADDR && transaction.value.equals(Utils.ZERO_INT)) {
    let artwork = Utils.getArtwork(event.params.tokenId)

    let isSpecial = Utils.isSpecial(event.params.tokenId)
    if (isSpecial) {
      artwork.soldSpecialSegmentsCount = artwork.soldSpecialSegmentsCount.plus(Utils.ONE_INT)

      // Add PIECE to Special tokens
      let claimablePiece = Utils.getPieceReward(artwork.soldSegmentsCount, event.params.tokenId)
      token.claimablePiece = claimablePiece;
    } else {
      artwork.soldSimpleSegmentsCount = artwork.soldSimpleSegmentsCount.plus(Utils.ONE_INT)
    }

    let tokens = artwork.tokens
    tokens.push(event.params.tokenId.toString())
    artwork.tokens = tokens

    artwork.save()

    // Country
    let countryName = Utils.getCountryByTokenId(parseInt(event.params.tokenId.toString()))
    let countryEntity = Country.load(countryName + "-" + artwork.name)
    countryEntity.availableSegments = countryEntity.availableSegments.minus(Utils.ONE_INT)
    countryEntity.save()
  }

  // Update claimable PIECE if user transferred tokens
  if (from.id != Utils.ZERO_ADDR) {
    from.claimablePiece = from.claimablePiece.minus(token.claimablePiece)
    to.claimablePiece = to.claimablePiece.plus(token.claimablePiece)
  }

  token.owner = to.id

  token.save()
  from.save()
  to.save()
}

export function handleNewArtworkCreated(event: NewArtworkCreated): void {
  let id = event.params.id
  let artwork = new Artwork(id.toString())
  artwork.name = event.params.name
  artwork.soldSegments = Utils.EMPTY_STRING_ARRAY
  artwork.soldSimpleSegmentsCount = Utils.ZERO_INT
  artwork.soldSpecialSegmentsCount = Utils.ZERO_INT
  artwork.soldSegmentsCount = Utils.ZERO_INT
  artwork.tokens = Utils.EMPTY_STRING_ARRAY
  artwork.claimablePiece = Utils.getPieceReward(Utils.ZERO_INT, Utils.ZERO_INT)
  artwork.countries = Utils.getInitialCountries(event.params.name.toString());
  artwork.save()
}