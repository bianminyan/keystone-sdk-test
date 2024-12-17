"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = __importStar(require("uuid"));
const bc_ur_registry_1 = require("@keystonehq/bc-ur-registry");
const bc_ur_1 = require("@ngraveio/bc-ur");
const hw_transport_usb_1 = require("@keystonehq/hw-transport-usb");
const hw_transport_error_1 = require("@keystonehq/hw-transport-error");
const bc_ur_registry_sol_1 = require("@keystonehq/bc-ur-registry-sol");
const pathToKeypath = (path) => {
    const paths = path.replace(/[m|M]\//, '').split('/');
    const pathComponents = paths.map(path => {
        const index = parseInt(path.replace('\'', ''), 10);
        const isHardened = path.endsWith('\'');
        return new bc_ur_registry_1.PathComponent({ index, hardened: isHardened });
    });
    return new bc_ur_registry_1.CryptoKeypath(pathComponents);
};
class Solana {
    /**
     * Constructs a new instance of the class.
     *
     * @param transport - An object of type TransportWebUSB
     * @param mfp - Optional parameter of type string, default is undefined, but the mfp should exist in the signing process.
     */
    constructor(transport, mfp) {
        // Initialize Solana connection
        this.transport = transport;
        if (mfp) {
            this.mfp = mfp;
        }
    }
    precheck() {
        if (!this.transport) {
            (0, hw_transport_error_1.throwTransportError)(hw_transport_error_1.Status.ERR_TRANSPORT_HAS_NOT_BEEN_SET);
        }
        if (!this.mfp) {
            throw new Error('missing mfp for this wallet');
        }
    }
    sendToDevice(actions, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transport.send(actions, data);
        });
    }
    checkDeviceLockStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.sendToDevice(hw_transport_usb_1.Actions.CMD_CHECK_LOCK_STATUS, '');
            return result.payload;
        });
    }
    /**
    * Retrieves the public key (address) for a given derivation path from the hardware device.
    *
    * This method sends a request to the connected hardware device to derive the public key
    * for the specified path using the ED25519 curve and SLIP-10 derivation algorithm.
    * It also updates the master fingerprint (mfp) of the instance.
    *
    * @param path - The derivation path for the desired public key, e.g., "m/44'/501'/0'"
    * @param dislay - A boolean flag to indicate whether to display the address on the device (not used in current implementation due to compitable with ledger js sdk)
    * @returns A Promise that resolves to an object containing:
    *          - address: A Buffer containing the derived public key
    *          - mfp: A string representing the master fingerprint of the wallet
    * @throws Will throw an error if the device communication fails or if the response is incomplete
    *
    * @example
    * solana.getAddress("44'/501'/0'").then(r => r.address)
    */
    getAddress(path, dislay = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // Send a request to the device to get the address at the specified path
            const curve = bc_ur_registry_1.Curve.ed25519;
            const algo = bc_ur_registry_1.DerivationAlgorithm.slip10;
            const kds = new bc_ur_registry_1.KeyDerivationSchema(pathToKeypath(path), curve, algo, 'SOL');
            const keyDerivation = new bc_ur_registry_1.KeyDerivation([kds]);
            const hardwareCall = new bc_ur_registry_1.QRHardwareCall(bc_ur_registry_1.QRHardwareCallType.KeyDerivation, keyDerivation, 'Keystone USB SDK', bc_ur_registry_1.QRHardwareCallVersion.V1);
            const ur = hardwareCall.toUR();
            const encodedUR = new bc_ur_1.UREncoder(ur, Infinity).nextPart().toUpperCase();
            const response = yield this.sendToDevice(hw_transport_usb_1.Actions.CMD_RESOLVE_UR, encodedUR);
            const resultUR = parseResponoseUR(response.payload);
            const account = bc_ur_registry_1.CryptoMultiAccounts.fromCBOR(resultUR.cbor);
            const key = account.getKeys()[0];
            // reset the mfp when getting the address.
            this.mfp = account.getMasterFingerprint().toString('hex');
            const pubkey = key.getKey();
            return {
                address: pubkey,
                mfp: this.mfp,
            };
        });
    }
    sign(path, data, type) {
        return __awaiter(this, void 0, void 0, function* () {
            this.precheck();
            const encodedUR = constructURRequest(data, path, this.mfp, type);
            const response = yield this.sendToDevice(hw_transport_usb_1.Actions.CMD_RESOLVE_UR, encodedUR);
            const resultUR = parseResponoseUR(response.payload);
            return {
                signature: parseSignatureUR(resultUR),
            };
        });
    }
    /**
    * Signs a Solana transaction using the specified derivation path.
    *
    * This method sends the transaction to the hardware device for signing using the private key
    * derived from the given path.
    *
    * @param path - The derivation path of the private key to use for signing, e.g., "m/44'/501'/0'/0'"
    * @param txBuffer - A Buffer containing the serialized transaction to be signed
    * @returns A Promise that resolves to an object containing:
    *          - signature: A Buffer containing the transaction signature
    * @throws Will throw an error if the signing process fails or if the device is not properly initialized
    * @example
    * solana.signTransaction("44'/501'/0'", txBuffer).then(r => r.signature)
    */
    signTransaction(path, txBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sign(path, txBuffer, bc_ur_registry_sol_1.SignType.Transaction);
        });
    }
    /**
    * Signs an off-chain message using the specified derivation path.
    *
    * This method sends the message to the hardware device for signing using the private key
    * derived from the given path.
    *
    * @param path - The derivation path of the private key to use for signing, e.g., "m/44'/501'/0'"
    * @param msgBuffer - A Buffer containing the off-chain message to be signed
    * @returns A Promise that resolves to an object containing:
    *          - signature: A Buffer containing the message signature
    * @throws Will throw an error if the signing process fails or if the device is not properly initialized
    */
    signOffchainMessage(path, msgBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sign(path, msgBuffer, bc_ur_registry_sol_1.SignType.Message);
        });
    }
    /**
    * Retrieves the configuration information of the connected hardware device.
    *
    * This method sends a request to the device to get its version information,
    * then parses the response to extract the firmware version and wallet master fingerprint.
    *
    * @returns A Promise that resolves to an object containing:
    *          - version: A string representing the firmware version of the device
    *          - mfp: A string representing the master fingerprint of the wallet
    * @throws Will throw an error if the device communication fails or if the response cannot be parsed
    */
    getAppConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.sendToDevice(hw_transport_usb_1.Actions.CMD_GET_DEVICE_VERSION, '');
            const result = response.payload;
            const appConfig = JSON.parse(result);
            return {
                version: appConfig['firmwareVersion'],
                mfp: appConfig['walletMFP'],
            };
        });
    }
}
exports.default = Solana;
const constructURRequest = (txBuffer, path, mfp, type) => {
    const requestId = uuid.v4();
    const solRequest = bc_ur_registry_sol_1.SolSignRequest.constructSOLRequest(txBuffer, path, mfp, type, requestId);
    const ur = solRequest.toUR();
    const encodedUR = new bc_ur_1.UREncoder(ur, Infinity).nextPart().toUpperCase();
    return encodedUR;
};
const parseResponoseUR = (urPlayload) => {
    const decoder = new bc_ur_1.URDecoder();
    decoder.receivePart(urPlayload);
    if (!decoder.isComplete()) {
        (0, hw_transport_error_1.throwTransportError)(hw_transport_error_1.Status.ERR_UR_INCOMPLETE);
    }
    const resultUR = decoder.resultUR();
    return resultUR;
};
const parseSignatureUR = (ur) => {
    const signature = bc_ur_registry_sol_1.SolSignature.fromCBOR(ur.cbor);
    return signature.getSignature();
};
//# sourceMappingURL=index.js.map