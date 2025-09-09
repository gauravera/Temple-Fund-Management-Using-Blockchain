"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoCarouselProps {
  onSelectCrypto: (cryptoId: string) => void;
}

const CryptoCarousel: React.FC<CryptoCarouselProps> = ({ onSelectCrypto }) => {
  interface CarouselCurrency {
    id: string;
    name: string;
    symbol: string;
    price: number;
    image: string;
    price_change_percentage_24h: number;
    market_cap: number;
  }
  
  const [allCryptoPrices, setAllCryptoPrices] = useState<CarouselCurrency[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
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

        interface CarouselCurrency {
          id: string;
          name: string;
          symbol: string;
          price: number;
          image: string;
          price_change_percentage_24h: number;
          market_cap: number;
        }

        interface MarketData {
          id: string;
          name: string;
          symbol: string;
          current_price: number;
          image: string;
          price_change_percentage_24h: number;
          market_cap: number;
        }

        let carouselCurrencies: CarouselCurrency[] = (marketData as MarketData[]).map((coin: MarketData): CarouselCurrency => ({
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

        const totalMarketCap = uniqueCurrencies.reduce(
          (sum, crypto) => sum + (crypto.market_cap || 0),
          0
        );
        const totalVolume = totalMarketCap * 0.05; // This calculation seems arbitrary, consider actual total volume if available

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

  interface FormatPrice {
    (price: number): string;
  }

  const formatPrice: FormatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return price.toFixed(6);
  };

  interface FormatMarketCap {
    (marketCap: number): string;
  }

  const formatMarketCap: FormatMarketCap = (marketCap) => {
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

  return (
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
                    const cryptoMapping = {
                      bitcoin: "bitcoin",
                      ethereum: "ethereum",
                      binancecoin: "bnb",
                      "matic-network": "polygon",
                      cardano: "cardano",
                      solana: "solana",
                    };
                    const mappedCrypto = cryptoMapping[crypto.id as keyof typeof cryptoMapping];
                    if (mappedCrypto) {
                      onSelectCrypto(mappedCrypto); // Call the prop function
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
                          e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
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
                          className={`font-semibold text-sm ${
                            crypto.price_change_percentage_24h >= 0
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
  );
};

export default CryptoCarousel;
