import { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { customCakeOccasions, waLink } from "../data/mockData";

export default function CustomCake() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState("");

  function onSubmit(data) {
    // No backend yet — compose the request as a pre-filled WhatsApp message.
    // Once the API is wired up, this should POST to /api/custom-cake-requests instead.
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

    window.open(waLink(message), "_blank", "noopener,noreferrer");
    setSubmitted(true);
    reset();
    setFileName("");
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

          <Field label="Occasion" error={errors.occasion}>
            <select {...register("occasion", { required: "Please select an occasion" })} className="input">
              <option value="">Select an occasion</option>
              {customCakeOccasions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>

          <Field label="Delivery Date" error={errors.deliveryDate}>
            <input
              type="date"
              {...register("deliveryDate", { required: "Please choose a delivery date" })}
              className="input"
            />
          </Field>

          <Field label="Cake Weight" error={errors.weight}>
            <select {...register("weight", { required: "Please select a weight" })} className="input">
              <option value="">Select weight</option>
              <option value="500g">500g</option>
              <option value="1kg">1kg</option>
              <option value="1.5kg">1.5kg</option>
              <option value="2kg+">2kg+</option>
            </select>
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
