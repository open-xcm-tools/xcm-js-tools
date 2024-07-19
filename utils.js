export function fungibleAmount(value) {
    try {
        return BigInt(value);
    } catch {
        throw new Error(`unable to parse the fungible value: ${value}`);
    }
}

export function nonfungibleIndex(value) {
    try {
        return BigInt(value);
    } catch {
        throw new Error(`unable to parse the nonfungible index: ${value}`);
    }
}

export function nonfungibleArray(length, value) {
    switch (length) {
    case 4:
    case 8:
    case 16:
    case 32:
        // Pass
        break;

    default:
        throw new Error(`invalid nonfungible array length variant: ${length}`);
    }

    function invalidByteLength(byteLength) {
        throw new Error(`
            invalid nonfungible array parameter length:
                * value: ${value}
                * byte-length: ${byteLength}
                * expected byte-length: ${length}
        `);
    }

    const hexMatch = value.match(/^0x(?<numberPart>[0-9a-f]*)$/i);
    if (hexMatch) {
        const numberPart = hexMatch.groups.numberPart;
        const byteLength = Math.ceil(numberPart.length / 2);

        if (byteLength == length || byteLength == 0) {
            return value;
        } else {
            invalidByteLength(byteLength);
        }
    } else if (value.length == length) {
        return value;
    } else {
        invalidByteLength(value.length);
    }
}

function parseNonfungibleVariant(xcmVersion, value) {
    const match = value.match(/^(?<variant>\w+)((?<arg>\(.+\)))?$/);

    if (!match) {
        throw new Error(`unable to parse the nonfungible value: ${value}`);
    }

    const variant = match.groups.variant;
    const variantArg = match.groups.arg;

    variant = variant.toLowerCase();

    switch (variant) {
    case "undefined":
        if (!variantArg) {
            return { undefined: null };
        } else {
            throw new Error("nonfungible variant 'undefined' doesn't support arguments");
        }

    case "index":
        return {
            index: nonfungibleIndex(variantArg),
        };

    case "array4":
    case "array8":
    case "array16":
    case "array32":
        const arrayLength = parseInt(variant.slice("array".length));
        return {
            [variant]: nonfungibleArray(arrayLength, variantArg),
        };

    case "blob":
        if (xcmVersion < 3) {
            return {
                blob: variantArg,
            };
        } else {
            throw new Error(`the 'blob' nonfungible variant is invalid since XCM v3`);
        }

    default:
        throw new Error(`unknown nonfungible variant: ${variant}`);
    }
}

function parseAssetDescription(xcmVersion, assetDescription) {
    if (typeof assetDescription != "string") {
        throw new Error("an asset description must be a string");
    }


    if (!assetDescription.includes("?")) {
        throw new Error(`
            an asset description must include the fungibility parameter:
            e.g., '?fungible=VALUE' or '?nonfungible=index(INDEX)'
        `);
    }

    const assetDescriptionSplit = assetDescription.split("?");
    if (assetDescriptionSplit.length != 2) {
        throw Error("an asset description must have exactly one fungibility parameter");
    }

    const [ locationDescription, fungibilityParam ] = assetDescriptionSplit;
    const assetLocation = location(locationDescription);

    if (!fungibilityParam.includes("=")) {
        throw Error("the fungibility parameter must have a value");
    }
    const fungibilityParamSplit = fungibilityParam.split("=");

    if (fungibilityParamSplit.length != 2) {
        throw Error("the fungibility parameter must contain exactly one '=' sign");
    }

    const [ fungibility, value ] = fungibilityParamSplit;

    fungibility = fungibility.toLowerCase();
    if (fungibility == "fungible") {
        return {
            id: assetId(xcmVersion, assetLocation),
            fun: {
                fungible: fungibleAmount(value),
            },
        };
    } else if (fungibility == "nonfungible") {
        return {
            id: assetId(xcmVersion),
            fun: {
                nonfungible: parseNonfungibleVariant(xcmVersion, value),
            }
        };
    } else {
        throw Error(`${fungibility}: unknown fungibility, must be either 'fungible' or 'nonfungible'`);
    }
}

export function versioned(xcmVersion, entity) {
    return {
        ["V" + xcmVersion]: entity
    };
}

export function location(locationDescription) {
    // TODO
}

export function assetId(xcmVersion, location) {
    if (xcmVersion < 4) {
        return {
            concrete: location
        };
    } else {
        return location;
    }
}

export function versionedAssetId(xcmVersion, location) {
    return versioned(xcmVersion, assetId(xcmVersion, location));
}

export function asset(xcmVersion, assetDescription) {
    if (typeof description == "string") {
        return parseAssetDescription(xcmVersion, assetDescription);
    } else if (typeof description == "object") {
        // TODO check object validity
        return description;
    } else {
        throw new Error(`invalid type of the asset description: ${description}`);
    }
}

export function versionedAsset(xcmVersion, assetDescription) {
    return versioned(xcmVersion, asset(assetDescription));
}

export function assets(xcmVersion, assetDescriptions) {
    return assetDescriptions.map(description => asset(xcmVersion, description));
}

export function versionedAssets(xcmVersion, assetDescriptions) {
    return versioned(xcmVersion, assets(xcmVersion, assetDescriptions));
}
