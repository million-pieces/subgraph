import { Transfer, Artwork } from '../generated/schema'
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

  // Mint cases
  if (from.id == Utils.ZERO_ADDR) {
    let tokenPieceAmount = Utils.ZERO_INT
    Utils.segmentMintHandler(event.params.tokenId)

    // Special segment cases
    if (Utils.isSpecial(event.params.tokenId)) {
      token.isBigSegment = true
      tokenPieceAmount = Utils.getPieceReward(Utils.ZERO_INT, event.params.tokenId, false)
    } else if (Utils.isGiveAwayTx(event)) {
      tokenPieceAmount = Utils.getPieceReward(Utils.ZERO_INT, event.params.tokenId, true)
    }

    // Save claimable PIECE amount
    token.claimablePiece = tokenPieceAmount
    to.claimablePiece = to.claimablePiece.plus(tokenPieceAmount)

    // Save coordinates
    token.coordinate = Utils.getCoordinateByTokenId(event.params.tokenId)
  }
  // Update claimable PIECE if not minted event
  else {
    from.claimablePiece = from.claimablePiece.minus(token.claimablePiece)
    to.claimablePiece = to.claimablePiece.plus(token.claimablePiece)
  }

  token.owner = to.id

  token.save()
  from.save()
  to.save()
}

export function handleNewArtworkCreated(event: NewArtworkCreated): void {
  let artwork = new Artwork(event.params.id.toString())
  artwork.name = event.params.name
  artwork.soldSegments = Utils.EMPTY_STRING_ARRAY
  artwork.soldSimpleSegmentsCount = Utils.ZERO_INT
  artwork.soldSpecialSegmentsCount = Utils.ZERO_INT
  artwork.soldSegmentsCount = Utils.ZERO_INT
  artwork.tokens = Utils.EMPTY_STRING_ARRAY
  artwork.unsoldIds = Utils.getSegmentsIds()
  artwork.claimablePiece = Utils.getPieceReward(Utils.ZERO_INT, Utils.ZERO_INT, false)
  artwork.countries = Utils.getInitialCountries(event.params.name.toString())
  artwork.save()
}