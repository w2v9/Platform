import type { Metadata } from 'next'

// Export metadata for the page for SEO and better performance
export const metadata: Metadata = {
  title: 'Privacy Policy - AzoozGAT Platform',
  description: 'Privacy Policy for the AzoozGAT Platform services.',
}

export default function PrivacyPolicyPage() {
  return (
    // Main container with padding, similar to the Home page
    <div className="flex flex-col items-center justify-center p-4 sm:p-8 md:p-12">
      <div className="max-w-4xl w-full mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        
        {/* Page Header */}
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
            Privacy Policy for AzoozGAT
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: July 30, 2025
          </p>
        </div>

        {/* Policy Content Sections */}
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
            <p>
              Welcome to AzoozGAT. We are committed to protecting the privacy of our customers. This Privacy Policy outlines the types of personal information we collect, how it is used, and the rights you have regarding your data when using our services on Telegram.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
            <p>To provide and improve our service, we collect the following information:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li><strong className="font-medium">Contact Information:</strong> Your full name, phone number, email address, and Telegram account ID.</li>
              <li><strong className="font-medium">Transaction Information:</strong> Proof of payment from a bank transfer, which includes details of the transaction.</li>
              <li><strong className="font-medium">Communication Data:</strong> Any messages, questions, or feedback you send to us directly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
            <p>The information we collect is used solely for these purposes:</p>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li>To Process Orders: To confirm your payment and verify your purchase.</li>
              <li>To Deliver Products: To provide you with the tajme3at files you have purchased.</li>
              <li>To Communicate: To respond to your questions and provide customer support.</li>
              <li>To Improve Your Experience: To understand customer needs and enhance the services offered on the AzoozGAT platform.</li>
              <li>For Record-Keeping: To maintain internal records of transactions as required by Saudi Arabian law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">4. Data Sharing and Third Parties</h2>
            <p>
              We do not sell, rent, or trade your personal information. Your privacy is important, and we limit sharing to what is absolutely necessary. However, to function, our service relies on the following third parties who will handle your data as part of their standard operations:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
              <li><strong className="font-medium">Telegram:</strong> All our communications and file deliveries occur on Telegram, which operates under its own privacy policy.</li>
              <li><strong className="font-medium">Our Bank:</strong> To confirm your payment, our bank processes the transaction. This means the bank will have a record of the transfer, including the sender's name and account information, as is standard for all banking operations.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">5. Data Security</h2>
            <p>
              We take reasonable administrative and technical measures to protect your personal information from unauthorized access, disclosure, or loss.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">6. Your Rights Under the Personal Data Protection Law (PDPL)</h2>
            <p>
              As per Saudi Arabia's Personal Data Protection Law, you have the following rights regarding your personal data:
            </p>
             <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
                <li><strong className="font-medium">Right to Access:</strong> You can request a copy of the personal information we hold about you.</li>
                <li><strong className="font-medium">Right to Correction:</strong> You can request to correct any inaccurate or incomplete information.</li>
                <li><strong className="font-medium">Right to Destruction:</strong> You can request the deletion of your personal data when it is no longer needed for the purpose it was collected.</li>
             </ul>
             <p className="mt-2">
               Please note, we may be legally required to retain certain data after a request of deletion (such as financial transaction records) for a specific period to comply with legal or regulatory obligations.
             </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">7. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Communication data will be deleted upon request or when no longer needed, while transaction records will be kept in accordance with Saudi financial regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on our Telegram channel or by direct message.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us via our official Telegram account: <a href="https://t.me/AzoozGAT" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://t.me/AzoozGAT</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
