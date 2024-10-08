## Roadmap

- [x] `xcm-types` package. It provides types for XCM entities of all XCM versions. Also, it offers auxiliary types for the rest of the packages.
- [x] `xcm-util` package. It provides tools for tedious actions needed to work with XCM, such as
  - [x] Upgrading and downgrading XCM entities such as locations, assets, and fungibilities.
  - [x] Comparing and sorting of assets.
        NOTE: The `VersionedAssets` must be sorted before encoding the extrinsic; **otherwise, the chain won't decode it**. This is a property of the `VersionedAssets` type (this type is usually the main parameter of a transfer extrinsic).
  - [x] Sanitizing XCM entities. The sanitizing functions provide better error reporting when an XCM entity is malformed. Also, they perform necessary conversions that PolkadotJS doesn't automatically, such as encoding the SS58 address into bytes for the `AccountId32` junction.
  - [x] Unit tests (and more might be added in the future).
  - [ ] Examples.
  - [ ] Documentation.
- [x] `xcm-estimate` package. It provides tools for estimating the XCM properties of a chain and the effects of XCM program execution.
  - [x] XCM version estimation of the chain.
  - [x] Total required fee estimation across all chains participating in an XCM execution by dry-running all the XCM programs
    - [x] Estimating fees when the fee asset is a part of the encoded transfer extrinsic.
          NOTE: Currently, there is a limitation. If the encoded transfer extrinsic doesn't have enough fee-asset fungibles, it will fail during dry-running. This is inconvenient, as the user still needs to ensure the minimal amount of fungibles by themselves. However, since the error is found during dry-running, the user avoids paying for the erroneous XCM execution (for instance, if the execution failed on the reserve chain, i.e., on the intermediate chain, and the assets got trapped).
    - [ ] Estimating fees when the fee asset is either not a part of the extrinsic encoded transfer or the extrinsic contains not enough amount.
  - [ ] Integration tests.
  - [ ] Examples.
  - [ ] Documentation.
- [x] `simple-xcm` package. It provides simplified usage of XCM. It uses all the packages above to provide a simple interface to the package's user.
  - [x] Unit tests (and more might be added in the future).
  - [ ] Integration tests.
  - [ ] Examples.
  - [ ] Documentation.
