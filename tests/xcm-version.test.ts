import { describe, expect, it } from 'vitest';
import { convertAssetVersion, convertLocationVersion } from '../src/util.ts';
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
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationWithNetworkIdV4: VersionedLocation = {
    V4: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: 'Polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  const locationWithEthereumNetworkV4: VersionedLocation = {
    V4: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: { Ethereum: { chainId: 2002 } },
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
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
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationWithNetworkIdV3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: 'Polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  const locationWithEthereumNetworkV3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: { Ethereum: { chainId: 2002 } },
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  describe('identity test for locations', () => {
    it('v4 identity test with versioned location', () => {
      expect(convertLocationVersion(4, locationV4)).toStrictEqual(locationV4);
      expect(convertLocationVersion(4, locationWithBitcoinV4)).toStrictEqual(
        locationWithBitcoinV4
      );
      expect(
        convertLocationVersion(4, locationWithMultipleJunctionsV4)
      ).toStrictEqual(locationWithMultipleJunctionsV4);
      expect(convertLocationVersion(4, locationWithNetworkIdV4)).toStrictEqual(
        locationWithNetworkIdV4
      );
      expect(
        convertLocationVersion(4, locationWithEthereumNetworkV4)
      ).toStrictEqual(locationWithEthereumNetworkV4);
    });

    it('v4 identity test with location', () => {
      expect(convertLocationVersion(4, locationV4.V4)).toStrictEqual(
        locationV4
      );
      expect(convertLocationVersion(4, locationWithBitcoinV4.V4)).toStrictEqual(
        locationWithBitcoinV4
      );
      expect(
        convertLocationVersion(4, locationWithMultipleJunctionsV4.V4)
      ).toStrictEqual(locationWithMultipleJunctionsV4);
      expect(
        convertLocationVersion(4, locationWithNetworkIdV4.V4)
      ).toStrictEqual(locationWithNetworkIdV4);
      expect(
        convertLocationVersion(4, locationWithEthereumNetworkV4.V4)
      ).toStrictEqual(locationWithEthereumNetworkV4);
    });

    it('v3 identity test with location', () => {
      expect(convertLocationVersion(3, locationV4.V4)).toStrictEqual(
        locationV3
      );
      expect(convertLocationVersion(3, locationWithBitcoinV4.V4)).toStrictEqual(
        locationWithBitcoinV3
      );
      expect(
        convertLocationVersion(3, locationWithMultipleJunctionsV4.V4)
      ).toStrictEqual(locationWithMultipleJunctionsV3);
      expect(
        convertLocationVersion(3, locationWithNetworkIdV4.V4)
      ).toStrictEqual(locationWithNetworkIdV3);
      expect(
        convertLocationVersion(3, locationWithEthereumNetworkV4.V4)
      ).toStrictEqual(locationWithEthereumNetworkV3);
    });
  });

  describe('location convert v4->v3', () => {
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

    it('location v4->v3 with NetworkId', () => {
      expect(convertLocationVersion(3, locationWithNetworkIdV4)).toStrictEqual(
        locationWithNetworkIdV3
      );
    });

    it('location v4->v3 with ethereum', () => {
      expect(
        convertLocationVersion(3, locationWithEthereumNetworkV4)
      ).toStrictEqual(locationWithEthereumNetworkV3);
    });
  });

  describe('location convert v3->v4', () => {
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

    it('location v3->v4 with NetworkId', () => {
      expect(convertLocationVersion(4, locationWithNetworkIdV3)).toStrictEqual(
        locationWithNetworkIdV4
      );
    });

    it('location v3->v4 with ethereum', () => {
      expect(
        convertLocationVersion(4, locationWithEthereumNetworkV3)
      ).toStrictEqual(locationWithEthereumNetworkV4);
    });
  });

  const locationV2: VersionedLocation = {
    V2: { parents: 1, interior: { X1: { Parachain: 2001 } } }
  };

  const locationWithMultipleJunctionsV2: VersionedLocation = {
    V2: {
      parents: 2,
      interior: {
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationWithNetworkIdV2: VersionedLocation = {
    V2: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: 'Polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
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
      ).toThrowError(`V2 network ID doesn't include`);
    });

    it('location v3->v2 with miltiple junction', () => {
      expect(
        convertLocationVersion(2, locationWithMultipleJunctionsV3)
      ).toStrictEqual(locationWithMultipleJunctionsV2);
    });

    it('location v3->v2 with NetworkId', () => {
      expect(convertLocationVersion(2, locationWithNetworkIdV3)).toStrictEqual(
        locationWithNetworkIdV2
      );
    });

    it('location v3->v2 with ethereum', () => {
      expect(() =>
        convertLocationVersion(2, locationWithEthereumNetworkV3)
      ).toThrowError(`V2 network ID doesn't include`);
    });
  });

  describe('asset location convert v2->v3', () => {
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

  const assetWithNonFungibleV4: VersionedAsset = {
    V4: {
      id: { parents: 0, interior: 'Here' },
      fun: { NonFungible: 'Undefined' }
    }
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
        interior: {
          X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
        }
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

  const assetWithNonFungibleV3: VersionedAsset = {
    V3: {
      id: {
        Concrete: { parents: 0, interior: 'Here' }
      },
      fun: { NonFungible: 'Undefined' }
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
            X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
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
            X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
          }
        }
      },
      fun: { Fungible: 1000 }
    }
  };

  const assetWithNonFungibleV2: VersionedAsset = {
    V2: {
      id: {
        Concrete: { parents: 0, interior: 'Here' }
      },
      fun: { NonFungible: 'Undefined' }
    }
  };

  const assetWithNonFungibleBlobV2: VersionedAsset = {
    V2: {
      id: {
        Concrete: {
          parents: 3,
          interior: {
            X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
          }
        }
      },
      fun: { NonFungible: { Blob: 'blob' } }
    }
  };

  describe('identity test for assets', () => {
    it('v4 identity test with versioned asset', () => {
      expect(convertAssetVersion(4, assetV4)).toStrictEqual(assetV4);
      expect(convertAssetVersion(4, assetJunctionV4)).toStrictEqual(
        assetJunctionV4
      );
      expect(
        convertAssetVersion(4, assetWithMultipleJunctionsV4)
      ).toStrictEqual(assetWithMultipleJunctionsV4);
      expect(convertAssetVersion(4, assetWithNonFungibleV4)).toStrictEqual(
        assetWithNonFungibleV4
      );
    });

    it('v4 identity test with asset', () => {
      expect(convertAssetVersion(4, assetV4.V4)).toStrictEqual(assetV4);
      expect(convertAssetVersion(4, assetJunctionV4.V4)).toStrictEqual(
        assetJunctionV4
      );
      expect(
        convertAssetVersion(4, assetWithMultipleJunctionsV4.V4)
      ).toStrictEqual(assetWithMultipleJunctionsV4);
      expect(convertAssetVersion(4, assetWithNonFungibleV4.V4)).toStrictEqual(
        assetWithNonFungibleV4
      );
    });

    it('v3 identity test with asset', () => {
      expect(convertAssetVersion(3, assetV4.V4)).toStrictEqual(assetV3);
      expect(convertAssetVersion(3, assetJunctionV4.V4)).toStrictEqual(
        assetJunctionV3
      );
      expect(
        convertAssetVersion(3, assetWithMultipleJunctionsV4.V4)
      ).toStrictEqual(assetWithMultipleJunctionsV3);
      expect(convertAssetVersion(3, assetWithNonFungibleV4.V4)).toStrictEqual(
        assetWithNonFungibleV3
      );
    });
  });

  describe('asset convert v4->v3', () => {
    it('asset v4->v3', () => {
      expect(convertAssetVersion(3, assetV4)).toStrictEqual(assetV3);
    });

    it('asset v4->v3 with non fungible', () => {
      expect(convertAssetVersion(3, assetWithNonFungibleV4)).toStrictEqual(
        assetWithNonFungibleV3
      );
    });

    it('asset v4->v3 junction', () => {
      expect(convertAssetVersion(3, assetJunctionV4)).toStrictEqual(
        assetJunctionV3
      );
    });

    it('asset v4->v3 multiple junction', () => {
      expect(
        convertAssetVersion(3, assetWithMultipleJunctionsV4)
      ).toStrictEqual(assetWithMultipleJunctionsV3);
    });
  });

  describe('asset convert v3->v4', () => {
    it('asset v3->v4', () => {
      expect(convertAssetVersion(4, assetV3)).toStrictEqual(assetV4);
    });

    it('asset v3->v4 with non fungible', () => {
      expect(convertAssetVersion(4, assetWithNonFungibleV3)).toStrictEqual(
        assetWithNonFungibleV4
      );
    });

    it('asset v3->v4 junction', () => {
      expect(convertAssetVersion(4, assetJunctionV3)).toStrictEqual(
        assetJunctionV4
      );
    });

    it('asset v3->v4 multiple junction', () => {
      expect(
        convertAssetVersion(4, assetWithMultipleJunctionsV3)
      ).toStrictEqual(assetWithMultipleJunctionsV4);
    });
  });

  describe('asset convert v3->v2', () => {
    it('asset v3->v2', () => {
      expect(convertAssetVersion(2, assetV3)).toStrictEqual(assetV2);
    });

    it('asset v3->v2 junction', () => {
      expect(convertAssetVersion(2, assetJunctionV3)).toStrictEqual(
        assetJunctionV2
      );
    });

    it('asset v3->v2 multiple junction', () => {
      expect(
        convertAssetVersion(2, assetWithMultipleJunctionsV3)
      ).toStrictEqual(assetWithMultipleJunctionsV2);
    });

    it('asset v3->v2 non fungible', () => {
      expect(convertAssetVersion(2, assetWithNonFungibleV3)).toStrictEqual(
        assetWithNonFungibleV2
      );
    });
  });

  describe('asset convert v2->v3', () => {
    it('asset v2->v3', () => {
      expect(convertAssetVersion(3, assetV2)).toStrictEqual(assetV3);
    });

    it('asset v2->v3 junction', () => {
      expect(convertAssetVersion(3, assetJunctionV2)).toStrictEqual(
        assetJunctionV3
      );
    });

    it('asset v2->v3 multiple junction', () => {
      expect(
        convertAssetVersion(3, assetWithMultipleJunctionsV2)
      ).toStrictEqual(assetWithMultipleJunctionsV3);
    });

    it('asset v2->v3 non fungible', () => {
      expect(convertAssetVersion(3, assetWithNonFungibleV2)).toStrictEqual(
        assetWithNonFungibleV3
      );
    });

    it('asset v2->v3 with non fungible blob', () => {
      expect(() =>
        convertAssetVersion(3, assetWithNonFungibleBlobV2)
      ).toThrowError(`cannot be upgraded to V3`);
    });
  });
});
