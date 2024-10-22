# xcm-util

**xcm-util** is a package designed to provide tools for tedious actions needed to work with XCM, such as

- Upgrading and downgrading XCM entities such as locations, assets, and fungibilities.
- Comparing and sorting of assets.
  NOTE: The `VersionedAssets` must be sorted before encoding the extrinsic; **otherwise, the chain won't decode it**. This is a property of the `VersionedAssets` type (this type is usually the main parameter of a transfer extrinsic).
- Sanitizing XCM entities. The sanitizing functions provide better error reporting when an XCM entity is malformed. Also, they perform necessary conversions that PolkadotJS doesn't automatically, such as encoding the SS58 address into bytes for the `AccountId32` junction.

## Installation

TBD

## Usage

TBD

## Dependencies

- `@open-xcm-tools/xcm-types`