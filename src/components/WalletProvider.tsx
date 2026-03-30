"use client";

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren, createContext, useContext, useState, useEffect, useCallback } from "react";

interface NetworkContextType {
  isCorrectNetwork: boolean;
  currentNetwork: string | null;
}

export const NetworkContext = createContext<NetworkContextType>({
  isCorrectNetwork: true, // Default to true - let user manage network in Petra
  currentNetwork: "Shelbynet",
});

export const useNetwork = () => useContext(NetworkContext);

const wallets = [new PetraWallet()];

function NetworkChecker({ children }: PropsWithChildren) {
  const [isCorrectNetwork] = useState(true); // Assume correct - user manages in Petra
  const [currentNetwork] = useState("Shelbynet");
  const { connected } = useWallet();

  return (
    <NetworkContext.Provider value={{ isCorrectNetwork, currentNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider autoConnect={false}>
      <NetworkChecker>
        {children}
      </NetworkChecker>
    </AptosWalletAdapterProvider>
  );
}
