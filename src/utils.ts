import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'

export let ZERO_INT = BigInt.fromI32(0)
export let ZERO_DEC = BigDecimal.fromString('0')
export let EMPTY_STRING_ARRAY = new Array<string>()
export let ONE_INT = BigInt.fromI32(1)
export let ONE_DEC = BigDecimal.fromString('1')
export let PRECISION = new BigDecimal(tenPow(18))
export let ETH_ADDR = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"
export let ZERO_ADDR = '0x0000000000000000000000000000000000000000'
export let NFT_ADDRESS = '0x58add7e59b348e3607837fad6f2a7fc8ca144685'
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

export function getPieceReward(nextSegmentPlace: BigInt): BigDecimal {
  // (150*0.999216459** 6751 + 50).toFixed()
  let numericSegmentPlace = nextSegmentPlace.toString()
  let amount = BigDecimal.fromString('150').times(powDecimal(BigDecimal.fromString('0.999216459'), parseInt(numericSegmentPlace))).plus(BigDecimal.fromString('50'))
  return amount
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