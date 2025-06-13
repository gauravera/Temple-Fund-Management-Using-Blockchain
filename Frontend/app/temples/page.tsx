"use client";
import { Heart, MapPin, ImageIcon, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface TempleCard {
    _id: string;
    templeName: string;
    location: {
        city: string;
        state: string;
    };
    description: string;
    coverImage: string;
    slug: string;
}

export default function TempleCards() {
    const [temples, setTemples] = useState<TempleCard[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [filteredTemples, setFilteredTemples] = useState<TempleCard[]>([]);
    const router = useRouter();

    useEffect(() => {
        const fetchTemples = async () => {
            try {
                const response = await fetch("http://localhost:5050/api/v1/templeDetails/public-temple-cards");
                const result = await response.json();

                if (!response.ok) {
                    console.error("Error fetching temples:", result.message);
                    setTemples([]);
                    return;
                }

                setTemples(result.data);
                setFilteredTemples(result.data);
            } catch (error) {
                console.error("Failed to fetch temples:", error);
            }
        };

        fetchTemples();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        const filtered = temples.filter((temple) =>
            temple.templeName.toLowerCase().includes(value.toLowerCase()) ||
            temple.location.city.toLowerCase().includes(value.toLowerCase()) ||
            temple.location.state.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredTemples(filtered);
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Explore Temples</h1>
                    <p className="text-muted-foreground">Discover and support temples across India with transparent donations</p>
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder="Search temples..."
                    className="px-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-orange-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemples.length === 0 ? (
                    <div className="col-span-full text-center text-gray-500 text-lg">
                        No temples available at the moment.
                    </div>
                ) : (
                    filteredTemples.map((temple) => (
                        <div
                            key={temple._id}
                            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
                        >
                            <div className="relative">
                                {temple.coverImage ? (
                                    <img src={temple.coverImage} alt={temple.templeName} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg text-gray-900 truncate pr-2">{temple.templeName}</h3>
                                    <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                        <Heart className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>

                                <div className="flex items-center text-sm text-gray-600 mb-3">
                                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">
                                        {temple.location.city}, {temple.location.state}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                    {temple.description}
                                </p>

                                <div className="flex gap-2">
                                    <Link href={`/temples/${temple.slug}`}>
                                        <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
                                            View Details
                                        </button>
                                    </Link>

                                    <button
                                        onClick={() => router.push("/user/donate")}
                                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
                                    >
                                        Donate
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
