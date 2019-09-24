import React, { useState, useCallback } from 'react'
import {
  Navbar,
  Page,
  Atlas,
  Footer,
  Tabs,
  Loader,
  Layer
} from 'decentraland-ui'
import mainnetDeployments from './data/deployments.mainnet.json'
import ropstenDeployments from './data/deployments.ropsten.json'
import { Network } from './modules/network/types'
import { useTiles } from './modules/tile/hooks'
import './App.css'

const deployments = {
  [Network.MAINNET]: mainnetDeployments,
  [Network.ROPSTEN]: ropstenDeployments
}

const App: React.FC = () => {
  const [network, setNetwork] = useState(Network.MAINNET)
  const tiles = useTiles(network)

  const deploymentsLayer: Layer = useCallback(
    (x, y) => {
      const id = x + ',' + y
      return id in deployments[network] ? { color: '#00d3ff' } : null
    },
    [network]
  )

  const mainnetCount = Object.keys(
    deployments[Network.MAINNET]
  ).length.toLocaleString()
  const ropstenCount = Object.keys(
    deployments[Network.ROPSTEN]
  ).length.toLocaleString()

  return (
    <>
      <Navbar activePage="atlas" isFullscreen />
      <Tabs
        isFullscreen
        onClick={() =>
          setNetwork(
            network !== Network.MAINNET ? Network.MAINNET : Network.ROPSTEN
          )
        }
      >
        <Tabs.Tab active={network === Network.MAINNET}>
          Mainnet ({mainnetCount} LAND)
        </Tabs.Tab>
        <Tabs.Tab active={network === Network.ROPSTEN}>
          Ropsten ({ropstenCount} LAND)
        </Tabs.Tab>
      </Tabs>
      <Page isFullscreen>
        {tiles ? (
          <Atlas tiles={tiles} layers={[deploymentsLayer]} />
        ) : (
          <Loader active />
        )}
      </Page>
      <Footer isFullscreen />
    </>
  )
}

export default App
