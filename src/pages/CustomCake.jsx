import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ThemedSelect from "../components/ThemedSelect";
import DatePicker from "../components/DatePicker";
import { getPublicContent, submitContactMessage } from "../services/api";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Baby Shower", "Corporate Event", "Other"];
const CAKE_WEIGHTS = ["500g", "1kg", "1.5kg", "2kg+"];

function todayISODate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CustomCake() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState("");
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getPublicContent().then((data) => setSettings(data.settings || {})).catch(() => {});
  }, []);

  const waLink = (message) => `https://wa.me/${settings.whatsapp || '918780652597'}?text=${encodeURIComponent(message)}`;

  function onSubmit(data) {
    const message = [
      "Hi! I'd like to request a custom cake quote:",
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `Occasion: ${data.occasion}`,
      `Delivery Date: ${data.deliveryDate}`,
      `Cake Weight: ${data.weight}`,
      `Theme: ${data.theme}`,
      data.message ? `Special Message: ${data.message}` : null,
      fileName ? `(Reference image "${fileName}" to be shared here)` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // WhatsApp redirect stays exactly as before, regardless of whether the
    // save below succeeds — the message request must never be blocked on it.
    window.open(waLink(message), "_blank", "noopener,noreferrer");
    setSubmitted(true);
    reset();
    setFileName("");

    submitContactMessage({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message || `Custom cake request — Theme: ${data.theme}`,
      source: "CUSTOM_CAKE",
      occasion: data.occasion,
      cakeWeight: data.weight,
      deliveryDate: data.deliveryDate,
    }).catch(() => {});
  }

  return (
    <>
      <PageHeader
        eyebrow="Made to Order"
        title="Request a Custom Cake"
        description="Tell us about your occasion and vision — we'll follow up on WhatsApp with a quote."
      />

      <section className="max-w-2xl mx-auto px-5 md:px-8 py-14 md:py-20">
        {submitted && (
          <div className="mb-8 flex items-center gap-3 bg-blush-soft border border-blush rounded-2xl p-4 text-cocoa-soft">
            <CheckCircle2 className="w-5 h-5 text-rose-deep shrink-0" />
            <p className="text-sm">
              Your request details are ready in WhatsApp — send the message to complete your quote request.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-ivory rounded-3xl border border-blush/60 p-6 md:p-8 space-y-5">
          <Field label="Name" error={errors.name}>
            <input
              {...register("name", { required: "Please enter your name" })}
              className="input"
              placeholder="Your full name"
            />
          </Field>

          <Field label="Phone Number" error={errors.phone}>
            <input
              {...register("phone", {
                required: "Please enter a phone number",
                pattern: { value: /^[0-9+\-\s]{7,15}$/, message: "Enter a valid phone number" },
              })}
              className="input"
              placeholder="e.g. 9876543210"
            />
          </Field>

          <Field label="Email" error={errors.email}>
            <input
              type="email"
              {...register("email", {
                required: "Please enter your email",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
              })}
              className="input"
              placeholder="you@example.com"
            />
          </Field>

          <Field label="Occasion" error={errors.occasion}>
            <Controller
              name="occasion"
              control={control}
              rules={{ required: "Please select an occasion" }}
              render={({ field }) => (
                <ThemedSelect value={field.value} onChange={field.onChange} options={OCCASIONS} placeholder="Select an occasion" />
              )}
            />
          </Field>

          <Field label="Delivery Date" error={errors.deliveryDate}>
            <Controller
              name="deliveryDate"
              control={control}
              rules={{ required: "Please choose a delivery date" }}
              render={({ field }) => (
                <DatePicker
                  theme="public"
                  value={field.value}
                  onChange={field.onChange}
                  min={todayISODate()}
                  placeholder="Select delivery date"
                />
              )}
            />
          </Field>

          <Field label="Cake Weight" error={errors.weight}>
            <Controller
              name="weight"
              control={control}
              rules={{ required: "Please select a weight" }}
              render={({ field }) => (
                <ThemedSelect value={field.value} onChange={field.onChange} options={CAKE_WEIGHTS} placeholder="Select weight" />
              )}
            />
          </Field>

          <Field label="Theme" error={errors.theme}>
            <input
              {...register("theme", { required: "Please describe a theme" })}
              className="input"
              placeholder="e.g. Floral pastel, superhero, minimalist"
            />
          </Field>

          <Field label="Special Message (optional)">
            <textarea {...register("message")} className="input min-h-24" placeholder="Anything else we should know?" />
          </Field>

          <Field label="Reference Image (optional)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
              className="text-sm text-cocoa-soft file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blush file:text-rose-deep file:font-semibold hover:file:bg-blush-soft"
            />
            {fileName && <p className="text-xs text-cocoa-soft/70 mt-1">Selected: {fileName} — please attach it in WhatsApp when you send your request.</p>}
          </Field>

          <button type="submit" className="w-full bg-rose text-ivory font-semibold py-3.5 rounded-full hover:bg-rose-deep transition-colors">
            Request Quote
          </button>
        </form>
      </section>
    </>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-cocoa">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="text-xs text-rose-deep mt-1 block">{error.message}</span>}
    </label>
  );
}
