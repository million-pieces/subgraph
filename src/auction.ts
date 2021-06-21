import { NewPurchase } from "../generated/Auction/Auction"
import { Purchase } from "../generated/schema"
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
  let purchase = new Purchase(token.id + "-" + event.transaction.hash.toHex())
  purchase.token = token.id
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

  // Artwork (purchase state)
  artwork.soldSegmentsCount = artwork.soldSegmentsCount.plus(Utils.ONE_INT)
  artwork.claimablePiece = Utils.getPieceReward(artwork.soldSegmentsCount, Utils.ZERO_INT)

  let soldSegments = artwork.soldSegments
  soldSegments.push(token.id)
  artwork.soldSegments = soldSegments

  artwork.save()
}