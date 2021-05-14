import { User, Transfer, Artwork } from '../generated/schema'
import { Transfer as TransferEvent, NewWorldCreated } from '../generated/IERC721/IERC721'
import * as Utils from './utils'

export function handleTransfer(event: TransferEvent): void {
  let token = Utils.getToken(event.params.tokenId)
  let from = Utils.getUser(event.params.from.toHex())
  let to = Utils.getUser(event.params.to.toHex())

  token.owner = to.id

  token.save()
  from.save()
  to.save()

  let transaction = Utils.getTransaction(event);
  let eventId = event.block.number.toString().concat('-').concat(event.logIndex.toString());
  let ev = new Transfer(eventId)
  ev.transaction = transaction.id
  ev.timestamp = event.block.timestamp
  ev.token = token.id
  ev.from = from.id
  ev.to = to.id
  ev.save()
}

export function handleNewWorldCreated(event: NewWorldCreated): void {
  let id = event.params.id
  let artwork = new Artwork(id.toString())
  artwork.name = event.params.name
  artwork.soldSegments = Utils.EMPTY_STRING_ARRAY
  artwork.soldSimpleSegmentsCount = Utils.ZERO_INT
  artwork.soldSpecialSegmentsCount = Utils.ZERO_INT
  artwork.tokens = Utils.EMPTY_STRING_ARRAY
  artwork.claimablePiece = Utils.getPieceReward(Utils.ONE_INT)
  artwork.countries = Utils.getInitialCountries(event.params.name.toString());
  artwork.save()
}