import { describe, expect, it } from "vitest";
import { convertLocationVersion } from "../src/util.ts"
import { VersionedLocation } from "../src/xcmtypes.ts";

const locationV4: VersionedLocation = {V4: { parents: 1, interior: { X1: [{ AccountId32: { network: 'BitcoinCore', id: "TEST" } }]}}};
const locationWithBitcoinV4: VersionedLocation = {V4: { parents: 1, interior: { X1: [{ GlobalConsensus: 'BitcoinCore' }]}}};
const locationWithMultipleJunctionsV4: VersionedLocation = {V4: { parents: 2, interior: {
        X3: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 200 }, { AccountId32: {network: 'BitcoinCore', id: 'TEST'}}]
      }}};


const locationV3: VersionedLocation = { V3: { parents: 1, interior: { X1: { GlobalConsensus: 'Kusama' } } }};
const locationWithBitcoinV3: VersionedLocation = { V3: { parents: 1, interior: { X1: { GlobalConsensus: 'BitcoinCore' } } }};
const locationWithMultipleJunctionsV3: VersionedLocation = {V3: { parents: 2, interior: { X3: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 200 }, { AccountId32: {network: 'BitcoinCore', id: "TEST"}}] } }}


describe('create versions from v4', () => {
    it('create v4 from v4 location', () => {
        expect(convertLocationVersion(4, locationV4.V4)).toStrictEqual(locationV4);
        expect(convertLocationVersion(4, locationWithBitcoinV4.V4)).toStrictEqual(locationWithBitcoinV4);
        expect(convertLocationVersion(4, locationWithMultipleJunctionsV4.V4)).toStrictEqual(locationWithMultipleJunctionsV4);
    }) 

    it('create v3 from v4 location', () => {
        expect(convertLocationVersion(3, locationV4.V4)).toStrictEqual(locationV3);
        expect(convertLocationVersion(3, locationWithBitcoinV4.V4)).toStrictEqual(locationWithBitcoinV3);
        expect(convertLocationVersion(3, locationWithMultipleJunctionsV4.V4)).toStrictEqual(locationWithMultipleJunctionsV3);
    })
})



describe('asset location convert v4->v3', () => {
    it('location v4->v3', () => {
        expect(convertLocationVersion(3, locationV4)).toStrictEqual(locationV3);
    })

    it('location v4->v3 bitcoin', () => {
        expect(convertLocationVersion(3, locationWithBitcoinV4)).toStrictEqual(locationWithBitcoinV3)
    })

    it('location v4->v3 with miltiple junction', () => {
        expect(convertLocationVersion(3, locationWithMultipleJunctionsV4)).toStrictEqual(locationWithMultipleJunctionsV3)
    })
})

describe("asset location convert v3->v4", () => {

    it('location v3->v4', () => {
        expect(convertLocationVersion(4, locationV3)).toStrictEqual(locationV4);
    })

    it('location v3->v4 bitcoin', () => {
        expect(convertLocationVersion(4, locationWithBitcoinV3)).toStrictEqual(locationWithBitcoinV4)
    })

    it('location v4->v3 with miltiple junction', () => {
        expect(convertLocationVersion(4, locationWithMultipleJunctionsV3)).toStrictEqual(locationWithMultipleJunctionsV4)
    })
})

describe("asset location convert v3->v2", () => {
    const locationV3: VersionedLocation = { V3: { parents: 1, interior: { X1: {Parachain: 200} } }};
    const locationWithBitcoinV3: VersionedLocation = { V3: { parents: 1, interior: { X1: {AccountId32: {network: 'BitcoinCore', id: "TEST"}} } }};
    const locationWithMultipleJunctionsV3: VersionedLocation = {V3: { parents: 2, interior: { X2: [ { Parachain: 200 }, { AccountId32: {network: 'Polkadot', id: "TEST"}}] } }}
    
    const locationV2: VersionedLocation = {V2: {parents: 1, interior: { X1: {Parachain: 200}}}};
    const locationWithMultipleJunctionsV2: VersionedLocation = {V2: { parents: 2, interior: { X2: [ { Parachain: 200 }, { AccountId32: {network: 'Polkadot', id: "TEST"}}] } }}
    
    it('location v3->v2', () => {
        expect(convertLocationVersion(2, locationV3)).toStrictEqual(locationV2);
    })

    it('location v3->v2 bitcoin', () => {
        expect(() => convertLocationVersion(2, locationWithBitcoinV3)).toThrowError();
    })

    it('location v3->v2 with miltiple junction', () => {
        expect(convertLocationVersion(2, locationWithMultipleJunctionsV3)).toStrictEqual(locationWithMultipleJunctionsV2)
    })
})