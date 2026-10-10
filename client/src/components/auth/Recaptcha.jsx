import { useEffect, useId, useRef, useState } from 'react';
import './Recaptcha.css';

const SCRIPT_ID = 'google-recaptcha-v2';
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

/** Shared promise so concurrent mounts wait for the same script load. */
let scriptPromise = null;

function loadScript() {
  if (window.grecaptcha?.render) {
    return Promise.resolve();
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);

    const waitUntilReady = () => {
      if (window.grecaptcha?.render) {
        resolve();
        return;
      }
      // Tag exists but API not ready yet (race with Strict Mode / remount)
      let tries = 0;
      const tick = () => {
        if (window.grecaptcha?.render) {
          resolve();
          return;
        }
        tries += 1;
        if (tries > 80) {
          scriptPromise = null;
          reject(new Error('Captcha script timed out.'));
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    };

    if (existing) {
      waitUntilReady();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => waitUntilReady();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load captcha. Check your network or ad blocker.'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Google reCAPTCHA v2 checkbox. Calls onChange with the response token (or '').
 */
export default function Recaptcha({ onChange }) {
  const containerId = useId().replace(/:/g, '');
  const widgetId = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [status, setStatus] = useState(SITE_KEY ? 'loading' : 'missing');

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      if (!SITE_KEY) {
        setStatus('missing');
        return;
      }

      try {
        await loadScript();
        if (cancelled) return;

        await new Promise((resolve) => {
          window.grecaptcha.ready(resolve);
        });
        if (cancelled) return;

        const el = document.getElementById(containerId);
        if (!el) return;

        // Avoid "already rendered" when React remounts into a reused node
        el.innerHTML = '';

        widgetId.current = window.grecaptcha.render(el, {
          sitekey: SITE_KEY,
          callback: (token) => onChangeRef.current?.(token),
          'expired-callback': () => onChangeRef.current?.(''),
          'error-callback': () => {
            onChangeRef.current?.('');
            if (!cancelled) setStatus('error');
          },
        });
        if (!cancelled) setStatus('ready');
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setStatus('error');
          onChangeRef.current?.('');
        }
      }
    }

    mount();

    return () => {
      cancelled = true;
      widgetId.current = null;
    };
  }, [containerId]);

  if (status === 'missing') {
    return (
      <p className="recaptcha-missing">
        Captcha is not configured. Set VITE_RECAPTCHA_SITE_KEY in client/.env and restart Vite.
      </p>
    );
  }

  return (
    <div className="recaptcha-wrap">
      {status === 'loading' && <p className="recaptcha-status">Loading captcha…</p>}
      {status === 'error' && (
        <p className="recaptcha-missing">
          Captcha failed to load. Disable ad blockers for localhost, confirm the site key allows{' '}
          <code>localhost</code>, then refresh.
        </p>
      )}
      <div id={containerId} className="recaptcha" />
    </div>
  );
}

/** Reset the last rendered widget after a failed submit. */
export function resetRecaptcha() {
  if (window.grecaptcha?.reset) {
    try {
      window.grecaptcha.reset();
    } catch {
      /* ignore if no widget yet */
    }
  }
}
