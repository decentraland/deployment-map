import { useState, useEffect } from 'react'

import { Network } from '../network/types'
import { Tiles } from './types'
import { API } from '../../lib/api'

export function useTiles(network: Network = Network.MAINNET) {
  const [tiles, setTiles] = useState<Record<string, Tiles>>({})
  const [isLoading, setLoading] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (network in tiles) return
    setLoading(true)
    API.fetchTiles(network).then(newTiles => {
      setTiles({
        ...tiles,
        [network]: newTiles
      })
      setLoading(false)
    })
  }, [network, isLoading, tiles])

  return isLoading ? null : tiles[network]
}
