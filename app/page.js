"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadInventoryItems } from "../lib/orderService"; // ✅ Changed from inventoryUtils to Supabase

// Unsplash direct CDN images – no need to download!
const bgImages = [
  "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
  "https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&w=1200&q=80",
  "https://images.pexels.com/photos/2232/vegetables-italian-pizza-restaurant.jpg?auto=compress&w=1200&q=80",
  "https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg",
  "https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&w=1200&q=80",
];

// ✅ Emoji mapping for different items
const getItemEmoji = (itemName) => {
  const name = itemName.toLowerCase();
  const emojiMap = {
    'fries': '🍟',
    'french fries': '🍟',
    'loaded fries': '🍟',
    'garlic bread': '🥖',
    'bread': '🍞',
    'pasta': '🍝',
    'spaghetti': '🍝',
    'penne': '🍝',
    'salad': '🥗',
    'caesar salad': '🥗',
    'garden salad': '🥗',
    'burger': '🍔',
    'chicken burger': '🍔',
    'bbq burger': '🍔',
    'beef burger': '🍔',
    'pizza': '🍕',
    'margherita pizza': '🍕',
    'pepperoni pizza': '🍕',
    'cheese pizza': '🍕',
    'coke': '🥤',
    'coca cola': '🥤',
    'cola': '🥤',
    'milkshake': '🥤',
    'shake': '🥤',
    'smoothie': '🥤',
    'onion rings': '🧅',
    'sandwich': '🥪',
    'wrap': '🌯',
    'taco': '🌮',
    'burrito': '🌯'
  };
  
  // Find matching emoji or use default
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) {
      return emoji;
    }
  }
  
  return '🍽️'; // Default emoji for unknown items
};

export default function LandingPage() {
  const [idx, setIdx] = useState(0);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ✅ UPDATED: Load menu items from Supabase
  const loadMenuFromInventory = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Loading menu from Supabase...');
      
      const result = await loadInventoryItems();
      
      if (result.success && result.data) {
        console.log('📦 Raw inventory from Supabase:', result.data);
        
        // Convert Supabase inventory items to menu format and filter available items
        const dynamicMenu = result.data
          .filter(item => item.quantity > 0) // Only show items in stock
          .map(item => ({
            name: item.item_name,
            price: item.price,
            emoji: getItemEmoji(item.item_name),
            quantity: item.quantity
          }))
          .sort((a, b) => a.price - b.price); // Sort by price
        
        console.log('✅ Dynamic menu created from Supabase:', dynamicMenu);
        setMenuItems(dynamicMenu);
      } else {
        console.error('❌ Failed to load menu from Supabase:', result.error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('❌ Error loading menu from Supabase:', error);
      setMenuItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Load inventory on component mount
  useEffect(() => {
    loadMenuFromInventory();
  }, []);

  // ✅ Listen for inventory updates in real-time
  useEffect(() => {
    const handleInventoryUpdate = () => {
      console.log('🔄 Inventory updated, refreshing menu from Supabase...');
      loadMenuFromInventory();
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    window.addEventListener('pricesUpdated', handleInventoryUpdate);
    window.addEventListener('quantityUpdated', handleInventoryUpdate);

    return () => {
      window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
      window.removeEventListener('pricesUpdated', handleInventoryUpdate);
      window.removeEventListener('quantityUpdated', handleInventoryUpdate);
    };
  }, []);

  // Automatic background slide every 4 seconds
  useEffect(() => {
    const intv = setInterval(
      () => setIdx((i) => (i + 1) % bgImages.length),
      4000
    );
    return () => clearInterval(intv);
  }, []);

  // ✅ Calculate dynamic stats
  const totalItems = menuItems.length;
  const lowestPrice = menuItems.length > 0 ? Math.min(...menuItems.map(item => item.price)) : 0;
  const totalStock = menuItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
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
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-[2.5rem] md:text-5xl font-bold shadow-lg mb-3 text-white tracking-tight drop-shadow-xl">
            KhanaBuddy
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-medium shadow text-center max-w-lg">
            Order by Voice, Dine with Joy - Fast & Easy! <br />
          </p>
        </div>

        {/* ✅ Menu Table Section with Scroll */}
        <div className="w-full max-w-2xl mx-auto mb-8">
          <div className="bg-white/20 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 p-6 md:p-8">
            {/* Menu Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
                🍽️ Our Menu
              </h2>
              <p className="text-white/80 drop-shadow-md">
                Fresh ingredients, great taste, always affordable
              </p>
            </div>

            {/* ✅ Loading State */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-white mt-4">Loading fresh menu from database...</p>
              </div>
            ) : menuItems.length === 0 ? (
              /* ✅ Empty State */
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🍽️</div>
                <p className="text-white/90 mb-2">Menu is being prepared!</p>
                <p className="text-white/70 text-sm">Check back soon for fresh items.</p>
              </div>
            ) : (
              /* ✅ SCROLLABLE Menu Table Container */
              <div className="overflow-hidden rounded-2xl border border-white/20">
                {/* Fixed Table Header */}
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

                {/* ✅ SCROLLABLE Menu Body - Fixed Height with Scroll */}
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
                            {/* ✅ Show low stock indicator */}
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

            {/* ✅ Dynamic Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-lg md:text-xl font-bold text-white">{totalItems}</div>
                <div className="text-xs md:text-sm text-white/80">Items</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-lg md:text-xl font-bold text-yellow-300">
                  {lowestPrice > 0 ? `₹${lowestPrice}` : '₹0'}
                </div>
                <div className="text-xs md:text-sm text-white/80">From</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
                <div className="text-lg md:text-xl font-bold text-green-300">
                  {totalStock > 0 ? 'Fresh' : 'Soon'}
                </div>
                <div className="text-xs md:text-sm text-white/80">
                  {totalStock > 0 ? 'Always' : 'Coming'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Dynamic Order Button */}
        <button
          type="button"
          onClick={() => router.push("/order")}
          disabled={menuItems.length === 0}
          className={`shadow-2xl w-[95vw] max-w-[26rem] py-4 text-xl font-bold rounded-xl transition-all ${
            menuItems.length > 0
              ? 'bg-gradient-to-r from-teal-500 via-indigo-500 to-pink-500 text-white hover:scale-105'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
        >
          {menuItems.length > 0 ? '🛒 Order Now' : '⏳ Menu Loading...'}
        </button>
      </div>

      {/* ✅ Custom Scrollbar Styles */}
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
        
        /* Firefox scrollbar styling */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.3) rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
