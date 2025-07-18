
export default function PrivacyPolicyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to MapMyLED. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        We collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application or otherwise when you contact us.
      </p>
      <p>
        The personal information that we collect depends on the context of your interactions with us and the application, the choices you make and the products and features you use. The personal information we collect may include the following:
      </p>
      <ul>
        <li><strong>Personal Information Provided by You.</strong> We collect names; email addresses; passwords; and other similar information.</li>
        <li><strong>Payment Data.</strong> We may collect data necessary to process your payment if you make purchases, such as your payment instrument number (such as a credit card number), and the security code associated with your payment instrument. All payment data is stored by our payment processor and you should review its privacy policies and contact the payment processor directly to respond to your questions.</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>
        We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
      </p>
      <ul>
          <li>To facilitate account creation and logon process.</li>
          <li>To post testimonials.</li>
          <li>Request feedback.</li>
          <li>To enable user-to-user communications.</li>
          <li>To manage user accounts.</li>
      </ul>

      <h2>4. Will Your Information Be Shared With Anyone?</h2>
      <p>
        We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
      </p>
      
      <h2>5. How Long Do We Keep Your Information?</h2>
      <p>
        We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
      </p>
    </>
  );
}
