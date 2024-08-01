import { describe, expect, it } from 'vitest';
import { convertAssetVersion, convertLocationVersion } from '../src/util.ts';
import { VersionedAsset, VersionedLocation } from '../src/xcmtypes.ts';

describe('xcm location tests', () => {
  const locationX1V4: VersionedLocation = {
    V4: { parents: 1, interior: { X1: [{ Parachain: 2001 }] } }
  };

  const locationWithBitcoinX1V4: VersionedLocation = {
    V4: {
      parents: 1,
      interior: {
        X1: [{ AccountId32: { network: 'BitcoinCore', id: 'TEST' } }]
      }
    }
  };

  const locationX2V4: VersionedLocation = {
    V4: {
      parents: 2,
      interior: {
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationWithNetworkIdX2V4: VersionedLocation = {
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

  const locationWithEthereumNetworkX2V4: VersionedLocation = {
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

  const locationWithGlobalConsensusX3V4: VersionedLocation = {
    V4: {
      parents: 2,
      interior: {
        X3: [
          { GlobalConsensus: 'Polkadot' },
          { Parachain: 2002 },
          {
            AccountId32: {
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  const locationX1V3: VersionedLocation = {
    V3: { parents: 1, interior: { X1: { Parachain: 2001 } } }
  };

  const locationWithBitcoinX1V3: VersionedLocation = {
    V3: {
      parents: 1,
      interior: { X1: { AccountId32: { network: 'BitcoinCore', id: 'TEST' } } }
    }
  };

  const locationX2V3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationWithNetworkIdX2V3: VersionedLocation = {
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

  const locationWithNetworkIdRococoX2V3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: 'Rococo',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  const locationWithNullNetworkIdX2V3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: null,
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  const locationWithEthereumNetworkX2V3: VersionedLocation = {
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

  const locationWithGlobalConsensusX3V3: VersionedLocation = {
    V3: {
      parents: 2,
      interior: {
        X3: [
          { GlobalConsensus: 'Polkadot' },
          { Parachain: 2002 },
          {
            AccountId32: {
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  const locationX1V2: VersionedLocation = {
    V2: { parents: 1, interior: { X1: { Parachain: 2001 } } }
  };

  const locationX2V2: VersionedLocation = {
    V2: {
      parents: 2,
      interior: {
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationWithNetworkIdX2V2: VersionedLocation = {
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

  const locationWithNetworkIdAnyX2V2: VersionedLocation = {
    V2: {
      parents: 2,
      interior: {
        X2: [
          { Parachain: 2001 },
          {
            AccountId32: {
              network: 'Any',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
            }
          }
        ]
      }
    }
  };

  describe('identity test for locations', () => {
    it('v4 identity test with versioned location', () => {
      expect(convertLocationVersion(4, locationX1V4)).toStrictEqual(locationX1V4);
      expect(convertLocationVersion(4, locationWithBitcoinX1V4)).toStrictEqual(
        locationWithBitcoinX1V4
      );
      expect(
        convertLocationVersion(4, locationX2V4)
      ).toStrictEqual(locationX2V4);
      expect(convertLocationVersion(4, locationWithNetworkIdX2V4)).toStrictEqual(
        locationWithNetworkIdX2V4
      );
      expect(
        convertLocationVersion(4, locationWithEthereumNetworkX2V4)
      ).toStrictEqual(locationWithEthereumNetworkX2V4);
      expect(
        convertLocationVersion(4, locationWithGlobalConsensusX3V4)
      ).toStrictEqual(locationWithGlobalConsensusX3V4);
    });

    it('v3 identity test with versioned location', () => {
      expect(convertLocationVersion(3, locationX1V3)).toStrictEqual(
        locationX1V3
      );
      expect(convertLocationVersion(3, locationWithBitcoinX1V3)).toStrictEqual(
        locationWithBitcoinX1V3
      );
      expect(
        convertLocationVersion(3, locationX2V3)
      ).toStrictEqual(locationX2V3);
      expect(
        convertLocationVersion(3, locationWithNetworkIdX2V3)
      ).toStrictEqual(locationWithNetworkIdX2V3);
      expect(
        convertLocationVersion(3, locationWithEthereumNetworkX2V3)
      ).toStrictEqual(locationWithEthereumNetworkX2V3);
      expect(
        convertLocationVersion(3, locationWithGlobalConsensusX3V3)
      ).toStrictEqual(locationWithGlobalConsensusX3V3);
    });

    it('v2 identity test with versioned location', () => {
      expect(convertLocationVersion(2, locationX1V2)).toStrictEqual(
        locationX1V2
      );
      expect(
        convertLocationVersion(2, locationX2V2)
      ).toStrictEqual(locationX2V2);
      expect(
        convertLocationVersion(2, locationWithNetworkIdX2V2)
      ).toStrictEqual(locationWithNetworkIdX2V2);
    });
  });

  describe('create versions from location', () => {
    it('v4 test create with location', () => {
      expect(convertLocationVersion(4, locationX1V4.V4)).toStrictEqual(
        locationX1V4
      );
      expect(convertLocationVersion(4, locationWithBitcoinX1V4.V4)).toStrictEqual(
        locationWithBitcoinX1V4
      );
      expect(
        convertLocationVersion(4, locationX2V4.V4)
      ).toStrictEqual(locationX2V4);
      expect(
        convertLocationVersion(4, locationWithNetworkIdX2V4.V4)
      ).toStrictEqual(locationWithNetworkIdX2V4);
      expect(
        convertLocationVersion(4, locationWithEthereumNetworkX2V4.V4)
      ).toStrictEqual(locationWithEthereumNetworkX2V4);
      expect(
        convertLocationVersion(4, locationWithGlobalConsensusX3V4.V4)
      ).toStrictEqual(locationWithGlobalConsensusX3V4);
    });

    it('v3 test create with location', () => {
      expect(convertLocationVersion(3, locationX1V4.V4)).toStrictEqual(
        locationX1V3
      );
      expect(convertLocationVersion(3, locationWithBitcoinX1V4.V4)).toStrictEqual(
        locationWithBitcoinX1V3
      );
      expect(
        convertLocationVersion(3, locationX2V4.V4)
      ).toStrictEqual(locationX2V3);
      expect(
        convertLocationVersion(3, locationWithNetworkIdX2V4.V4)
      ).toStrictEqual(locationWithNetworkIdX2V3);
      expect(
        convertLocationVersion(3, locationWithEthereumNetworkX2V4.V4)
      ).toStrictEqual(locationWithEthereumNetworkX2V3);
      expect(
        convertLocationVersion(3, locationWithGlobalConsensusX3V4.V4)
      ).toStrictEqual(locationWithGlobalConsensusX3V3);
    });
  })

  describe('location convert v4->v3', () => {
    it('location v4->v3', () => {
      expect(convertLocationVersion(3, locationX1V4)).toStrictEqual(locationX1V3);
    });

    it('location v4->v3 bitcoin', () => {
      expect(convertLocationVersion(3, locationWithBitcoinX1V4)).toStrictEqual(
        locationWithBitcoinX1V3
      );
    });

    it('location v4->v3 with miltiple junction', () => {
      expect(
        convertLocationVersion(3, locationX2V4)
      ).toStrictEqual(locationX2V3);
    });

    it('location v4->v3 with NetworkId', () => {
      expect(convertLocationVersion(3, locationWithNetworkIdX2V4)).toStrictEqual(
        locationWithNetworkIdX2V3
      );
    });

    it('location v4->v3 with ethereum', () => {
      expect(
        convertLocationVersion(3, locationWithEthereumNetworkX2V4)
      ).toStrictEqual(locationWithEthereumNetworkX2V3);
    });

    it('location v4->v3 with global consensus', () => {
      expect(
        convertLocationVersion(3, locationWithGlobalConsensusX3V4)
      ).toStrictEqual(locationWithGlobalConsensusX3V3);
    });
  });

  describe('location convert v3->v4', () => {
    it('location v3->v4', () => {
      expect(convertLocationVersion(4, locationX1V3)).toStrictEqual(locationX1V4);
    });

    it('location v3->v4 bitcoin', () => {
      expect(convertLocationVersion(4, locationWithBitcoinX1V3)).toStrictEqual(
        locationWithBitcoinX1V4
      );
    });

    it('location v4->v3 with miltiple junction', () => {
      expect(
        convertLocationVersion(4, locationX2V3)
      ).toStrictEqual(locationX2V4);
    });

    it('location v3->v4 with NetworkId', () => {
      expect(convertLocationVersion(4, locationWithNetworkIdX2V3)).toStrictEqual(
        locationWithNetworkIdX2V4
      );
    });

    it('location v3->v4 with ethereum', () => {
      expect(
        convertLocationVersion(4, locationWithEthereumNetworkX2V3)
      ).toStrictEqual(locationWithEthereumNetworkX2V4);
    });

    it('location v3->v4 with global consensus', () => {
      expect(
        convertLocationVersion(4, locationWithGlobalConsensusX3V3)
      ).toStrictEqual(locationWithGlobalConsensusX3V4);
    });
  });

  describe('location convert v3->v2', () => {
    it('location v3->v2', () => {
      expect(convertLocationVersion(2, locationX1V3)).toStrictEqual(locationX1V2);
    });

    it('location v3->v2 bitcoin', () => {
      expect(() =>
        convertLocationVersion(2, locationWithBitcoinX1V3)
      ).toThrowError(`V2 network ID don't include`);
    });

    it('location v3->v2 with miltiple junction', () => {
      expect(
        convertLocationVersion(2, locationX2V3)
      ).toStrictEqual(locationX2V2);
    });

    it('location v3->v2 with NetworkId', () => {
      expect(convertLocationVersion(2, locationWithNetworkIdX2V3)).toStrictEqual(
        locationWithNetworkIdX2V2
      );
    });

    it('location v3->v2 with NetworkId Rococo', () => {
      expect(() => convertLocationVersion(2, locationWithNetworkIdRococoX2V3)).toThrowError(`V2 network ID don't include`);
    });

    it('location v3->v2 with ethereum', () => {
      expect(() =>
        convertLocationVersion(2, locationWithEthereumNetworkX2V3)
      ).toThrowError(`V2 network ID don't include`);
    });

    it('location v3->v2 with global consensus', () => {
      expect(() =>
        convertLocationVersion(2, locationWithGlobalConsensusX3V3)
      ).toThrowError(`V2 junctions don't include`);
    });
  });

  describe('location convert v2->v3', () => {
    it('location v2->v3', () => {
      expect(convertLocationVersion(3, locationX1V2)).toStrictEqual(locationX1V3);
    });

    it('location v2->v3 with miltiple junction', () => {
      expect(
        convertLocationVersion(3, locationX2V2)
      ).toStrictEqual(locationX2V3);
    });

    it('location v2->v3 with networkId: Any', () => {
      expect(
        convertLocationVersion(3, locationWithNetworkIdAnyX2V2)
      ).toStrictEqual(locationWithNullNetworkIdX2V3);
    })
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

  const assetJunctionX1V4: VersionedAsset = {
    V4: {
      id: { parents: 1, interior: { X1: [{ Parachain: 2001 }] } },
      fun: { Fungible: 1000 }
    }
  };

  const assetX2V4: VersionedAsset = {
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

  const assetWithGlobalConsensusX2V4: VersionedAsset = {
    V4: {
      id: {
        parents: 2,
        interior: {
          X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 2002 }]
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

  const assetJunctionX1V3: VersionedAsset = {
    V3: {
      id: { Concrete: { parents: 1, interior: { X1: { Parachain: 2001 } } } },
      fun: { Fungible: 1000 }
    }
  };

  const assetX2V3: VersionedAsset = {
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

  const assetWithGlobalConsensusX2V3: VersionedAsset = {
    V3: {
      id: {
        Concrete: {
          parents: 2,
          interior: {
            X2: [{ GlobalConsensus: 'Polkadot' }, { Parachain: 2002 }]
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

  const assetX2V2: VersionedAsset = {
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

  const assetWithNonFungibleBlobX2V2: VersionedAsset = {
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
      expect(convertAssetVersion(4, assetJunctionX1V4)).toStrictEqual(
        assetJunctionX1V4
      );
      expect(
        convertAssetVersion(4, assetX2V4)
      ).toStrictEqual(assetX2V4);
      expect(convertAssetVersion(4, assetWithNonFungibleV4)).toStrictEqual(
        assetWithNonFungibleV4
      );
      expect(convertAssetVersion(4, assetWithGlobalConsensusX2V4)).toStrictEqual(
        assetWithGlobalConsensusX2V4
      );
    });

    it('v4 identity test with asset', () => {
      expect(convertAssetVersion(4, assetV4.V4)).toStrictEqual(assetV4);
      expect(convertAssetVersion(4, assetJunctionX1V4.V4)).toStrictEqual(
        assetJunctionX1V4
      );
      expect(
        convertAssetVersion(4, assetX2V4.V4)
      ).toStrictEqual(assetX2V4);
      expect(convertAssetVersion(4, assetWithNonFungibleV4.V4)).toStrictEqual(
        assetWithNonFungibleV4
      );
      expect(
        convertAssetVersion(4, assetWithGlobalConsensusX2V4.V4)
      ).toStrictEqual(assetWithGlobalConsensusX2V4);
    });

    it('v3 identity test with asset', () => {
      expect(convertAssetVersion(3, assetV4.V4)).toStrictEqual(assetV3);
      expect(convertAssetVersion(3, assetJunctionX1V4.V4)).toStrictEqual(
        assetJunctionX1V3
      );
      expect(
        convertAssetVersion(3, assetX2V4.V4)
      ).toStrictEqual(assetX2V3);
      expect(convertAssetVersion(3, assetWithNonFungibleV4.V4)).toStrictEqual(
        assetWithNonFungibleV3
      );
      expect(
        convertAssetVersion(3, assetWithGlobalConsensusX2V4.V4)
      ).toStrictEqual(assetWithGlobalConsensusX2V3);
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
      expect(convertAssetVersion(3, assetJunctionX1V4)).toStrictEqual(
        assetJunctionX1V3
      );
    });

    it('asset v4->v3 multiple junction', () => {
      expect(
        convertAssetVersion(3, assetX2V4)
      ).toStrictEqual(assetX2V3);
    });

    it('asset v4->v3 global consensus', () => {
      expect(convertAssetVersion(3, assetWithGlobalConsensusX2V4)).toStrictEqual(
        assetWithGlobalConsensusX2V3
      );
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
      expect(convertAssetVersion(4, assetJunctionX1V3)).toStrictEqual(
        assetJunctionX1V4
      );
    });

    it('asset v3->v4 multiple junction', () => {
      expect(
        convertAssetVersion(4, assetX2V3)
      ).toStrictEqual(assetX2V4);
    });

    it('asset v3->v4 global consensus', () => {
      expect(convertAssetVersion(4, assetWithGlobalConsensusX2V3)).toStrictEqual(
        assetWithGlobalConsensusX2V4
      );
    });
  });

  describe('asset convert v3->v2', () => {
    it('asset v3->v2', () => {
      expect(convertAssetVersion(2, assetV3)).toStrictEqual(assetV2);
    });

    it('asset v3->v2 junction', () => {
      expect(convertAssetVersion(2, assetJunctionX1V3)).toStrictEqual(
        assetJunctionV2
      );
    });

    it('asset v3->v2 multiple junction', () => {
      expect(
        convertAssetVersion(2, assetX2V3)
      ).toStrictEqual(assetX2V2);
    });

    it('asset v3->v2 non fungible', () => {
      expect(convertAssetVersion(2, assetWithNonFungibleV3)).toStrictEqual(
        assetWithNonFungibleV2
      );
    });

    it('asset v3->v2 global consensus', () => {
      expect(() =>
        convertAssetVersion(2, assetWithGlobalConsensusX2V4)
      ).toThrowError(`V2 junctions don't include`);
    });
  });

  describe('asset convert v2->v3', () => {
    it('asset v2->v3', () => {
      expect(convertAssetVersion(3, assetV2)).toStrictEqual(assetV3);
    });

    it('asset v2->v3 junction', () => {
      expect(convertAssetVersion(3, assetJunctionV2)).toStrictEqual(
        assetJunctionX1V3
      );
    });

    it('asset v2->v3 multiple junction', () => {
      expect(
        convertAssetVersion(3, assetX2V2)
      ).toStrictEqual(assetX2V3);
    });

    it('asset v2->v3 non fungible', () => {
      expect(convertAssetVersion(3, assetWithNonFungibleV2)).toStrictEqual(
        assetWithNonFungibleV3
      );
    });

    it('asset v2->v3 with non fungible blob', () => {
      expect(() =>
        convertAssetVersion(3, assetWithNonFungibleBlobX2V2)
      ).toThrowError(`cannot be upgraded to V3`);
    });
  });
});
