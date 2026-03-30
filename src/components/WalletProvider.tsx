"use client";

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren, createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

interface NetworkContextType {
  isCorrectNetwork: boolean;
  currentNetwork: string | null;
}

export const NetworkContext = createContext<NetworkContextType>({
  isCorrectNetwork: true,
  currentNetwork: "Shelbynet",
});

export const useNetwork = () => useContext(NetworkContext);

const wallets = [new PetraWallet()];

const queryClient = new QueryClient();

export const shelbyClient = new ShelbyClient({
  network: Network.SHELBYNET,
});

function NetworkChecker({ children }: PropsWithChildren) {
  const [isCorrectNetwork] = useState(true);
  const [currentNetwork] = useState("Shelbynet");

  return (
    <NetworkContext.Provider value={{ isCorrectNetwork, currentNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={false}
        dappConfig={{
          network: Network.SHELBYNET,
        }}
      >
        <NetworkChecker>
          {children}
        </NetworkChecker>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
