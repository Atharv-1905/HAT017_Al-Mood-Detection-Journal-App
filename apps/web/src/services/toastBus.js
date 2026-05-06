const TOAST_EVENT = 'mindtrace:toast';

export function emitToast(message, type = 'error') {
  if (!message) return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, {
      detail: { message, type, id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` },
    })
  );
}

export function subscribeToasts(handler) {
  const wrapped = (event) => handler(event.detail);
  window.addEventListener(TOAST_EVENT, wrapped);
  return () => window.removeEventListener(TOAST_EVENT, wrapped);
}

export { TOAST_EVENT };
