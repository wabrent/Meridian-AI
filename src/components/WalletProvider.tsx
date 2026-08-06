"use client";

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren, createContext, useContext, useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network as AptosNetwork, AptosConfig } from "@aptos-labs/ts-sdk";

export type NetworkName = "shelbynet";

interface NetworkContextType {
  selectedNetwork: NetworkName;
  setSelectedNetwork: (network: NetworkName) => void;
  isCorrectNetwork: boolean;
  shelbyClient: ShelbyClient;
}

export const NetworkContext = createContext<NetworkContextType>({
  selectedNetwork: "shelbynet",
  setSelectedNetwork: () => {},
  isCorrectNetwork: true,
  shelbyClient: {} as ShelbyClient,
});

export const useNetwork = () => useContext(NetworkContext);

const wallets = [new PetraWallet()];

const queryClient = new QueryClient();

const networkConfig: Record<NetworkName, { aptNetwork: AptosNetwork; fullnode: string; indexer: string; rpc: string }> = {
  shelbynet: {
    aptNetwork: AptosNetwork.SHELBYNET,
    fullnode: "https://api.shelbynet.shelby.xyz/v1",
    indexer: "https://api.shelbynet.aptoslabs.com/nocode/v1/public/cmforrguw0042s601fn71f9l2/v1/graphql",
    rpc: "https://api.shelbynet.shelby.xyz/shelby"
  }
};

function NetworkChecker({ children }: PropsWithChildren) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>("shelbynet");

  const shelbyClient = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || '';
    const config = networkConfig[selectedNetwork];
    
    const aptos = new AptosConfig({
      network: config.aptNetwork,
      fullnode: config.fullnode,
      indexer: config.indexer,
      clientConfig: apiKey ? { API_KEY: apiKey } : undefined,
    });

    const shelby = new ShelbyClient({ 
      network: config.aptNetwork as any,
      apiKey: apiKey,
      aptos: aptos,
      indexer: { apiKey: apiKey, baseUrl: config.indexer },
      rpc: { apiKey: apiKey, baseUrl: config.rpc }
    });
    
    return shelby;
  }, [selectedNetwork]);

  return (
    <NetworkContext.Provider value={{ 
      selectedNetwork, 
      setSelectedNetwork, 
      isCorrectNetwork: true, 
      shelbyClient 
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function WalletProvider({ children }: PropsWithChildren) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>("shelbynet");
  
  const currentConfig = networkConfig[selectedNetwork];

  return (
    <AptosWalletAdapterProvider autoConnect={false}>
      <QueryClientProvider client={queryClient}>
        <NetworkChecker>
          {children}
        </NetworkChecker>
      </QueryClientProvider>
    </AptosWalletAdapterProvider>
  );
}

export const networkLabels: Record<NetworkName, string> = {
  shelbynet: "Shelbynet",
  testnet: "Aptos Testnet",
  mainnet: "Aptos Mainnet"
};
