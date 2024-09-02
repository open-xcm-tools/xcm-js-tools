import {describe, expect, it} from 'vitest';
import {Junction} from '../../src/xcmtypes';
import {sanitizeJunction} from '../../src/util';
import {JunctionValidationError} from '../../src/errors';

describe('junction validation tests', () => {
  describe('raw bytes tests', () => {
    it('valid: account id hex', () => {
      const junctionAccountId32HexValid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountId32HexValid),
      ).not.toThrowError();
    });

    it('invalid: account id hex length less than 64', () => {
      const junctionAccountId32HexInvalid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a6796a1f7e71328b501',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountId32HexInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: account id incorrect ascii data', () => {
      const junctionAccountId32IncorrectData: Junction = {
        accountId32: {
          id: 'ABSCDEF',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountId32IncorrectData),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: account key hex', () => {
      const junctionAccountKeyHexValid: Junction = {
        accountKey20: {
          key: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountKeyHexValid),
      ).not.toThrowError();
    });

    it('invalid: account key hex length greater than 40', () => {
      const junctionAccountKeyHexInvalid: Junction = {
        accountKey20: {
          key: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cca21',
        },
      };
      expect(() => sanitizeJunction(junctionAccountKeyHexInvalid)).toThrowError(
        JunctionValidationError,
      );
    });

    it('invalid: account key incorrect ascii data', () => {
      const junctionAccountKeyIncorrectData: Junction = {
        accountKey20: {
          key: '123456',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountKeyIncorrectData),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: general key hex', () => {
      const junctionGeneralKeyHexValid: Junction = {
        generalKey: {
          data: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          length: 32n,
        },
      };
      expect(() =>
        sanitizeJunction(junctionGeneralKeyHexValid),
      ).not.toThrowError();
    });

    it('invalid: general key hex length less than 64', () => {
      const junctionGeneralKeyHexInvalid: Junction = {
        generalKey: {
          data: '0x006ddf51dbc85ad5cd4a679376a1f7e71328b5',
          length: 32n,
        },
      };
      expect(() => sanitizeJunction(junctionGeneralKeyHexInvalid)).toThrowError(
        JunctionValidationError,
      );
    });

    it('invalid: general key incorrect ascii data', () => {
      const junctionGeneralKeyIncorrectData: Junction = {
        generalKey: {
          data: '123',
          length: 654n,
        },
      };
      expect(() =>
        sanitizeJunction(junctionGeneralKeyIncorrectData),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id by genesis hex', () => {
      const junctionNetworkIdByGenesisHexValid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byGenesis:
              '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByGenesisHexValid),
      ).not.toThrowError();
    });

    it('invalid: network id by genesis hex length less than 64', () => {
      const junctionNetworkIdByGenesisHexInvalid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byGenesis: '0x166cf9727d2191dd059f314a709727d7c9f690d56a2bdf6',
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByGenesisHexInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: network id by genesis incorrect ascii data', () => {
      const junctionNetworkIdByGenesisIncorrectDataInvalid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byGenesis: 'Unique',
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByGenesisIncorrectDataInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id by fork hex', () => {
      const junctionNetworkIdByForkHexValid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byFork: {
              blockHash:
                '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2n,
            },
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByForkHexValid),
      ).not.toThrowError();
    });

    it('invalid: network id by fork hex length less than 64', () => {
      const junctionNetworkIdByForkHexInvalid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byFork: {
              blockHash: '0x166cf9727d2191dd059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2n,
            },
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByForkHexInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: network id by fork incorrect ascii data', () => {
      const junctionNetworkIdByForkIncorrectDataInvalid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byFork: {blockHash: 'Unique', blockNumber: 2n},
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByForkIncorrectDataInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: body id moniker hex', () => {
      const junctionBodyIdMonikerHexValid: Junction = {
        plurality: {
          id: {
            moniker: '0x447ed0e1',
          },
          part: 'voice',
        },
      };
      expect(() =>
        sanitizeJunction(junctionBodyIdMonikerHexValid),
      ).not.toThrowError();
    });

    it('invalid: body id moniker hex length less than 8', () => {
      const junctionBodyIdMonikerHexInvalid: Junction = {
        plurality: {
          id: {
            moniker: '0x44d0e1',
          },
          part: 'voice',
        },
      };
      expect(() =>
        sanitizeJunction(junctionBodyIdMonikerHexInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: body id moniker incorrect ascii data', () => {
      const junctionBodyIdMonikerIncorrectDataInvalid: Junction = {
        plurality: {
          id: {
            moniker: 'ABD',
          },
          part: 'voice',
        },
      };
      expect(() =>
        sanitizeJunction(junctionBodyIdMonikerIncorrectDataInvalid),
      ).toThrowError(JunctionValidationError);
    });
  });

  describe('account id ascii address tests', () => {
    it('valid: account id ascii', () => {
      const junctionAccountId32TextValid: Junction = {
        accountId32: {
          id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountId32TextValid),
      ).not.toThrowError();
    });

    it('invalid: account id ascii', () => {
      const junctionAccountId32TextInvalid: Junction = {
        accountId32: {
          id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt6v2',
        },
      };
      expect(() =>
        sanitizeJunction(junctionAccountId32TextInvalid),
      ).toThrowError(JunctionValidationError);
    });
  });

  describe('max number in junction tests', () => {
    it('valid: parachain number', () => {
      const junctionParachainNumberValid: Junction = {
        parachain: 2001n,
      };
      expect(() =>
        sanitizeJunction(junctionParachainNumberValid),
      ).not.toThrowError();
    });

    it('invalid: parachain number', () => {
      const junctionParachainNumberInvalid: Junction = {
        parachain: 2n ** 50n,
      };
      expect(() =>
        sanitizeJunction(junctionParachainNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: account index 64 number', () => {
      const junctionAccountIndex64NumberValid: Junction = {
        accountIndex64: {index: 10002n},
      };
      expect(() =>
        sanitizeJunction(junctionAccountIndex64NumberValid),
      ).not.toThrowError();
    });

    it('invalid: account index 64 number', () => {
      const junctionAccountIndex64NumberInvalid: Junction = {
        accountIndex64: {index: 2n ** 128n + 1n},
      };
      expect(() =>
        sanitizeJunction(junctionAccountIndex64NumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: pallet instance number', () => {
      const junctionPalletInstanceNumberValid: Junction = {
        palletInstance: 2n ** 7n,
      };
      expect(() =>
        sanitizeJunction(junctionPalletInstanceNumberValid),
      ).not.toThrowError();
    });

    it('invalid: pallet instance number', () => {
      const junctionPalletInstanceNumberInvalid: Junction = {
        palletInstance: 2n ** 10n,
      };
      expect(() =>
        sanitizeJunction(junctionPalletInstanceNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: general index number', () => {
      const junctionGeneralIndexNumberValid: Junction = {
        generalIndex: 2n ** 127n + 1n,
      };
      expect(() =>
        sanitizeJunction(junctionGeneralIndexNumberValid),
      ).not.toThrowError();
    });

    it('invalid: general index number', () => {
      const junctionGeneralIndexNumberInvalid: Junction = {
        generalIndex: 2n ** 128n + 1n,
      };
      expect(() =>
        sanitizeJunction(junctionGeneralIndexNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id by fork block number', () => {
      const junctionNetworkIdByForkNumberValid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byFork: {
              blockHash:
                '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2n,
            },
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByForkNumberValid),
      ).not.toThrowError();
    });

    it('invalid: network id by fork block number', () => {
      const junctionNetworkIdByForkNumberInvalid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            byFork: {
              blockHash:
                '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2n ** 128n,
            },
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdByForkNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id ethereum chain id number', () => {
      const junctionNetworkIdEthereumNumberValid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ethereum: {
              chainId: 2001n,
            },
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdEthereumNumberValid),
      ).not.toThrowError();
    });

    it('invalid: network id ethereum chain id number', () => {
      const junctionNetworkIdEthereumNumberValid: Junction = {
        accountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ethereum: {
              chainId: 2n ** 128n,
            },
          },
        },
      };
      expect(() =>
        sanitizeJunction(junctionNetworkIdEthereumNumberValid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: plurality body part members number', () => {
      const junctionPluralityBodyPartMembersNumberValid: Junction = {
        plurality: {
          id: 'unit',
          part: {members: {count: 5n}},
        },
      };
      expect(() =>
        sanitizeJunction(junctionPluralityBodyPartMembersNumberValid),
      ).not.toThrowError();
    });

    it('invalid: plurality body part members number', () => {
      const junctionPluralityBodyPartMembersNumberInvalid: Junction = {
        plurality: {
          id: 'unit',
          part: {members: {count: 2n ** 32n}},
        },
      };
      expect(() =>
        sanitizeJunction(junctionPluralityBodyPartMembersNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('valid: plurality body part fraction nom & denom number', () => {
      const junctionPluralityBodyPartFractionNomNumberValid: Junction = {
        plurality: {
          id: 'unit',
          part: {fraction: {nom: 5n, denom: 5n}},
        },
      };
      expect(() =>
        sanitizeJunction(junctionPluralityBodyPartFractionNomNumberValid),
      ).not.toThrowError();
    });

    it('invalid: plurality body part fraction nom number', () => {
      const junctionPluralityBodyPartFractionNomNumberInvalid: Junction = {
        plurality: {
          id: 'unit',
          part: {fraction: {nom: 2n ** 32n, denom: 5n}},
        },
      };
      expect(() =>
        sanitizeJunction(junctionPluralityBodyPartFractionNomNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: plurality body part fraction denom number', () => {
      const junctionPluralityBodyPartFractionNomNumberInvalid: Junction = {
        plurality: {
          id: 'unit',
          part: {fraction: {nom: 5n, denom: 2n ** 32n}},
        },
      };
      expect(() =>
        sanitizeJunction(junctionPluralityBodyPartFractionNomNumberInvalid),
      ).toThrowError(JunctionValidationError);
    });
  });
});
