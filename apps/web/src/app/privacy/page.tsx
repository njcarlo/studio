export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 prose">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> April 18, 2025</p>

      <p>
        COG Nation ("we", "our", or "us") operates the Tracts Tracker mobile application.
        This page informs you of our policies regarding the collection, use, and disclosure
        of personal data when you use our app.
      </p>

      <h2>Information We Collect</h2>
      <p>We collect the following information when you use the app:</p>
      <ul>
        <li>Name and email address (for account creation and login)</li>
        <li>Location data (used only for tract tracking features while the app is in use)</li>
        <li>Device information (for app functionality and crash reporting)</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>To provide and maintain the app</li>
        <li>To authenticate your account</li>
        <li>To track ministry activity and attendance</li>
        <li>To communicate updates or important notices</li>
      </ul>

      <h2>Data Sharing</h2>
      <p>
        We do not sell or share your personal data with third parties except as required
        by law or to operate core app services (e.g., Supabase for database hosting).
      </p>

      <h2>Data Retention</h2>
      <p>
        Your data is retained as long as your account is active. You may request deletion
        by contacting us at the email below.
      </p>

      <h2>Location Data</h2>
      <p>
        Location is only accessed while the app is in use and is not stored or shared
        beyond the session unless explicitly required for a feature.
      </p>

      <h2>Children's Privacy</h2>
      <p>
        This app is not intended for children under 13. We do not knowingly collect
        data from children under 13.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions about this Privacy Policy, contact us at:{" "}
        <a href="mailto:admin@cognation.org">admin@cognation.org</a>
      </p>
    </div>
  );
}
