<template>
  <div class="privacy-container">
    <div class="privacy-card">
      <div class="header-section">
        <div class="logo-section">
          <div class="logo">🔒</div>
          <h1 class="main-title">Privacy & Policy</h1>
        </div>
        <p class="subtitle">Please login and allow permissions to continue</p>
      </div>

      <div class="content-section">
        <div class="policy-item">
          <div class="policy-number">1</div>
          <div class="policy-content">
            <h3>Allow Pop-ups</h3>
            <p>Allow pop-up windows on this page to continue with the authentication process.</p>
          </div>
        </div>

        <div class="policy-item">
          <div class="policy-number">2</div>
          <div class="policy-content">
            <h3>Page Insights Usage</h3>
            <p>We will only use your page insights for counting live concurrent views on your Facebook pages.</p>
          </div>
        </div>

        <div class="policy-item">
          <div class="policy-number">3</div>
          <div class="policy-content">
            <h3>App Purpose</h3>
            <p>This app is designed to count live views from different pages that are sub-streaming your video or live feed content.</p>
          </div>
        </div>

        <div class="policy-item">
          <div class="policy-number">4</div>
          <div class="policy-content">
            <h3>Data Security</h3>
            <p>Your data is securely stored and we do not share your personal information with third parties.</p>
          </div>
        </div>
      </div>

      <div class="footer-section">
        <div class="permission-info">
          <h4>Required Permissions:</h4>
          <ul class="permission-list">
            <li>📊 Page Insights</li>
            <li>📱 Page Management</li>
            <li>👥 Page Engagement</li>
            <li>📈 Live Video Analytics</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref,computed,watch,useTemplateRef } from 'vue'

 import { useStoreNotes } from '@/stores/storeNotes'
const storeNotes = useStoreNotes()
import {getLongLivedUserAndPageTokens, requestUserAndPageTokens, getPageAccessTokenFor } from '@/js/facebookAuth.js';

const pages1 = ref([])
const page_access_token = ref('')
const user_access_token = ref('')
const get_comments = async (video_id) => {
  //https://graph.facebook.com/v23.0/2195146030960032/comments?access_token=
  //GET https://graph.facebook.com/v19.0/{live_video_id}?fields=live_views&access_token={PAGE_ACCESS_TOKEN}
  const response = await fetch(`https://graph.facebook.com/v23.0/${video_id}/comments?access_token=${page_access_token.value}`)
  const data = await response.json()
  console.log(data,'data')
}
async function connectFacebook() {
  const { longLivedUserAccessToken,longLivedUserExpiresIn, pages } = await getLongLivedUserAndPageTokens({
    appId: '765691559587440',
    scopes: [
      'pages_show_list',
      'pages_read_engagement',
      'read_insights',
      // add more if needed, e.g. 'pages_manage_posts'
      'business_management',
      'pages_manage_metadata',
      'pages_read_user_content',
      'pages_manage_posts',
      'pages_manage_engagement'

    ]
  });

  // Choose a page and get its Page Access Token
  const pageId = pages[0]?.id; // or your specific PAGE_ID
  const pageAccessToken = await getPageAccessTokenFor(pageId, longLivedUserAccessToken);

  // Now you can call Graph API with either token as needed
  console.log({ longLivedUserAccessToken, longLivedUserExpiresIn, pageAccessToken, pages },'final');
  // console.log(pages,'pages222')
  pages1.value = pages
  page_access_token.value = pageAccessToken
  user_access_token.value = longLivedUserAccessToken
  //save_page_info()
  add_page_info()
}
const add_page_info=()=>{
    console.log(pages1.value)
    pages1.value.forEach(page => {
      storeNotes.addPages(page)
    })
    //storeNotes.addPages(pages1.value)
}
const save_page_info = () => {
  localStorage.setItem('page_info',JSON.stringify(pages1.value))
}
connectFacebook()

</script>

<style lang="css" scoped>
.privacy-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.privacy-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 800px;
  width: 100%;
  animation: slideIn 0.6s ease-out;
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
  border-bottom: 2px solid #f0f0f0;
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
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.main-title {
  color: #333;
  font-size: 2.5em;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #666;
  font-size: 1.2em;
  margin: 10px 0 0 0;
  font-weight: 400;
}

.content-section {
  margin-bottom: 40px;
}

.policy-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;
}

.policy-item:hover {
  transform: translateX(10px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.15);
  background: #f0f2ff;
}

.policy-number {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2em;
  margin-right: 20px;
  flex-shrink: 0;
}

.policy-content h3 {
  color: #333;
  font-size: 1.3em;
  font-weight: 600;
  margin: 0 0 10px 0;
}

.policy-content p {
  color: #666;
  font-size: 1em;
  line-height: 1.6;
  margin: 0;
}

.footer-section {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  padding: 25px;
  border-radius: 15px;
  border: 1px solid #e9ecef;
}

.permission-info h4 {
  color: #333;
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 15px 0;
  text-align: center;
}

.permission-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.permission-list li {
  background: white;
  padding: 12px 20px;
  border-radius: 10px;
  color: #555;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
}

.permission-list li:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

/* Responsive Design */
@media (max-width: 768px) {
  .privacy-container {
    padding: 10px;
  }
  
  .privacy-card {
    padding: 25px;
  }
  
  .main-title {
    font-size: 2em;
  }
  
  .policy-item {
    flex-direction: column;
    text-align: center;
  }
  
  .policy-number {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .permission-list {
    grid-template-columns: 1fr;
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
}
</style>
