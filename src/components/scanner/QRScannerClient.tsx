"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, History } from "lucide-react";

interface QRScannerClientProps {
  eventId: string;
  eventTitle: string;
}

interface ScanHistoryItem {
  code: string;
  status: "success" | "error";
  name?: string;
  tier?: string;
  error?: string;
  time: string;
}

interface TicketRecord {
  unique_code?: string;
  profiles?: {
    full_name?: string;
  };
  ticket_type?: {
    name?: string;
  };
}

interface VerificationResponse {
  ticket?: TicketRecord;
}

export default function QRScannerClient({ eventId, eventTitle }: QRScannerClientProps) {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<VerificationResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem(`scan_history_${eventId}`);
      return savedHistory ? JSON.parse(savedHistory) : [];
    }
    return [];
  });

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const saveToHistory = useCallback((item: ScanHistoryItem) => {
    setHistory((prev) => {
      const updated = [item, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem(`scan_history_${eventId}`, JSON.stringify(updated));
      return updated;
    });
  }, [eventId]);

  // Synthesize beep sound using Web Audio API (no external asset dependencies!)
  const playSound = (type: "success" | "error") => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (_e) {
      // Audio errors are safely caught
    }
  };

  const handleVerifyTicket = useCallback(async (ticketCode: string) => {
    setVerifying(true);
    setScanResult(null);
    setScanError(null);

    // Vibrate phone if supported
    if (navigator.vibrate) navigator.vibrate([100]);

    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ticketCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify ticket");
      }

      // Success
      playSound("success");
      setScanResult(data);
      saveToHistory({
        code: ticketCode,
        status: "success",
        name: data.ticket?.profiles?.full_name || "Guest",
        tier: data.ticket?.ticket_type?.name || "GA",
        time: new Date().toLocaleTimeString(),
      });

    } catch (err: unknown) {
      playSound("error");
      const errorMessage = (err as Error).message || "Network error";
      setScanError(errorMessage);
      saveToHistory({
        code: ticketCode,
        status: "error",
        error: errorMessage,
        time: new Date().toLocaleTimeString(),
      });
    } finally {
      setVerifying(false);
    }
  }, [eventId, saveToHistory]);

  const startScanner = useCallback(async () => {
    try {
      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        // Use the back camera (rear) by default
        const backCamera = cameras.find(c => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("environment")) || cameras[0];
        
        const html5Qrcode = new Html5Qrcode("reader");
        html5QrcodeRef.current = html5Qrcode;

        await html5Qrcode.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Check if it's JSON or direct ticket code
            let ticketCode = decodedText;
            try {
              const parsed = JSON.parse(decodedText);
              if (parsed.code) ticketCode = parsed.code;
            } catch (_e) {
              // Not JSON, use direct text
            }
            
            // Pause scanner while verifying
            html5Qrcode.pause();
            handleVerifyTicket(ticketCode);
          },
          (_errorMessage) => {
            // Skip noisy scanner errors
          }
        );
        setScannerActive(true);
      } else {
        setScanError("No cameras detected on this device.");
      }
    } catch (err: unknown) {
      setScanError((err as Error).message || "Failed to start scanner.");
    }
  }, [handleVerifyTicket]);

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      await html5QrcodeRef.current.stop();
      html5QrcodeRef.current = null;
      setScannerActive(false);
    }
  }, []);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, [startScanner, stopScanner]);

  const resumeScanning = () => {
    setScanResult(null);
    setScanError(null);
    if (html5QrcodeRef.current) {
      html5QrcodeRef.current.resume();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      {/* Top Header */}
      <header className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <button 
          onClick={async () => {
            await stopScanner();
            router.push("/scan");
          }} 
          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        <div className="text-center">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Scanner Console</p>
          <h2 className="text-sm font-bold truncate max-w-[200px]">{eventTitle}</h2>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full ${scannerActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
        </div>
      </header>

      {/* Main Viewfinder Section */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-6 max-w-6xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative w-full max-w-sm aspect-square bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* HTML5 Qrcode Target element */}
            <div id="reader" className="w-full h-full object-cover" />
            
            {/* Scanner Overlay animations */}
            {scannerActive && !verifying && !scanResult && !scanError && (
              <div className="absolute inset-0 border-[3px] border-dashed border-indigo-500/30 pointer-events-none rounded-2xl animate-pulse">
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-indigo-500/80 shadow-lg shadow-indigo-500 animate-bounce" />
              </div>
            )}

            {/* Verifying Spinner */}
            {verifying && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="font-bold text-sm text-zinc-300">Verifying Pass...</p>
              </div>
            )}

            {/* SUCCESS STATE OVERLAY */}
            {scanResult && (
              <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <CheckCircle2 className="w-20 h-20 text-emerald-400 animate-bounce" />
                <div>
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Access Granted</p>
                  <h3 className="text-2xl font-bold font-heading text-white mt-1">
                    {scanResult.ticket?.profiles?.full_name || "Guest"}
                  </h3>
                  <p className="text-zinc-300 text-sm mt-1">
                    Tier: <span className="font-bold">{scanResult.ticket?.ticket_type?.name || "General Admission"}</span>
                  </p>
                  <p className="text-zinc-500 text-xs mt-2">Code: {scanResult.ticket?.unique_code}</p>
                </div>
                <button 
                  onClick={resumeScanning}
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors text-sm w-full max-w-[200px]"
                >
                  Scan Next Ticket
                </button>
              </div>
            )}

            {/* ERROR STATE OVERLAY */}
            {scanError && (
              <div className="absolute inset-0 bg-red-950/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <XCircle className="w-20 h-20 text-red-500 animate-bounce" />
                <div>
                  <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Access Denied</p>
                  <h3 className="text-xl font-bold text-white mt-2 leading-snug">{scanError}</h3>
                </div>
                <button 
                  onClick={resumeScanning}
                  className="px-6 py-2.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-colors text-sm w-full max-w-[200px]"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500 text-center max-w-xs">
            Center the ticket&apos;s QR code within the viewfinder. The validation logic will run automatically.
          </p>
        </div>

        {/* Scan History / Audit Log */}
        <div className="w-full md:w-80 flex flex-col bg-white/5 border border-white/5 rounded-2xl p-6 h-[400px]">
          <h3 className="text-md font-bold font-heading mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
            <History className="w-4 h-4 text-indigo-400" />
            Check-In History ({history.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {history.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-zinc-500 p-4">
                Previous scan reports will be logged here for tracking.
              </div>
            ) : (
              history.map((h, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl border text-xs flex justify-between items-center transition-all ${
                    h.status === "success" 
                      ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400" 
                      : "bg-red-500/5 border-red-500/10 text-red-400"
                  }`}
                >
                  <div className="space-y-0.5 truncate flex-1 mr-2">
                    <p className="font-bold truncate text-white">{h.status === "success" ? h.name : "Invalid Pass"}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{h.status === "success" ? h.tier : h.error}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-[10px] text-zinc-500">{h.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
