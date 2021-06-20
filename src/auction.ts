import { NewPurchase } from "../generated/Auction/Auction"
import {
  Country,
  Purchase,
} from "../generated/schema"
import * as Utils from './utils'


export function handleNewPurchase(event: NewPurchase): void {
  let artwork = Utils.getArtwork(event.params.tokenId)
  let claimablePiece = Utils.getPieceReward(artwork.soldSegmentsCount, event.params.tokenId)

  // Token
  let token = Utils.getToken(event.params.tokenId)
  token.claimablePiece = claimablePiece
  token.saleOrder = artwork.soldSegmentsCount
  token.save()

  // Purchase
  let tokenId = event.params.tokenId.toString()
  let purchase = new Purchase(tokenId + "-" + event.transaction.hash.toHex())
  purchase.token = tokenId
  purchase.initiator = event.params.purchaser.toHex()
  purchase.buyer = event.params.receiver.toHex()
  purchase.paidAmount = event.params.weiAmount
  purchase.transaction = Utils.getTransaction(event).id
  purchase.claimedPiece = claimablePiece
  purchase.save()

  // User
  let user = Utils.getUser(event.params.receiver.toHex())
  user.claimablePiece = user.claimablePiece.plus(claimablePiece)
  user.save()

  // Artwork
  artwork.soldSegmentsCount = artwork.soldSegmentsCount.plus(Utils.ONE_INT)
  artwork.soldSimpleSegmentsCount = artwork.soldSimpleSegmentsCount.plus(Utils.ONE_INT)
  artwork.claimablePiece = Utils.getPieceReward(artwork.soldSegmentsCount, Utils.ZERO_INT)

  // Country
  let countryName = Utils.getCountryByTokenId(parseInt(event.params.tokenId.toString()))
  let countryEntity = Utils.getCountry(countryName, artwork.name)
  countryEntity.availableSegments = countryEntity.availableSegments.minus(Utils.ONE_INT)
  countryEntity.save()

  let tokens = artwork.tokens
  let soldSegments = artwork.soldSegments

  tokens.push(tokenId)
  soldSegments.push(tokenId)

  artwork.tokens = tokens
  artwork.soldSegments = soldSegments

  artwork.save()
}