import { useRef, useState } from "react";
import Card from "../ui/Card";

const SAMPLES = [
  "kal subah 2 ton cement Noida se Gurgaon bhejna hai",
  "Send 500 kg vegetables from Faridabad to Delhi Azadpur mandi tomorrow morning",
  "Urgent: 400 kg fruits Faridabad to Connaught Place, must reach in 2 hours",
  "Need to move 3 sofas and a glass table from Ghaziabad to Connaught Place today",
];

const field =
  "w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-[15px] text-ink outline-none placeholder:text-ink/35 focus:border-road focus:ring-2 focus:ring-road/20";

function resizeToDataUrl(file, max = 1024) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function OrderForm({ onSubmit, busy }) {
  const [text, setText] = useState("");
  const [customer, setCustomer] = useState("");
  const [image, setImage] = useState(null);
  const [imgError, setImgError] = useState("");
  const fileRef = useRef(null);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgError("");
    try {
      setImage(await resizeToDataUrl(file));
    } catch {
      setImgError("That image could not be read. Try a JPG or PNG.");
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const send = (urgent) => {
    if (!text.trim()) return;
    onSubmit(text.trim(), customer.trim() || undefined, urgent, image || undefined);
    clearImage();
  };

  return (
    <Card title="New order">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(false);
        }}
        className="flex flex-col gap-3"
      >
        <input
          className={field}
          placeholder="Customer name (optional)"
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
        />
        <textarea
          rows={4}
          className={`${field} resize-y`}
          placeholder="Type the order the way the customer said it, in English or Hinglish"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-md border border-ink/15 px-3 py-1.5 text-sm text-ink/70 transition hover:border-road/50 hover:text-road">
            {image ? "Change photo" : "Add a photo of the load"}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pick} />
          </label>
          {image && (
            <>
              <img
                src={image}
                alt="Load preview"
                className="h-10 w-10 rounded border border-ink/15 object-cover"
              />
              <button type="button" onClick={clearImage} className="text-sm text-ink/55 underline">
                Remove
              </button>
            </>
          )}
        </div>
        {imgError && <p className="text-sm text-brake">{imgError}</p>}

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-ink/55">Quick orders</span>
          {SAMPLES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setText(s)}
              className="line-clamp-2 rounded-md border border-ink/10 bg-ink/[0.03] px-3 py-2 text-left text-sm text-ink/75 transition hover:border-road/40 hover:bg-road/5"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            disabled={busy || !text.trim()}
            className="rounded-md bg-road px-4 py-2.5 font-medium text-white shadow-[0_3px_0_var(--color-road-dark)] transition active:translate-y-[2px] active:shadow-[0_1px_0_var(--color-road-dark)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {busy ? "Working" : "Dispatch"}
          </button>
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => send(true)}
            title="Treat as urgent. May move a driver off a normal job."
            className="rounded-md border border-brake/40 bg-white px-4 py-2.5 font-medium text-brake shadow-[0_3px_0_rgba(212,61,47,0.25)] transition active:translate-y-[2px] active:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Urgent
          </button>
        </div>
      </form>
    </Card>
  );
}
