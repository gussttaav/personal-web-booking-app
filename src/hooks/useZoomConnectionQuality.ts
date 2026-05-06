"use client";

// ─────────────────────────────────────────────────────────────────────────────
// useZoomConnectionQuality
//
// Subscribes to the Zoom Video SDK's quality and stats events for both the
// local client and a single remote peer (1-on-1 sessions), and derives:
//
//   • selfStatus   — 'good' | 'poor' | 'reconnecting'
//   • remoteStatus — 'unknown' | 'good' | 'poor' | 'lost'
//
// Plus the raw QoS snapshots (rtt, jitter, packet loss, fps, bitrate, etc.)
// so a future Settings panel can read live metrics from this same hook.
//
// Lost-connection detection runs ahead of the SDK's ~60 s heartbeat by
// watching for either:
//   • inbound video stats stalling (no decode events with fps>0 for 5 s),
//   • or the remote uplink quality sitting at level ≤ 1 for 8 s.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import type { VideoQosData, AudioQosData } from "@zoom/videosdk";

// ─── Public types ──────────────────────────────────────────────────────────────

export type SelfStatus   = "good" | "poor" | "reconnecting";
export type RemoteStatus = "unknown" | "good" | "poor" | "lost";

export interface QosSnapshot {
  rtt:         number;
  jitter:      number;
  avg_loss:    number;
  max_loss:    number;
  bandwidth:   number;
  bitrate:     number;
  // Video-only fields are 0 for audio snapshots.
  fps:         number;
  width:       number;
  height:      number;
  sample_rate: number;
  encoding:    boolean;
  updatedAt:   number;
}

export interface ZoomConnectionQuality {
  selfStatus:      SelfStatus;
  remoteStatus:    RemoteStatus;
  selfUplink:      number | null;
  selfDownlink:    number | null;
  remoteUplink:    number | null;
  remoteDownlink:  number | null;
  videoEncode:     QosSnapshot | null;
  videoDecode:     QosSnapshot | null;
  audioEncode:     QosSnapshot | null;
  audioDecode:     QosSnapshot | null;
  connectionState: "Connected" | "Reconnecting" | "Closed" | null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Thresholds — tuned in the plan.
const POOR_LEVEL_MAX        = 1;     // levels 0,1 = bad
const REMOTE_LOST_AFTER_MS  = 8000;  // sustained poor uplink → declare lost
const DECODE_STALL_AFTER_MS = 5000;  // no inbound video frames → declare lost

function toVideoSnapshot(data: VideoQosData & { encoding: boolean }): QosSnapshot {
  return {
    rtt:         data.rtt         ?? 0,
    jitter:      data.jitter      ?? 0,
    avg_loss:    data.avg_loss    ?? 0,
    max_loss:    data.max_loss    ?? 0,
    bandwidth:   data.bandwidth   ?? 0,
    bitrate:     data.bitrate     ?? 0,
    fps:         data.fps         ?? 0,
    width:       data.width       ?? 0,
    height:      data.height      ?? 0,
    sample_rate: data.sample_rate ?? 0,
    encoding:    data.encoding,
    updatedAt:   Date.now(),
  };
}

function toAudioSnapshot(data: AudioQosData & { encoding: boolean }): QosSnapshot {
  return {
    rtt:         data.rtt         ?? 0,
    jitter:      data.jitter      ?? 0,
    avg_loss:    data.avg_loss    ?? 0,
    max_loss:    data.max_loss    ?? 0,
    bandwidth:   data.bandwidth   ?? 0,
    bitrate:     data.bitrate     ?? 0,
    fps:         0,
    width:       0,
    height:      0,
    sample_rate: data.sample_rate ?? 0,
    encoding:    data.encoding,
    updatedAt:   Date.now(),
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseZoomConnectionQualityOptions {
  // The Zoom client returned by ZoomVideo.createClient(), or null before join /
  // after leave. Typed as unknown to avoid pulling in the SDK's namespace type;
  // we cast to a minimal shape internally.
  client:        unknown | null;
  selfUserId:    number;
  remoteUserId:  number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventClient = { on: (e: string, fn: (p: any) => void) => void; off: (e: string, fn: (p: any) => void) => void };

export function useZoomConnectionQuality(
  opts: UseZoomConnectionQualityOptions
): ZoomConnectionQuality {
  const { client, selfUserId, remoteUserId } = opts;

  const [selfUplink,      setSelfUplink]      = useState<number | null>(null);
  const [selfDownlink,    setSelfDownlink]    = useState<number | null>(null);
  const [remoteUplink,    setRemoteUplink]    = useState<number | null>(null);
  const [remoteDownlink,  setRemoteDownlink]  = useState<number | null>(null);
  const [videoEncode,     setVideoEncode]     = useState<QosSnapshot | null>(null);
  const [videoDecode,     setVideoDecode]     = useState<QosSnapshot | null>(null);
  const [audioEncode,     setAudioEncode]     = useState<QosSnapshot | null>(null);
  const [audioDecode,     setAudioDecode]     = useState<QosSnapshot | null>(null);
  const [connectionState, setConnectionState] = useState<ZoomConnectionQuality["connectionState"]>(null);

  // Time-window refs (don't trigger renders).
  const lastDecodeAtRef    = useRef<number | null>(null);
  const remotePoorSinceRef = useRef<number | null>(null);

  // Forces re-derivation of statuses every second so the time-window thresholds
  // advance even when no SDK event fires.
  const [, setTick] = useState(0);

  // ── SDK listeners ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!client) return;
    const c = client as EventClient;

    const onNetworkQuality = (p: { userId: number; type: "uplink" | "downlink"; level: number }) => {
      if (p.userId === selfUserId) {
        if (p.type === "uplink")   setSelfUplink(p.level);
        else                       setSelfDownlink(p.level);
        return;
      }
      if (remoteUserId !== null && p.userId === remoteUserId) {
        if (p.type === "uplink") {
          setRemoteUplink(p.level);
          if (p.level <= POOR_LEVEL_MAX) {
            if (remotePoorSinceRef.current === null) remotePoorSinceRef.current = Date.now();
          } else {
            remotePoorSinceRef.current = null;
          }
        } else {
          setRemoteDownlink(p.level);
        }
      }
    };

    const onConnection = (p: { state: "Connected" | "Reconnecting" | "Closed" }) => {
      setConnectionState(p.state);
    };

    const onVideoStats = (p: { data: VideoQosData & { encoding: boolean } }) => {
      const snap = toVideoSnapshot(p.data);
      if (snap.encoding) {
        setVideoEncode(snap);
      } else {
        setVideoDecode(snap);
        if (snap.fps > 0) lastDecodeAtRef.current = Date.now();
      }
    };

    const onAudioStats = (p: { data: AudioQosData & { encoding: boolean } }) => {
      const snap = toAudioSnapshot(p.data);
      if (snap.encoding) setAudioEncode(snap);
      else               setAudioDecode(snap);
    };

    c.on("network-quality-change",         onNetworkQuality);
    c.on("connection-change",              onConnection);
    c.on("video-statistic-data-change",    onVideoStats);
    c.on("audio-statistic-data-change",    onAudioStats);

    const tickId = setInterval(() => setTick((n) => (n + 1) & 0xffff), 1000);

    return () => {
      clearInterval(tickId);
      c.off("network-quality-change",      onNetworkQuality);
      c.off("connection-change",           onConnection);
      c.off("video-statistic-data-change", onVideoStats);
      c.off("audio-statistic-data-change", onAudioStats);
      // Reset detection refs so a fresh client starts clean.
      lastDecodeAtRef.current    = null;
      remotePoorSinceRef.current = null;
    };
  }, [client, selfUserId, remoteUserId]);

  // ── Reset remote-side state when the tracked peer changes / leaves ──────────
  useEffect(() => {
    setRemoteUplink(null);
    setRemoteDownlink(null);
    lastDecodeAtRef.current    = null;
    remotePoorSinceRef.current = null;
  }, [remoteUserId]);

  // ── Derived statuses ────────────────────────────────────────────────────────
  const now = Date.now();

  let selfStatus: SelfStatus = "good";
  if (connectionState === "Reconnecting") {
    selfStatus = "reconnecting";
  } else if (selfUplink !== null && selfUplink <= POOR_LEVEL_MAX) {
    selfStatus = "poor";
  }

  let remoteStatus: RemoteStatus = "unknown";
  if (remoteUserId === null) {
    remoteStatus = "unknown";
  } else {
    const decodeStalled =
      lastDecodeAtRef.current !== null &&
      now - lastDecodeAtRef.current >= DECODE_STALL_AFTER_MS;
    const sustainedPoor =
      remotePoorSinceRef.current !== null &&
      now - remotePoorSinceRef.current >= REMOTE_LOST_AFTER_MS;

    if (connectionState !== "Reconnecting" && (decodeStalled || sustainedPoor)) {
      remoteStatus = "lost";
    } else if (remoteUplink !== null && remoteUplink <= POOR_LEVEL_MAX) {
      remoteStatus = "poor";
    } else if (remoteUplink !== null) {
      remoteStatus = "good";
    }
  }

  return {
    selfStatus,
    remoteStatus,
    selfUplink,
    selfDownlink,
    remoteUplink,
    remoteDownlink,
    videoEncode,
    videoDecode,
    audioEncode,
    audioDecode,
    connectionState,
  };
}
