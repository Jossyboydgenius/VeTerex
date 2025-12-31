import { createConfig, http } from 'wagmi'
import { defineChain } from 'viem'

export const verychain = defineChain({
  id: 4613,
  name: 'Verychain',
  nativeCurrency: { name: 'VERY', symbol: 'VERY', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.verylabs.io'] },
    public: { http: ['https://rpc.verylabs.io'] },
  },
  blockExplorers: {
    default: { name: 'Veryscan', url: 'https://veryscan.io' },
  },
})

export const wagmiConfig = createConfig({
  chains: [verychain],
  transports: {
    [verychain.id]: http('https://rpc.verylabs.io'),
  },
})

