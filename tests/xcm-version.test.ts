import { describe, expect, it } from 'vitest';
import { convertAssetVersion, convertLocationVersion } from '../src/util.ts';
import { VersionedAsset, VersionedLocation } from '../src/xcmtypes.ts';

describe('xcm location tests', () => {
  const locationX1V4: VersionedLocation = {
    V4: { parents: 1, interior: { X1: [{ Parachain: 2001 }] } }
  };

  const locationX2V4: VersionedLocation = {
    V4: {
      parents: 2,
      interior: {
        X2: [{ Parachain: 2001 }, { GeneralIndex: 1002 }]
      }
    }
  };

  const locationX1BitcoinV4: VersionedLocation = {
    V4: {
      parents: 1,
      interior: {
        X1: [{ AccountId32: { network: 'BitcoinCore', id: 'TEST' } }]
      }
    }
  };

  const locationX2PolkadotNetworkIdV4: VersionedLocation = {
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

  const locationX2EthereumNetworkIdV4: VersionedLocation = {
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

  const locationX3GlobalConsensusV4: VersionedLocation = {
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

  const locationX1BitcoinV3: VersionedLocation = {
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

  const locationX2PolkadotNetworkIdV3: VersionedLocation = {
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

  const locationX2RococoNetworkIdV3: VersionedLocation = {
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

  const locationX2NullNetworkIdV3: VersionedLocation = {
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

  const locationX2EthereumNetworkIdV3: VersionedLocation = {
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

  const locationX3GlobalConsensusV3: VersionedLocation = {
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

  const locationX2PolkadotNetworkIdV2: VersionedLocation = {
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

  const locationX2AnyNetworkIdV2: VersionedLocation = {
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
      expect(convertLocationVersion(4, locationX1V4)).toStrictEqual(
        locationX1V4
      );
      expect(convertLocationVersion(4, locationX1BitcoinV4)).toStrictEqual(
        locationX1BitcoinV4
      );
      expect(convertLocationVersion(4, locationX2V4)).toStrictEqual(
        locationX2V4
      );
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV4)
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV4)
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV4)
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });

    it('v4 identity test with non-versioned location', () => {
      expect(convertLocationVersion(4, locationX1V4.V4)).toStrictEqual(
        locationX1V4
      );
      expect(convertLocationVersion(4, locationX1BitcoinV4.V4)).toStrictEqual(
        locationX1BitcoinV4
      );
      expect(convertLocationVersion(4, locationX2V4.V4)).toStrictEqual(
        locationX2V4
      );
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV4.V4)
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV4.V4)
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV4.V4)
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });

    it('v3 identity test with versioned location', () => {
      expect(convertLocationVersion(3, locationX1V3)).toStrictEqual(
        locationX1V3
      );
      expect(convertLocationVersion(3, locationX1BitcoinV3)).toStrictEqual(
        locationX1BitcoinV3
      );
      expect(convertLocationVersion(3, locationX2V3)).toStrictEqual(
        locationX2V3
      );
      expect(
        convertLocationVersion(3, locationX2PolkadotNetworkIdV3)
      ).toStrictEqual(locationX2PolkadotNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX2EthereumNetworkIdV3)
      ).toStrictEqual(locationX2EthereumNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX3GlobalConsensusV3)
      ).toStrictEqual(locationX3GlobalConsensusV3);
    });

    it('v2 identity test with versioned location', () => {
      expect(convertLocationVersion(2, locationX1V2)).toStrictEqual(
        locationX1V2
      );
      expect(convertLocationVersion(2, locationX2V2)).toStrictEqual(
        locationX2V2
      );
      expect(
        convertLocationVersion(2, locationX2PolkadotNetworkIdV2)
      ).toStrictEqual(locationX2PolkadotNetworkIdV2);
    });
  });

  describe('create location versions from non-versioned location', () => {
    it('v3 test create with non-versioned location', () => {
      expect(convertLocationVersion(3, locationX1V4.V4)).toStrictEqual(
        locationX1V3
      );
      expect(convertLocationVersion(3, locationX1BitcoinV4.V4)).toStrictEqual(
        locationX1BitcoinV3
      );
      expect(convertLocationVersion(3, locationX2V4.V4)).toStrictEqual(
        locationX2V3
      );
      expect(
        convertLocationVersion(3, locationX2PolkadotNetworkIdV4.V4)
      ).toStrictEqual(locationX2PolkadotNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX2EthereumNetworkIdV4.V4)
      ).toStrictEqual(locationX2EthereumNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX3GlobalConsensusV4.V4)
      ).toStrictEqual(locationX3GlobalConsensusV3);
    });

    it('v2 test create with non-versioned location', () => {
      expect(convertLocationVersion(2, locationX1V4.V4)).toStrictEqual(
        locationX1V2
      );
      expect(convertLocationVersion(2, locationX2V4.V4)).toStrictEqual(
        locationX2V2
      );
      expect(
        convertLocationVersion(2, locationX2PolkadotNetworkIdV4.V4)
      ).toStrictEqual(locationX2PolkadotNetworkIdV2);
    });
  });

  describe('location convert v4->v3', () => {
    it('v4->v3: location x1', () => {
      expect(convertLocationVersion(3, locationX1V4)).toStrictEqual(
        locationX1V3
      );
    });

    it('v4->v3: location x1 bitcoin', () => {
      expect(convertLocationVersion(3, locationX1BitcoinV4)).toStrictEqual(
        locationX1BitcoinV3
      );
    });

    it('v4->v3: location x2', () => {
      expect(convertLocationVersion(3, locationX2V4)).toStrictEqual(
        locationX2V3
      );
    });

    it('v4->v3: location x2 v4->v3 polkadot network id', () => {
      expect(
        convertLocationVersion(3, locationX2PolkadotNetworkIdV4)
      ).toStrictEqual(locationX2PolkadotNetworkIdV3);
    });

    it('v4->v3: location x2 ethereum network id', () => {
      expect(
        convertLocationVersion(3, locationX2EthereumNetworkIdV4)
      ).toStrictEqual(locationX2EthereumNetworkIdV3);
    });

    it('v4->v3: location x3 global consensus', () => {
      expect(
        convertLocationVersion(3, locationX3GlobalConsensusV4)
      ).toStrictEqual(locationX3GlobalConsensusV3);
    });
  });

  describe('location convert v3->v4', () => {
    it('v3->v4: location x1', () => {
      expect(convertLocationVersion(4, locationX1V3)).toStrictEqual(
        locationX1V4
      );
    });

    it('v3->v4: location x1 bitcoin', () => {
      expect(convertLocationVersion(4, locationX1BitcoinV3)).toStrictEqual(
        locationX1BitcoinV4
      );
    });

    it('v3->v4: location x2', () => {
      expect(convertLocationVersion(4, locationX2V3)).toStrictEqual(
        locationX2V4
      );
    });

    it('v3->v4: location x2 polkadot network id', () => {
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV3)
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
    });

    it('v3->v4: location x2 ethereum network id', () => {
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV3)
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
    });

    it('v3->v4: location x3 global consensus', () => {
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV3)
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });
  });

  describe('location convert v3->v2', () => {
    it('v3->v2: location x1', () => {
      expect(convertLocationVersion(2, locationX1V3)).toStrictEqual(
        locationX1V2
      );
    });

    it('v3->v2: location x1 bitcoin', () => {
      expect(() => convertLocationVersion(2, locationX1BitcoinV3)).toThrowError(
        `V2 network ID doesn't include`
      );
    });

    it('v3->v2: location x2', () => {
      expect(convertLocationVersion(2, locationX2V3)).toStrictEqual(
        locationX2V2
      );
    });

    it('v3->v2: location x2 polkadot network id', () => {
      expect(
        convertLocationVersion(2, locationX2PolkadotNetworkIdV3)
      ).toStrictEqual(locationX2PolkadotNetworkIdV2);
    });

    it('v3->v2: location x2 rococo network id', () => {
      expect(() =>
        convertLocationVersion(2, locationX2RococoNetworkIdV3)
      ).toThrowError(`V2 network ID doesn't include`);
    });

    it('v3->v2: location x2 ethereum network id', () => {
      expect(() =>
        convertLocationVersion(2, locationX2EthereumNetworkIdV3)
      ).toThrowError(`V2 network ID doesn't include`);
    });

    it('v3->v2: location x3 global consensus', () => {
      expect(() =>
        convertLocationVersion(2, locationX3GlobalConsensusV3)
      ).toThrowError(`V2 junctions don't include`);
    });

    it('v3->v2: location x2 null network id', () => {
      expect(
        convertLocationVersion(2, locationX2NullNetworkIdV3)
      ).toStrictEqual(locationX2AnyNetworkIdV2);
    });
  });

  describe('location convert v2->v3', () => {
    it('v2->v3: location x1', () => {
      expect(convertLocationVersion(3, locationX1V2)).toStrictEqual(
        locationX1V3
      );
    });

    it('v2->v3: location x2', () => {
      expect(convertLocationVersion(3, locationX2V2)).toStrictEqual(
        locationX2V3
      );
    });

    it('v2->v3: location x2 any network id', () => {
      expect(convertLocationVersion(3, locationX2AnyNetworkIdV2)).toStrictEqual(
        locationX2NullNetworkIdV3
      );
    });
  });
});

describe('asset xcm tests', () => {
  const ftAssetV4: VersionedAsset = {
    V4: { id: { parents: 0, interior: 'Here' }, fun: { Fungible: 1000 } }
  };

  const nftAssetV4: VersionedAsset = {
    V4: {
      id: { parents: 0, interior: 'Here' },
      fun: { NonFungible: 'Undefined' }
    }
  };

  const ftAssetX1V4: VersionedAsset = {
    V4: {
      id: { parents: 1, interior: { X1: [{ Parachain: 2001 }] } },
      fun: { Fungible: 1000 }
    }
  };

  const ftAssetX2V4: VersionedAsset = {
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

  const ftAssetX2GlobalConsensusV4: VersionedAsset = {
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

  const ftAssetV3: VersionedAsset = {
    V3: {
      id: { Concrete: { parents: 0, interior: 'Here' } },
      fun: { Fungible: 1000 }
    }
  };

  const nftAssetV3: VersionedAsset = {
    V3: {
      id: {
        Concrete: { parents: 0, interior: 'Here' }
      },
      fun: { NonFungible: 'Undefined' }
    }
  };

  const ftAssetX1V3: VersionedAsset = {
    V3: {
      id: { Concrete: { parents: 1, interior: { X1: { Parachain: 2001 } } } },
      fun: { Fungible: 1000 }
    }
  };

  const ftAssetX2V3: VersionedAsset = {
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

  const ftAssetX2GlobalConsensusV3: VersionedAsset = {
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

  const ftAssetV2: VersionedAsset = {
    V2: {
      id: { Concrete: { parents: 0, interior: 'Here' } },
      fun: { Fungible: 1000 }
    }
  };

  const ftAssetX1V2: VersionedAsset = {
    V2: {
      id: { Concrete: { parents: 1, interior: { X1: { Parachain: 2001 } } } },
      fun: { Fungible: 1000 }
    }
  };

  const ftAssetX2V2: VersionedAsset = {
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

  const nftAssetV2: VersionedAsset = {
    V2: {
      id: {
        Concrete: { parents: 0, interior: 'Here' }
      },
      fun: { NonFungible: 'Undefined' }
    }
  };

  const nftBlobAssetX2V2: VersionedAsset = {
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
      expect(convertAssetVersion(4, ftAssetV4)).toStrictEqual(ftAssetV4);
      expect(convertAssetVersion(4, ftAssetX1V4)).toStrictEqual(ftAssetX1V4);
      expect(convertAssetVersion(4, ftAssetX2V4)).toStrictEqual(ftAssetX2V4);
      expect(convertAssetVersion(4, nftAssetV4)).toStrictEqual(nftAssetV4);
      expect(convertAssetVersion(4, ftAssetX2GlobalConsensusV4)).toStrictEqual(
        ftAssetX2GlobalConsensusV4
      );
    });

    it('v4 identity test with non-versioned asset', () => {
      expect(convertAssetVersion(4, ftAssetV4.V4)).toStrictEqual(ftAssetV4);
      expect(convertAssetVersion(4, ftAssetX1V4.V4)).toStrictEqual(ftAssetX1V4);
      expect(convertAssetVersion(4, ftAssetX2V4.V4)).toStrictEqual(ftAssetX2V4);
      expect(convertAssetVersion(4, nftAssetV4.V4)).toStrictEqual(nftAssetV4);
      expect(
        convertAssetVersion(4, ftAssetX2GlobalConsensusV4.V4)
      ).toStrictEqual(ftAssetX2GlobalConsensusV4);
    });

    it('v3 identity test with versioned asset', () => {
      expect(convertAssetVersion(3, ftAssetV3)).toStrictEqual(ftAssetV3);
      expect(convertAssetVersion(3, ftAssetX1V3)).toStrictEqual(ftAssetX1V3);
      expect(convertAssetVersion(3, ftAssetX2V3)).toStrictEqual(ftAssetX2V3);
      expect(convertAssetVersion(3, nftAssetV3)).toStrictEqual(nftAssetV3);
      expect(convertAssetVersion(3, ftAssetX2GlobalConsensusV3)).toStrictEqual(
        ftAssetX2GlobalConsensusV3
      );
    });

    it('v2 identity test with versioned asset', () => {
      expect(convertAssetVersion(2, ftAssetV2)).toStrictEqual(ftAssetV2);
      expect(convertAssetVersion(2, ftAssetX1V2)).toStrictEqual(ftAssetX1V2);
      expect(convertAssetVersion(2, ftAssetX2V2)).toStrictEqual(ftAssetX2V2);
      expect(convertAssetVersion(2, nftAssetV2)).toStrictEqual(nftAssetV2);
      expect(convertAssetVersion(2, nftBlobAssetX2V2)).toStrictEqual(
        nftBlobAssetX2V2
      );
    });
  });

  describe('create asset versions from non-versioned asset', () => {
    it('v3 test create with non-versioned asset', () => {
      expect(convertAssetVersion(3, ftAssetV4.V4)).toStrictEqual(ftAssetV3);
      expect(convertAssetVersion(3, ftAssetX1V4.V4)).toStrictEqual(ftAssetX1V3);
      expect(convertAssetVersion(3, ftAssetX2V4.V4)).toStrictEqual(ftAssetX2V3);
      expect(convertAssetVersion(3, nftAssetV4.V4)).toStrictEqual(nftAssetV3);
      expect(
        convertAssetVersion(3, ftAssetX2GlobalConsensusV4.V4)
      ).toStrictEqual(ftAssetX2GlobalConsensusV3);
    });

    it('v2 test create with non-versioned asset', () => {
      expect(convertAssetVersion(2, ftAssetV4.V4)).toStrictEqual(ftAssetV2);
      expect(convertAssetVersion(2, ftAssetX1V4.V4)).toStrictEqual(ftAssetX1V2);
      expect(convertAssetVersion(2, ftAssetX2V4.V4)).toStrictEqual(ftAssetX2V2);
      expect(convertAssetVersion(2, nftAssetV4.V4)).toStrictEqual(nftAssetV2);
    });
  });

  describe('asset convert v4->v3', () => {
    it('v4->v3: fungible asset', () => {
      expect(convertAssetVersion(3, ftAssetV4)).toStrictEqual(ftAssetV3);
    });

    it('v4->v3: non-fungible asset', () => {
      expect(convertAssetVersion(3, nftAssetV4)).toStrictEqual(nftAssetV3);
    });

    it('v4->v3: fungible asset x1', () => {
      expect(convertAssetVersion(3, ftAssetX1V4)).toStrictEqual(ftAssetX1V3);
    });

    it('v4->v3: fungible asset x2', () => {
      expect(convertAssetVersion(3, ftAssetX2V4)).toStrictEqual(ftAssetX2V3);
    });

    it('v4->v3: fungible asset x2 global consensus', () => {
      expect(convertAssetVersion(3, ftAssetX2GlobalConsensusV4)).toStrictEqual(
        ftAssetX2GlobalConsensusV3
      );
    });
  });

  describe('asset convert v3->v4', () => {
    it('v3->v4: fungible asset', () => {
      expect(convertAssetVersion(4, ftAssetV3)).toStrictEqual(ftAssetV4);
    });

    it('v3->v4: non-fungible asset', () => {
      expect(convertAssetVersion(4, nftAssetV3)).toStrictEqual(nftAssetV4);
    });

    it('v3->v4: fungible asset x1', () => {
      expect(convertAssetVersion(4, ftAssetX1V3)).toStrictEqual(ftAssetX1V4);
    });

    it('v3->v4: fungible asset x2', () => {
      expect(convertAssetVersion(4, ftAssetX2V3)).toStrictEqual(ftAssetX2V4);
    });

    it('v3->v4: fungible asset x2 global consensus', () => {
      expect(convertAssetVersion(4, ftAssetX2GlobalConsensusV3)).toStrictEqual(
        ftAssetX2GlobalConsensusV4
      );
    });
  });

  describe('asset convert v3->v2', () => {
    it('v3->v2: fungible asset', () => {
      expect(convertAssetVersion(2, ftAssetV3)).toStrictEqual(ftAssetV2);
    });

    it('v3->v2: fungible asset x1', () => {
      expect(convertAssetVersion(2, ftAssetX1V3)).toStrictEqual(ftAssetX1V2);
    });

    it('v3->v2: fungible asset x2', () => {
      expect(convertAssetVersion(2, ftAssetX2V3)).toStrictEqual(ftAssetX2V2);
    });

    it('v3->v2: non-fungible asset', () => {
      expect(convertAssetVersion(2, nftAssetV3)).toStrictEqual(nftAssetV2);
    });

    it('v3->v2: fungible asset x2 global consensus', () => {
      expect(() =>
        convertAssetVersion(2, ftAssetX2GlobalConsensusV4)
      ).toThrowError(`V2 junctions don't include`);
    });
  });

  describe('asset convert v2->v3', () => {
    it('v2->v3: fungible asset', () => {
      expect(convertAssetVersion(3, ftAssetV2)).toStrictEqual(ftAssetV3);
    });

    it('v2->v3: fungible asset x1', () => {
      expect(convertAssetVersion(3, ftAssetX1V2)).toStrictEqual(ftAssetX1V3);
    });

    it('v2->v3: fungible asset x2', () => {
      expect(convertAssetVersion(3, ftAssetX2V2)).toStrictEqual(ftAssetX2V3);
    });

    it('v2->v3: non-fungible asset', () => {
      expect(convertAssetVersion(3, nftAssetV2)).toStrictEqual(nftAssetV3);
    });

    it('v2->v3: non-fungible asset x2', () => {
      expect(() => convertAssetVersion(3, nftBlobAssetX2V2)).toThrowError(
        `cannot be upgraded to V3`
      );
    });
  });
});
