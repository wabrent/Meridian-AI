"use client";

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren, createContext, useContext, useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network, AptosConfig } from "@aptos-labs/ts-sdk";

interface NetworkContextType {
  isCorrectNetwork: boolean;
  currentNetwork: string | null;
  shelbyClient: ShelbyClient;
}

export const NetworkContext = createContext<NetworkContextType>({
  isCorrectNetwork: true,
  currentNetwork: "Shelbynet",
  shelbyClient: {} as ShelbyClient,
});

export const useNetwork = () => useContext(NetworkContext);

const wallets = [new PetraWallet()];

const queryClient = new QueryClient();

function NetworkChecker({ children }: PropsWithChildren) {
  const [isCorrectNetwork] = useState(true);
  const [currentNetwork] = useState("Shelbynet");

  const shelbyClient = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || '';
    
    const shelby = new ShelbyClient({ 
      network: 'shelbynet',
      apiKey: apiKey,
      rpc: { apiKey: apiKey },
      indexer: { apiKey: apiKey },
    });
    
    return shelby;
  }, []);

  return (
    <NetworkContext.Provider value={{ isCorrectNetwork, currentNetwork, shelbyClient }}>
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
