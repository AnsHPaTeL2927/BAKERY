import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageSquareQuote, PenLine, ShieldCheck, Quote } from "lucide-react";
import PageHeader from "../components/PageHeader";
import SafeImage from "../components/SafeImage";
import ScrollReveal from "../components/ScrollReveal";
import AnimatedButton from "../components/AnimatedButton";
import ButtonLoader from "../components/loading/ButtonLoader";
import Skeleton from "../components/loading/Skeleton";
import { StarRatingDisplay, StarRatingInput } from "../components/StarRating";
import { getTestimonials, submitReview } from "../services/api";

const MIN_REVIEW_LENGTH = 10;
const MAX_REVIEW_LENGTH = 1500;

function formatMonth(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(0); // 0 = all, otherwise exact star value
  const formRef = useRef(null);

  useEffect(() => {
    getTestimonials()
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (reviews.length === 0) return { average: 0, total: 0, breakdown: {} };
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    reviews.forEach((r) => {
      const rating = Math.min(5, Math.max(1, Number(r.rating) || 5));
      breakdown[rating] += 1;
      sum += rating;
    });
    return { average: sum / reviews.length, total: reviews.length, breakdown };
  }, [reviews]);

  const visible = filter === 0 ? reviews : reviews.filter((r) => Number(r.rating) === filter);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <PageHeader
        eyebrow="In Their Words"
        title="Customer Reviews"
        description="Every review below comes from a real customer order. Read them — then tell us how we did."
      />

      {/* ═══ RATING SUMMARY ═══ */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16">
        {loading ? (
          <Skeleton className="h-64 rounded-[2rem]" />
        ) : stats.total > 0 ? (
          <ScrollReveal>
            <div className="rounded-[2rem] border border-blush/60 bg-ivory overflow-hidden grid md:grid-cols-[minmax(0,320px)_1fr]">
              {/* Headline score */}
              <div className="bg-blush-soft/60 p-8 md:p-10 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-blush/50">
                <p className="font-display font-semibold text-6xl md:text-7xl text-cocoa leading-none">
                  {stats.average.toFixed(1)}
                </p>
                <StarRatingDisplay value={stats.average} size="lg" className="mt-4" />
                <p className="mt-3 text-sm text-cocoa-soft/70">
                  Based on {stats.total} published review{stats.total === 1 ? "" : "s"}
                </p>
              </div>

              {/* Distribution */}
              <div className="p-8 md:p-10">
                <p className="font-display font-semibold text-cocoa mb-5">Rating breakdown</p>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.breakdown[star] || 0;
                    const percent = stats.total ? (count / stats.total) * 100 : 0;
                    const isActive = filter === star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFilter(isActive ? 0 : star)}
                        className="w-full flex items-center gap-3 group text-left"
                        aria-pressed={isActive}
                      >
                        <span className={`text-sm font-semibold tabular-nums w-10 shrink-0 transition-colors ${isActive ? "text-rose-deep" : "text-cocoa-soft/70"}`}>
                          {star} ★
                        </span>
                        <span className="flex-1 h-2.5 rounded-full bg-blush/40 overflow-hidden">
                          <span
                            className="block h-full rounded-full bg-gold transition-[width] duration-700 ease-out"
                            style={{ width: `${percent}%` }}
                          />
                        </span>
                        <span className="text-sm tabular-nums text-cocoa-soft/60 w-8 shrink-0 text-right">{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <AnimatedButton type="button" onClick={scrollToForm} arrow>
                    Write a Review
                  </AnimatedButton>
                  <p className="flex items-center gap-2 text-xs text-cocoa-soft/60">
                    <ShieldCheck className="w-4 h-4 text-rose shrink-0" />
                    Every review is checked before it's published.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <ScrollReveal>
            <div className="rounded-[2rem] border border-blush/60 bg-ivory py-14 px-6 text-center">
              <MessageSquareQuote className="w-10 h-10 text-rose/40 mx-auto mb-4" strokeWidth={1.5} />
              <p className="font-display font-semibold text-cocoa text-lg mb-2">Be the first to review us</p>
              <p className="text-cocoa-soft/70 max-w-sm mx-auto mb-6">
                Ordered from us before? Your words help the next customer decide.
              </p>
              <AnimatedButton type="button" onClick={scrollToForm} arrow>
                Write the First Review
              </AnimatedButton>
            </div>
          </ScrollReveal>
        )}
      </section>

      {/* ═══ REVIEW LIST ═══ */}
      {(loading || stats.total > 0) && (
        <section className="max-w-6xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
          {!loading && stats.total > 0 && (
            <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
              <h2 className="font-display font-semibold text-2xl md:text-3xl text-cocoa">
                {filter === 0 ? "All reviews" : `${filter}-star reviews`}
                <span className="text-cocoa-soft/50 font-body text-base font-normal ml-2">({visible.length})</span>
              </h2>
              {filter !== 0 && (
                <button
                  type="button"
                  onClick={() => setFilter(0)}
                  className="text-sm font-semibold text-rose-deep hover:text-rose transition-colors"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : visible.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visible.map((r, i) => (
                <ScrollReveal key={r.id} delay={Math.min(i, 5) * 60} distance={20}>
                  <ReviewCard review={r} />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-blush/60 bg-ivory py-12 text-center">
              <p className="text-cocoa-soft/70">
                No {filter}-star reviews yet.{" "}
                <button type="button" onClick={() => setFilter(0)} className="font-semibold text-rose-deep hover:text-rose">
                  Show all reviews
                </button>
              </p>
            </div>
          )}
        </section>
      )}

      {/* ═══ WRITE A REVIEW ═══ */}
      <section ref={formRef} className="bg-blush-soft/50 border-y border-blush/50 scroll-mt-24">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-16 md:py-24">
          <ScrollReveal>
            <div className="text-center mb-10">
              <p className="font-script text-2xl md:text-3xl text-rose-deep mb-1">Tell Us How We Did</p>
              <h2 className="font-display font-semibold text-2xl md:text-4xl text-cocoa">Write a Review</h2>
              <p className="mt-3 text-cocoa-soft/70 max-w-md mx-auto leading-relaxed">
                Share your experience in a few lines. We read every one, and publish it here once it's checked.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <ReviewForm />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

/* ═══ REVIEW CARD ═══ */
function ReviewCard({ review }) {
  const submitted = formatMonth(review.createdAt);
  return (
    <article className="h-full bg-ivory rounded-2xl border border-blush/50 p-6 flex flex-col card-hover">
      <Quote className="w-7 h-7 text-blush shrink-0 mb-3" strokeWidth={1.5} aria-hidden="true" />
      <StarRatingDisplay value={review.rating || 5} size="sm" />
      <p className="mt-4 text-sm text-cocoa-soft/85 leading-relaxed flex-1">{review.review}</p>
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-blush/40">
        {review.photo ? (
          <SafeImage
            src={review.photo}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-blush/50"
            containerClassName="w-10 h-10 shrink-0"
          />
        ) : (
          <span
            className="w-10 h-10 shrink-0 rounded-full bg-blush-soft border border-blush/50 flex items-center justify-center font-display font-semibold text-rose-deep"
            aria-hidden="true"
          >
            {(review.name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-sm text-cocoa truncate">{review.name}</p>
          {submitted && <p className="text-xs text-cocoa-soft/50">{submitted}</p>}
        </div>
      </div>
    </article>
  );
}

/* ═══ REVIEW FORM ═══ */
function ReviewForm() {
  const [form, setForm] = useState({ name: "", rating: 0, review: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate() {
    const next = {};
    if (form.name.trim().length < 2) next.name = "Please enter your name";
    if (!form.rating) next.rating = "Please select a rating";
    if (form.review.trim().length < MIN_REVIEW_LENGTH) {
      next.review = `Please write at least ${MIN_REVIEW_LENGTH} characters`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitReview({
        name: form.name.trim(),
        rating: form.rating,
        review: form.review.trim(),
      });
      setSubmitted(true);
      setForm({ name: "", rating: 0, review: "" });
      setErrors({});
    } catch (err) {
      setServerError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-ivory rounded-3xl border border-blush/50 p-8 md:p-10 text-center"
      >
        <span className="w-14 h-14 rounded-full bg-blush-soft flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-7 h-7 text-rose-deep" strokeWidth={1.75} />
        </span>
        <p className="font-display font-semibold text-xl text-cocoa mb-2">Thank you for your review</p>
        <p className="text-cocoa-soft/75 max-w-sm mx-auto leading-relaxed">
          We've received it. Once our team has checked it, it will appear on this page alongside the others.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 text-sm font-semibold text-rose-deep hover:text-rose transition-colors"
        >
          Write another review
        </button>
      </motion.div>
    );
  }

  const remaining = MAX_REVIEW_LENGTH - form.review.length;

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-ivory rounded-3xl border border-blush/50 p-6 md:p-8 space-y-6 shadow-sm">
      {serverError && (
        <p className="rounded-2xl border border-rose/30 bg-blush-soft px-4 py-3 text-sm text-rose-deep">{serverError}</p>
      )}

      {/* Rating */}
      <div>
        <span className="text-sm font-semibold text-cocoa mb-2 block">Your rating</span>
        <div className="flex flex-wrap items-center gap-3">
          <StarRatingInput
            value={form.rating}
            onChange={(rating) => {
              setForm((f) => ({ ...f, rating }));
              setErrors((e) => ({ ...e, rating: undefined }));
            }}
          />
          {form.rating > 0 && (
            <span className="text-sm text-cocoa-soft/70">
              {["Poor", "Fair", "Good", "Very good", "Excellent"][form.rating - 1]}
            </span>
          )}
        </div>
        <FieldError message={errors.rating} />
      </div>

      {/* Name */}
      <label className="block">
        <span className="text-sm font-semibold text-cocoa mb-1.5 block">Your name</span>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="input"
          placeholder="e.g. Priya S."
          maxLength={120}
          autoComplete="name"
        />
        <FieldError message={errors.name} />
      </label>

      {/* Review */}
      <label className="block">
        <span className="text-sm font-semibold text-cocoa mb-1.5 block">Your review</span>
        <textarea
          value={form.review}
          onChange={(e) => setForm((f) => ({ ...f, review: e.target.value.slice(0, MAX_REVIEW_LENGTH) }))}
          className="input min-h-32 resize-none"
          placeholder="What did you order, and how was it? Taste, decoration, delivery — anything that would help someone else decide."
        />
        <span className="mt-1.5 flex items-center justify-between gap-3">
          <FieldError message={errors.review} />
          <span className={`text-xs shrink-0 ml-auto ${remaining < 100 ? "text-rose-deep" : "text-cocoa-soft/45"}`}>
            {remaining} characters left
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-rose text-ivory font-semibold py-3.5 rounded-full hover:bg-rose-deep hover:shadow-md hover:shadow-rose/20 transition-all duration-300 disabled:opacity-60 disabled:hover:bg-rose"
      >
        {submitting ? <ButtonLoader /> : (<><PenLine className="w-4 h-4" /> Submit Review</>)}
      </button>

      <p className="text-xs text-cocoa-soft/55 text-center leading-relaxed">
        Your name and review are published on this page after approval. We never publish contact details.
      </p>
    </form>
  );
}

function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-xs text-rose-deep mt-1.5 block"
        >
          {message}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
