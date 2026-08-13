import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  CheckCircle2, BadgeCheck, ClipboardList, MessageCircle, ClipboardCheck, Truck, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/PageHeader";
import ThemedSelect from "../components/ThemedSelect";
import DatePicker from "../components/DatePicker";
import ScrollReveal from "../components/ScrollReveal";
import { getPublicContent, submitContactMessage } from "../services/api";

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Baby Shower", "Corporate Event", "Other"];
const CAKE_WEIGHTS = ["500g", "1kg", "1.5kg", "2kg+"];
const SHAPES = [
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "heart", label: "Heart" },
  { value: "rectangle", label: "Rectangle" },
];

// What happens after the form is sent — set expectations before we ask for
// details, not after.
const NEXT_STEPS = [
  { title: "You send the brief", desc: "The form opens WhatsApp with everything below pre-filled. Add a reference photo if you have one.", Icon: MessageCircle },
  { title: "We confirm design & price", desc: "We reply with what's achievable, the right weight and a firm quote — before anything is baked.", Icon: ClipboardCheck },
  { title: "Baked fresh & handed over", desc: "Made on your date, ready for pickup or delivery exactly when you need it.", Icon: Truck },
];

const ASSURANCES = [
  "No payment taken on this form",
  "Quote confirmed before we bake",
  "Eggless & flavour substitutions on request",
];

function todayISODate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-08-20" → "Thu, 20 Aug 2026". Parsed from the parts rather than
// `new Date(string)` so the date never shifts a day across timezones.
function formatLongDate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
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
  const watchedTheme = watch("theme");
  const watchedDate = watch("deliveryDate");

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

  // The live spec the customer is building. Rendered twice — as the sticky
  // desktop rail and as a final recap directly above the mobile submit button
  // — so no one sends a request they haven't been able to read back.
  const summary = [
    { label: "Occasion", value: watchedOccasion },
    { label: "Needed by", value: formatLongDate(watchedDate) },
    { label: "Size", value: watchedWeight },
    { label: "Shape", value: SHAPES.find((s) => s.value === watchedShape)?.label },
    { label: "Theme", value: watchedTheme },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Made to Order"
        title="Request a Custom Cake"
        description="Tell us about your occasion and we'll come back on WhatsApp with a design and a firm quote. It takes about two minutes."
      />

      {/* ═══ WHAT HAPPENS NEXT ═══ */}
      <section className="py-6 sm:py-8 bg-blush-soft/25">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <ol className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {NEXT_STEPS.map((step, i) => (
              <ScrollReveal as="li" key={step.title} delay={i * 70} distance={16} className="h-full">
                <div className="flex items-start gap-3.5 bg-ivory/90 hover:bg-ivory rounded-2xl border border-blush/60 p-4 shadow-2xs transition-all h-full">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-blush-soft border border-blush/60 flex items-center justify-center relative">
                    <step.Icon className="w-5 h-5 text-rose-deep" strokeWidth={1.75} aria-hidden="true" />
                    <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose text-ivory text-[10px] font-bold flex items-center justify-center tabular-nums shadow-2xs">
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-cocoa text-sm mb-0.5">{step.title}</p>
                    <p className="text-xs text-cocoa-soft/70 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-14 md:py-20">
        <div className="grid md:grid-cols-5 gap-6 sm:gap-8">
          {/* Live request summary — desktop rail */}
          <ScrollReveal className="md:col-span-2 hidden md:block" direction="left">
            <div className="sticky top-28 space-y-4">
              <RequestSummary summary={summary} />
              <AssurancePanel />
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
                  className="mb-6 flex items-center gap-3 bg-blush-soft border border-blush rounded-2xl p-4 text-cocoa-soft"
                >
                  <CheckCircle2 className="w-5 h-5 text-rose-deep shrink-0" />
                  <p className="text-xs sm:text-sm">
                    Your request details are ready in WhatsApp — send the message to complete your quote request.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-ivory rounded-2xl sm:rounded-3xl border border-blush/50 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 shadow-2xs">
              <Field label="Name" error={errors.name}>
                <input
                  {...register("name", { required: "Please enter your name" })}
                  className="input text-xs sm:text-sm"
                  placeholder="Your full name"
                />
              </Field>

              <Field label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  maxLength={10}
                  {...register("phone", {
                    required: "Please enter a phone number",
                    pattern: { value: /^[0-9]{10}$/, message: "Phone number must be exactly 10 digits" },
                  })}
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  }}
                  className="input text-xs sm:text-sm"
                  placeholder="10-digit mobile number"
                />
              </Field>

              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  {...register("email", {
                    required: "Please enter your email",
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" },
                  })}
                  className="input text-xs sm:text-sm"
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

              {/* Shape selector — clean 2-col on mobile, 4-col on tablet/desktop */}
              <Field label="Cake Shape (optional)">
                <Controller
                  name="shape"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SHAPES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => field.onChange(field.value === s.value ? "" : s.value)}
                          className={`w-full px-3 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center ${
                            field.value === s.value
                              ? "bg-rose text-ivory border-rose shadow-2xs"
                              : "border-blush text-cocoa-soft hover:border-rose/60 bg-ivory"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>

              {/* Cake Weight — clean 4-col grid across all devices */}
              <Field label="Cake Weight" error={errors.weight}>
                <Controller
                  name="weight"
                  control={control}
                  rules={{ required: "Please select a weight" }}
                  render={({ field }) => (
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {CAKE_WEIGHTS.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => field.onChange(w)}
                          className={`w-full px-1.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-200 text-center flex items-center justify-center ${
                            field.value === w
                              ? "bg-rose text-ivory border-rose shadow-2xs"
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
                  className="input text-xs sm:text-sm"
                  placeholder="e.g. Floral pastel, superhero, minimalist"
                />
              </Field>

              <Field label="Special Message (optional)">
                <textarea {...register("message")} className="input min-h-20 sm:min-h-24 resize-none text-xs sm:text-sm" placeholder="Anything else we should know?" />
              </Field>

              <Field label="Reference Image (optional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  className="w-full text-xs sm:text-sm text-cocoa-soft file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blush file:text-rose-deep file:font-semibold hover:file:bg-blush-soft file:transition-colors file:cursor-pointer"
                />
                {fileName && <p className="text-[11px] sm:text-xs text-cocoa-soft/70 mt-1">Selected: {fileName} — please attach it in WhatsApp when you send your request.</p>}
              </Field>

              {/* Mobile recap */}
              <div className="md:hidden pt-2">
                <RequestSummary summary={summary} />
              </div>

              <button
                type="submit"
                className="w-full bg-rose text-ivory font-semibold py-3 sm:py-3.5 rounded-full hover:bg-rose-deep hover:shadow-md hover:shadow-rose/20 active:scale-[0.99] transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-base"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Request Quote on WhatsApp</span>
              </button>

              <p className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-cocoa-soft/60 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-rose shrink-0" strokeWidth={1.75} />
                No payment is taken here — this only starts the conversation.
              </p>
            </form>

            {/* Assurances follow the form on mobile */}
            <div className="md:hidden mt-4 sm:mt-6">
              <AssurancePanel />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

/* ═══ LIVE REQUEST SUMMARY ═══ */
function RequestSummary({ summary }) {
  const filled = summary.filter((row) => row.value).length;

  return (
    <div className="bg-ivory rounded-2xl sm:rounded-3xl border border-blush/50 overflow-hidden shadow-2xs">
      <div className="flex items-center gap-2.5 px-4 py-3 sm:px-6 sm:py-4 border-b border-blush/50 bg-blush-soft/40">
        <ClipboardList className="w-4 h-4 text-rose-deep shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <p className="font-display font-semibold text-cocoa text-xs sm:text-sm flex-1">Your Request</p>
        <span className="text-[11px] sm:text-xs text-cocoa-soft/65 tabular-nums font-semibold">{filled}/{summary.length}</span>
      </div>

      <dl className="divide-y divide-blush/40">
        {summary.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3">
            <dt className="text-[10px] sm:text-xs uppercase tracking-wider text-cocoa-soft/60 shrink-0">{row.label}</dt>
            <dd className={`text-xs sm:text-sm text-right truncate ${row.value ? "font-semibold text-cocoa" : "text-cocoa-soft/35"}`}>
              {row.value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ═══ ASSURANCE PANEL ═══ */
function AssurancePanel() {
  return (
    <ul className="bg-blush-soft/50 rounded-2xl sm:rounded-3xl border border-blush/50 px-4 py-3.5 sm:px-6 sm:py-5 space-y-2 sm:space-y-3">
      {ASSURANCES.map((line) => (
        <li key={line} className="flex items-start gap-2 text-xs sm:text-sm text-cocoa-soft/80 leading-snug">
          <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
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
