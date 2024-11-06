# XCM JS tools

The XCM JS tools aim to facilitate interaction with XCM-capable chains as generically and universally as possible through various XCM-related Runtime APIs.

The tools contain various utilities for XCM objects, such as version conversion, sanitizing, and deduplicating.
The most valuable among them is fee estimation utilities.

Estimating all the fees on all the chains required to perform a cross-chain transaction is a particularly important and challenging task. The tools contain several utilities for fee estimation. These utilities have different abstraction levels. The lower ones are better suited to be used in a library or an SDK, while the higher ones might be good for UI builders. The rest of the utilities are meant to support the primary goal of estimating fees. Yet, a lot of them are accessible and can be used independently.

## Motivation

### Covering XCM fees

When interacting with a chain, we usually know beforehand how much we have to pay for the transaction. At least we can get a pretty good estimation.

When using XCM, we can easily estimate only fees on the first chain where we start the cross-chain action. Essentially, we just estimate the first chain's native fee for the extrinsic, which starts the actual XCM execution.

However, there is at least one other chain where another part of our transaction will take place. The XCM program sent to another chain begins with a special instruction that buys the block space to execute the rest of the program. We must ensure that our XCM program carries enough fungibles to cover all the fees. Also, we need to know what fungible asset is acceptable as a fee asset since not every token in the universe may be eligible to pay fees on a given chain.

Estimating fees is especially important when doing asset transfers via XCM because if the sender doesn't include enough fee assets (or includes an invalid one), the XCM program might fail on a remote chain, causing assets to get trapped.
The asset recovering process might be cumbersome and tedious, potentially involving the governance of one of the chains.

This problem doesn't affect the transfers of large amounts of assets that are acceptable for paying the fees. However, it **does** affect transferring multiple currencies where one currency isn't a fee asset while the other is, and it is used solely for covering fees. If the user makes a mistake with the second one, all the assets will be trapped.
The same goes for transferring NFTs since it is just another instance of transferring multiple assets.

The fee estimation greatly mitigates the problem, possibly even solving it if the fees don't fluctuate much.

### Handling different XCM versions

Different chains might support different XCM versions. Dealing with various XCM versions on JS is challenging, especially if complex manipulations are needed, such as XCM location re-anchoring. Also, it is difficult to maintain complex logic for every possible XCM version; it is easier to work with only one and convert an object's version when necessary. Moreover, focusing on working with the most recent XCM version makes sense since most chains will gradually adopt it. Thus, even if some chains require XCM version conversions, it is temporary. 

The XCM JS tools contain utilities to convert XCM objects' versions easily. Furthermore, a more high-level package called `simple-xcm` provides interfaces using the most modern XCM version while automatically converting to the version the connected chain needs without any hustle.

## Structure

The XCM JS tools have a modular structure. It hosts packages of different abstraction levels.

* [`xcm-types`](https://github.com/open-xcm-tools/xcm-js-tools/tree/master/packages/xcm-types) - the most low-level package, which describes the XCM types of all versions.
* [`xcm-util`](https://github.com/open-xcm-tools/xcm-js-tools/tree/master/packages/xcm-util) - another low-level package, which contains functions to convert objects' XCM versions, sanitize their content, and perform other utility functions, such as sorting the XCM assets.

These low-level packages can be used independently. But they are also used in more high-level packages of this repository:
* [`xcm-estimate`](https://github.com/open-xcm-tools/xcm-js-tools/tree/master/packages/xcm-estimate) - this package's primary goal is to provide the means to estimate fees on all involved chains in reaction to a given extrinsic, which triggers XCM execution. It also offers additional estimating functions, such as estimating the maximal supported XCM version by the given chain or fetching the chain's list of fee asset IDs.
* [`simple-xcm`](https://github.com/open-xcm-tools/xcm-js-tools/tree/master/packages/simple-xcm) - this package is the most high-level one. It provides a simple interface for composing a transfer extrinsic for a given chain with automatic fee estimation. The distinctive feature of its interface is the usage of the most recent XCM version. The package's user can focus on working with an XCM object using the last XCM version. If necessary, the `simple-xcm` package converts to the actual version the chain needs automatically.

## Documentation and examples

You can find the docs and examples in the packages' README files and inside the doc comments in their code.
You can also check out the runnable examples in the [examples repository](https://github.com/open-xcm-tools/xcm-js-examples). This repository exhibits an example project setup and several runnable examples that use the XCM JS tools of different abstraction levels.

## Future improvements

Currently, there is a limitation on estimating fees. If the encoded transfer extrinsic doesn't have enough fee-asset fungibles, it will fail during dry-running. This is inconvenient, as the user still needs to ensure the minimal amount of fungibles by themselves. However, since the error is found during dry-running, the user avoids paying for the erroneous XCM execution (for instance, if the execution failed on the reserve chain, i.e., on the intermediate chain, and the assets got trapped).

In the future, when appropriate XCM Runtime APIs are available, this limitation should be lifted. The user would ask the `SimpleXcm` object to estimate fees, and the estimation would be completely independent of the assets embedded in the provided extrinsic.
