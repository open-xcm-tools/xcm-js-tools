import { describe, expect, it } from 'vitest';
import {
  asset,
  convertAssetVersion,
  convertLocationVersion,
  fungible,
  location
} from '../src/util.ts';
import { VersionedAsset, VersionedLocation } from '../src/xcmtypes.ts';

describe('xcm location tests', () => {
  const locationV4: VersionedLocation = {
    V4: { parents: 1, interior: { X1: [{ Parachain: 2001 }] } }
  };

  const locationWithBitcoinV4: VersionedLocation = {
    V4: {
      parents: 1,
      interior: {
        X1: [{ AccountId32: { network: 'BitcoinCore', id: 'TEST' } }]
      }
    }
  };

  const locationWithMultipleJunctionsV4: VersionedLocation = {
    V4: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          { AccountId32: { network: 'Polkadot', id: 'TEST' } }
        ]
      }
    }
  };

  const locationV3: VersionedLocation = {
    V3: { parents: 1, interior: { X1: { Parachain: 2001 } } }
  };
  
  const locationWithBitcoinV3: VersionedLocation = {
    V3: {
      parents: 1,
      interior: { X1: { AccountId32: { network: 'BitcoinCore', id: 'TEST' } } }
    }
  };
  
  const locationWithMultipleJunctionsV3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          { AccountId32: { network: 'Polkadot', id: 'TEST' } }
        ]
      }
    }
  };

  describe('create versions from v4', () => {
    it('create v4 from v4 location', () => {
      expect(convertLocationVersion(4, locationV4.V4)).toStrictEqual({
        V4: location(1, [{ Parachain: 2001 }])
      });
      expect(convertLocationVersion(4, locationWithBitcoinV4.V4)).toStrictEqual(
        locationWithBitcoinV4
      );
      expect(
        convertLocationVersion(4, locationWithMultipleJunctionsV4.V4)
      ).toStrictEqual(locationWithMultipleJunctionsV4);
    });

    it('create v3 from v4 location', () => {
      expect(convertLocationVersion(3, locationV4.V4)).toStrictEqual(
        locationV3
      );
      expect(convertLocationVersion(3, locationWithBitcoinV4.V4)).toStrictEqual(
        locationWithBitcoinV3
      );
      expect(
        convertLocationVersion(3, locationWithMultipleJunctionsV4.V4)
      ).toStrictEqual(locationWithMultipleJunctionsV3);
    });
  });

  describe('asset location convert v4->v3', () => {
    it('location v4->v3', () => {
      expect(convertLocationVersion(3, locationV4)).toStrictEqual(locationV3);
    });

    it('location v4->v3 bitcoin', () => {
      expect(convertLocationVersion(3, locationWithBitcoinV4)).toStrictEqual(
        locationWithBitcoinV3
      );
    });

    it('location v4->v3 with miltiple junction', () => {
      expect(
        convertLocationVersion(3, locationWithMultipleJunctionsV4)
      ).toStrictEqual(locationWithMultipleJunctionsV3);
    });
  });

  describe('asset location convert v3->v4', () => {
    it('location v3->v4', () => {
      expect(convertLocationVersion(4, locationV3)).toStrictEqual(locationV4);
    });

    it('location v3->v4 bitcoin', () => {
      expect(convertLocationVersion(4, locationWithBitcoinV3)).toStrictEqual(
        locationWithBitcoinV4
      );
    });

    it('location v4->v3 with miltiple junction', () => {
      expect(
        convertLocationVersion(4, locationWithMultipleJunctionsV3)
      ).toStrictEqual(locationWithMultipleJunctionsV4);
    });
  });

  const locationV2: VersionedLocation = {
    V2: { parents: 1, interior: { X1: { Parachain: 2001 } } }
  };
  
  const locationWithMultipleJunctionsV2: VersionedLocation = {
    V2: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          { AccountId32: { network: 'Polkadot', id: 'TEST' } }
        ]
      }
    }
  };

  describe('asset location convert v3->v2', () => {
    it('location v3->v2', () => {
      expect(convertLocationVersion(2, locationV3)).toStrictEqual(locationV2);
    });

    it('location v3->v2 bitcoin', () => {
      expect(() =>
        convertLocationVersion(2, locationWithBitcoinV3)
      ).toThrowError();
    });

    it('location v3->v2 with miltiple junction', () => {
      expect(
        convertLocationVersion(2, locationWithMultipleJunctionsV3)
      ).toStrictEqual(locationWithMultipleJunctionsV2);
    });
  });

  describe('asset location convert v2->v3', () => {
    const locationWithMultipleJunctionsV3: VersionedLocation = {
      V3: {
        parents: 2,
        interior: {
          X2: [
            { Parachain: 2001 },
            { AccountId32: { network: 'Polkadot', id: 'TEST' } }
          ]
        }
      }
    };

    it('location v2->v3', () => {
      expect(convertLocationVersion(3, locationV2)).toStrictEqual(locationV3);
    });

    it('location v3->v2 with miltiple junction', () => {
      expect(
        convertLocationVersion(3, locationWithMultipleJunctionsV2)
      ).toStrictEqual(locationWithMultipleJunctionsV3);
    });
  });
});

describe('asset xcm tests', () => {
  const assetV4: VersionedAsset = {
    V4: { id: { parents: 0, interior: 'Here' }, fun: { Fungible: 1000 } }
  };
  
  const assetJunctionV4: VersionedAsset = {
    V4: {
      id: { parents: 1, interior: { X1: [{ Parachain: 2001 }] } },
      fun: { Fungible: 1000 }
    }
  };
  
  const assetWithMultipleJunctionsV4: VersionedAsset = {
    V4: {
      id: {
        parents: 3,
        interior: { X2: [{ Parachain: 2001 }, { AccountId32: { id: 'TEST' } }] }
      },
      fun: { Fungible: 1000 }
    }
  };

  const assetV3: VersionedAsset = {
    V3: {
      id: { Concrete: { parents: 0, interior: 'Here' } },
      fun: { Fungible: 1000 }
    }
  };
  
  const assetJunctionV3: VersionedAsset = {
    V3: {
      id: { Concrete: { parents: 1, interior: { X1: { Parachain: 2001 } } } },
      fun: { Fungible: 1000 }
    }
  };
  
  const assetWithMultipleJunctionsV3: VersionedAsset = {
    V3: {
      id: {
        Concrete: {
          parents: 3,
          interior: {
            X2: [{ Parachain: 2001 }, { AccountId32: { id: 'TEST' } }]
          }
        }
      },
      fun: { Fungible: 1000 }
    }
  };

  const assetV2: VersionedAsset = {
    V2: {
      id: { Concrete: { parents: 0, interior: 'Here' } },
      fun: { Fungible: 1000 }
    }
  };
  
  const assetJunctionV2: VersionedAsset = {
    V2: {
      id: { Concrete: { parents: 1, interior: { X1: { Parachain: 2001 } } } },
      fun: { Fungible: 1000 }
    }
  };
  
  const assetWithMultipleJunctionsV2: VersionedAsset = {
    V2: {
      id: {
        Concrete: {
          parents: 3,
          interior: {
            X2: [{ Parachain: 2001 }, { AccountId32: { id: 'TEST' } }]
          }
        }
      },
      fun: { Fungible: 1000 }
    }
  };

  describe('create versions from assets', () => {
    it('create v4 from v4 asset', () => {
      expect(convertAssetVersion(4, assetV4.V4)).toStrictEqual({
        V4: asset(location(0, 'Here'), fungible(1000))
      });
      expect(convertAssetVersion(4, assetJunctionV4.V4)).toStrictEqual({
        V4: asset(location(1, [{ Parachain: 2001 }]), fungible(1000))
      });
      expect(
        convertAssetVersion(4, assetWithMultipleJunctionsV4.V4)
      ).toStrictEqual({
        V4: asset(
          location(3, [{ Parachain: 2001 }, { AccountId32: { id: 'TEST' } }]),
          fungible(1000)
        )
      });
    });

    it('create v4 from v4 asset', () => {
      expect(convertAssetVersion(3, assetV4.V4)).toStrictEqual(assetV3);
      expect(convertAssetVersion(3, assetJunctionV4.V4)).toStrictEqual(
        assetJunctionV3
      );
      expect(
        convertAssetVersion(3, assetWithMultipleJunctionsV4.V4)
      ).toStrictEqual(assetWithMultipleJunctionsV3);
    });
  });

  describe('asset convert v4->v3', () => {
    it('asset v4->v3', () => {
      expect(convertAssetVersion(3, assetV4)).toStrictEqual(assetV3);
    });

    it('asset v4->v3 interior', () => {
      expect(convertAssetVersion(3, assetJunctionV4)).toStrictEqual(
        assetJunctionV3
      );
    });

    it('asset v4->v3 multiple interior', () => {
      expect(
        convertAssetVersion(3, assetWithMultipleJunctionsV4)
      ).toStrictEqual(assetWithMultipleJunctionsV3);
    });
  });

  describe('asset convert v3->v4', () => {
    it('asset v3->v4', () => {
      expect(convertAssetVersion(4, assetV3)).toStrictEqual(assetV4);
    });

    it('asset v3->v4 interior', () => {
      expect(convertAssetVersion(4, assetJunctionV3)).toStrictEqual(
        assetJunctionV4
      );
    });

    it('asset v3->v4 multiple interior', () => {
      expect(
        convertAssetVersion(4, assetWithMultipleJunctionsV3)
      ).toStrictEqual(assetWithMultipleJunctionsV4);
    });
  });

  describe('asset convert v3->v2', () => {
    it('asset v3->v4', () => {
      expect(convertAssetVersion(2, assetV3)).toStrictEqual(assetV2);
    });

    it('asset v3->v4 interior', () => {
      expect(convertAssetVersion(2, assetJunctionV3)).toStrictEqual(
        assetJunctionV2
      );
    });

    it('asset v3->v4 multiple interior', () => {
      // "network": "Any"
      expect(
        convertAssetVersion(2, assetWithMultipleJunctionsV3)
      ).not.toStrictEqual(assetWithMultipleJunctionsV2);
    });
  });
});
