import { useEffect, useRef, useCallback } from 'react';

const CHANNEL_NAME = 'financia-sync-leader';
const HEARTBEAT_INTERVAL = 3000;
const LEADER_TIMEOUT = 10000;

export function useSyncLeader(uid, onSyncNeeded) {
  const isLeaderRef = useRef(false);
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);

  const becomeLeader = useCallback(() => {
    isLeaderRef.current = true;
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      try {
        channelRef.current?.postMessage({ type: 'heartbeat', uid, ts: Date.now() });
      } catch (_) { void _; }
    }, HEARTBEAT_INTERVAL);
  }, [uid]);

  const resignLeadership = useCallback(() => {
    isLeaderRef.current = false;
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!uid) return;

    try {
      channelRef.current = new BroadcastChannel(CHANNEL_NAME);
    } catch (_) {
      becomeLeader();
      return;
    }

    const channel = channelRef.current;
    let lastHeartbeat = Date.now();
    let electionTimeout = null;

    channel.onmessage = (e) => {
      const { type, uid: msgUid, ts } = e.data;

      if (msgUid !== uid) return;

      if (type === 'heartbeat') {
        lastHeartbeat = ts;
      }

      if (type === 'claim-leadership') {
        if (!isLeaderRef.current) {
          channel.postMessage({ type: 'leadership-ack', uid, ts: Date.now() });
        }
      }

      if (type === 'leadership-ack') {
        lastHeartbeat = ts;
      }

      if (type === 'sync-complete') {
        if (onSyncNeeded) onSyncNeeded();
      }
    };

    const startElection = () => {
      channel.postMessage({ type: 'claim-leadership', uid, ts: Date.now() });

      electionTimeout = setTimeout(() => {
        becomeLeader();
      }, 2000);
    };

    const checkLeader = setInterval(() => {
      if (isLeaderRef.current) {
        channel.postMessage({ type: 'heartbeat', uid, ts: Date.now() });
      } else {
        if (Date.now() - lastHeartbeat > LEADER_TIMEOUT) {
          startElection();
        }
      }
    }, HEARTBEAT_INTERVAL);

    startElection();

    return () => {
      resignLeadership();
      clearInterval(checkLeader);
      if (electionTimeout) clearTimeout(electionTimeout);
      channel.close();
    };
  }, [uid, becomeLeader, resignLeadership, onSyncNeeded]);

  return { isLeader: isLeaderRef.current };
}
