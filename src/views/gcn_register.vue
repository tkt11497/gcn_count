<template>
    <h1>hello world</h1>
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
