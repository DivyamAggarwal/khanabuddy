"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadInventoryItems } from "../lib/orderService";

// Background images array (keeping your existing images)
const bgImages = [
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&w=1200&q=80",
  "https://images.pexels.com/photos/2232/vegetables-italian-pizza-restaurant.jpg?auto=compress&w=1200&q=80",
  "https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg",
  "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&w=1200&q=80",
];

// Emoji mapping for menu items
const getItemEmoji = (itemName) => {
  const name = itemName.toLowerCase();
  const emojiMap = {
    fries: "🍟",
    "french fries": "🍟",
    "loaded fries": "🍟",
    "garlic bread": "🥖",
    bread: "🍞",
    pasta: "🍝",
    spaghetti: "🍝",
    penne: "🍝",
    salad: "🥗",
    "caesar salad": "🥗",
    "garden salad": "🥗",
    burger: "🍔",
    "chicken burger": "🍔",
    "bbq burger": "🍔",
    "beef burger": "🍔",
    pizza: "🍕",
    "margherita pizza": "🍕",
    "pepperoni pizza": "🍕",
    "cheese pizza": "🍕",
    coke: "🥤",
    "coca cola": "🥤",
    cola: "🥤",
    milkshake: "🥤",
    shake: "🥤",
    smoothie: "🥤",
    "onion rings": "🧅",
    sandwich: "🥪",
    wrap: "🌯",
    taco: "🌮",
    burrito: "🌯",
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) {
      return emoji;
    }
  }
  return "🍽️";
};

export default function LandingPage() {
  const [idx, setIdx] = useState(0);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load menu items from Supabase
  const loadMenuFromInventory = async () => {
    try {
      setIsLoading(true);
      console.log("🚀 Loading menu from Supabase...");

      const result = await loadInventoryItems();

      if (result.success && result.data) {
        console.log("📦 Raw inventory from Supabase:", result.data);

        const dynamicMenu = result.data
          .filter((item) => item.quantity > 0)
          .map((item) => ({
            name: item.item_name,
            price: item.price,
            emoji: getItemEmoji(item.item_name),
            quantity: item.quantity,
          }))
          .sort((a, b) => a.price - b.price);

        console.log("✅ Dynamic menu created from Supabase:", dynamicMenu);
        setMenuItems(dynamicMenu);
      } else {
        console.error("❌ Failed to load menu from Supabase:", result.error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error("❌ Error loading menu from Supabase:", error);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuFromInventory();
  }, []);

  useEffect(() => {
    const handleInventoryUpdate = () => {
      console.log("🔄 Inventory updated, refreshing menu from Supabase...");
      loadMenuFromInventory();
    };

    window.addEventListener("inventoryUpdated", handleInventoryUpdate);
    window.addEventListener("pricesUpdated", handleInventoryUpdate);
    window.addEventListener("quantityUpdated", handleInventoryUpdate);

    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdate);
      window.removeEventListener("pricesUpdated", handleInventoryUpdate);
      window.removeEventListener("quantityUpdated", handleInventoryUpdate);
    };
  }, []);

  useEffect(() => {
    const intv = setInterval(
      () => setIdx((i) => (i + 1) % bgImages.length),
      4000
    );
    return () => clearInterval(intv);
  }, []);

  const totalItems = menuItems.length;
  const lowestPrice =
    menuItems.length > 0 ? Math.min(...menuItems.map((item) => item.price)) : 0;
  const totalStock = menuItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="min-h-screen w-full relative overflow-hidden">
        {/* Background Images */}
        <div className="absolute inset-0 -z-10">
          {bgImages.map((src, i) => (
            <img
              key={src}
              alt=""
              src={src}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-900 ease-in-out ${
                i === idx ? "opacity-100" : "opacity-0"
              }`}
              style={{ transition: "opacity 0.9s cubic-bezier(.4,0,.2,1)" }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-black/40 pointer-events-none" />
        </div>

        {/* Admin Button */}
        <button
          onClick={() => router.push("/admin-login")}
          className="fixed top-5 right-7 bg-white/80 text-black text-sm font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-white/90 z-20"
        >
          Admin
        </button>

        {/* Main Content Container */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
          {/* ✅ UPDATED: Header Section with Logo and Name Side by Side */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-1">
              {/* Logo */}
              <img
                src="/websitelogoo.png"
                alt="KhanaBuddy Logo"
                className="w-20 h-auto md:w-24 lg:w-28 drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
              {/* Brand Name */}
              <h1 className="text-[2.5rem] md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-xl">
                KhanaBuddy
              </h1>
            </div>
            <p className="text-lg md:text-xl text-white/90 font-medium shadow text-center max-w-lg drop-shadow-lg mx-auto">
              Order by Voice, Dine with Joy - Fast & Easy!
            </p>
          </div>

          {/* Menu Table Section - Rest of your existing code remains the same */}
          <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                  🍽️ Our Menu
                </h2>
                <p className="text-white/80 drop-shadow-md">
                  Fresh ingredients, great taste, always affordable
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="text-white mt-4">
                    Loading fresh menu from database...
                  </p>
                </div>
              ) : menuItems.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🍽️</div>
                  <p className="text-white/90 mb-2">Menu is being prepared!</p>
                  <p className="text-white/70 text-sm">
                    Check back soon for fresh items.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/20">
                  <div className="bg-white/10 backdrop-blur-sm">
                    <div className="grid grid-cols-2">
                      <div className="px-4 md:px-6 py-4 text-left text-sm md:text-base font-bold text-white uppercase tracking-wider">
                        Item
                      </div>
                      <div className="px-4 md:px-6 py-4 text-right text-sm md:text-base font-bold text-white uppercase tracking-wider">
                        Price
                      </div>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="divide-y divide-white/10">
                      {menuItems.map((item, index) => (
                        <div
                          key={`${item.name}-${index}`}
                          className="grid grid-cols-2 hover:bg-white/10 transition-colors duration-200"
                        >
                          <div className="px-4 md:px-6 py-4">
                            <div className="flex items-center">
                              <span className="text-xl md:text-2xl mr-3">
                                {item.emoji}
                              </span>
                              <div className="text-base md:text-lg font-semibold text-white drop-shadow-md">
                                {item.name}
                              </div>
                              {item.quantity < 5 && (
                                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                  Low Stock
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="px-4 md:px-6 py-4 text-right">
                            <div className="text-lg md:text-xl font-bold text-yellow-300 drop-shadow-md">
                              ₹{item.price}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 group hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-lg mr-1">🍽️</span>
                    <div className="text-lg md:text-xl font-bold text-white">
                      {totalItems}
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-white/80 font-medium">
                    Menu Items
                  </div>
                  <div className="text-[10px] text-white/60 mt-1">
                    Something for everyone
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 group hover:bg-white/15 transition-all duration-300">
                  <div className="text-[10px] md:text-xs text-white/70 font-medium mb-1">
                    Starting From
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-sm mr-1">💰</span>
                    <div className="text-lg md:text-xl font-bold text-yellow-300">
                      {lowestPrice > 0 ? `₹${lowestPrice}` : "₹0"}
                    </div>
                  </div>
                  <div className="text-[10px] text-white/60 mt-1">
                    Budget friendly
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 group hover:bg-white/15 transition-all duration-300">
                  <div className="flex items-center justify-center mb-1">
                    <span className="text-lg mr-1">
                      {totalStock > 0 ? "✅" : "⏳"}
                    </span>
                    <div className="text-lg md:text-xl font-bold text-green-300">
                      {totalStock > 0 ? "Fresh" : "Soon"}
                    </div>
                  </div>
                  <div className="text-xs md:text-sm text-white/80 font-medium">
                    {totalStock > 0 ? "Made to Order" : "Coming Soon"}
                  </div>
                  <div className="text-[10px] text-white/60 mt-1">
                    {totalStock > 0 ? "Zero compromise" : "Please wait"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Now Button - Keep existing implementation */}
          <div className="w-full max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => router.push("/order")}
              disabled={menuItems.length === 0}
              className={`
                group relative w-full py-6 px-8 rounded-2xl
                backdrop-blur-md border border-white/30
                transition-all duration-300 ease-out
                shadow-xl hover:shadow-2xl
                ${
                  menuItems.length > 0
                    ? "bg-white/20 hover:bg-white/25 hover:scale-[1.02] hover:border-white/40 active:scale-[0.98]"
                    : "bg-white/10 border-white/20 cursor-not-allowed opacity-60"
                }
              `}
            >
              <div
                className={`
                absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                transition-opacity duration-300
                ${
                  menuItems.length > 0
                    ? "bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20"
                    : ""
                }
              `}
              />

              <div className="relative flex items-center justify-center space-x-3">
                <div
                  className={`
                  text-3xl transition-transform duration-300
                  ${
                    menuItems.length > 0
                      ? "group-hover:scale-110 group-hover:rotate-12"
                      : ""
                  }
                `}
                >
                  {menuItems.length > 0 ? "🛒" : "⏳"}
                </div>

                <div className="text-center">
                  <div
                    className={`
                    text-2xl font-bold tracking-wide
                    ${menuItems.length > 0 ? "text-white" : "text-white/70"}
                    drop-shadow-lg
                  `}
                  >
                    {menuItems.length > 0 ? "Order Now" : "Menu Loading..."}
                  </div>

                  {menuItems.length > 0 && (
                    <div className="text-white/80 text-sm font-medium mt-1 drop-shadow-md">
                      Voice ordering • Fast delivery
                    </div>
                  )}
                </div>

                {menuItems.length > 0 && (
                  <div className="text-white/70 group-hover:text-white transition-colors duration-300 group-hover:translate-x-1">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {menuItems.length === 0 && (
                <div className="absolute inset-0 rounded-2xl bg-white/5 animate-pulse" />
              )}

              {menuItems.length > 0 && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 group-hover:translate-x-full"
                  style={{
                    transition:
                      "transform 0.8s ease-out, opacity 0.3s ease-out",
                  }}
                />
              )}
            </button>

            {menuItems.length > 0 && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-2 border border-white/20">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-sm font-medium">
                      Live Menu
                    </span>
                  </div>
                  <div className="text-white/60">•</div>
                  <div className="text-white/80 text-sm font-medium">
                    {totalItems} items available
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Scrollbar Styles */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }

          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
          }
        `}</style>
      </div>

      {/* Footer - Keep your existing footer code */}
      <footer className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🍽️</span>
                </div>
                <h3 className="text-2xl font-bold text-white">KhanaBuddy</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                Smart Voice-Enabled Food Ordering Platform for modern dining.
                <br />
                Transparent, efficient, and reliable service for all food
                lovers.
                <br />
                Order by Voice, Dine with Joy - Fast & Easy!
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-6">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="/"
                    className="text-gray-300 hover:text-orange-400 transition-colors cursor-pointer block"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/order"
                    className="text-gray-300 hover:text-orange-400 transition-colors cursor-pointer block"
                  >
                    Place Order
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="text-gray-300 hover:text-orange-400 transition-colors cursor-pointer block"
                  >
                    Track Order
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="text-gray-300 hover:text-orange-400 transition-colors cursor-pointer block"
                  >
                    Guidelines
                  </a>
                </li>
                <li>
                  <a
                    href=""
                    className="text-gray-300 hover:text-orange-400 transition-colors cursor-pointer block"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-6">Support</h4>
              <div className="space-y-3 text-sm">
                <div className="text-gray-300">Emergency: 139</div>
                <div className="text-gray-300">General: 1800-111-139</div>
                <div className="text-gray-300">support@khanabuddy.com</div>
                <div className="text-gray-300 mt-4">24/7 Online Support</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-400 text-sm">
                © 2025 KhanaBuddy. All Rights Reserved.
              </p>
              {/* <p className="text-gray-400 text-sm">
                Project by <span className="text-orange-400"></span> • <a href="#" className="text-orange-400 hover:text-orange-300 transition-colors"></a>
              </p> */}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
