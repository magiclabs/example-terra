import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { TerraExtension } from "@magic-ext/terra";
import {LCDClient, MsgSend, Key, SimplePublicKey} from '@terra-money/terra.js';

const rpcUrl = 'https://bombay-lcd.terra.dev';

export class MagicRawKey extends Key {
    constructor(publicKey) {
        super(new SimplePublicKey(publicKey));
    }

    async sign(payload){
        return magic.terra.sign(payload)
    }
}

const magic = new Magic("pk_live_1F739F3147657A01", {
    extensions: {
        terra: new TerraExtension({
            rpcUrl
        })
    }
});

export default function App() {
    const [email, setEmail] = useState("");
    const [publicAddress, setPublicAddress] = useState("");
    const [destinationAddress, setDestinationAddress] = useState("");
    const [sendAmount, setSendAmount] = useState(0);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userMetadata, setUserMetadata] = useState({});
    const [txHash, setTxHash] = useState("");
    const [sendingTransaction, setSendingTransaction] = useState(false);

    useEffect(() => {
        magic.user.isLoggedIn().then(async (magicIsLoggedIn) => {
            setIsLoggedIn(magicIsLoggedIn);
            if (magicIsLoggedIn) {
                const metadata = await magic.user.getMetadata()
                setPublicAddress(metadata.publicAddress);
                setUserMetadata(metadata);
            }
        });
    }, [isLoggedIn]);

    const login = async () => {
        await magic.auth.loginWithMagicLink({ email });
        setIsLoggedIn(true);
    };

    const logout = async () => {
        await magic.user.logout();
        setIsLoggedIn(false);
    };

    const handleTerraSignTransaction = async () => {
        setSendingTransaction(true);
        const publicKey = await magic.terra.getPublicKey();
        const mk = new MagicRawKey(publicKey);

        const terra = new LCDClient({
            URL: rpcUrl,
            chainID: 'bombay-12',
        });

        const wallet = terra.wallet(mk);

        const send = new MsgSend(
            publicAddress,
            destinationAddress,
            { uluna: sendAmount }
        );

        const tx = await wallet.createAndSignTx({
            msgs: [send],
            memo: 'test from terra.js!',
        })
        setSendingTransaction(false);

        console.log('signed transaction', tx);
    }

    return (
        <div className="App">
            {!isLoggedIn ? (
                <div className="container">
                    <h1>Please sign up or login</h1>
                    <input
                        type="email"
                        name="email"
                        required="required"
                        placeholder="Enter your email"
                        onChange={(event) => {
                            setEmail(event.target.value);
                        }}
                    />
                    <button onClick={login}>Send</button>
                </div>
            ) : (
                <div>
                    <div className="container">
                        <h1>Current user: {userMetadata.email}</h1>
                        <button onClick={logout}>Logout</button>
                    </div>
                    <div className="container">
                        <h1>Terra address</h1>
                        <div className="info">{publicAddress}</div>
                    </div>
                    <div className="container">
                        <h1>Send Transaction</h1>
                        {txHash ? (
                            <div>
                                <div>Send transaction success</div>
                                <div className="info">{txHash}</div>
                            </div>
                        ) : sendingTransaction ? (
                            <div className="sending-status">Sending transaction</div>
                        ) : (
                            <div />
                        )}
                        <input
                            type="text"
                            name="destination"
                            className="full-width"
                            required="required"
                            placeholder="Destination address"
                            onChange={(event) => {
                                setDestinationAddress(event.target.value);
                            }}
                        />
                        <input
                            type="text"
                            name="amount"
                            className="full-width"
                            required="required"
                            placeholder="Amount in uluna"
                            onChange={(event) => {
                                setSendAmount(event.target.value);
                            }}
                        />
                        <button id="btn-send-txn" onClick={handleTerraSignTransaction}>
                            Sign Transaction
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
