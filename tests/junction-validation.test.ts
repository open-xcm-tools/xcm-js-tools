import { describe, expect, it } from 'vitest';
import { Junction } from '../src/xcmtypes';
import { validateJunction } from '../src/util';
import { JunctionValidationError } from '../src/errors';

describe('junction validation tests', () => {
  describe('raw bytes tests', () => {
    it('valid: account id hex', () => {
      const junctionAccountId32HexValid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501'
        }
      };
      expect(() =>
        validateJunction(junctionAccountId32HexValid)
      ).not.toThrowError();
    });

    it('invalid: account id hex length less than 64', () => {
      const junctionAccountId32HexInvalid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a6796a1f7e71328b501'
        }
      };
      expect(() =>
        validateJunction(junctionAccountId32HexInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: account id incorrect ascii data', () => {
      const junctionAccountId32IncorrectData: Junction = {
        AccountId32: {
          id: 'ABSCDEF'
        }
      };
      expect(() =>
        validateJunction(junctionAccountId32IncorrectData)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: account key hex', () => {
      const junctionAccountKeyHexValid: Junction = {
        AccountKey20: {
          key: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc'
        }
      };
      expect(() =>
        validateJunction(junctionAccountKeyHexValid)
      ).not.toThrowError();
    });

    it('invalid: account key hex length greater than 40', () => {
      const junctionAccountKeyHexInvalid: Junction = {
        AccountKey20: {
          key: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cca21'
        }
      };
      expect(() => validateJunction(junctionAccountKeyHexInvalid)).toThrowError(
        JunctionValidationError
      );
    });

    it('invalid: account key incorrect ascii data', () => {
      const junctionAccountKeyIncorrectData: Junction = {
        AccountKey20: {
          key: '123456'
        }
      };
      expect(() =>
        validateJunction(junctionAccountKeyIncorrectData)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: general key hex', () => {
      const junctionGeneralKeyHexValid: Junction = {
        GeneralKey: {
          data: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          length: 32
        }
      };
      expect(() =>
        validateJunction(junctionGeneralKeyHexValid)
      ).not.toThrowError();
    });

    it('invalid: general key hex length less than 64', () => {
      const junctionGeneralKeyHexInvalid: Junction = {
        GeneralKey: {
          data: '0x006ddf51dbc85ad5cd4a679376a1f7e71328b5',
          length: 32
        }
      };
      expect(() => validateJunction(junctionGeneralKeyHexInvalid)).toThrowError(
        JunctionValidationError
      );
    });

    it('invalid: general key incorrect ascii data', () => {
      const junctionGeneralKeyIncorrectData: Junction = {
        GeneralKey: {
          data: '123',
          length: 654
        }
      };
      expect(() =>
        validateJunction(junctionGeneralKeyIncorrectData)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id by genesis hex', () => {
      const junctionNetworkIdByGenesisHexValid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByGenesis:
              '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6'
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByGenesisHexValid)
      ).not.toThrowError();
    });

    it('invalid: network id by genesis hex length less than 64', () => {
      const junctionNetworkIdByGenesisHexInvalid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByGenesis: '0x166cf9727d2191dd059f314a709727d7c9f690d56a2bdf6'
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByGenesisHexInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: network id by genesis incorrect ascii data', () => {
      const junctionNetworkIdByGenesisIncorrectDataInvalid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByGenesis: 'Unique'
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByGenesisIncorrectDataInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id by fork hex', () => {
      const junctionNetworkIdByForkHexValid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByFork: {
              blockHash:
                '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2
            }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByForkHexValid)
      ).not.toThrowError();
    });

    it('invalid: network id by fork hex length less than 64', () => {
      const junctionNetworkIdByForkHexInvalid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByFork: {
              blockHash: '0x166cf9727d2191dd059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2
            }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByForkHexInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: network id by fork incorrect ascii data', () => {
      const junctionNetworkIdByForkIncorrectDataInvalid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByFork: { blockHash: 'Unique', blockNumber: 2 }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByForkIncorrectDataInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: body id moniker hex', () => {
      const junctionBodyIdMonikerHexValid: Junction = {
        Plurality: {
          id: {
            Moniker: '0x447ed0e1'
          },
          part: 'Voice'
        }
      };
      expect(() =>
        validateJunction(junctionBodyIdMonikerHexValid)
      ).not.toThrowError();
    });

    it('invalid: body id moniker hex length less than 8', () => {
      const junctionBodyIdMonikerHexInvalid: Junction = {
        Plurality: {
          id: {
            Moniker: '0x44d0e1'
          },
          part: 'Voice'
        }
      };
      expect(() =>
        validateJunction(junctionBodyIdMonikerHexInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: body id moniker incorrect ascii data', () => {
      const junctionBodyIdMonikerIncorrectDataInvalid: Junction = {
        Plurality: {
          id: {
            Moniker: 'ABD'
          },
          part: 'Voice'
        }
      };
      expect(() =>
        validateJunction(junctionBodyIdMonikerIncorrectDataInvalid)
      ).toThrowError(JunctionValidationError);
    });
  });

  describe('account id ascii address tests', () => {
    it('valid: account id ascii', () => {
      const junctionAccountId32TextValid: Junction = {
        AccountId32: {
          id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt7v2'
        }
      };
      expect(() =>
        validateJunction(junctionAccountId32TextValid)
      ).not.toThrowError();
    });

    it('invalid: account id ascii', () => {
      const junctionAccountId32TextInvalid: Junction = {
        AccountId32: {
          id: '1LLF3L51WAHNtSmRvE2Y6UzGf9saNFz9d84pcUsAKZxt6v2'
        }
      };
      expect(() =>
        validateJunction(junctionAccountId32TextInvalid)
      ).toThrowError(JunctionValidationError);
    });
  });

  describe('max number in junction tests', () => {
    it('valid: parachain number', () => {
      const junctionParachainNumberValid: Junction = {
        Parachain: 2001
      };
      expect(() =>
        validateJunction(junctionParachainNumberValid)
      ).not.toThrowError();
    });

    it('invalid: parachain number', () => {
      const junctionParachainNumberInvalid: Junction = {
        Parachain: 2 ** 50
      };
      expect(() =>
        validateJunction(junctionParachainNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: account index 64 number', () => {
      const junctionAccountIndex64NumberValid: Junction = {
        AccountIndex64: { index: 10002 }
      };
      expect(() =>
        validateJunction(junctionAccountIndex64NumberValid)
      ).not.toThrowError();
    });

    it('invalid: account index 64 number', () => {
      const junctionAccountIndex64NumberInvalid: Junction = {
        AccountIndex64: { index: 2n ** 128n + 1n }
      };
      expect(() =>
        validateJunction(junctionAccountIndex64NumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: pallet instance number', () => {
      const junctionPalletInstanceNumberValid: Junction = {
        PalletInstance: 2 ** 7
      };
      expect(() =>
        validateJunction(junctionPalletInstanceNumberValid)
      ).not.toThrowError();
    });

    it('invalid: pallet instance number', () => {
      const junctionPalletInstanceNumberInvalid: Junction = {
        PalletInstance: 2 ** 10
      };
      expect(() =>
        validateJunction(junctionPalletInstanceNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: general index number', () => {
      const junctionGeneralIndexNumberValid: Junction = {
        GeneralIndex: 2n ** 127n + 1n
      };
      expect(() =>
        validateJunction(junctionGeneralIndexNumberValid)
      ).not.toThrowError();
    });

    it('invalid: general index number', () => {
      const junctionGeneralIndexNumberInvalid: Junction = {
        GeneralIndex: 2n ** 128n + 1n
      };
      expect(() =>
        validateJunction(junctionGeneralIndexNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id by fork block number', () => {
      const junctionNetworkIdByForkNumberValid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByFork: {
              blockHash:
                '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2
            }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByForkNumberValid)
      ).not.toThrowError();
    });

    it('invalid: network id by fork block number', () => {
      const junctionNetworkIdByForkNumberInvalid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            ByFork: {
              blockHash:
                '0x166cf9727d2191d4e4bd5e03fb8a3db5d059f314a709727d7c9f690d56a2bdf6',
              blockNumber: 2n ** 128n
            }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdByForkNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: network id ethereum chain id number', () => {
      const junctionNetworkIdEthereumNumberValid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            Ethereum: {
              chainId: 2001
            }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdEthereumNumberValid)
      ).not.toThrowError();
    });

    it('invalid: network id ethereum chain id number', () => {
      const junctionNetworkIdEthereumNumberValid: Junction = {
        AccountId32: {
          id: '0x006ddf51db56437ce5c886ab28cd767fc85ad5cc5d4a679376a1f7e71328b501',
          network: {
            Ethereum: {
              chainId: 2n ** 128n
            }
          }
        }
      };
      expect(() =>
        validateJunction(junctionNetworkIdEthereumNumberValid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: plurality body part members number', () => {
      const junctionPluralityBodyPartMembersNumberValid: Junction = {
        Plurality: {
          id: 'Unit',
          part: { Members: 5 }
        }
      };
      expect(() =>
        validateJunction(junctionPluralityBodyPartMembersNumberValid)
      ).not.toThrowError();
    });

    it('invalid: plurality body part members number', () => {
      const junctionPluralityBodyPartMembersNumberInvalid: Junction = {
        Plurality: {
          id: 'Unit',
          part: { Members: 2 ** 32 }
        }
      };
      expect(() =>
        validateJunction(junctionPluralityBodyPartMembersNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('valid: plurality body part fraction nom & denom number', () => {
      const junctionPluralityBodyPartFractionNomNumberValid: Junction = {
        Plurality: {
          id: 'Unit',
          part: { Fraction: { nom: 5, denom: 5 } }
        }
      };
      expect(() =>
        validateJunction(junctionPluralityBodyPartFractionNomNumberValid)
      ).not.toThrowError();
    });

    it('invalid: plurality body part fraction nom number', () => {
      const junctionPluralityBodyPartFractionNomNumberInvalid: Junction = {
        Plurality: {
          id: 'Unit',
          part: { Fraction: { nom: 2 ** 32, denom: 5 } }
        }
      };
      expect(() =>
        validateJunction(junctionPluralityBodyPartFractionNomNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });

    it('invalid: plurality body part fraction denom number', () => {
      const junctionPluralityBodyPartFractionNomNumberInvalid: Junction = {
        Plurality: {
          id: 'Unit',
          part: { Fraction: { nom: 5, denom: 2 ** 32 } }
        }
      };
      expect(() =>
        validateJunction(junctionPluralityBodyPartFractionNomNumberInvalid)
      ).toThrowError(JunctionValidationError);
    });
  });
});
