<template>
  <div class="privacy-container">
    <div class="privacy-card">
      <div class="header-section">
        <div class="logo-section">
          <div class="logo">📋</div>
          <h1 class="main-title">Privacy Policy</h1>
        </div>
        <p class="subtitle">Effective Date: 8/28/2025</p>
      </div>

      <div class="content-section">
        <div class="policy-intro">
          <p>We respects your privacy and is committed to protecting it. This Privacy Policy explains how we collect, use, and share information when you use our application.</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">1. Information We Collect</h2>
          <p>When you use our app, we may collect the following information through the Facebook Graph API and other services:</p>
          <ul class="policy-list">
            <li>Basic Facebook profile information (such as name, profile picture, user ID)</li>
            <li>Page information (such as page name, ID, and access tokens if you manage a Page)</li>
            <li>Content-related data (such as posts, comments, live video statistics) if you grant permissions</li>
          </ul>
          <p>We do not collect sensitive personal data unless explicitly required for the app's functionality.</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">2. How We Use the Information</h2>
          <p>We use the collected information only for the following purposes:</p>
          <ul class="policy-list">
            <li>To provide the app's features (such as displaying live video metrics, concurrent viewers, and insights).</li>
            <li>If you are streaming our live game live feed.</li>
            <li>To improve the functionality and performance of our app.</li>
            <li>To ensure security and prevent unauthorized use.</li>
          </ul>
          <p>We do not sell, rent, or trade your information to third parties.</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">3. Data Sharing</h2>
          <p>We may share your information only in the following cases:</p>
          <ul class="policy-list">
            <li><strong>With Facebook APIs:</strong> as required to fetch and display the data you requested.</li>
            <li><strong>With service providers:</strong> who help us operate our app (e.g., hosting, database, analytics).</li>
            <li><strong>As required by law:</strong> if we are legally required to disclose information.</li>
          </ul>
        </div>

        <div class="policy-section">
          <h2 class="section-title">4. Data Storage and Retention</h2>
          <p>Your data is stored securely using <strong>Google Firestore</strong> (a very secured platform)</p>
          <p>We retain your data only as long as necessary to provide the app's services.</p>
          <p>You may request deletion of your data at any time (see "Your Rights" below).</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">5. Your Rights</h2>
          <p>As a user, you have the right to:</p>
          <ul class="policy-list">
            <li>Access the information we have collected about you.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Withdraw permissions you granted to the app via Facebook at any time from your Facebook Settings.</li>
          </ul>
        </div>

        <div class="policy-section">
          <h2 class="section-title">6. Security</h2>
          <p>We take reasonable measures to protect your data from unauthorized access, loss, misuse, or disclosure.</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">7. Children's Privacy</h2>
          <p>Our app is not directed to children under 13, and we do not knowingly collect data from them.</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any changes will be posted at this page with a revised "Effective Date."</p>
        </div>

        <div class="policy-section">
          <h2 class="section-title">9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at:</p>
          <div class="contact-info">
            <span class="contact-label">Email:</span>
            <a href="mailto:yonefang@gamecastnetwork.com" class="contact-link">yonefang@gamecastnetwork.com</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
/* Dark Theme Styles for Privacy Policy */
.privacy-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.privacy-card {
  background: #1e1e2e;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  padding: 40px;
  max-width: 900px;
  width: 100%;
  animation: slideIn 0.6s ease-out;
  border: 1px solid #2d2d3f;
  margin: 20px 0;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 30px;
  border-bottom: 2px solid #2d2d3f;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.logo {
  font-size: 3em;
  margin-right: 15px;
  animation: pulse 2s infinite;
  filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.5));
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.main-title {
  color: #ffffff;
  font-size: 2.5em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.subtitle {
  color: #a0a0a0;
  font-size: 1.1em;
  margin: 10px 0 0 0;
  font-weight: 400;
}

.content-section {
  color: #b0b0b0;
  line-height: 1.7;
}

.policy-intro {
  background: #2d2d3f;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
  border: 1px solid #3d3d4f;
}

.policy-intro p {
  color: #ffffff;
  font-size: 1.1em;
  margin: 0;
  text-align: center;
  font-weight: 500;
}

.policy-section {
  margin-bottom: 35px;
  padding: 25px;
  background: #2d2d3f;
  border-radius: 15px;
  border: 1px solid #3d3d4f;
  transition: all 0.3s ease;
}

.policy-section:hover {
  background: #3d3d4f;
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.1);
}

.section-title {
  color: #ffffff;
  font-size: 1.4em;
  font-weight: 600;
  margin: 0 0 15px 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.policy-section p {
  color: #b0b0b0;
  font-size: 1em;
  margin: 0 0 15px 0;
  line-height: 1.6;
}

.policy-section p:last-child {
  margin-bottom: 0;
}

.policy-list {
  list-style: none;
  padding: 0;
  margin: 15px 0;
}

.policy-list li {
  color: #b0b0b0;
  padding: 8px 0 8px 25px;
  position: relative;
  font-size: 0.95em;
  line-height: 1.5;
}

.policy-list li::before {
  content: '•';
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: 0;
  font-size: 1.2em;
}

.policy-list li strong {
  color: #ffffff;
  font-weight: 600;
}

.contact-info {
  background: #1e1e2e;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #3d3d4f;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.contact-label {
  color: #a0a0a0;
  font-weight: 500;
  font-size: 0.95em;
}

.contact-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.contact-link:hover {
  color: #ffffff;
  text-shadow: 0 0 10px rgba(102, 126, 234, 0.5);
}

/* Responsive Design */
@media (max-width: 768px) {
  .privacy-container {
    padding: 15px;
  }
  
  .privacy-card {
    padding: 25px;
  }
  
  .main-title {
    font-size: 2em;
  }
  
  .policy-section {
    padding: 20px;
  }
  
  .section-title {
    font-size: 1.3em;
  }
  
  .contact-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

@media (max-width: 480px) {
  .privacy-card {
    padding: 20px;
  }
  
  .main-title {
    font-size: 1.8em;
  }
  
  .logo {
    font-size: 2.5em;
  }
  
  .policy-section {
    padding: 15px;
  }
}
</style>