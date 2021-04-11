import { Address, BigInt, ethereum } from "@graphprotocol/graph-ts"
import { IERC721 } from '../generated/IERC721/IERC721'
import {
  SpecialSegmentCreated,
  NewBatchPurchase,
  NewSinglePurchase
} from "../generated/Auction/Auction"

import {
  User,
  Token,
  Artwork,
  Purchase,
  Transaction
} from "../generated/schema"

import * as Utils from './utils'


export function handleNewSinglePurchase(event: NewSinglePurchase): void {
  // Purchase
  let purchase = getNewPurchaseEntity(
    event.params.tokenId,
    event.params.purchaser,
    event.params.receiver,
    event.params.weiAmount,
    event
  )

  // Artwork
  let artwork = getArtwork(event.params.tokenId)
  let soldSegments = artwork.soldSegments
  let tokens = artwork.tokens

  artwork.soldSegmentsCount = artwork.soldSegmentsCount.plus(Utils.ONE_INT)
  soldSegments.push(event.params.tokenId.toHex())
  tokens.push(event.params.tokenId.toHex())
  artwork.soldSegments = soldSegments
  artwork.tokens = tokens
  artwork.save()


  // User
  let userAddress = event.params.receiver.toHex()
  let user = User.load(userAddress)
  if (user == null) {
    user = getUser(userAddress)
  }

  user.save()
}

export function handleSpecialSegmentCreated(event: SpecialSegmentCreated): void {
  let receivers = event.params.receivers
  let tokenIds = event.params.tokenIds
  let amountsPaid = event.params.amountsPaid
  let segmentsCount = event.params.tokenIds.length

  for (let i = 0; i < segmentsCount; i++) {
    // Purchase
    let purchase = getNewPurchaseEntity(
      tokenIds[i],
      event.transaction.from,
      receivers[i],
      amountsPaid[i],
      event
    )

    // Token
    let tokenId = tokenIds[i]
    let receiver = receivers[i].toHex()
    let segment = getToken(tokenId)
    segment.isBigSegment = true // As this event happens for big segments only
    segment.save()

    // User
    let user = getUser(receiver)
  }
}

export function handleNewBatchPurchase(event: NewBatchPurchase): void {
  let tokenIds = event.params.tokenIds
  let receivers = event.params.receivers
  let segmentsCount = event.params.tokenIds.length
  let amountPerEachNft = segmentsCount > 0 ? event.params.ethSent.div(new BigInt(segmentsCount)) : Utils.ZERO_INT

  for (let i = 0; i < segmentsCount; i++) {
    // Purchase
    let purchase = getNewPurchaseEntity(
      tokenIds[i],
      event.params.purchaser,
      receivers[i],
      amountPerEachNft,
      event
    )

    // Token
    let segment = getToken(tokenIds[i])
    segment.isBigSegment = true // As this event happens for big segments only
    segment.save()

    // User
    let user = getUser(receivers[i].toHex())
  }
}

///  ----------------------
///  HELPERS
///  ----------------------

function getNewPurchaseEntity(tokenId: BigInt, initiator: Address, buyer: Address, paidAmount: BigInt,event: ethereum.Event): Purchase {
  let id = tokenId.toHex() + "-" + event.transaction.hash.toHex()
  let purchase = Purchase.load(id)

  if (purchase == null) {
    purchase = new Purchase(id)
    purchase.token = tokenId.toHex()
    purchase.initiator = initiator.toHex()
    purchase.buyer = buyer.toHex()
    purchase.paidAmount = paidAmount
    purchase.transaction = getTransaction(event).id
    purchase.save()
  }

  return purchase as Purchase
}

function getUser(address: string): User {
  let user = User.load(address)

  if (user == null) {
    user = new User(address)
    user.save()
  }

  return user as User
}

function getTransaction(event: ethereum.Event): Transaction {
  let tx = Transaction.load(event.transaction.hash.toHex());

  if (tx == null) {
    tx = new Transaction(event.transaction.hash.toHex());
    tx.timestamp = event.block.timestamp;
    tx.blockNumber = event.block.number;
    tx.value = event.transaction.value;
    tx.gasUsed = event.transaction.gasUsed;
    tx.gasPrice = event.transaction.gasPrice;
    tx.save();
  }

  return tx as Transaction;
}

function getToken(tokenId: BigInt): Token {
  let token = Token.load(tokenId.toHex())

  if (!token) {
    token = new Token(tokenId.toHex())
    token.identifier = tokenId
    token.isBigSegment = false

    let erc721 = IERC721.bind(Address.fromString(Utils.NFT_ADDRESS))
    let try_tokenURI = erc721.try_tokenURI(tokenId)
    token.uri = try_tokenURI.reverted ? '' : try_tokenURI.value
    token.save()
  }

  return token as Token;
}

function getArtwork(tokenId: BigInt): Artwork {
  let artworkId = Utils.ZERO_INT

  // if (tokenId.ge(Utils.ARTWORK_SEGMENTS)) {
  //   artworkId = tokenId.div(Utils.ARTWORK_SEGMENTS)
  // }

  let artwork = Artwork.load(artworkId.toHex())

  return artwork as Artwork
}