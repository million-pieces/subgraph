import { ethereum, BigInt, Address} from '@graphprotocol/graph-ts'

import { User, Token, Transfer, Transaction, Artwork } from '../generated/schema'
import { Transfer as TransferEvent, NewWorldCreated } from '../generated/IERC721/IERC721'
import { IERC721 } from '../generated/IERC721/IERC721'
import * as Utils from './utils'

export function handleTransfer(event: TransferEvent): void {
  let token = getToken(event.params.tokenId)
  let from = new User(event.params.from.toHex())
  let to = new User(event.params.to.toHex())

  token.owner = to.id

  token.save()
  from.save()
  to.save()

  let transaction = getTransaction(event);
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

//  ----------------------
//  HELPERS
//  ----------------------

function getTransaction(event: ethereum.Event): Transaction {
  let tx = new Transaction(event.transaction.hash.toHex());
  tx.timestamp = event.block.timestamp;
  tx.blockNumber = event.block.number;
  tx.value = event.transaction.value;
  tx.gasUsed = event.transaction.gasUsed;
  tx.gasPrice = event.transaction.gasPrice;
  tx.save();

  return tx;
}

function getToken(tokenId: BigInt): Token {
  let token = Token.load(tokenId.toString())

  if (!token) {
    token = new Token(tokenId.toString())
    token.identifier = tokenId
    token.isBigSegment = false

    let erc721 = IERC721.bind(Address.fromString(Utils.NFT_ADDRESS))
    let try_tokenURI = erc721.try_tokenURI(tokenId)
    token.uri = try_tokenURI.reverted ? '' : try_tokenURI.value
  }

  return token as Token;
}
