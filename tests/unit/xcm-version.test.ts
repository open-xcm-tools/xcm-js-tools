import {VersionedAsset, VersionedLocation} from '@open-xcm-tools/xcm-types';
import {
  convertAssetVersion,
  convertLocationVersion,
} from '@open-xcm-tools/xcm-util';
import {describe, expect, it} from 'vitest';

describe('xcm location tests', () => {
  const locationX1V5: VersionedLocation = {
    v5: {parents: 1n, interior: {x1: [{parachain: 2001n}]}},
  };

  const locationX2V5: VersionedLocation = {
    v5: {
      parents: 2n,
      interior: {
        x2: [{parachain: 2001n}, {generalIndex: 1002n}],
      },
    },
  };

  const locationX1BitcoinV5: VersionedLocation = {
    v5: {
      parents: 1n,
      interior: {
        x1: [{accountId32: {network: 'bitcoinCore', id: 'TEST'}}],
      },
    },
  };

  const locationX2PolkadotNetworkIdV5: VersionedLocation = {
    v5: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2RococoNetworkIdV5: VersionedLocation = {
    v5: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: {
                byGenesis:
                  '0x6408de7737c59c238890533af25896a2c20608d8b380bb01029acb392781063e',
              },
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2EthereumNetworkIdV5: VersionedLocation = {
    v5: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: {ethereum: {chainId: 2002n}},
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX3GlobalConsensusV5: VersionedLocation = {
    v5: {
      parents: 2n,
      interior: {
        x3: [
          {globalConsensus: 'polkadot'},
          {parachain: 2002n},
          {
            accountId32: {
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX1V4: VersionedLocation = {
    v4: {parents: 1n, interior: {x1: [{parachain: 2001n}]}},
  };

  const locationX2V4: VersionedLocation = {
    v4: {
      parents: 2n,
      interior: {
        x2: [{parachain: 2001n}, {generalIndex: 1002n}],
      },
    },
  };

  const locationX1BitcoinV4: VersionedLocation = {
    v4: {
      parents: 1n,
      interior: {
        x1: [{accountId32: {network: 'bitcoinCore', id: 'TEST'}}],
      },
    },
  };

  const locationX2PolkadotNetworkIdV4: VersionedLocation = {
    v4: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2RococoNetworkIdV4: VersionedLocation = {
    v4: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'rococo',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2RococoByGenesisNetworkIdV4: VersionedLocation = {
    v4: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: {
                byGenesis:
                  '0x6408de7737c59c238890533af25896a2c20608d8b380bb01029acb392781063e',
              },
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2EthereumNetworkIdV4: VersionedLocation = {
    v4: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: {ethereum: {chainId: 2002n}},
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX3GlobalConsensusV4: VersionedLocation = {
    v4: {
      parents: 2n,
      interior: {
        x3: [
          {globalConsensus: 'polkadot'},
          {parachain: 2002n},
          {
            accountId32: {
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX1V3: VersionedLocation = {
    v3: {parents: 1n, interior: {x1: {parachain: 2001n}}},
  };

  const locationX1BitcoinV3: VersionedLocation = {
    v3: {
      parents: 1n,
      interior: {x1: {accountId32: {network: 'bitcoinCore', id: 'TEST'}}},
    },
  };

  const locationX2V3: VersionedLocation = {
    v3: {
      parents: 2n,
      interior: {
        x2: [{parachain: 2001n}, {generalIndex: 1002n}],
      },
    },
  };

  const locationX2PolkadotNetworkIdV3: VersionedLocation = {
    v3: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2RococoNetworkIdV3: VersionedLocation = {
    v3: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'rococo',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2NullNetworkIdV3: VersionedLocation = {
    v3: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: null,
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2EthereumNetworkIdV3: VersionedLocation = {
    v3: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: {ethereum: {chainId: 2002n}},
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX3GlobalConsensusV3: VersionedLocation = {
    v3: {
      parents: 2n,
      interior: {
        x3: [
          {globalConsensus: 'polkadot'},
          {parachain: 2002n},
          {
            accountId32: {
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX1V2: VersionedLocation = {
    v2: {parents: 1n, interior: {x1: {parachain: 2001n}}},
  };

  const locationX2V2: VersionedLocation = {
    v2: {
      parents: 2n,
      interior: {
        x2: [{parachain: 2001n}, {generalIndex: 1002n}],
      },
    },
  };

  const locationX2PolkadotNetworkIdV2: VersionedLocation = {
    v2: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'polkadot',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  const locationX2AnyNetworkIdV2: VersionedLocation = {
    v2: {
      parents: 2n,
      interior: {
        x2: [
          {parachain: 2001n},
          {
            accountId32: {
              network: 'any',
              id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
            },
          },
        ],
      },
    },
  };

  describe('identity test for locations', () => {
    it('v5 identity test with versioned location', () => {
      expect(convertLocationVersion(5, locationX1V5)).toStrictEqual(
        locationX1V5,
      );
      expect(convertLocationVersion(5, locationX1BitcoinV5)).toStrictEqual(
        locationX1BitcoinV5,
      );
      expect(convertLocationVersion(5, locationX2V5)).toStrictEqual(
        locationX2V5,
      );
      expect(
        convertLocationVersion(5, locationX2PolkadotNetworkIdV5),
      ).toStrictEqual(locationX2PolkadotNetworkIdV5);
      expect(
        convertLocationVersion(5, locationX2EthereumNetworkIdV5),
      ).toStrictEqual(locationX2EthereumNetworkIdV5);
      expect(
        convertLocationVersion(5, locationX3GlobalConsensusV5),
      ).toStrictEqual(locationX3GlobalConsensusV5);
    });

    it('v5 identity test with non-versioned location', () => {
      expect(convertLocationVersion(5, locationX1V5.v5)).toStrictEqual(
        locationX1V5,
      );
      expect(convertLocationVersion(5, locationX1BitcoinV5.v5)).toStrictEqual(
        locationX1BitcoinV5,
      );
      expect(convertLocationVersion(5, locationX2V5.v5)).toStrictEqual(
        locationX2V5,
      );
      expect(
        convertLocationVersion(5, locationX2PolkadotNetworkIdV5.v5),
      ).toStrictEqual(locationX2PolkadotNetworkIdV5);
      expect(
        convertLocationVersion(5, locationX2EthereumNetworkIdV5.v5),
      ).toStrictEqual(locationX2EthereumNetworkIdV5);
      expect(
        convertLocationVersion(5, locationX3GlobalConsensusV5.v5),
      ).toStrictEqual(locationX3GlobalConsensusV5);
    });

    it('v4 identity test with versioned location', () => {
      expect(convertLocationVersion(4, locationX1V4)).toStrictEqual(
        locationX1V4,
      );
      expect(convertLocationVersion(4, locationX1BitcoinV4)).toStrictEqual(
        locationX1BitcoinV4,
      );
      expect(convertLocationVersion(4, locationX2V4)).toStrictEqual(
        locationX2V4,
      );
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV4),
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV4),
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV4),
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });

    it('v3 identity test with versioned location', () => {
      expect(convertLocationVersion(3, locationX1V3)).toStrictEqual(
        locationX1V3,
      );
      expect(convertLocationVersion(3, locationX1BitcoinV3)).toStrictEqual(
        locationX1BitcoinV3,
      );
      expect(convertLocationVersion(3, locationX2V3)).toStrictEqual(
        locationX2V3,
      );
      expect(
        convertLocationVersion(3, locationX2PolkadotNetworkIdV3),
      ).toStrictEqual(locationX2PolkadotNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX2EthereumNetworkIdV3),
      ).toStrictEqual(locationX2EthereumNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX3GlobalConsensusV3),
      ).toStrictEqual(locationX3GlobalConsensusV3);
    });

    it('v2 identity test with versioned location', () => {
      expect(convertLocationVersion(2, locationX1V2)).toStrictEqual(
        locationX1V2,
      );
      expect(convertLocationVersion(2, locationX2V2)).toStrictEqual(
        locationX2V2,
      );
      expect(
        convertLocationVersion(2, locationX2PolkadotNetworkIdV2),
      ).toStrictEqual(locationX2PolkadotNetworkIdV2);
    });
  });

  describe('create location versions from non-versioned location', () => {
    it('v4 test create with non-versioned location', () => {
      expect(convertLocationVersion(4, locationX1V5.v5)).toStrictEqual(
        locationX1V4,
      );
      expect(convertLocationVersion(4, locationX1BitcoinV5.v5)).toStrictEqual(
        locationX1BitcoinV4,
      );
      expect(convertLocationVersion(4, locationX2V5.v5)).toStrictEqual(
        locationX2V4,
      );
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV5.v5),
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV5.v5),
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV5.v5),
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });

    it('v3 test create with non-versioned location', () => {
      expect(convertLocationVersion(3, locationX1V5.v5)).toStrictEqual(
        locationX1V3,
      );
      expect(convertLocationVersion(3, locationX1BitcoinV5.v5)).toStrictEqual(
        locationX1BitcoinV3,
      );
      expect(convertLocationVersion(3, locationX2V5.v5)).toStrictEqual(
        locationX2V3,
      );
      expect(
        convertLocationVersion(3, locationX2PolkadotNetworkIdV5.v5),
      ).toStrictEqual(locationX2PolkadotNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX2EthereumNetworkIdV5.v5),
      ).toStrictEqual(locationX2EthereumNetworkIdV3);
      expect(
        convertLocationVersion(3, locationX3GlobalConsensusV5.v5),
      ).toStrictEqual(locationX3GlobalConsensusV3);
    });

    it('v2 test create with non-versioned location', () => {
      expect(convertLocationVersion(2, locationX1V5.v5)).toStrictEqual(
        locationX1V2,
      );
      expect(convertLocationVersion(2, locationX2V5.v5)).toStrictEqual(
        locationX2V2,
      );
      expect(
        convertLocationVersion(2, locationX2PolkadotNetworkIdV5.v5),
      ).toStrictEqual(locationX2PolkadotNetworkIdV2);
    });
  });

  describe('location convert v5->v4', () => {
    it('v5->v4: location x1', () => {
      expect(convertLocationVersion(4, locationX1V5)).toStrictEqual(
        locationX1V4,
      );
    });

    it('v5->v4: location x1 bitcoin', () => {
      expect(convertLocationVersion(4, locationX1BitcoinV5)).toStrictEqual(
        locationX1BitcoinV4,
      );
    });

    it('v5->v4: location x2', () => {
      expect(convertLocationVersion(4, locationX2V5)).toStrictEqual(
        locationX2V4,
      );
    });

    it('v5->v4: location x2 polkadot network id', () => {
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV5),
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
    });

    it('v5->v4: location x2 rococo network id', () => {
      expect(
        convertLocationVersion(4, locationX2RococoNetworkIdV5),
      ).toStrictEqual(locationX2RococoByGenesisNetworkIdV4);
    });

    it('v5->v4: location x2 ethereum network id', () => {
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV5),
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
    });

    it('v5->v4: location x3 global consensus', () => {
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV5),
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });
  });

  describe('location convert v4->v5', () => {
    it('v4->v5: location x1', () => {
      expect(convertLocationVersion(5, locationX1V4)).toStrictEqual(
        locationX1V5,
      );
    });

    it('v4->v5: location x1 bitcoin', () => {
      expect(convertLocationVersion(5, locationX1BitcoinV4)).toStrictEqual(
        locationX1BitcoinV5,
      );
    });

    it('v4->v5: location x2', () => {
      expect(convertLocationVersion(5, locationX2V4)).toStrictEqual(
        locationX2V5,
      );
    });

    it('v4->v5: location x2 polkadot network id', () => {
      expect(
        convertLocationVersion(5, locationX2PolkadotNetworkIdV4),
      ).toStrictEqual(locationX2PolkadotNetworkIdV5);
    });

    it('v4->v5: location x2 rococo network id', () => {
      expect(
        convertLocationVersion(5, locationX2RococoNetworkIdV4),
      ).toStrictEqual(locationX2RococoNetworkIdV5);
    });

    it('v4->v5: location x2 ethereum network id', () => {
      expect(
        convertLocationVersion(5, locationX2EthereumNetworkIdV4),
      ).toStrictEqual(locationX2EthereumNetworkIdV5);
    });

    it('v4->v5: location x3 global consensus', () => {
      expect(
        convertLocationVersion(5, locationX3GlobalConsensusV4),
      ).toStrictEqual(locationX3GlobalConsensusV5);
    });
  });

  describe('location convert v4->v3', () => {
    it('v4->v3: location x1', () => {
      expect(convertLocationVersion(3, locationX1V4)).toStrictEqual(
        locationX1V3,
      );
    });

    it('v4->v3: location x1 bitcoin', () => {
      expect(convertLocationVersion(3, locationX1BitcoinV4)).toStrictEqual(
        locationX1BitcoinV3,
      );
    });

    it('v4->v3: location x2', () => {
      expect(convertLocationVersion(3, locationX2V4)).toStrictEqual(
        locationX2V3,
      );
    });

    it('v4->v3: location x2 v4->v3 polkadot network id', () => {
      expect(
        convertLocationVersion(3, locationX2PolkadotNetworkIdV4),
      ).toStrictEqual(locationX2PolkadotNetworkIdV3);
    });

    it('v4->v3: location x2 ethereum network id', () => {
      expect(
        convertLocationVersion(3, locationX2EthereumNetworkIdV4),
      ).toStrictEqual(locationX2EthereumNetworkIdV3);
    });

    it('v4->v3: location x3 global consensus', () => {
      expect(
        convertLocationVersion(3, locationX3GlobalConsensusV4),
      ).toStrictEqual(locationX3GlobalConsensusV3);
    });
  });

  describe('location convert v3->v4', () => {
    it('v3->v4: location x1', () => {
      expect(convertLocationVersion(4, locationX1V3)).toStrictEqual(
        locationX1V4,
      );
    });

    it('v3->v4: location x1 bitcoin', () => {
      expect(convertLocationVersion(4, locationX1BitcoinV3)).toStrictEqual(
        locationX1BitcoinV4,
      );
    });

    it('v3->v4: location x2', () => {
      expect(convertLocationVersion(4, locationX2V3)).toStrictEqual(
        locationX2V4,
      );
    });

    it('v3->v4: location x2 polkadot network id', () => {
      expect(
        convertLocationVersion(4, locationX2PolkadotNetworkIdV3),
      ).toStrictEqual(locationX2PolkadotNetworkIdV4);
    });

    it('v3->v4: location x2 ethereum network id', () => {
      expect(
        convertLocationVersion(4, locationX2EthereumNetworkIdV3),
      ).toStrictEqual(locationX2EthereumNetworkIdV4);
    });

    it('v3->v4: location x3 global consensus', () => {
      expect(
        convertLocationVersion(4, locationX3GlobalConsensusV3),
      ).toStrictEqual(locationX3GlobalConsensusV4);
    });
  });

  describe('location convert v3->v2', () => {
    it('v3->v2: location x1', () => {
      expect(convertLocationVersion(2, locationX1V3)).toStrictEqual(
        locationX1V2,
      );
    });

    it('v3->v2: location x1 bitcoin', () => {
      expect(() => convertLocationVersion(2, locationX1BitcoinV3)).toThrowError(
        "V2 network ID doesn't include",
      );
    });

    it('v3->v2: location x2', () => {
      expect(convertLocationVersion(2, locationX2V3)).toStrictEqual(
        locationX2V2,
      );
    });

    it('v3->v2: location x2 polkadot network id', () => {
      expect(
        convertLocationVersion(2, locationX2PolkadotNetworkIdV3),
      ).toStrictEqual(locationX2PolkadotNetworkIdV2);
    });

    it('v3->v2: location x2 rococo network id', () => {
      expect(() =>
        convertLocationVersion(2, locationX2RococoNetworkIdV3),
      ).toThrowError("V2 network ID doesn't include");
    });

    it('v3->v2: location x2 ethereum network id', () => {
      expect(() =>
        convertLocationVersion(2, locationX2EthereumNetworkIdV3),
      ).toThrowError("V2 network ID doesn't include");
    });

    it('v3->v2: location x3 global consensus', () => {
      expect(() =>
        convertLocationVersion(2, locationX3GlobalConsensusV3),
      ).toThrowError("V2 junctions don't include");
    });

    it('v3->v2: location x2 null network id', () => {
      expect(
        convertLocationVersion(2, locationX2NullNetworkIdV3),
      ).toStrictEqual(locationX2AnyNetworkIdV2);
    });
  });

  describe('location convert v2->v3', () => {
    it('v2->v3: location x1', () => {
      expect(convertLocationVersion(3, locationX1V2)).toStrictEqual(
        locationX1V3,
      );
    });

    it('v2->v3: location x2', () => {
      expect(convertLocationVersion(3, locationX2V2)).toStrictEqual(
        locationX2V3,
      );
    });

    it('v2->v3: location x2 any network id', () => {
      expect(convertLocationVersion(3, locationX2AnyNetworkIdV2)).toStrictEqual(
        locationX2NullNetworkIdV3,
      );
    });
  });
});

describe('asset xcm tests', () => {
  const ftAssetV5: VersionedAsset = {
    v5: {id: {parents: 0n, interior: 'here'}, fun: {fungible: 1000n}},
  };

  const nftAssetV5: VersionedAsset = {
    v5: {
      id: {parents: 0n, interior: 'here'},
      fun: {nonFungible: 'undefined'},
    },
  };

  const ftAssetX1V5: VersionedAsset = {
    v5: {
      id: {parents: 1n, interior: {x1: [{parachain: 2001n}]}},
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2V5: VersionedAsset = {
    v5: {
      id: {
        parents: 3n,
        interior: {
          x2: [{parachain: 2001n}, {generalIndex: 1002n}],
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2GlobalConsensusV5: VersionedAsset = {
    v5: {
      id: {
        parents: 2n,
        interior: {
          x2: [{globalConsensus: 'polkadot'}, {parachain: 2002n}],
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const ftAssetV4: VersionedAsset = {
    v4: {id: {parents: 0n, interior: 'here'}, fun: {fungible: 1000n}},
  };

  const nftAssetV4: VersionedAsset = {
    v4: {
      id: {parents: 0n, interior: 'here'},
      fun: {nonFungible: 'undefined'},
    },
  };

  const ftAssetX1V4: VersionedAsset = {
    v4: {
      id: {parents: 1n, interior: {x1: [{parachain: 2001n}]}},
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2V4: VersionedAsset = {
    v4: {
      id: {
        parents: 3n,
        interior: {
          x2: [{parachain: 2001n}, {generalIndex: 1002n}],
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2GlobalConsensusV4: VersionedAsset = {
    v4: {
      id: {
        parents: 2n,
        interior: {
          x2: [{globalConsensus: 'polkadot'}, {parachain: 2002n}],
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const ftAssetV3: VersionedAsset = {
    v3: {
      id: {concrete: {parents: 0n, interior: 'here'}},
      fun: {fungible: 1000n},
    },
  };

  const nftAssetV3: VersionedAsset = {
    v3: {
      id: {
        concrete: {parents: 0n, interior: 'here'},
      },
      fun: {nonFungible: 'undefined'},
    },
  };

  const ftAssetX1V3: VersionedAsset = {
    v3: {
      id: {concrete: {parents: 1n, interior: {x1: {parachain: 2001n}}}},
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2V3: VersionedAsset = {
    v3: {
      id: {
        concrete: {
          parents: 3n,
          interior: {
            x2: [{parachain: 2001n}, {generalIndex: 1002n}],
          },
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2GlobalConsensusV3: VersionedAsset = {
    v3: {
      id: {
        concrete: {
          parents: 2n,
          interior: {
            x2: [{globalConsensus: 'polkadot'}, {parachain: 2002n}],
          },
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const ftAssetV2: VersionedAsset = {
    v2: {
      id: {concrete: {parents: 0n, interior: 'here'}},
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX1V2: VersionedAsset = {
    v2: {
      id: {concrete: {parents: 1n, interior: {x1: {parachain: 2001n}}}},
      fun: {fungible: 1000n},
    },
  };

  const ftAssetX2V2: VersionedAsset = {
    v2: {
      id: {
        concrete: {
          parents: 3n,
          interior: {
            x2: [{parachain: 2001n}, {generalIndex: 1002n}],
          },
        },
      },
      fun: {fungible: 1000n},
    },
  };

  const nftAssetV2: VersionedAsset = {
    v2: {
      id: {
        concrete: {parents: 0n, interior: 'here'},
      },
      fun: {nonFungible: 'undefined'},
    },
  };

  const nftBlobAssetX2V2: VersionedAsset = {
    v2: {
      id: {
        concrete: {
          parents: 3n,
          interior: {
            x2: [{parachain: 2001n}, {generalIndex: 1002n}],
          },
        },
      },
      fun: {nonFungible: {blob: 'blob'}},
    },
  };

  describe('identity test for assets', () => {
    it('v5 identity test with non-versioned asset', () => {
      expect(convertAssetVersion(5, ftAssetV5.v5)).toStrictEqual(ftAssetV5);
      expect(convertAssetVersion(5, ftAssetX1V5.v5)).toStrictEqual(ftAssetX1V5);
      expect(convertAssetVersion(5, ftAssetX2V5.v5)).toStrictEqual(ftAssetX2V5);
      expect(convertAssetVersion(5, nftAssetV5.v5)).toStrictEqual(nftAssetV5);
      expect(
        convertAssetVersion(5, ftAssetX2GlobalConsensusV5.v5),
      ).toStrictEqual(ftAssetX2GlobalConsensusV5);
    });

    it('v5 identity test with versioned asset', () => {
      expect(convertAssetVersion(5, ftAssetV5)).toStrictEqual(ftAssetV5);
      expect(convertAssetVersion(5, ftAssetX1V5)).toStrictEqual(ftAssetX1V5);
      expect(convertAssetVersion(5, ftAssetX2V5)).toStrictEqual(ftAssetX2V5);
      expect(convertAssetVersion(5, nftAssetV5)).toStrictEqual(nftAssetV5);
      expect(convertAssetVersion(5, ftAssetX2GlobalConsensusV5)).toStrictEqual(
        ftAssetX2GlobalConsensusV5,
      );
    });

    it('v4 identity test with versioned asset', () => {
      expect(convertAssetVersion(4, ftAssetV4)).toStrictEqual(ftAssetV4);
      expect(convertAssetVersion(4, ftAssetX1V4)).toStrictEqual(ftAssetX1V4);
      expect(convertAssetVersion(4, ftAssetX2V4)).toStrictEqual(ftAssetX2V4);
      expect(convertAssetVersion(4, nftAssetV4)).toStrictEqual(nftAssetV4);
      expect(convertAssetVersion(4, ftAssetX2GlobalConsensusV4)).toStrictEqual(
        ftAssetX2GlobalConsensusV4,
      );
    });

    it('v4 identity test with versioned asset', () => {
      expect(convertAssetVersion(4, ftAssetV4)).toStrictEqual(ftAssetV4);
      expect(convertAssetVersion(4, ftAssetX1V4)).toStrictEqual(ftAssetX1V4);
      expect(convertAssetVersion(4, ftAssetX2V4)).toStrictEqual(ftAssetX2V4);
      expect(convertAssetVersion(4, nftAssetV4)).toStrictEqual(nftAssetV4);
      expect(convertAssetVersion(4, ftAssetX2GlobalConsensusV4)).toStrictEqual(
        ftAssetX2GlobalConsensusV4,
      );
    });

    it('v3 identity test with versioned asset', () => {
      expect(convertAssetVersion(3, ftAssetV3)).toStrictEqual(ftAssetV3);
      expect(convertAssetVersion(3, ftAssetX1V3)).toStrictEqual(ftAssetX1V3);
      expect(convertAssetVersion(3, ftAssetX2V3)).toStrictEqual(ftAssetX2V3);
      expect(convertAssetVersion(3, nftAssetV3)).toStrictEqual(nftAssetV3);
      expect(convertAssetVersion(3, ftAssetX2GlobalConsensusV3)).toStrictEqual(
        ftAssetX2GlobalConsensusV3,
      );
    });

    it('v2 identity test with versioned asset', () => {
      expect(convertAssetVersion(2, ftAssetV2)).toStrictEqual(ftAssetV2);
      expect(convertAssetVersion(2, ftAssetX1V2)).toStrictEqual(ftAssetX1V2);
      expect(convertAssetVersion(2, ftAssetX2V2)).toStrictEqual(ftAssetX2V2);
      expect(convertAssetVersion(2, nftAssetV2)).toStrictEqual(nftAssetV2);
      expect(convertAssetVersion(2, nftBlobAssetX2V2)).toStrictEqual(
        nftBlobAssetX2V2,
      );
    });
  });

  describe('create asset versions from non-versioned asset', () => {
    it('v4 test create with non-versioned asset', () => {
      expect(convertAssetVersion(4, ftAssetV5.v5)).toStrictEqual(ftAssetV4);
      expect(convertAssetVersion(4, ftAssetX1V5.v5)).toStrictEqual(ftAssetX1V4);
      expect(convertAssetVersion(4, ftAssetX2V5.v5)).toStrictEqual(ftAssetX2V4);
      expect(convertAssetVersion(4, nftAssetV5.v5)).toStrictEqual(nftAssetV4);
      expect(
        convertAssetVersion(4, ftAssetX2GlobalConsensusV5.v5),
      ).toStrictEqual(ftAssetX2GlobalConsensusV4);
    });

    it('v3 test create with non-versioned asset', () => {
      expect(convertAssetVersion(3, ftAssetV5.v5)).toStrictEqual(ftAssetV3);
      expect(convertAssetVersion(3, ftAssetX1V5.v5)).toStrictEqual(ftAssetX1V3);
      expect(convertAssetVersion(3, ftAssetX2V5.v5)).toStrictEqual(ftAssetX2V3);
      expect(convertAssetVersion(3, nftAssetV5.v5)).toStrictEqual(nftAssetV3);
      expect(
        convertAssetVersion(3, ftAssetX2GlobalConsensusV5.v5),
      ).toStrictEqual(ftAssetX2GlobalConsensusV3);
    });

    it('v2 test create with non-versioned asset', () => {
      expect(convertAssetVersion(2, ftAssetV5.v5)).toStrictEqual(ftAssetV2);
      expect(convertAssetVersion(2, ftAssetX1V5.v5)).toStrictEqual(ftAssetX1V2);
      expect(convertAssetVersion(2, ftAssetX2V5.v5)).toStrictEqual(ftAssetX2V2);
      expect(convertAssetVersion(2, nftAssetV5.v5)).toStrictEqual(nftAssetV2);
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
        ftAssetX2GlobalConsensusV3,
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
        ftAssetX2GlobalConsensusV4,
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
        convertAssetVersion(2, ftAssetX2GlobalConsensusV4),
      ).toThrowError("V2 junctions don't include");
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
        'cannot be upgraded to v3',
      );
    });
  });
});
