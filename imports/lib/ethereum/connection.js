/* globals web3 */
/* eslint no-global-assign: 0 */
import Web3 from 'web3'
import { getUserPTIAddress } from '../../api/users.js'
import { getContract, getContractAddress, setRegistryAddress, getContracts } from './contracts.js'
// TODO: store all this information in a settings.json object
const DEFAULT_PROVIDER = Meteor.settings.public.http_provider

const GAS_PRICE = 50000000000
const GAS_LIMIT = 4e6

// must not define this varable because ethereum-tools will trip
web3 = new Web3()

export async function PTIContract () {
  // return a web3.eth.contract instance for the PTI Contract
  return getContract('ParatiiToken')
}

export async function updateSession () {
  /* update Session variables with latest information from the blockchain */
  console.log('updating Sesssion')
  Session.set('eth_host', web3.currentProvider.host)

  /* if Web3 is running over testrpc test contract is deployed
  and PARATII_TOKEN_ADDRESS ovverride */
  if (web3.currentProvider.host.indexOf('localhost') !== -1) {
    Session.set('isTestRPC', true)
  } else {
    Session.set('isTestRPC', false)
  }

  if (web3.isConnected()) {
    Session.set('eth_isConnected', true)
    Session.set('eth_currentBlock', web3.eth.blockNumber)
    const ptiAddress = getUserPTIAddress()
    getContractAddress('ParatiiToken').then(function (result) {
      Session.set('ParatiiToken', result)
    })
    if (ptiAddress) {
      // SET PTI BALANCE
      const contract = await PTIContract()
      if (contract) {
        const ptiBalance = await contract.balanceOf(ptiAddress)
        Session.set('pti_balance', ptiBalance.toNumber())
      }

      // SET ETH BALANCE
      web3.eth.getBalance(ptiAddress, function (err, result) {
        if (err) { throw err }
        if (result !== undefined) {
          Session.set('eth_balance', result.toNumber())
        }
      })

      // set the contracts in the Session object
      getContracts().then(function (contracts) {
        Session.set('contracts', contracts)
      })
    }
  } else {
    Session.set('eth_isConnected', false)
    Session.set('eth_currentBlock', null)
    Session.set('eth_highestBlock', null)
    Session.set('eth_balance', null)
    Session.set('pti_balance', null)
  }
}

web3.setProvider(new web3.providers.HttpProvider(DEFAULT_PROVIDER))

export const initConnection = function () {
  console.log('initializing connection..')
  web3.setProvider(new web3.providers.HttpProvider(DEFAULT_PROVIDER))

  setRegistryAddress(Meteor.settings.public.ParatiiRegistry)

  const filter = web3.eth.filter('latest')
  filter.watch(function (error, result) {
    if (!error) {
      updateSession()
    }
  })
  if (Meteor.isServer) {
    console.log('initConnection')
  }
}

export { web3, GAS_PRICE, GAS_LIMIT }
