"use client";

import React, { useState, useEffect } from "react";
import { Heart, Shield, Award, TrendingUp, TrendingDown } from "lucide-react";
import { useMetamask } from "@/app/hooks/useMetamask";
import AuthWrapper from "@/app/components/AuthWrapper";
import { TEMPLE_FUND_ABI, TEMPLE_FUND_ADDRESS } from "@/app/utils/TempleFund";
import { ethers } from "ethers";
import { toast } from "react-toastify";
// Mock socket for demonstration

const UnifiedTempleDonationPage = () => {
  // Donation form state
  const [donationAmount, setDonationAmount] = useState("");
  // const [selectedTemple, setSelectedTemple] = useState("");
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [donationPurpose, setDonationPurpose] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");
  const [temples, setTemples] = useState([]);
  const { account, provider, connectWallet } = useMetamask();
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  const [templeAddress, setTempleAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastGasUsed, setLastGasUsed] = useState<string | null>(null);
  const [lastTransactionCost, setLastTransactionCost] = useState<string | null>(
    null
  );

  // Fetch active temple admins (for donation)
  const fetchActiveTempleAdmins = async () => {
    try {
      const response = await fetch(
        "http://localhost:5050/api/v1/templeAdmin/for-donation-active-temple",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      setTemples(result.data.data);
    } catch (error) {
      console.error("Error fetching active temple admins:", error);
      setTemples([]);
    }
  };

  // Call fetch on mount
  useEffect(() => {
    fetchActiveTempleAdmins();
  }, []);

  const handleTransaction = async (
    contractCall: Promise<ethers.TransactionResponse>,
    successMessage: string
  ) => {
    setLoading(true);
    setLastGasUsed(null);
    setLastTransactionCost(null);

    try {
      toast.info("📤 Transaction sent to the network...");
      const tx = await contractCall;
      console.log("Transaction hash:", tx.hash);
      toast.info(`📨 Transaction hash: ${tx.hash}`);

      // Show a persistent toast until confirmation
      const waitingToastId = toast.loading("⏳ Waiting for confirmation...");

      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      // Dismiss the waiting toast
      toast.dismiss(waitingToastId);

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

        const payload = {
          amount: Number(donationAmount),
          txHash: tx.hash,
          gasPrice: Number(effectiveGasPrice.toString()),
          transactionFee: Number(totalCostWei.toString()),
          purpose: donationPurpose,
          status: "confirmed",
          templeWalletAddress: selectedTemple?.walletAddress,
        };

        if (!selectedTemple?.walletAddress) {
          toast.error("Please select a valid temple.");
          return;
        }

        const accessToken = sessionStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("Access token not found. Please log in again.");
        }
        const response = await fetch("http://localhost:5050/api/v1/transactions/donate-to-temple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          toast.success("🎉 Donation saved in database");
        } else {
          toast.error(`DB Error: ${result?.message || "Failed to save transaction"}`);
        }

        toast.success(`✅ ${successMessage}`);
        toast.success(`🔗 View on explorer: ${receipt.hash}`);
      } else {
        toast.success(successMessage + ` (Receipt not immediately available)`);
      }

      return true;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      let errorMessage = "❌ Transaction failed.";
      if (error.code === 4001) {
        errorMessage = "🚫 Transaction rejected by user.";
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


  const donateEth = async (templeAddress: string) => {
    if (!provider || !account) {
      toast.error("Connect wallet first");
      return;
    }
    if (!ethers.isAddress(templeAddress)) {
      toast.error("Invalid temple address");
      return;
    }

    try {
      const signer = await provider.getSigner();
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        signer
      );

      const amountInEth = donationAmount;
      if (!amountInEth || isNaN(Number(amountInEth)) || Number(amountInEth) <= 0) {
        toast.error("Invalid donation amount");
        return;
      }

      toast.info(`🚀 Initiating donation of ${amountInEth} ETH...`);

      const success = await handleTransaction(
        templeFund.donateEthToTemple(templeAddress, {
          value: ethers.parseEther(amountInEth),
        }),
        "Donation successful!"
      );

      if (success) {
        fetchEthBalance(templeAddress);
      }
    } catch (error) {
      console.error(error);
      toast.error("Donation failed");
    }
  };


  const fetchEthBalance = async (templeAddr: string) => {
    if (!provider || !ethers.isAddress(templeAddr)) {
      toast.error("Invalid temple address or wallet not connected.");
      return;
    }
    try {
      const templeFund = new ethers.Contract(
        TEMPLE_FUND_ADDRESS,
        TEMPLE_FUND_ABI,
        provider
      );
      const balance = await templeFund.getTempleEthBalance(templeAddr);
      setEthBalance(ethers.formatEther(balance));
    } catch (error) {
      toast.error("Failed to fetch ETH balance.");
      console.error(error);
    }
  };

  const purposes = [
    "General Fund",
    "Prasadam Distribution",
    "Temple Maintenance",
    "Festival Celebrations",
    "Educational Programs",
    "Community Kitchen",
  ];
  const handleDonate = () => {
    if (
      !donationAmount ||
      !selectedTemple ||
      !donationPurpose ||
      !selectedCrypto
    ) {
      toast.error("Please fill all fields");
      return;
    }

    const templeAddress = selectedTemple.walletAddress;
    if (!templeAddress) {
    toast.error("Temple wallet address not found.");
    return;
  }

    const cryptoInfo = {
      bitcoin: "BTC",
      ethereum: "ETH",
      bnb: "BNB",
      polygon: "MATIC",
      cardano: "ADA",
      solana: "SOL",
    };

    const selectedCryptoPrice = cryptoPrices[selectedCrypto]?.price || 0;
    const usdValue = (parseFloat(donationAmount) * selectedCryptoPrice).toFixed(
      2
    );

    if (selectedCrypto === "ethereum" || selectedCrypto === "polygon") {
      // assuming same contract for both ETH & MATIC (since both EVM chains)
      donateEth(templeAddress);
    } else {
      toast.error(`${cryptoInfo[selectedCrypto]} donations not supported yet.`);
    }
  };

  // Crypto prices state
  const [allCryptoPrices, setAllCryptoPrices] = useState([]);
  const [cryptoPrices, setCryptoPrices] = useState({
    bitcoin: { price: 0, change: 0 },
    ethereum: { price: 0, change: 0 },
    bnb: { price: 0, change: 0 },
    polygon: { price: 0, change: 0 },
    cardano: { price: 0, change: 0 },
    solana: { price: 0, change: 0 },
  });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState(null);
  const [marketStats, setMarketStats] = useState({
    totalMarketCap: 0,
    totalVolume: 0,
    activeCoins: 0,
  });

  // Fetch comprehensive crypto data
  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        setLoadingPrices(true);
        setPriceError(null);

        const marketResponse = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h"
        );

        if (!marketResponse.ok) {
          throw new Error(`HTTP error! status: ${marketResponse.status}`);
        }

        const marketData = await marketResponse.json();

        const coinGeckoIds =
          "bitcoin,ethereum,binancecoin,matic-network,cardano,solana";
        const specificResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!specificResponse.ok) {
          throw new Error(`HTTP error! status: ${specificResponse.status}`);
        }

        const specificData = await specificResponse.json();

        let carouselCurrencies = marketData.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          price: coin.current_price,
          image: coin.image,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap: coin.market_cap,
        }));

        // Ensure MATIC is included
        const maticInCarousel = carouselCurrencies.find(
          (coin) => coin.id === "matic-network"
        );
        if (!maticInCarousel && specificData["matic-network"]) {
          const maticMarketData = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=matic-network`
          )
            .then((res) => res.json())
            .then((data) => data[0])
            .catch(() => null);

          if (maticMarketData) {
            carouselCurrencies.push({
              id: "matic-network",
              name: "Polygon",
              symbol: "MATIC",
              price: specificData["matic-network"].usd,
              image:
                maticMarketData.image ||
                "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
              price_change_percentage_24h:
                specificData["matic-network"].usd_24h_change,
              market_cap: maticMarketData.market_cap || 0,
            });
          }
        }

        const uniqueCurrencies = Array.from(
          new Map(carouselCurrencies.map((item) => [item.id, item])).values()
        ).slice(0, 18);

        setAllCryptoPrices(uniqueCurrencies);

        // Set donation form crypto prices
        setCryptoPrices({
          bitcoin: {
            price: specificData.bitcoin?.usd || 0,
            change: specificData.bitcoin?.usd_24h_change || 0,
          },
          ethereum: {
            price: specificData.ethereum?.usd || 0,
            change: specificData.ethereum?.usd_24h_change || 0,
          },
          bnb: {
            price: specificData.binancecoin?.usd || 0,
            change: specificData.binancecoin?.usd_24h_change || 0,
          },
          polygon: {
            price: specificData["matic-network"]?.usd || 0,
            change: specificData["matic-network"]?.usd_24h_change || 0,
          },
          cardano: {
            price: specificData.cardano?.usd || 0,
            change: specificData.cardano?.usd_24h_change || 0,
          },
          solana: {
            price: specificData.solana?.usd || 0,
            change: specificData.solana?.usd_24h_change || 0,
          },
        });

        const totalMarketCap = uniqueCurrencies.reduce(
          (sum, crypto) => sum + (crypto.market_cap || 0),
          0
        );
        const totalVolume = totalMarketCap * 0.05;

        setMarketStats({
          totalMarketCap,
          totalVolume,
          activeCoins: uniqueCurrencies.length,
        });
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
        setPriceError("Failed to load prices. Please try again later.");
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchCryptoPrices();
    const interval = setInterval(fetchCryptoPrices, 30000);
    return () => clearInterval(interval);
  }, []);



  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(6);
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) {
      return (marketCap / 1e12).toFixed(1) + "T";
    } else if (marketCap >= 1e9) {
      return (marketCap / 1e9).toFixed(1) + "B";
    } else if (marketCap >= 1e6) {
      return (marketCap / 1e6).toFixed(1) + "M";
    }
    return "N/A";
  };

  const duplicatedCryptos = [...allCryptoPrices, ...allCryptoPrices];

  const cryptoOptions = [
    { value: "bitcoin", name: "Bitcoin (BTC)" },
    { value: "ethereum", name: "Ethereum (ETH)" },
    { value: "bnb", name: "Binance Coin (BNB)" },
    { value: "polygon", name: "Polygon (MATIC)" },
    { value: "cardano", name: "Cardano (ADA)" },
    { value: "solana", name: "Solana (SOL)" },
  ];

  return (
    <AuthWrapper role="user">
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Live Crypto Carousel Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent mb-4">
                🚀 Live Crypto Market
              </h2>
              <p className="text-gray-600 text-lg">
                Real-time cryptocurrency prices • Updates every 30 seconds
              </p>
              <div className="flex justify-center items-center mt-4 space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-500 text-sm font-medium">LIVE</span>
              </div>
            </div>

            {/* Crypto Carousel */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-white to-red-50 border border-orange-200 shadow-xl mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-purple-500/5"></div>

              {loadingPrices && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center space-x-3">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-700 text-xl font-medium">
                      Loading crypto prices...
                    </span>
                  </div>
                </div>
              )}

              {priceError && (
                <div className="text-center py-16">
                  <div className="text-red-500 text-xl">⚠️ {priceError}</div>
                </div>
              )}

              {!loadingPrices && !priceError && allCryptoPrices.length > 0 && (
                <div className="relative">
                  <div
                    className="flex animate-scroll"
                    style={{
                      animation: "scroll 60s linear infinite",
                      width: `${duplicatedCryptos.length * 320}px`,
                    }}
                  >
                    {duplicatedCryptos.map((crypto, index) => (
                      <div
                        key={`${crypto.id}-${index}`}
                        className="flex-shrink-0 w-80 mx-2 bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 hover:border-orange-400/70 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer"
                        onClick={() => {
                          // Auto-select crypto for donation if it's available
                          const cryptoMapping = {
                            bitcoin: "bitcoin",
                            ethereum: "ethereum",
                            binancecoin: "bnb",
                            "matic-network": "polygon",
                            cardano: "cardano",
                            solana: "solana",
                          };
                          const mappedCrypto = cryptoMapping[crypto.id];
                          if (mappedCrypto) {
                            setSelectedCrypto(mappedCrypto);
                            document
                              .getElementById("donation-form")
                              ?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={crypto.image}
                              alt={crypto.name}
                              className="w-12 h-12 rounded-full shadow-md transition-transform duration-300 hover:scale-110"
                              onError={(e) => {
                                e.target.src = `data:image/svg+xml;base64,${btoa(`
                                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="24" cy="24" r="24" fill="#F59E0B"/>
                                    <text x="24" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${crypto.symbol.charAt(
                                  0
                                )}</text>
                                  </svg>
                                `)}`;
                              }}
                            />
                            <div>
                              <h3 className="text-gray-800 font-bold text-lg">
                                {crypto.symbol}
                              </h3>
                              <p className="text-gray-500 text-sm truncate max-w-[120px]">
                                {crypto.name}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-800 mb-1">
                              ${formatPrice(crypto.price)}
                            </div>
                            <div className="flex items-center justify-end space-x-1">
                              {crypto.price_change_percentage_24h >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                              )}
                              <span
                                className={`font-semibold text-sm ${crypto.price_change_percentage_24h >= 0
                                  ? "text-green-500"
                                  : "text-red-500"
                                  }`}
                              >
                                {Math.abs(
                                  crypto.price_change_percentage_24h || 0
                                ).toFixed(2)}
                                %
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Market Cap</span>
                            <span className="text-gray-700 font-medium">
                              ${formatMarketCap(crypto.market_cap)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Donation Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">
              Temple Crypto Donations
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Make donations using various cryptocurrencies with complete
              transparency. Track your contributions in real-time with
              blockchain technology.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8" id="donation-form">
            {/* Donation Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  Make a Donation
                </h3>

                <div className="space-y-6">
                  {/* Temple Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Temple
                    </label>
                    <select
                      value={selectedTemple?.templeName || ""}
                      onChange={(e) => {
                        const selected = temples.find(t => t.templeName === e.target.value);
                        setSelectedTemple(selected || null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Choose a temple...</option>
                      {temples.map((temple) => (
                        <option key={temple.walletAddress} value={temple.templeName}>
                          {temple.templeName}
                        </option>
                      ))}
                    </select>

                  </div>

                  {/* Purpose Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Purpose
                    </label>
                    <select
                      value={donationPurpose}
                      onChange={(e) => setDonationPurpose(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      <option value="">Select purpose...</option>
                      {purposes.map((purpose, index) => (
                        <option key={index} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cryptocurrency Selection Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Cryptocurrency
                    </label>
                    <select
                      value={selectedCrypto}
                      onChange={(e) => setSelectedCrypto(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    >
                      {cryptoOptions.map((crypto) => (
                        <option key={crypto.value} value={crypto.value}>
                          {crypto.name}
                        </option>
                      ))}
                    </select>

                    {/* Live Price Display */}
                    {selectedCrypto &&
                      cryptoPrices[selectedCrypto]?.price > 0 && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Current Price:
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-gray-800">
                              ${formatPrice(cryptoPrices[selectedCrypto].price)}
                            </span>
                            <div
                              className={`text-xs ml-2 inline-block ${cryptoPrices[selectedCrypto].change >= 0
                                ? "text-green-500"
                                : "text-red-500"
                                }`}
                            >
                              {cryptoPrices[selectedCrypto].change >= 0
                                ? "+"
                                : ""}
                              {cryptoPrices[selectedCrypto].change?.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Donation Amount (
                      {cryptoOptions
                        .find((c) => c.value === selectedCrypto)
                        ?.name.match(/\(([^)]+)\)/)?.[1] || "Crypto"}
                      )
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        required
                        min="0.001"
                        step="0.001"
                      />
                      {donationAmount &&
                        cryptoPrices[selectedCrypto]?.price && (
                          <div className="absolute right-3 top-3 text-sm text-gray-500">
                            ≈ $
                            {(
                              parseFloat(donationAmount) *
                              cryptoPrices[selectedCrypto].price
                            ).toFixed(2)}{" "}
                            USD
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleDonate}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-lg font-medium text-lg hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Donate Now
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Features */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Why Donate Here?
                </h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">Transparent</h5>
                      <p className="text-sm text-gray-600">
                        Every transaction recorded on blockchain
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">Verified</h5>
                      <p className="text-sm text-gray-600">
                        All temples verified and authentic
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-purple-500 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-800">
                        Impact Tracking
                      </h5>
                      <p className="text-sm text-gray-600">
                        See how your donation is used
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  Recent Donations
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">0.05 BTC</p>
                      <p className="text-sm text-gray-600">Tirupati Balaji</p>
                    </div>
                    <span className="text-xs text-gray-500">2 hours ago</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">1.2 ETH</p>
                      <p className="text-sm text-gray-600">Golden Temple</p>
                    </div>
                    <span className="text-xs text-gray-500">5 hours ago</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">500 MATIC</p>
                      <p className="text-sm text-gray-600">Kedarnath Temple</p>
                    </div>
                    <span className="text-xs text-gray-500">1 day ago</span>
                  </div>
                </div>
              </div>

              {/* Total Raised */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
                <h4 className="text-lg font-bold mb-2">Total Raised</h4>
                <p className="text-3xl font-bold">$2,45,678</p>
                <p className="text-orange-100 text-sm">This month: $34,567</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-gray-400">
              &copy; 2025 DevTemple. Empowering sacred traditions through
              blockchain technology.
            </p>
          </div>
        </footer>

        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 60s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    </AuthWrapper>
  );
};

export default UnifiedTempleDonationPage;
