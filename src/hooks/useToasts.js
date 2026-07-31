import { useCallback } from 'react';

export function useToasts({ toasts, setToasts, toastId, toastTimeoutsRef }) {
  const dismissToast = useCallback(function(id) {
    setToasts(function(list) { return list.filter(function(t) { return t.id !== id; }); });
  }, [setToasts]);

  const toast = useCallback(function(msg, type) {
    if (!type) type = 'success';
    const id = ++toastId.current;
    setToasts(function(list) { return list.concat([{id:id, msg:msg, type:type}]); });
    const tid = setTimeout(function() {
      toastTimeoutsRef.current = toastTimeoutsRef.current.filter(function(t) { return t !== tid; });
      setToasts(function(list) { return list.filter(function(t) { return t.id !== id; }); });
    }, type === 'error' ? 4000 : 3000);
    toastTimeoutsRef.current.push(tid);
  }, [setToasts, toastId, toastTimeoutsRef]);

  return { toasts, toast, dismissToast };
}