"use client";

import { useState, useEffect } from "react";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = fetch(`${API_URL}/api/stripe/config`)
      .then((r) => r.json())
      .then((d) => loadStripe(d.publishableKey))
      .catch(() => null);
  }
  return stripePromise;
}

function CheckoutForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");
      setProcessing(false);
    } else if (result.paymentIntent?.status === "succeeded") {
      setSucceeded(true);
      setProcessing(false);
      setTimeout(onSuccess, 2000);
    }
  }

  if (succeeded) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#ecfdf5", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.5rem", color: "#059669" }}>&#10003;</span>
        </div>
        <h3 style={{ color: "#059669", fontWeight: 700, margin: "0 0 0.5rem" }}>Payment Successful!</h3>
        <p style={{ color: "#627d98", fontSize: "0.85rem" }}>A confirmation will be emailed to you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.5rem", borderRadius: "6px", fontSize: "0.8rem", marginTop: "0.75rem" }}>
          {error}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            flex: 1, padding: "0.75rem", background: "#059669", color: "white", border: "none",
            borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            opacity: processing ? 0.6 : 1,
          }}
        >
          {processing ? "Processing..." : "Pay Now"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ padding: "0.75rem 1.5rem", background: "none", border: "1px solid #d1d5db", borderRadius: "8px", color: "#627d98", cursor: "pointer", fontSize: "0.85rem" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function InvoicePaymentForm({
  invoiceId,
  onSuccess,
  onCancel,
}: {
  invoiceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeObj, setStripeObj] = useState<Stripe | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStripe().then(setStripeObj);

    fetch(`${API_URL}/api/invoices/${invoiceId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to create payment");
        return r.json();
      })
      .then((d) => setClientSecret(d.clientSecret))
      .catch((e) => setError(e.message));
  }, [invoiceId]);

  if (error) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{error}</p>
        <button onClick={onCancel} style={{ marginTop: "0.5rem", padding: "0.5rem 1rem", background: "none", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", color: "#627d98" }}>
          Close
        </button>
      </div>
    );
  }

  if (!clientSecret || !stripeObj) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#627d98" }}>
        Setting up payment...
      </div>
    );
  }

  return (
    <Elements stripe={stripeObj} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#059669" } } }}>
      <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
