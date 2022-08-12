import { ExternalSCERC721Ledger__factory } from '@big-whale-labs/seal-cred-ledger-contract'
import { SC_EXTERNAL_ERC721_LEDGER_CONTRACT_ADDRESS } from '@big-whale-labs/constants'
import { Web3Provider } from '@ethersproject/providers'
import ERC721Proof from 'helpers/ERC721Proof'
import makeTransaction from 'helpers/makeTransaction'

function createContract(provider: Web3Provider) {
  return ExternalSCERC721Ledger__factory.connect(
    SC_EXTERNAL_ERC721_LEDGER_CONTRACT_ADDRESS,
    provider.getSigner(0)
  )
}

export default async function (
  provider: Web3Provider,
  proof: ERC721Proof,
  message: string,
  signature: string
) {
  if (!proof.result) throw new Error('Invalid proof')
  const contract = createContract(provider)
  const txData = makeTransaction(proof.result)

  const tx = await contract[
    'mint((uint256[2],uint256[2][2],uint256[2],uint256[46]),bytes,bytes)'
  ](txData, message, signature)

  return tx.wait()
}
