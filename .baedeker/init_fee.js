"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var api_1 = require("@polkadot/api");
void (function () { return __awaiter(void 0, void 0, void 0, function () {
    var BDK_URL, INTERVAL, providerRelay, providerAssetHubA, providerAssetHubB, providerAssetHubC, apiRelay, apiAssetHubA, apiAssetHubB, apiAssetHubC, keyring, alice, hrmp, asset, foreignAsset;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                BDK_URL = process.env.BDK_BALANCER.replace('http', 'ws');
                INTERVAL = 10000;
                providerRelay = new api_1.WsProvider("".concat(BDK_URL, "/relay/"));
                providerAssetHubA = new api_1.WsProvider("".concat(BDK_URL, "/relay-assethubA/"));
                providerAssetHubB = new api_1.WsProvider("".concat(BDK_URL, "/relay-assethubB/"));
                providerAssetHubC = new api_1.WsProvider("".concat(BDK_URL, "/relay-assethubC/"));
                return [4 /*yield*/, api_1.ApiPromise.create({ provider: providerRelay })];
            case 1:
                apiRelay = _a.sent();
                return [4 /*yield*/, api_1.ApiPromise.create({ provider: providerAssetHubA })];
            case 2:
                apiAssetHubA = _a.sent();
                return [4 /*yield*/, api_1.ApiPromise.create({ provider: providerAssetHubB })];
            case 3:
                apiAssetHubB = _a.sent();
                return [4 /*yield*/, api_1.ApiPromise.create({ provider: providerAssetHubC })];
            case 4:
                apiAssetHubC = _a.sent();
                keyring = new api_1.Keyring({ type: 'sr25519' });
                alice = keyring.addFromUri('//Alice');
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2001, 2002, 8, 8192))
                        .signAndSend(alice)];
            case 5:
                hrmp = _a.sent();
                console.log('Hrmp channel for 2001 and 2002 opened!');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 6:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2002, 2001, 8, 8192))
                        .signAndSend(alice)];
            case 7:
                hrmp = _a.sent();
                console.log('Hrmp channel for 2002 and 2001 opened!');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 8:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2001, 2003, 8, 8192))
                        .signAndSend(alice)];
            case 9:
                hrmp = _a.sent();
                console.log('Hrmp channel for 2001 and 2003 opened!');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 10:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2003, 2001, 8, 8192))
                        .signAndSend(alice)];
            case 11:
                hrmp = _a.sent();
                console.log('Hrmp channel for 2003 and 2001 opened!');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 12:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2003, 2002, 8, 8192))
                        .signAndSend(alice)];
            case 13:
                hrmp = _a.sent();
                console.log('Hrmp channel for 2003 and 2002 opened!');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 14:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.hrmp.forceOpenHrmpChannel(2002, 2003, 8, 8192))
                        .signAndSend(alice)];
            case 15:
                hrmp = _a.sent();
                console.log('Hrmp channel for 2002 and 2003 opened!');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, 60000); })];
            case 16:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.xcmPallet.send({
                        V4: {
                            parents: 0,
                            interior: {
                                X1: [
                                    {
                                        Parachain: 2001,
                                    },
                                ],
                            },
                        },
                    }, {
                        V4: [
                            {
                                UnpaidExecution: {
                                    weightLimit: 'Unlimited',
                                },
                            },
                            {
                                Transact: {
                                    originKind: 'Superuser',
                                    requireWeightAtMost: {
                                        refTime: 8000000000,
                                        proofSize: 8000,
                                    },
                                    call: {
                                        encoded: '0x3201011f00d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0104',
                                    },
                                },
                            },
                        ],
                    }))
                        .signAndSend(alice)];
            case 17:
                asset = _a.sent();
                console.log('Asset created on AssetHubA');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 18:
                _a.sent();
                return [4 /*yield*/, apiAssetHubA.tx.assets
                        .setMetadata(1984, 'USDT', 'USDT', 6)
                        .signAndSend(alice)];
            case 19:
                asset = _a.sent();
                console.log('Asset metadata on AssetHubA');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 20:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.xcmPallet.send({
                        V4: {
                            parents: 0,
                            interior: {
                                X1: [
                                    {
                                        Parachain: 2002,
                                    },
                                ],
                            },
                        },
                    }, {
                        V4: [
                            {
                                UnpaidExecution: {
                                    weightLimit: 'Unlimited',
                                },
                            },
                            {
                                Transact: {
                                    originKind: 'Superuser',
                                    requireWeightAtMost: {
                                        refTime: 8000000000,
                                        proofSize: 8000,
                                    },
                                    call: {
                                        encoded: '0x3501010300451f043205011f00d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0104',
                                    },
                                },
                            },
                        ],
                    }))
                        .signAndSend(alice)];
            case 21:
                asset = _a.sent();
                console.log('Asset created on AssetHubB');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 22:
                _a.sent();
                return [4 /*yield*/, apiAssetHubB.tx.foreignAssets
                        .setMetadata({
                        parents: 1,
                        interior: {
                            X3: [{ Parachain: 2001 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }],
                        },
                    }, 'USDT', 'USDT', 6)
                        .signAndSend(alice)];
            case 23:
                foreignAsset = _a.sent();
                console.log('Asset metadata on AssetHubB');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 24:
                _a.sent();
                return [4 /*yield*/, apiRelay.tx.sudo
                        .sudo(apiRelay.tx.xcmPallet.send({
                        V4: {
                            parents: 0,
                            interior: {
                                X1: [
                                    {
                                        Parachain: 2003,
                                    },
                                ],
                            },
                        },
                    }, {
                        V4: [
                            {
                                UnpaidExecution: {
                                    weightLimit: 'Unlimited',
                                },
                            },
                            {
                                Transact: {
                                    originKind: 'Superuser',
                                    requireWeightAtMost: {
                                        refTime: 8000000000,
                                        proofSize: 8000,
                                    },
                                    call: {
                                        encoded: '0x3501010300451f043205011f00d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0104',
                                    },
                                },
                            },
                        ],
                    }))
                        .signAndSend(alice)];
            case 25:
                asset = _a.sent();
                console.log('Asset created on AssetHubC');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 26:
                _a.sent();
                return [4 /*yield*/, apiAssetHubC.tx.foreignAssets
                        .setMetadata({
                        parents: 1,
                        interior: {
                            X3: [{ Parachain: 2001 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }],
                        },
                    }, 'USDT', 'USDT', 6)
                        .signAndSend(alice)];
            case 27:
                foreignAsset = _a.sent();
                console.log('Asset metadata on AssetHubC');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 28:
                _a.sent();
                return [4 /*yield*/, apiAssetHubA.tx.assets
                        .mint(1984, { id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' }, 150000000)
                        .signAndSend(alice)];
            case 29:
                _a.sent();
                console.log('Tokens minted for AssetHubA');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 30:
                _a.sent();
                return [4 /*yield*/, apiAssetHubA.tx.assets
                        .mint(1984, { id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' }, 250000000)
                        .signAndSend(alice)];
            case 31:
                _a.sent();
                console.log('Tokens minted for AssetHubA');
                return [4 /*yield*/, apiAssetHubB.tx.foreignAssets
                        .mint({
                        parents: 1,
                        interior: {
                            X3: [{ Parachain: 2001 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }],
                        },
                    }, { id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' }, 50000000)
                        .signAndSend(alice)];
            case 32:
                _a.sent();
                console.log('Tokens minted for AssetHubB');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 33:
                _a.sent();
                return [4 /*yield*/, apiAssetHubB.tx.foreignAssets
                        .mint({
                        parents: 1,
                        interior: {
                            X3: [{ Parachain: 2001 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }],
                        },
                    }, { id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' }, 150000000)
                        .signAndSend(alice)];
            case 34:
                _a.sent();
                console.log('Tokens minted for AssetHubB');
                return [4 /*yield*/, apiAssetHubC.tx.foreignAssets
                        .mint({
                        parents: 1,
                        interior: {
                            X3: [{ Parachain: 2001 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }],
                        },
                    }, { id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' }, 50000000)
                        .signAndSend(alice)];
            case 35:
                _a.sent();
                console.log('Tokens minted for AssetHubC');
                return [4 /*yield*/, new Promise(function (f) { return setTimeout(f, INTERVAL); })];
            case 36:
                _a.sent();
                return [4 /*yield*/, apiAssetHubC.tx.foreignAssets
                        .mint({
                        parents: 1,
                        interior: {
                            X3: [{ Parachain: 2001 }, { PalletInstance: 50 }, { GeneralIndex: 1984 }],
                        },
                    }, { id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' }, 150000000)
                        .signAndSend(alice)];
            case 37:
                _a.sent();
                console.log('Tokens minted for AssetHubC');
                return [2 /*return*/];
        }
    });
}); })();
