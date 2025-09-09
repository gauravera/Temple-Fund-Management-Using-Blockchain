"use client";

import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { ethers } from "ethers";
import { useMetamask } from "@/app/hooks/useMetamask";
import {
  TEMPLE_REGISTRY_ABI,
  TEMPLE_REGISTRY_ADDRESS,
} from "@/app/utils/TempleRegistry";
import {
  Check,
  X,
  Wallet,
  Globe,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import AuthWrapper from "@/app/components/AuthWrapper";

const socket = io("http://localhost:5050");

export default function ConfirmPage() {
  const [expandedMetaMaskCard, setExpandedMetaMaskCard] = useState<string | null>(null);
  const [expandedNetworkCard, setExpandedNetworkCard] = useState<number | null>(null);
  const { account, provider} = useMetamask();
  const [templeAddressToRegister, setTempleAddressToRegister] =
    useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null); // New state for gas used
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  );
  const [pendingConfirmations, setPendingConfirmations] = useState<any[]>([]);

  const pendingNetworkConnections = [
    {
      id: 1,
      templeName: "Divine Temple of Prosperity",
      walletId: "0x742d35Cc6637C0532c2c0b6C7C7d7f6",
      networkType: "Ethereum Mainnet",
      requestDate: "2024-01-15",
      gasEstimate: "0.023 ETH",
      status: "Pending Verification",
    },
    {
      id: 2,
      templeName: "Sacred Heart Sanctuary",
      walletId: "0x8ba1f109551bD432803012645Hac136c",
      networkType: "Polygon",
      requestDate: "2024-01-14",
      gasEstimate: "0.001 MATIC",
      status: "Ready for Confirmation",
    },
    {
      id: 3,
      templeName: "Golden Lotus Temple",
      walletId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
      networkType: "BSC",
      requestDate: "2024-01-13",
      gasEstimate: "0.002 BNB",
      status: "Documentation Review",
    },
  ];

  const fetchPendingConfirmations = async () => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");

      const response = await fetch(
        "http://localhost:5050/api/v1/superAdmin/get-pending-confirmations",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setPendingConfirmations(result.data);
        console.log("Pending confirmations updated:", result.data);
      } else {
        toast.error(result.message || "Failed to fetch pending confirmations.");
      }
    } catch (error) {
      console.error("Error fetching pending confirmations:", error);
      toast.error("An error occurred while fetching pending confirmations.");
    }
  };

  useEffect(() => {
    fetchPendingConfirmations();

    // Listen for updates from the websocket server
    socket.on("update-confirmations", (newConfirmation) => {
      setPendingConfirmations((prev) => {
        // Check if the new confirmation already exists in the state
        const exists = prev.some(
          (temple) => temple.templeAdminId === newConfirmation.templeAdminId
        );
        if (exists) {
          console.log("Duplicate confirmation ignored:", newConfirmation);
          return prev;
        }
        return [...prev, newConfirmation];
      });

      // setPendingConfirmations((prev) => [...prev, newConfirmation]);
      toast.success("New temple admin registration request received!");
    });

    return () => {
      console.log("Clearning up Websocket listeners");
      socket.off("update-confirmations");
    };
  }, []);

  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null); // Clear previous gas info
    setLastTransactionCost(null); // Clear previous cost info

    try {
      toast.info("Transaction sent. Waiting for confirmation...");
      const tx = await contractCall;
      console.log("Transaction hash:", tx.hash);
      toast.info(`Transaction hash: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // --- Extract Gas Used and Calculate Cost ---
      if (receipt) {
        const gasUsed = receipt.gasUsed; // This is a BigInt
        // effectiveGasPrice is generally what's actually paid for EIP-1559 transactions
        // For legacy transactions, gasPrice would be available on the receipt
        // @ts-ignore
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;

        let totalCostWei: bigint | null = null;
        if (effectiveGasPrice) {
          totalCostWei = gasUsed * effectiveGasPrice;
        }

        setLastGasUsed(gasUsed.toString()); // Convert BigInt to string for display
        if (totalCostWei) {
          // Format total cost to ETH from Wei
          setLastTransactionCost(ethers.formatEther(totalCostWei));
        }

        toast.success(successMessage + ` Transaction hash: ${receipt.hash}`);
      } else {
        toast.success(successMessage + ` (Receipt not available immediately)`);
      }
      return true;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = "Transaction failed.";
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user.";
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndRegister = async (
    templeAdminId: string,
    templeAddressToRegister: string
  ) => {
    if (!templeAdminId) {
      toast.error("Invalid temple admin ID. Please try again.");
      return;
    }

    // Step 1: Check if MetaMask wallet is connected
    if (!provider || !account) {
      toast.error("Please connect your MetaMask wallet and try again.");
      return; // Stop the process if wallet isn't connected
    }

    // Step 2: Register the temple on the blockchain first
    try {
      if (!ethers.isAddress(templeAddressToRegister)) {
        toast.error("Invalid temple address to register.");
        return;
      }

      const signer = await provider?.getSigner();
      const registry = new ethers.Contract(
        TEMPLE_REGISTRY_ADDRESS,
        TEMPLE_REGISTRY_ABI,
        signer
      );

      // Gas Estimation with buffer
      const gasLimit = BigInt("300000"); // Or estimatedGas * BigInt(150) / BigInt(100);
      console.log("Before blockchain transaction");
      const success = await handleTransaction(
        registry.registerTemple(templeAddressToRegister, {
          gasLimit: gasLimit,
        }), // Blockchain transaction
        `Temple ${templeAddressToRegister} registered successfully on the blockchain!`
      );
      console.log("Transaction status:", success);
      // Step 3: Proceed to off-chain registration only if blockchain transaction is successful
      if (success) {
        console.log("Attempting off-chain registration...");
        // Now, update the off-chain database
        const accessToken = sessionStorage.getItem("accessToken");

        const response = await fetch(
          "http://localhost:5050/api/v1/superAdmin/confirm-temple-admin-registration",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ templeAdminId }),
          }
        );

        const result = await response.json();
        console.log("Database response:", result);

        if (!response.ok) {
          toast.error(
            result.message ||
              "Failed to confirm registration in the database. Please try again."
          );
          console.error("Database error response", response.status);
          return;
        }

        toast.success("Temple Admin registration confirmed in the database!");
        setTempleAddressToRegister(""); // Clear input on success
      }
    } catch (error) {
      console.error(
        "Error during blockchain registration or admin confirmation:",
        error
      );
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleReject = async (templeAdminId: string) => {
    console.log(`Rejecting temple admin with ID: ${templeAdminId}`);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      console.log("Access Token:", accessToken);

      const response = await fetch(
        "http://localhost:5050/api/v1/superAdmin/reject-temple-admin-registration",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ templeAdminId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.message || "Failed to reject registration. Please try again."
        );
        return;
      }

      toast.success("Temple Admin registration request rejected.");
      fetchPendingConfirmations(); // Refresh list of pending confirmations
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("An error occurred. Please try again.");
    }
  };

  interface PendingNetworkConnection {
    id: number;
    templeName: string;
    walletId: string;
    networkType: string;
    requestDate: string;
    gasEstimate: string;
    status: string;
  }

  interface HandleRemoveFn {
    (connectionId: number): void;
  }

  const handleRemove: HandleRemoveFn = (connectionId) => {
    console.log(`Removing network connection with ID: ${connectionId}`);
    alert(`Network connection removed for ID: ${connectionId}`);
  };

  function handleConfirm(id: number): void {
    // For demo purposes, just show a toast and remove the connection from the list
    toast.success(`Network connection with ID ${id} confirmed.`);
    // In a real app, you would call an API to confirm the connection
    // and then update the UI accordingly.
    // Here, we just remove it from the pendingNetworkConnections array.
    // Since pendingNetworkConnections is a constant, you might want to manage it as state.
    // For now, just show a toast.
  }

  return (
    <AuthWrapper role="superAdmin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">Confirmation Panel</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* MetaMask Connections */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <Wallet className="mr-2" />
              Pending Network Connections
            </h3>
            <div className="space-y-4">
              {pendingConfirmations.length > 0 ? (
                pendingConfirmations.map((temple) => (
                  <div
                    key={temple._id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onMouseEnter={() => setExpandedMetaMaskCard(temple._id)}
                      onMouseLeave={() => setExpandedMetaMaskCard(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {temple.templeName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {temple.templeLocation}
                          </p>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium">Request Time:</span>{" "}
                            {new Date(temple.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {expandedMetaMaskCard === temple._id ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>

                      {expandedMetaMaskCard === temple._id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-1">
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="font-medium">Location:</span>{" "}
                              {temple.templeLocation}
                            </p>
                            <p>
                              <span className="font-medium">Name:</span>{" "}
                              {temple.name}
                            </p>
                            <p>
                              <span className="font-medium">Contact:</span>{" "}
                              {temple.phone}
                            </p>
                            <p>
                              <span className="font-medium">Email:</span>{" "}
                              {temple.email}
                            </p>
                            <p>
                              <span className="font-medium">
                                Wallet Address:
                              </span>{" "}
                              {temple.walletAddress}
                            </p>
                          </div>
                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() =>
                                handleConfirmAndRegister(
                                  temple._id,
                                  temple.walletAddress
                                )
                              }
                              className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm font-medium"
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleReject(temple._id)}
                              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center text-sm font-medium"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">
                  No pending confirmations available.
                </p>
              )}
            </div>
          </div>

          {/* Network Connections */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
              <Globe className="mr-2" />
              Pending Metamask Connections
            </h3>
            <div className="space-y-4">
              {pendingNetworkConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onMouseEnter={() => setExpandedNetworkCard(connection.id)}
                    onMouseLeave={() => setExpandedNetworkCard(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          {connection.templeName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {connection.networkType}
                        </p>
                      </div>
                      {expandedNetworkCard === connection.id ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>

                    {expandedNetworkCard === connection.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-1">
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Wallet ID:</span>{" "}
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {connection.walletId}
                            </code>
                          </p>
                          <p>
                            <span className="font-medium">Network:</span>{" "}
                            {connection.networkType}
                          </p>
                          <p>
                            <span className="font-medium">Request Date:</span>{" "}
                            {connection.requestDate}
                          </p>
                          <p>
                            <span className="font-medium">Gas Estimate:</span>{" "}
                            {connection.gasEstimate}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span>{" "}
                            <span className="text-orange-600">
                              {connection.status}
                            </span>
                          </p>
                        </div>
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => handleConfirm(connection.id)}
                            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm font-medium"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Confirm
                          </button>
                          <button
                            onClick={() => handleRemove(connection.id)}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center text-sm font-medium"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}
