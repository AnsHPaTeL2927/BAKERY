import PageHeader from "../components/PageHeader";

export default function PrivacyPolicy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <section className="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20 space-y-6 text-cocoa-soft/85 leading-relaxed">
        <p>
          Cakes by Tulsi collects only the information you choose to share with us — such as
          your name, phone number, and order details — to process orders and custom cake
          requests. We do not sell or share your information with third parties.
        </p>
        <p>
          Orders placed through WhatsApp are subject to WhatsApp's own privacy policy.
          Reference images uploaded for custom cake requests are used solely to prepare
          your order.
        </p>
        <p>
          For any questions about how your information is handled, please contact us
          directly using the details on our Contact page.
        </p>
      </section>
    </>
  );
}
