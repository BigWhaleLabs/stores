import { utils } from 'ethers'
import type { Filter, Log } from '@ethersproject/providers'

const transferEventInterface = new utils.Interface([
  'event Transfer(address indexed from, address indexed to, uint indexed tokenId)',
])

const sig = 'Transfer(address,address,uint256)'
const sigHash = utils.keccak256(utils.toUtf8Bytes(sig))

export function isTransferEvent(topics: string[]) {
  return topics[0] === sigHash && topics.length > 3
}

export function parseLogData({
  data,
  topics,
}: {
  data: string
  topics: string[]
}) {
  return transferEventInterface.parseLog({ data, topics })
}

export default async function (
  account: string,
  fromBlock = 0,
  toBlock: number,
  addressToTokenIds: { [address: string]: string[] },
  getLogs: (filter: Filter) => Promise<Log[]>,
  skipTransactions?: Set<string>
) {
  const receivedLogs = await getLogs({
    fromBlock,
    toBlock,
    topics: [utils.id(sig), null, utils.hexZeroPad(account, 32)],
  })

  const sentLogs = await getLogs({
    fromBlock,
    toBlock,
    topics: [utils.id(sig), utils.hexZeroPad(account, 32)],
  })

  for (const { topics, data, address, transactionHash } of receivedLogs.concat(
    sentLogs
  )) {
    if (!isTransferEvent(topics)) continue

    const {
      args: { tokenId },
    } = parseLogData({ data, topics })

    if (skipTransactions && skipTransactions.has(transactionHash)) {
      skipTransactions.delete(transactionHash)
      continue
    }

    const value = tokenId.toString()

    if (!addressToTokenIds[address]) {
      addressToTokenIds[address] = [value]
      continue
    }

    if (addressToTokenIds[address].includes(value)) {
      addressToTokenIds[address] = addressToTokenIds[address].filter(
        (tokenId) => tokenId !== value
      )
      if (!addressToTokenIds[address].length) delete addressToTokenIds[address]
    } else {
      addressToTokenIds[address].push(value)
    }
  }

  return addressToTokenIds
}
