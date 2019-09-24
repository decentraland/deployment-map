import fetch from 'isomorphic-fetch'
import { Coord } from 'decentraland-ui'

const deploymentsMainnet = require('../src/data/deployments.mainnet')
const deploymentsRopsten = require('../src/data/deployments.mainnet')

let differencesMainnet
let differencesRopsten

try {
  differencesMainnet = require('../src/data/differences.mainnet')
} catch (e) {
  differencesMainnet = {}
}

try {
  differencesRopsten = require('../src/data/differences.ropsten')
} catch (e) {
  differencesRopsten = {}
}

type ScenesResponse = {
  data: {
    parcel_id: string
    root_cid: string
    scene_cid: string
  }[]
}

const isRopsten = !!process.env.ROPSTEN

async function batch(
  nw: Coord,
  se: Coord,
  deployments: Map<string, string>,
  differences: Map<string, string>,
  failures: { nw: Coord; se: Coord }[]
) {
  const url = isRopsten
    ? 'https://content.decentraland.zone'
    : 'https://content.decentraland.org'
  const req = `${url}/scenes?x1=${nw.x}&x2=${se.x}&y1=${nw.y}&y2=${se.y}`
  try {
    const res = await fetch(req)
    const { data } = (await res.json()) as ScenesResponse
    for (const mapping of data) {
      const { parcel_id, root_cid, scene_cid } = mapping
      const previous = isRopsten ? deploymentsRopsten : deploymentsMainnet
      if (previous[parcel_id] !== root_cid) {
        differences.set(parcel_id, scene_cid)
      }
      deployments.set(parcel_id, root_cid)
    }
  } catch (e) {
    failures.push({ nw, se })
    console.log(`Error [nw=${nw.x},${nw.y} se=${se.x},${se.y}] ${e.message}`)
  }
}

async function main() {
  const deployments = new Map<string, string>()
  const differences = new Map<string, string>(
    Object.entries(isRopsten ? differencesRopsten : differencesMainnet)
  )

  console.log(`NETWORK: ${isRopsten ? 'ROPSTEN' : 'MAINNET'}`)
  console.log('fetching map data...')
  const size = 13
  let progress = 0
  let total = 90601
  let failures: { nw: Coord; se: Coord }[] = []
  for (let x = -150; x < 150; x += size) {
    for (let y = 150; y > -150; y -= size) {
      let nw = { x, y }
      let se = { x: Math.min(nw.x + size, 150), y: Math.max(nw.y - size, -150) }
      console.log(
        `${((progress / total) * 100).toFixed(2)}% - ${
          deployments.size
        } LAND (${failures.length} failures) (${differences.size} differences)`
      )
      await batch(nw, se, deployments, differences, failures)
      progress += (se.x - nw.x) * (nw.y - se.y)
    }
  }
  while (failures.length > 0) {
    const { nw, se } = failures.pop()
    console.log(
      `Retrying [nw=${nw.x},${nw.y} se=${se.x},${se.y}] (${failures.length} failures) (${differences.size} differences)`
    )
    await batch(nw, se, deployments, differences, failures)
  }

  console.log('writing map data...')
  const deploymentsFilename = isRopsten
    ? 'deployments.ropsten.json'
    : 'deployments.mainnet.json'
  const deploymentsData = Array.from(deployments.entries()).reduce(
    (obj, [id, cid]) => {
      obj[id] = cid
      return obj
    },
    {}
  )
  require('fs').writeFileSync(
    `src/data/${deploymentsFilename}`,
    JSON.stringify(deploymentsData, null, 2),
    'utf8'
  )

  console.log('done ✅')

  console.log('writing differences...')
  const differencesFilename = isRopsten
    ? 'differences.ropsten.json'
    : 'differences.mainnet.json'
  const differencesData = Array.from(differences.entries()).reduce(
    (obj, [id, cid]) => {
      obj[id] = cid
      return obj
    },
    {}
  )
  console.log(`${Object.keys(differencesData).length} differences`)
  require('fs').writeFileSync(
    `src/data/${differencesFilename}`,
    JSON.stringify(differencesData, null, 2),
    'utf8'
  )

  console.log('done ✅')
}

main().catch(console.error)
