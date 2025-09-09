"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { TEMPLE_FUND_ABI, TEMPLE_FUND_ADDRESS } from "@/app/utils/TempleFund";
import { useMetamask } from "@/app/hooks/useMetamask";

export default function WithdrawPage() {
  const { account, provider, connectWallet } = useMetamask();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null);
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  );

  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null);
    setLastTransactionCost(null);

    try {
      toast.info("Transaction sent. Waiting for confirmation...");
      const tx = await contractCall;
      toast.info(`Transaction hash: ${tx.hash}`);

      const receipt = await tx.wait();

      if (receipt) {
        const gasUsed = receipt.gasUsed;
        // @ts-ignore
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;

        let totalCostWei: bigint | null = null;
        if (effectiveGasPrice) {
          totalCostWei = gasUsed * effectiveGasPrice;
        }

        setLastGasUsed(gasUsed.toString());
        if (totalCostWei) {
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

  const withdrawEth = async () => {
    if (!provider || !account) {
      toast.error("Connect wallet first");
      return;
    }

    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      toast.error("Invalid withdrawal amount");
      return;
    }

    try {
      const signer = await provider?.getSigner();
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );

      const amountInWei = ethers.parseEther(withdrawAmount);

      // Call contract withdrawEth(uint256 amount) for connected temple (msg.sender)
      const success = await handleTransaction(
        templeFund.withdrawEth(amountInWei),
        "Withdrawal successful!"
      );

      if (success) {
        setWithdrawAmount("");
      }
    } catch (error) {
      console.error(error);
      toast.error("Withdrawal failed");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      {!account ? (
        <button
          onClick={connectWallet}
          className="bg-purple-600 text-white px-4 py-2 rounded mb-4"
          disabled={loading}
        >
          Connect Wallet
        </button>
      ) : (
        <div className="mb-4 p-2 bg-gray-100 rounded">
          Connected Wallet:{" "}
          <span className="font-mono">
            {account.slice(0, 6)}...{account.slice(-4)}
          </span>
        </div>
      )}

      <label>Withdrawal Amount (ETH/MATIC)</label>
      <input
        type="text"
        placeholder="Enter amount to withdraw"
        value={withdrawAmount}
        onChange={(e) => setWithdrawAmount(e.target.value)}
        className="border p-2 mb-4 w-full"
      />

      <button
        onClick={withdrawEth}
        className="bg-red-600 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        Withdraw ETH/MATIC
      </button>

      {lastGasUsed && lastTransactionCost && (
        <div className="text-sm text-gray-700">
          <p>Gas Used: {lastGasUsed}</p>
          <p>Transaction Cost (ETH): {lastTransactionCost}</p>
        </div>
      )}
    </div>
  );
}
