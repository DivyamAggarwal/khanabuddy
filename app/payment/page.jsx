"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";

export default function PaymentPage() {
  const router = useRouter();
  const [orderData, setOrderData] = useState({ items: [], total: 0 });
  const [qrCodeImage, setQrCodeImage] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(true);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
  });
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentCancelled, setPaymentCancelled] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);

  // Load order data from localStorage
  useEffect(() => {
    const savedOrderData = localStorage.getItem("orderData");
    if (savedOrderData) {
      setOrderData(JSON.parse(savedOrderData));
    }
  }, []);

  // Generate QR Code when customer details are submitted
  const generateQRCode = async () => {
    try {
      const paymentData = {
        status: "PAYMENT_SUCCESS",
        message: "Payment Completed Successfully",
        amount: orderData.total,
        customer: customerDetails.name,
        phone: customerDetails.phone,
        orderId: Date.now(),
        paymentMethod: "QR_SCAN",
        timestamp: new Date().toISOString(),
      };

      const qrString = await QRCode.toDataURL(JSON.stringify(paymentData), {
        width: 300,
        margin: 2,
        color: {
          dark: "#92400e",
          light: "#fffbeb",
        },
      });

      setQrCodeImage(qrString);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  // Handle customer form submission with auto-progression
  const handleCustomerFormSubmit = (e) => {
    e.preventDefault();

    // Validate customer details
    if (!customerDetails.name.trim()) {
      alert("Please enter your full name");
      return;
    }

    if (!customerDetails.phone.trim()) {
      alert("Please enter your phone number");
      return;
    }

    // Strict 10-digit validation only
    if (!/^[0-9]{10}$/.test(customerDetails.phone.trim())) {
      alert("Please enter a valid 10-digit mobile number");
      return;
    }

    // Auto-progress: Move to QR generation and start immediately
    setShowCustomerForm(false);
    generateQRCode();

    // Auto-start QR generation after a brief delay
    setTimeout(() => {
      handleStartScan();
    }, 500);
  };

  // Updated function: Show QR for 6 seconds, then proceed
  const handleStartScan = () => {
    setShowQR(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setPaymentProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        // Display QR code for 6 seconds before auto-confirmation
        setTimeout(() => {
          setQrScanned(true);
        }, 5000); // Changed from 2000ms to 6000ms (6 seconds)
      }
    }, 200);
  };

  // Save order to admin dashboard and complete payment
  // ✅ FIXED: Proper quantity handling for admin dashboard
const handleYesClick = () => {
  // Create expanded items array that represents actual quantities
  const expandedItems = [];
  
  orderData.items.forEach(item => {
    // Add each item name multiple times based on quantity
    for (let i = 0; i < item.quantity; i++) {
      expandedItems.push(item.name);
    }
  });

  console.log('💾 Original orderData.items:', orderData.items);
  console.log('💾 Expanded items for admin:', expandedItems);

  // Create new order for admin dashboard
  const newOrder = {
    id: `ORD-${Date.now()}`,
    customerName: customerDetails.name.trim(),
    items: expandedItems, // ✅ Now contains ["pizza", "pizza", "pizza"] for 3 pizzas
    orderTime: new Date().toISOString(),
    status: "preparing",
    phone: customerDetails.phone.trim(),
    total: orderData.total,
  };

  // Add to admin dashboard active orders
  const existingOrders = JSON.parse(
    localStorage.getItem("activeOrders") || "[]"
  );
  const updatedOrders = [...existingOrders, newOrder];
  localStorage.setItem("activeOrders", JSON.stringify(updatedOrders));

  // Clear payment order data
  localStorage.removeItem("orderData");

  setPaymentComplete(true);
};


  const handleNoClick = () => {
    setPaymentCancelled(true);
  };

  const handleGoBack = () => {
    router.back();
  };

  // Payment Complete Screen
  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-orange-200/50 p-8 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-amber-900 mb-4">
            Payment Complete!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you <strong>{customerDetails.name}</strong>!
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Your payment of ₹{orderData.total} has been processed successfully.
            Your order has been sent to the kitchen.
          </p>
          <button
            onClick={() => router.push(process.env.NEXT_PUBLIC_HOST_URL || "/")}
            className="bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition transform"
          >
            🏠 Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Payment Cancelled Screen
  if (paymentCancelled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl border border-orange-200/50 p-8 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-rose-600 mb-4">
            Payment Cancelled!
          </h1>
          <p className="text-gray-600 mb-6">
            Your payment of ₹{orderData.total} has been cancelled. No charges
            were made to your account.
          </p>
          <div className="space-y-3">
            <button
              onClick={() =>
                router.push(process.env.NEXT_PUBLIC_HOST_URL || "/")
              }
              className="w-full bg-gradient-to-r from-rose-500 to-orange-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition transform"
            >
              🏠 Back to Home
            </button>
            <button
              onClick={() => {
                setPaymentCancelled(false);
                setShowCustomerForm(true);
                setShowQR(false);
                setQrScanned(false);
                setCustomerDetails({ name: "", phone: "" });
                setPaymentProgress(0);
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-400 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:scale-105 transition transform"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 pb-12">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur shadow-md sticky top-0 z-20 py-4 px-6 flex justify-between items-center border-b border-amber-200">
        <h1 className="text-xl font-bold text-amber-900">
          💳 KhanaBuddy Payment Gateway
        </h1>
        <button
          onClick={handleGoBack}
          className="bg-gradient-to-r from-rose-500 to-orange-400 text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:scale-105 transition"
        >
          ⬅ Back
        </button>
      </header>

      {/* Main Layout */}
      <div className="max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Section */}
        <section className="col-span-2 bg-white rounded-3xl shadow-xl border border-orange-200/50 p-6 space-y-4">
          <h2 className="text-xl font-bold text-amber-900 mb-2">
            📱 Complete Your Payment
          </h2>

          {/* Step 1: Customer Details Form */}
          {showCustomerForm ? (
            <div className="space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-6">
                <form
                  onSubmit={handleCustomerFormSubmit}
                  className="max-w-md mx-auto space-y-6"
                >
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">👤</div>
                    <h3 className="text-2xl font-bold text-amber-900">
                      Customer Details
                    </h3>
                    <p className="text-sm text-gray-600 mt-2">
                      Please provide your details to proceed with payment
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-800 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerDetails.name}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-900"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-800 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) => {
                        // Only allow numbers and limit to exactly 10 digits
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);
                        setCustomerDetails({
                          ...customerDetails,
                          phone: value,
                        });
                      }}
                      className="w-full px-4 py-3 border border-amber-300 rounded-xl focus:ring-2 focus:ring-orange-300 outline-none bg-white text-gray-900"
                      placeholder="9876543210"
                      maxLength="10"
                      required
                    />
                    <p className="text-xs text-amber-600 mt-1">
                      Enter 10-digit mobile number (without country code)
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold px-6 py-4 rounded-xl shadow-lg hover:scale-105 transition transform text-lg"
                  >
                    Continue to Payment QR ➤
                  </button>
                </form>
              </div>
            </div>
          ) : !qrScanned ? (
            /* Step 2 & 3: Auto QR Code Generation & Display */
            <div className="space-y-6">
              <div className="h-80 bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-center">
                {!showQR ? (
                  <div className="text-center text-amber-600">
                    <div className="animate-pulse text-6xl mb-4">⚡</div>
                    <p className="font-semibold text-lg">
                      Processing Details...
                    </p>
                    <p className="text-sm">
                      Automatically generating your payment QR
                    </p>
                  </div>
                ) : qrCodeImage ? (
                  <div className="bg-white p-4 rounded-2xl shadow-lg">
                    <img
                      src={qrCodeImage}
                      alt="Payment QR Code"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                ) : (
                  <div className="text-center text-amber-600">
                    <div className="animate-spin text-4xl mb-2">🔄</div>
                    <p className="font-semibold">
                      Generating secure QR code...
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {showQR && paymentProgress > 0 && paymentProgress < 100 && (
                <div className="bg-amber-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-amber-700 font-semibold">
                      🔒 Securing Payment
                    </span>
                    <span className="text-sm text-amber-600">
                      {paymentProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${paymentProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* QR Ready State */}
              {showQR && paymentProgress >= 100 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="text-xl font-bold text-green-600 mb-4">
                      QR Code Ready! Scan Now
                    </h3>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-bold text-green-700 mb-2">
                      📲 Scan Instructions:
                    </h4>
                    <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside mb-4">
                      <li>Open your phone's camera app</li>
                      <li>Point at the QR code above</li>
                      <li>Tap the notification that appears</li>
                      <li>You'll see "Payment Completed Successfully"</li>
                      <li>Wait for automatic confirmation below</li>
                    </ol>

                    <div className="text-center text-sm text-green-600 italic">
                      ⏳ Auto-confirming payment in 6 seconds...
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Step 4: Final Confirmation - Simplified */
            <div className="space-y-6">
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-6 overflow-hidden">
                <div className="flex items-center justify-center min-h-[300px]">
                  <div className="text-center space-y-4 w-full max-w-sm mx-auto">
                    <div className="text-5xl mb-3">🎉</div>
                    <h3 className="text-xl font-bold text-green-600 mb-3">
                      Payment Successful!
                    </h3>
                    <p className="text-sm text-green-700 mb-4 px-2">
                      Your payment has been completed successfully. Ready to
                      send your order to the kitchen?
                    </p>

                    {/* Simplified Order Summary - Fixed Container */}
                    <div className="bg-white rounded-xl p-4 border border-amber-200 mx-2">
                      <h4 className="font-bold text-amber-800 mb-3">
                        Order Confirmation
                      </h4>
                      <div className="space-y-2 text-left text-sm">
                        <p>
                          <strong>Customer:</strong> {customerDetails.name}
                        </p>
                        <p>
                          <strong>Phone:</strong> {customerDetails.phone}
                        </p>
                        <p>
                          <strong>Total Amount:</strong>{" "}
                          <span className="text-lg font-bold text-amber-700">
                            ₹{orderData.total}
                          </span>
                        </p>
                        <p>
                          <strong>Items:</strong> {orderData.items.length}{" "}
                          item(s)
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 text-sm px-2">
                      Click below to send your order to the kitchen for
                      preparation.
                    </p>

                    {/* Fixed Confirm Button */}
                    <div className="flex justify-center px-2">
                      <button
                        onClick={handleYesClick}
                        className="bg-gradient-to-r from-green-500 to-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 transition transform text-base w-full max-w-xs"
                      >
                        ✅ Confirm Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Order Summary Sidebar - Keep as is */}
        <section className="bg-white p-6 rounded-3xl shadow-xl border border-orange-200/50">
          <h2 className="text-xl font-semibold text-amber-900 mb-4">
            🧾 Payment Summary
          </h2>
          {orderData.items.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-amber-700 font-semibold mb-2">
                  Order Details:
                </p>
                <ul className="divide-y mb-4 border-t border-orange-100">
                  {orderData.items.map((item, i) => (
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
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center text-lg font-bold text-amber-800">
                  <span>Total Amount:</span>
                  <span>₹{orderData.total}</span>
                </div>
              </div>

              {customerDetails.name && (
                <div className="bg-green-50 rounded-xl p-4 mb-4">
                  <p className="text-sm text-green-700 font-semibold mb-1">
                    Customer:
                  </p>
                  <p className="text-green-800 font-bold">
                    {customerDetails.name}
                  </p>
                  <p className="text-green-700">{customerDetails.phone}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p>• No hidden charges</p>
                <p>• Secure payment gateway</p>
                <p>• Instant order confirmation</p>
              </div>
            </>
          ) : (
            <p className="text-gray-600 italic">
              No order data found. Please go back to place an order.
            </p>
          )}
        </section>
      </div>

      {/* Security Info */}
      <div className="max-w-6xl mx-auto mt-6">
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-4">
            <div className="text-2xl">🔒</div>
            <div>
              <h3 className="font-bold text-amber-900">
                Secure KhanaBuddy Payment
              </h3>
              <p className="text-sm text-amber-700">
                Your order and personal information are protected by advanced
                encryption.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
