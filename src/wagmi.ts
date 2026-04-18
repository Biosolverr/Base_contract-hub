import { http, createConfig } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'ContractHub' }),
    // Only add walletConnect if project ID is available, but for now we'll stick to injected and coinbase
  ],
  transports: {
    [base.id]: http(),
  },
})

export const CONTRACT_ADDRESSES = {
  FACTORY: '0xD7802f37737556531371c2Ba43bc50e2E3853c51',
  MARKETPLACE: '0x4EfC1Ea958aF47E80B8aF9fD1a18f4d17b6D30F5',
  LICENSE_NFT: '0xbEdebd1FA7838e94A1D6Da277814bbcF3412aeE0',
}
