import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { CheckCircle2, Cake, Heart, PartyPopper, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/PageHeader";
import ThemedSelect from "../components/ThemedSelect";
import DatePicker from "../components/DatePicker";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedButton from "../components/AnimatedButton";
import { getPublicContent, submitContactMessage } from "../services/api";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Baby Shower", "Corporate Event", "Other"];
const CAKE_WEIGHTS = ["500g", "1kg", "1.5kg", "2kg+"];
const SHAPES = [
  { value: "round", label: "Round", icon: "⬤" },
  { value: "square", label: "Square", icon: "◼" },
  { value: "heart", label: "Heart", icon: "♥" },
  { value: "rectangle", label: "Rectangle", icon: "▬" },
];

const OCCASION_ICONS = {
  Birthday: "🎂",
  Anniversary: "💕",
  Wedding: "💍",
  "Baby Shower": "👶",
  "Corporate Event": "🏢",
  Other: "🎉",
};

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
    watch,
    formState: { errors },
    reset,
  } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState("");
  const [settings, setSettings] = useState({});

  const watchedWeight = watch("weight");
  const watchedOccasion = watch("occasion");
  const watchedShape = watch("shape");

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
      data.shape ? `Shape: ${data.shape}` : null,
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

  // Compute cake preview scale based on weight
  const weightScale = { "500g": 0.7, "1kg": 0.85, "1.5kg": 1, "2kg+": 1.15 };
  const cakeScale = weightScale[watchedWeight] || 0.85;

  return (
    <>
      <PageHeader
        eyebrow="Made to Order"
        title="Request a Custom Cake"
        description="Tell us about your occasion and vision — we'll follow up on WhatsApp with a quote."
      />

      <section className="max-w-5xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Cake preview panel */}
          <ScrollReveal className="md:col-span-2 hidden md:block" direction="left">
            <div className="sticky top-28 bg-ivory rounded-3xl border border-blush/50 p-8 text-center">
              <p className="font-script text-xl text-rose-deep mb-4">Your Cake Preview</p>

              {/* Animated cake preview */}
              <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                <motion.div
                  animate={{ scale: cakeScale }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="text-8xl"
                >
                  {watchedShape === "heart" ? "💗" : "🎂"}
                </motion.div>

                {/* Occasion decorator */}
                <AnimatePresence mode="wait">
                  {watchedOccasion && (
                    <motion.div
                      key={watchedOccasion}
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.4 }}
                      className="absolute -top-2 -right-2 text-3xl"
                    >
                      {OCCASION_ICONS[watchedOccasion] || "🎉"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selection summary */}
              <div className="space-y-2 text-sm text-cocoa-soft/70">
                {watchedWeight && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Cake className="w-4 h-4 text-rose" /> {watchedWeight}
                  </motion.p>
                )}
                {watchedOccasion && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Heart className="w-4 h-4 text-rose" /> {watchedOccasion}
                  </motion.p>
                )}
                {watchedShape && (
                  <motion.p
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 justify-center"
                  >
                    <Star className="w-4 h-4 text-rose" /> {SHAPES.find(s => s.value === watchedShape)?.label || watchedShape}
                  </motion.p>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal className="md:col-span-3" direction="right" delay={100}>
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="mb-8 flex items-center gap-3 bg-blush-soft border border-blush rounded-2xl p-4 text-cocoa-soft"
                >
                  <CheckCircle2 className="w-5 h-5 text-rose-deep shrink-0" />
                  <p className="text-sm">
                    Your request details are ready in WhatsApp — send the message to complete your quote request.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-ivory rounded-3xl border border-blush/50 p-6 md:p-8 space-y-5 shadow-sm">
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

              {/* Shape selector */}
              <Field label="Cake Shape (optional)">
                <Controller
                  name="shape"
                  control={control}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {SHAPES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => field.onChange(field.value === s.value ? "" : s.value)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                            field.value === s.value
                              ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                              : "border-blush text-cocoa-soft hover:border-rose/60 bg-ivory"
                          }`}
                        >
                          <span className="text-base">{s.icon}</span> {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>

              <Field label="Cake Weight" error={errors.weight}>
                <Controller
                  name="weight"
                  control={control}
                  rules={{ required: "Please select a weight" }}
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {CAKE_WEIGHTS.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => field.onChange(w)}
                          className={`px-5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                            field.value === w
                              ? "bg-rose text-ivory border-rose shadow-sm shadow-rose/20"
                              : "border-blush text-cocoa-soft hover:border-rose/60 bg-ivory"
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
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
                <textarea {...register("message")} className="input min-h-24 resize-none" placeholder="Anything else we should know?" />
              </Field>

              <Field label="Reference Image (optional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  className="text-sm text-cocoa-soft file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:bg-blush file:text-rose-deep file:font-semibold hover:file:bg-blush-soft file:transition-colors file:cursor-pointer"
                />
                {fileName && <p className="text-xs text-cocoa-soft/70 mt-1">Selected: {fileName} — please attach it in WhatsApp when you send your request.</p>}
              </Field>

              <button
                type="submit"
                className="w-full bg-rose text-ivory font-semibold py-3.5 rounded-full hover:bg-rose-deep hover:shadow-md hover:shadow-rose/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                Request Quote on WhatsApp
              </button>
            </form>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-cocoa mb-1.5 block">{label}</span>
      <div className="mt-1">{children}</div>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-rose-deep mt-1.5 block"
          >
            {error.message}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}
