"use client";

import { AptosWalletAdapterProvider, useWallet } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren, createContext, useContext, useState, useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShelbyClient } from "@shelby-protocol/sdk/browser";
import { Network as AptosNetwork } from "@aptos-labs/ts-sdk";

export type NetworkName = "shelbynet" | "testnet" | "mainnet";

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

const networkConfig: Record<NetworkName, { aptNetwork: AptosNetwork; rpcUrl: string }> = {
  shelbynet: {
    aptNetwork: AptosNetwork.SHELBYNET,
    rpcUrl: "https://api.shelbynet.shelby.xyz/v1"
  },
  testnet: {
    aptNetwork: AptosNetwork.TESTNET,
    rpcUrl: "https://api.testnet.aptoslabs.com/v1"
  },
  mainnet: {
    aptNetwork: AptosNetwork.MAINNET,
    rpcUrl: "https://api.mainnet.aptoslabs.com/v1"
  }
};

function NetworkChecker({ children }: PropsWithChildren) {
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>("shelbynet");

  const shelbyClient = useMemo(() => {
    const apiKey = process.env.NEXT_PUBLIC_SHELBY_API_KEY || '';
    
    const shelby = new ShelbyClient({ 
      network: selectedNetwork,
      apiKey: apiKey,
      rpc: { apiKey: apiKey },
      indexer: { apiKey: apiKey },
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
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={false}
        wallets={wallets}
        dappConfig={{
          network: currentConfig.aptNetwork,
        }}
      >
        <NetworkChecker>
          {children}
        </NetworkChecker>
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}

export const networkLabels: Record<NetworkName, string> = {
  shelbynet: "Shelbynet",
  testnet: "Aptos Testnet",
  mainnet: "Aptos Mainnet"
};
