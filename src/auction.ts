import { BigInt, ethereum } from "@graphprotocol/graph-ts"

import { NewPurchase } from "../generated/Auction/Auction"
import {
  User,
  Artwork,
  Purchase,
  Transaction
} from "../generated/schema"
import * as Utils from './utils'


export function handleNewPurchase(event: NewPurchase): void {
  let artwork = getArtwork(event.params.tokenId)
  let claimablePiece = Utils.getPieceReward(artwork.soldSimpleSegmentsCount)

  // Purchase
  let tokenId = event.params.tokenId.toString()
  let purchase = new Purchase(tokenId + "-" + event.transaction.hash.toHex())
  purchase.token = tokenId
  purchase.initiator = event.params.purchaser.toHex()
  purchase.buyer = event.params.receiver.toHex()
  purchase.paidAmount = event.params.weiAmount
  purchase.transaction = getTransaction(event).id
  purchase.claimedPiece = claimablePiece
  purchase.save()

  // User
  let user = getUser(event.params.receiver.toHex())
  user.claimablePiece = user.claimablePiece.plus(claimablePiece)
  user.save()

  // Artwork
  artwork.soldSimpleSegmentsCount = artwork.soldSimpleSegmentsCount.plus(Utils.ONE_INT)
  artwork.claimablePiece = Utils.getPieceReward(artwork.soldSimpleSegmentsCount)

  let soldSegments = artwork.soldSegments
  soldSegments.push(tokenId)
  artwork.soldSegments = soldSegments
  let tokens = artwork.tokens
  tokens.push(tokenId)
  artwork.tokens = tokens
  artwork.save()
}

///  ----------------------
///  HELPERS
///  ----------------------

function getUser(address: string): User {
  let user = User.load(address)

  if (user == null) {
    user = new User(address)
    user.claimablePiece = Utils.ZERO_DEC
    user.tokens = Utils.EMPTY_STRING_ARRAY
    user.transfersFrom = Utils.EMPTY_STRING_ARRAY
    user.transfersTo = Utils.EMPTY_STRING_ARRAY
    user.save()
  }

  return user as User
}

function getTransaction(event: ethereum.Event): Transaction {
  let tx = Transaction.load(event.transaction.hash.toHex())

  if (tx == null) {
    tx = new Transaction(event.transaction.hash.toHex())
    tx.timestamp = event.block.timestamp
    tx.blockNumber = event.block.number
    tx.value = event.transaction.value
    tx.gasUsed = event.transaction.gasUsed
    tx.gasPrice = event.transaction.gasPrice
    tx.save()
  }

  return tx as Transaction
}

function getArtwork(tokenId: BigInt): Artwork {
  let artworkId = Utils.ZERO_INT

  // TODO for next Artworks
  // if (tokenId.ge(Utils.ARTWORK_SEGMENTS)) {
  //   artworkId = tokenId.div(Utils.ARTWORK_SEGMENTS)
  // }

  let artwork = Artwork.load(artworkId.toString())

  return artwork as Artwork
}