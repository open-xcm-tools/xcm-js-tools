import { describe, expect, it } from "vitest";
import { convertLocationVersion } from "../src/util.ts"
import { VersionedLocation } from "../src/xcmtypes.ts";

describe('asset location convert v4->v3', () => {
    it('location v4->v3', () => {
        const locationV4: VersionedLocation = {
            V4: {
              parents: 1,
              interior: {
                X1: [{ GlobalConsensus: 'Kusama' }]
              }
            }
          };

        expect(convertLocationVersion(3, locationV4)).toStrictEqual({ V3: { parents: 1, interior: { X1: { GlobalConsensus: 'Kusama' } } }});
    })

    it('location v4->v3 bitcoin', () => {
        const locationWithBitcoin: VersionedLocation = {
            V4: {
              parents: 1,
              interior: {
                X1: [{ GlobalConsensus: 'BitcoinCore' }]
              }
            }
          };

        expect(convertLocationVersion(3, locationWithBitcoin)).toStrictEqual({ V3: { parents: 1, interior: { X1: { GlobalConsensus: 'BitcoinCore' } } }})
    })

    it('location v4->v3 with miltiple junction', () => {
        const locationWithMultipleJunctions: VersionedLocation = {
            V4: {
              parents: 2,
              interior: {
                X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 200 }]
              }
            }
          };

        expect(convertLocationVersion(3, locationWithMultipleJunctions)).toStrictEqual({V3: { parents: 2, interior: { X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 200 }] } }})
    })
})