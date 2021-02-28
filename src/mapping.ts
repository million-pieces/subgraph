import { BigInt } from "@graphprotocol/graph-ts"
import {
  Auction,
  SpecialSegmentCreated,
  NewBulkPurchase,
  NewSinglePurchase
} from "../generated/Auction/Auction"
import {
  User,
  Segment,
  Purchase
} from "../generated/schema"

import * as Utils from './utils'


function returnNewPurchaseEntity(
  tokenId: string,
  txHash: string,
  purchaser: string,
  receiver: string,
  weiAmount: BigInt,
  timestamp: BigInt
): Purchase {
  let id = tokenId + "-" + txHash
  let purchase = new Purchase(id)

  purchase.initiator = purchaser
  purchase.buyer = receiver
  purchase.paidAmount = weiAmount
  purchase.timestamp = timestamp
  purchase.transaction = txHash

  return purchase
}

function returnNewSegmentEntity(
  tokenId: string,
  receiver: string,
): Segment {
  let segment = new Segment(tokenId)

  segment.currentOwner = receiver
  segment.isBigSegment = false // We have another event for big segments
  segment.purchaseHistory = new Array<string>()

  return segment
}

function returnNewUserEntity(address: string): User {
  let user = new User(address)

  user.purchaseHistory = new Array<string>()
  user.currentSegments = new Array<string>()

  return user
}

export function handleNewSinglePurchase(event: NewSinglePurchase): void {

  // -----------------
  // Purchase
  // -----------------

  let purchase = returnNewPurchaseEntity(
    event.params.tokenId.toString(),
    event.transaction.hash.toHex(),
    event.params.purchaser.toHex(),
    event.params.receiver.toHex(),
    event.params.weiAmount,
    event.block.timestamp
  )

  purchase.save()

  // -----------------
  // Segment
  // -----------------

  let segment = returnNewSegmentEntity(
    event.params.tokenId.toString(),
    event.params.receiver.toHex()
  )

  let segmentPurchaseHistory = segment.purchaseHistory
  segmentPurchaseHistory.push(purchase.id)
  segment.purchaseHistory = segmentPurchaseHistory
  segment.save()

  // -----------------
  // User
  // -----------------

  let userAddress = event.params.receiver.toHex()
  let user = User.load(userAddress)
  if (user == null) {
    user = returnNewUserEntity(userAddress)
  }

  let userPurchaseHistory = user.purchaseHistory,
      userCurrentSegments = user.currentSegments

  userPurchaseHistory.push(purchase.id)
  userCurrentSegments.push(segment.id)
  user.purchaseHistory = userPurchaseHistory
  user.currentSegments = userCurrentSegments

  user.save()
}

export function handleSpecialSegmentCreated(event: SpecialSegmentCreated): void {

  let receivers = event.params.receivers
  let tokenIds = event.params.tokenIds
  let amountsPaid = event.params.amountsPaid

  let transactionHash = event.transaction.hash.toHex()
  let timestamp = event.block.timestamp
  let segmentsCount = event.params.tokenIds.length

  for (let i = 0; i < segmentsCount; i++) {
    let receiver = receivers[i].toHex()
    let tokenId = tokenIds.toString()
    let amountPaid = amountsPaid[i]

    // -----------------
    // Purchase
    // -----------------

    let purchase = returnNewPurchaseEntity(
      tokenId,
      transactionHash,
      Utils.ZERO_ADDR,
      receiver,
      amountPaid,
      timestamp
    )

    purchase.save()

    // -----------------
    // Segment
    // -----------------

    let segment = returnNewSegmentEntity(
      tokenId,
      receiver
    )

    let segmentPurchaseHistory = segment.purchaseHistory
    segmentPurchaseHistory.push(purchase.id)
    segment.purchaseHistory = segmentPurchaseHistory
    segment.isBigSegment = true // As this event happens for big segments only
    segment.save()

    // -----------------
    // User
    // -----------------

    let user = User.load(receiver)
    if (user == null) {
      user = returnNewUserEntity(receiver)
    }

    let userPurchaseHistory = user.purchaseHistory,
        userCurrentSegments = user.currentSegments

    userPurchaseHistory.push(purchase.id)
    userCurrentSegments.push(segment.id)
    user.purchaseHistory = userPurchaseHistory
    user.currentSegments = userCurrentSegments

    user.save()
  }
}

export function handleNewBulkPurchase(event: NewBulkPurchase): void {
  let tokenIds = event.params.tokenIds
  let receivers = event.params.receivers

  let transactionHash = event.transaction.hash.toHex()
  let timestamp = event.block.timestamp
  let purchaser = event.params.purchaser.toHex()
  let segmentsCount = event.params.tokenIds.length
  let amountPerEachNft = event.params.ethSent.div(BigInt.fromI32(segmentsCount))

  for (let i = 0; i < segmentsCount; i++) {
    let receiver = receivers[i].toHex()
    let tokenId = tokenIds[i].toString()

    // -----------------
    // Purchase
    // -----------------

    let purchase = returnNewPurchaseEntity(
      tokenId,
      transactionHash,
      purchaser,
      receiver,
      amountPerEachNft,
      timestamp
    )

    purchase.save()

    // -----------------
    // Segment
    // -----------------

    let segment = returnNewSegmentEntity(
      tokenId,
      receiver
    )

    let segmentPurchaseHistory = segment.purchaseHistory
    segmentPurchaseHistory.push(purchase.id)
    segment.purchaseHistory = segmentPurchaseHistory
    segment.isBigSegment = true // As this event happens for big segments only
    segment.save()

    // -----------------
    // User
    // -----------------

    let user = User.load(receiver)
    if (user == null) {
      user = returnNewUserEntity(receiver)
    }

    let userPurchaseHistory = user.purchaseHistory,
        userCurrentSegments = user.currentSegments

    userPurchaseHistory.push(purchase.id)
    userCurrentSegments.push(segment.id)
    user.purchaseHistory = userPurchaseHistory
    user.currentSegments = userCurrentSegments

    user.save()
  }
}
