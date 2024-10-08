import {VersionedAssets} from '@open-xcm-tools/xcm-types';
import {sortAndDeduplicateVersionedAssets} from '@open-xcm-tools/xcm-util';
import {describe, expect, test} from 'vitest';

describe('asset sort unit-tests', () => {
  describe('asset v2 sort', () => {
    test('one asset list', () => {
      const assetArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 100n},
          },
        ],
      };
      const expectedArray = {...assetArray};
      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated fungible', () => {
      const assetArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 100n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 100n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 250n},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 450n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 200n},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible', () => {
      const assetArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible + duplicated fungible', () => {
      const assetArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 350n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 350n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 150n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v2: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 150n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 700n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });
  });

  test('duplicated non-fungible (with blob) + duplicated fungible in random order', () => {
    const assetArray: VersionedAssets = {
      v2: [
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {nonFungible: {blob: new Uint8Array([10, 20, 30, 40])}},
        },
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {fungible: 200n},
        },
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {fungible: 200n},
        },
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {nonFungible: {blob: new Uint8Array([10, 20, 30, 40])}},
        },
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {fungible: 250n},
        },
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {nonFungible: {blob: new Uint8Array([10, 20, 30, 40])}},
        },
      ],
    };

    const expectedArray: VersionedAssets = {
      v2: [
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {fungible: 650n},
        },
        {
          id: {
            concrete: {
              parents: 1n,
              interior: 'here',
            },
          },
          fun: {nonFungible: {blob: new Uint8Array([10, 20, 30, 40])}},
        },
      ],
    };

    sortAndDeduplicateVersionedAssets(assetArray);
    expect(assetArray).toStrictEqual(expectedArray);
  });

  describe('asset v3 sort', () => {
    test('one asset list', () => {
      const assetArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 100n},
          },
        ],
      };
      const expectedArray = {...assetArray};
      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated fungible', () => {
      const assetArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 100n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 100n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 250n},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 450n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 200n},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible', () => {
      const assetArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible + duplicated fungible', () => {
      const assetArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 350n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 350n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 150n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2001n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 150n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {fungible: 700n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: {
                  x2: [{parachain: 2002n}, {generalIndex: 1002n}],
                },
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible + duplicated fungible in random order', () => {
      const assetArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 250n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v3: [
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {fungible: 650n},
          },
          {
            id: {
              concrete: {
                parents: 1n,
                interior: 'here',
              },
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });
  });

  describe('asset v4 sort', () => {
    test('one asset list', () => {
      const assetArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2001n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 100n},
          },
        ],
      };
      const expectedArray = {...assetArray};
      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated fungible', () => {
      const assetArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2001n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 100n},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2001n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 100n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {fungible: 250n},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },

            fun: {fungible: 450n},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2001n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 200n},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible', () => {
      const assetArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {nonFungible: 'undefined'},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible + duplicated fungible', () => {
      const assetArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 350n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {nonFungible: 'undefined'},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 350n},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2001n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 150n},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {nonFungible: {array4: new Uint8Array([10, 20, 30, 40])}},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2001n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 150n},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {fungible: 700n},
          },
          {
            id: {
              parents: 1n,
              interior: {
                x2: [{parachain: 2002n}, {generalIndex: 1002n}],
              },
            },
            fun: {nonFungible: 'undefined'},
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });

    test('duplicated non-fungible + duplicated fungible in random order', () => {
      const assetArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {fungible: 200n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {fungible: 250n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },
            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
        ],
      };

      const expectedArray: VersionedAssets = {
        v4: [
          {
            id: {
              parents: 1n,
              interior: 'here',
            },

            fun: {fungible: 650n},
          },
          {
            id: {
              parents: 1n,
              interior: 'here',
            },

            fun: {
              nonFungible: {
                array8: new Uint8Array([10, 20, 30, 40, 50, 60, 60, 50]),
              },
            },
          },
        ],
      };

      sortAndDeduplicateVersionedAssets(assetArray);
      expect(assetArray).toStrictEqual(expectedArray);
    });
  });
});
