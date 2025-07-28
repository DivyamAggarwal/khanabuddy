"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getInventoryItems } from "../utils/inventoryUtils";
import { createNewOrder } from "../../lib/orderService";

const END_PHRASES = [
  "my order is done",
  "place order",
  "order done",
  "submit order",
  "finish order",
  "murder is done",
  "complete order",
  "order completed",
  "that's all",
  "take my order",
  "my order is finished",
  "finish order",
];

// ✅ NEW: Clear all phrases
const CLEAR_PHRASES = [
  "clear all",
  "clear everything",
  "remove all",
  "delete all",
  "cancel all",
  "clear my order",
  "start over",
  "reset order",
];

// ✅ NEW: AI question phrases
const AI_QUESTION_PHRASES = [
  "are you an ai",
  "are you artificial intelligence",
  "are you a bot",
  "are you a robot",
  "are you human",
  "what are you",
  "who are you",
  "hu r u",
  "are you ai",
];

export default function OrderPage() {
  const router = useRouter();
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  const [messages, setMessages] = useState([
    { from: "ai", text: "Hi, What would you like to order?" },
  ]);
  const [input, setInput] = useState("");
  const [done, setDone] = useState(false);
  const [orderList, setOrderList] = useState([]);
  const [showProceedButton, setShowProceedButton] = useState(false);
  const [cachedInventory, setCachedInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);

  // ✅ FIXED: Proper inventory loading
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        console.log("🚀 Loading inventory from Supabase...");

        const items = await getInventoryItems();
        console.log("📦 Loaded items:", items?.length || 0);

        if (items && Array.isArray(items) && items.length > 0) {
          setCachedInventory(items);
          console.log("✅ Inventory cached successfully");
        } else {
          console.warn("⚠️ No inventory items found");
          setCachedInventory([]);
        }
      } catch (error) {
        console.error("❌ Error loading inventory:", error);
        setCachedInventory([]);
      } finally {
        setInventoryLoading(false);
      }
    };

    loadInventory();
  }, []);

  // ✅ FIXED: Inventory checking with proper error handling
  const checkInventoryItem = (spokenItem) => {
    try {
      if (inventoryLoading) {
        console.log("⏳ Inventory still loading...");
        return { found: false };
      }

      if (!cachedInventory || cachedInventory.length === 0) {
        console.log("❌ No inventory data available");
        return { found: false };
      }

      console.log("🔍 Looking for:", spokenItem);
      console.log(
        "📦 Available inventory:",
        cachedInventory.map((i) => i.item_name)
      );

      const spokenLower = spokenItem.toLowerCase();

      const matchingPatterns = {
        burger: ["burger", "bbq burger", "beef burger"],
        pizza: ["pizza", "margherita pizza", "pepperoni pizza", "cheese pizza"],
        fries: ["fries", "french fries", "loaded fries"],
        pasta: ["pasta", "spaghetti", "penne pasta"],
        salad: ["salad", "caesar salad", "garden salad"],
        "garlic bread": ["garlic bread", "bread"],
        coke: ["coke", "coca cola", "cola", "cook"],
        "chicken burger": ["chicken burger"],
        "margherita pizza": ["margherita pizza"],
        "loaded fries": ["loaded fries"],
        "onion rings": ["onion rings"],
        milkshake: ["milkshake", "shake"],
        smoothie: ["smoothie"],
      };

      let bestMatch = null;

      const exactMatch = cachedInventory.find(
        (item) => item.item_name && item.item_name.toLowerCase() === spokenLower
      );

      if (exactMatch) {
        console.log("✅ Exact match found:", exactMatch.item_name);
        bestMatch = exactMatch;
      } else {
        for (const [pattern, variations] of Object.entries(matchingPatterns)) {
          if (spokenLower === pattern || spokenLower.includes(pattern)) {
            const foundItem = cachedInventory.find(
              (item) =>
                item.item_name &&
                variations.some(
                  (variation) =>
                    item.item_name.toLowerCase() === variation ||
                    item.item_name.toLowerCase().includes(variation)
                )
            );

            if (foundItem) {
              console.log(
                `✅ Pattern match: "${spokenLower}" → "${foundItem.item_name}"`
              );
              bestMatch = foundItem;
              break;
            }
          }
        }
      }

      if (bestMatch) {
        return {
          found: true,
          available: (bestMatch.quantity || 0) > 0,
          price: bestMatch.price || 0,
          quantity: bestMatch.quantity || 0,
          name: bestMatch.item_name,
          displayName: spokenItem,
        };
      }

      console.log("❌ No match found for:", spokenItem);
      return { found: false };
    } catch (error) {
      console.error("❌ Error checking inventory:", error);
      return { found: false };
    }
  };

  // AI voice response

  useEffect(() => {
    if (typeof window === "undefined") return;
    const last = messages[messages.length - 1];
    if (last?.from === "ai") {
      const u = new window.SpeechSynthesisUtterance(last.text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }, [messages]);

  // SpeechRecognition setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (inventoryLoading) return; // Wait for inventory to load

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Please use Google Chrome — Speech Recognition is not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript.trim();
      handleVoiceInput(text);
    };
    recognition.onend = () => {
      if (!done && !showProceedButton && listeningRef.current) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }
    };
    recognition.onerror = (e) => console.warn("Speech recognition error:", e);

    recognitionRef.current = recognition;

    setTimeout(() => {
      startListening();
    }, 3000);

    return () => {
      recognition.stop();
      listeningRef.current = false;
    };
  }, [done, showProceedButton, inventoryLoading]);

  const startListening = () => {
    if (showProceedButton || done || inventoryLoading) return;
    try {
      recognitionRef.current?.start();
      listeningRef.current = true;
    } catch {}
  };

  const handleGoBack = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    listeningRef.current = false;
    router.push("/");
  };

  const handleProceedToPayment = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis.cancel();
    listeningRef.current = false;

    const total = orderList.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    localStorage.setItem(
      "orderData",
      JSON.stringify({
        items: orderList,
        total: total,
      })
    );

    router.push("/payment");
  };

  const handleVoiceInput = (msg) => {
    if (inventoryLoading) {
      console.log("⏳ Inventory still loading...");
      return;
    }

    const lower = msg.toLowerCase();

    // ✅ NEW: Check for clear all phrases first
    if (CLEAR_PHRASES.some((phrase) => lower.includes(phrase))) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: "user", text: msg },
      ]);

      setOrderList([]);

      setTimeout(() => {
        setMessages((msgs) => [
          ...msgs,
          {
            from: "ai",
            text: "All items cleared from your order! What would you like to order now?",
          },
        ]);
      }, 500);

      return;
    }

    // ✅ NEW: Check for AI questions
    if (AI_QUESTION_PHRASES.some((phrase) => lower.includes(phrase))) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { from: "user", text: msg },
      ]);

      setTimeout(() => {
        setMessages((msgs) => [
          ...msgs,
          {
            from: "ai",
            text: "I am  KhanaBuddy's Virtual helper! What would you like to order?",
          },
        ]);
      }, 500);

      // 3 second delay before continuing to listen
      setTimeout(() => {
        if (!done && !showProceedButton && listeningRef.current) {
          startListening();
        }
      }, 3500); // 500ms for message + 3000ms delay = 3500ms total

      return;
    }

    if (END_PHRASES.some((p) => lower.includes(p))) {
      recognitionRef.current?.stop();
      listeningRef.current = false;
      setShowProceedButton(true);
      setDone(true);

      setMessages((prevMessages) => [
        ...prevMessages,
        { from: "user", text: msg },
      ]);

      setOrderList((currentOrderList) => {
        const total = currentOrderList.reduce(
          (sum, item) => sum + item.quantity * item.price,
          0
        );

        setMessages([
          {
            from: "ai",
            text: `Thank you for your order! Your bill amount is ₹${total}. Now proceed to payment.`,
          },
        ]);

        return currentOrderList;
      });

      return;
    }

    if (done || showProceedButton) return;

    if (lower.includes("price")) {
      const possibleItems = [
        "burger",
        "chicken burger",
        "pizza",
        "margherita pizza",
        "fries",
        "loaded fries",
        "pasta",
        "salad",
        "garlic bread",
        "coke",
        "onion rings",
        "milkshake",
        "smoothie",
        "bbq burger",
        "hot dog",
        "veggie wrap",
      ];

      const askedItem = possibleItems.find((item) => lower.includes(item));

      if (askedItem) {
        const inventoryCheck = checkInventoryItem(askedItem);
        if (inventoryCheck.found && inventoryCheck.available) {
          setMessages((m) => [
            ...m,
            { from: "user", text: msg },
            {
              from: "ai",
              text: `The price of ${inventoryCheck.name} is ₹${inventoryCheck.price}.`,
            },
          ]);
        } else {
          setMessages((m) => [
            ...m,
            { from: "user", text: msg },
            { from: "ai", text: "not present" },
          ]);
        }
      } else {
        setMessages((m) => [
          ...m,
          { from: "user", text: msg },
          { from: "ai", text: "Which item price do you want to know?" },
        ]);
      }
      return;
    }

    setMessages((m) => [...m, { from: "user", text: msg }]);

    const quantityWords = {
      one: 1,
      two: 2,
      three: 3,
      four: 4,
      five: 5,
      six: 6,
      seven: 7,
      eight: 8,
      nine: 9,
      ten: 10,
      n1: 1,
      n2: 2,
      n3: 3,
      n4: 4,
      n5: 5,
      tu: 2,
      for: 4,
      to: 2,
    };

    const isRemove = lower.includes("remove") || lower.includes("cancel");
    const words = lower.split(" ");

    const possibleItems = [
      "chicken burger",
      "margherita pizza",
      "loaded fries",
      "garlic bread",
      "onion rings",
      "milkshake",
      "smoothie",
      "burger",
      "pizza",
      "fries",
      "pasta",
      "salad",
      "coke",
      "bbq burger",
      "hot dog",
      "veggie wrap",
    ];
    const detectedItems = [];

    for (const itemName of possibleItems) {
      if (lower.includes(itemName)) {
        let qty = 1;
        const itemWords = itemName.split(" ");
        const itemIndex = words.findIndex((word, index) => {
          if (itemWords.length === 1) {
            return word.includes(itemWords[0]);
          } else {
            return itemWords.every(
              (itemWord, offset) =>
                words[index + offset] &&
                words[index + offset].includes(itemWord)
            );
          }
        });

        if (itemIndex > 0) {
          const beforeWord = words[itemIndex - 1];
          if (!isNaN(parseInt(beforeWord))) {
            qty = parseInt(beforeWord);
          } else if (quantityWords[beforeWord]) {
            qty = quantityWords[beforeWord];
          }
        }

        detectedItems.push({ name: itemName, quantity: qty });
        break;
      }
    }

    console.log("🔍 Detected items:", detectedItems);

    if (detectedItems.length > 0) {
      detectedItems.forEach(({ name, quantity }) => {
        const inventoryCheck = checkInventoryItem(name);

        if (!inventoryCheck.found || !inventoryCheck.available) {
          setTimeout(() => {
            setMessages((msgs) => [
              ...msgs,
              { from: "ai", text: "not present" },
            ]);
          }, 500);
          return;
        }

        const price = inventoryCheck.price;
        const actualItemName = inventoryCheck.name;

        if (isRemove) {
          setOrderList((prev) => {
            const existingIndex = prev.findIndex(
              (i) => i.name === actualItemName
            );
            if (existingIndex === -1) {
              setTimeout(() => {
                setMessages((msgs) => [
                  ...msgs,
                  {
                    from: "ai",
                    text: `You don't have any ${name} in your order.`,
                  },
                ]);
              }, 500);
              return prev;
            }

            const updated = [...prev];
            const existing = updated[existingIndex];

            if (quantity >= existing.quantity) {
              updated.splice(existingIndex, 1);
              setTimeout(() => {
                setMessages((msgs) => [
                  ...msgs,
                  { from: "ai", text: `${name} removed` },
                ]);
              }, 500);
            } else {
              updated[existingIndex].quantity -= quantity;
              setTimeout(() => {
                setMessages((msgs) => [
                  ...msgs,
                  { from: "ai", text: `${quantity} ${name} removed` },
                ]);
              }, 500);
            }

            return updated;
          });
        } else {
          setOrderList((prev) => {
            const existingIndex = prev.findIndex(
              (i) => i.name === actualItemName
            );
            let updated = [...prev];

            if (existingIndex !== -1) {
              updated[existingIndex].quantity += quantity;
            } else {
              updated.push({
                name: actualItemName,
                price: price,
                quantity: quantity,
              });
            }

            setTimeout(() => {
              setMessages((msgs) => [
                ...msgs,
                {
                  from: "ai",
                  text: `${quantity === 1 ? "one" : quantity} ${name} added`,
                },
              ]);
            }, 500);

            return updated;
          });
        }
      });
    } else {
      setTimeout(() => {
        setMessages((msgs) => [...msgs, { from: "ai", text: "not present" }]);
      }, 500);
    }
  };

  const handleSend = () => {
    if (!input.trim() || done || showProceedButton || inventoryLoading) return;
    handleVoiceInput(input);
    setInput("");
  };

  // Show loading message while inventory loads
  if (inventoryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 pb-12">
        <header className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-20 py-4 px-6 flex justify-between items-center border-b border-amber-200">
          <h1 className="text-xl font-bold text-amber-900">
            🍽️ KhanaBuddy Order Assistant
          </h1>
          <button
            onClick={handleGoBack}
            className="bg-gradient-to-r from-rose-500 to-orange-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:scale-105 transition"
          >
            ⬅ Back
          </button>
        </header>

        <div className="max-w-6xl mx-auto mt-20 text-center">
          <div className="bg-white rounded-3xl shadow-xl border border-orange-200/50 p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-amber-900 mb-2">
              Loading Menu...
            </h2>
            <p className="text-amber-700">
              Please wait while we load the latest menu items from our kitchen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 pb-12">
      <header className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-20 py-4 px-6 flex justify-between items-center border-b border-amber-200">
        <h1 className="text-xl font-bold text-amber-900">
          🍽️ KhanaBuddy Order Assistant
        </h1>
        <button
          onClick={handleGoBack}
          className="bg-gradient-to-r from-rose-500 to-orange-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:scale-105 transition"
        >
          ⬅ Back
        </button>
      </header>

      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="col-span-2 bg-white rounded-3xl shadow-xl border border-orange-200/50 p-6 space-y-4">
          <h2 className="text-xl font-bold text-amber-900 mb-2">
            🤖 Chat with KhanaBuddy
          </h2>

          <div className="h-80 overflow-y-auto space-y-3 bg-rose-50 border border-rose-100 rounded-xl p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
                  msg.from === "ai"
                    ? "bg-amber-100 text-amber-900 self-start"
                    : "ml-auto bg-green-100 text-green-900 self-end"
                }`}
              >
                <b>{msg.from === "ai" ? "KhanaBuddy" : "You"}:</b> {msg.text}
              </div>
            ))}
          </div>

          {showProceedButton ? (
            <div className="mt-4 text-center">
              <button
                onClick={handleProceedToPayment}
                className="bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition transform"
              >
                🛒 Proceed to Payment
              </button>
            </div>
          ) : (
            !done && (
              <div className="flex gap-2 mt-4">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type or just speak..."
                  className="flex-1 px-4 py-2 border border-amber-300 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none"
                />
                <button
                  onClick={handleSend}
                  className="bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold px-5 py-2 rounded-xl shadow hover:scale-105 transition"
                >
                  Send
                </button>
              </div>
            )
          )}
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-xl border border-orange-200/50">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">
            🧾 Your Order
          </h2>
          {orderList.length === 0 ? (
            <p className="text-gray-600 italic">
              Your cart is empty. Add items to see them here.
            </p>
          ) : (
            <>
              <ul className="divide-y mb-4 border-t border-orange-100">
                {orderList.map((item, i) => (
                  <li
                    key={i}
                    className="py-3 text-sm flex justify-between text-gray-900"
                  >
                    <span>
                      {item.quantity} × {item.name}
                    </span>
                    <span>₹{item.quantity * item.price}</span>
                  </li>
                ))}
              </ul>
              <div className="text-right text-lg font-bold text-amber-800">
                Total: ₹
                {orderList.reduce(
                  (sum, item) => sum + item.quantity * item.price,
                  0
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
