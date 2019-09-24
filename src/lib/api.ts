import { Network } from '../modules/network/types'
import { Tiles } from '../modules/tile/types'

export const TILES_URL = {
  [Network.MAINNET]: 'https://api.decentraland.org/v1/tiles',
  [Network.ROPSTEN]: 'https://api.decentraland.zone/v1/tiles'
}

export class API {
  static async fetchTiles(network: Network) {
    const resp = await fetch(TILES_URL[network])
    const json = await resp.json()
    return json.data as Tiles
  }
}
