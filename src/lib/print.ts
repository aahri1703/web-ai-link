// Prints on the student's OWN printer through the browser's print dialog.
// The OS dialog lists every printer the device knows — Wi-Fi, USB, Bluetooth,
// AirPrint, Mopria — so no printer setup is needed on our side.
//
// Desktop Chrome/Edge/Firefox: the PDF is loaded into a hidden same-origin
// iframe and its print() is called, opening the dialog right on our page.
// Safari and phones/tablets can't reliably print a PDF from an iframe, so the
// PDF opens in a new tab instead and the student taps Share/Print there.

function needsNewTab(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua);
  return mobile || safari;
}

/**
 * Call synchronously inside the click handler (before any await): pop-up
 * blockers only allow window.open during the user's click. Returns a tab to
 * reuse later, or null when the iframe route will be used.
 */
export function reservePrintTab(): Window | null {
  if (!needsNewTab()) return null;
  const tab = window.open("", "_blank");
  tab?.document.write("<p style='font:16px system-ui;padding:24px'>Preparing your document…</p>");
  return tab;
}

export async function printPdf(url: string, tab: Window | null): Promise<"dialog" | "tab"> {
  if (tab) {
    tab.location.href = url;
    return "tab";
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't download the file (${res.status})`);
  const blobUrl = URL.createObjectURL(await res.blob());
  await printInIframe((frame) => {
    frame.src = blobUrl;
  });
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  return "dialog";
}

/** One-page test sheet so a student can check their printer works (no quota used). */
export async function printTestPage(): Promise<void> {
  const html = `<!doctype html><html><head><title>Printer test</title><style>
    @page{size:A4;margin:20mm}body{font-family:system-ui,sans-serif;text-align:center;color:#111}
    h1{font-size:28pt;margin-top:60mm}p{font-size:14pt}.box{display:inline-block;width:25mm;height:25mm;margin:4mm}
  </style></head><body><h1>Your printer works!</h1>
  <p>This test page was sent from ConnectAI Studio on ${new Date().toLocaleString()}.</p>
  <div><span class="box" style="background:#00a3e0"></span><span class="box" style="background:#e5007e"></span>
  <span class="box" style="background:#ffd400"></span><span class="box" style="background:#111"></span></div>
  <p>If the four squares show in colour, colour printing works too.</p></body></html>`;
  if (needsNewTab()) {
    const tab = window.open("", "_blank");
    if (!tab) throw new Error("Allow pop-ups to print the test page");
    tab.document.write(html);
    tab.document.close();
    tab.onload = () => tab.print();
    setTimeout(() => tab.print(), 500);
    return;
  }
  await printInIframe((frame) => {
    frame.srcdoc = html;
  });
}

function printInIframe(load: (frame: HTMLIFrameElement) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
    frame.onload = () => {
      // Give the PDF viewer a moment to render before printing.
      setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          resolve();
        } catch (e) {
          reject(e as Error);
        }
        setTimeout(() => frame.remove(), 60_000);
      }, 400);
    };
    document.body.appendChild(frame);
    load(frame);
  });
}
