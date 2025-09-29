<template>
    <div class="banner">
      <div class="over-lay"></div>
      <img src="@/assets/image/banner.jpg" alt="Banner" class="banner-img">
      <div class="banner-content-box">
          <h1 class="heading-primary--main">GCN</h1>
          <h3 class="heading-primary--sub">From Passion to Impact, We Create the Hype!</h3>
          <h3 class="heading-primary--sub2"> Game Cast Network (GCN) delivers real-time broadcast analytics technology for esports tournaments and live events.</h3>
      </div>
    </div>
  </template>
  
  <script setup>
  // import VueQrcode from 'vue-qrcode'
  // import { Popover } from 'vant'

  //getvideoLink()
  
  
  
  </script>
  
  
  
  <style lang="scss" scoped>
  .banner{
      width: 100%;
      margin-top: -105px;
      position: relative;
      padding: 1.25rem;
      height: 1038px;
      .over-lay{
          position: absolute;
          width: 99%;
          height: 87%;
          background: rgba(0, 0, 0, 0.40);
          z-index: 1;
      }
      .banner-img{
          width: 100%;
          object-fit: cover;
          height: 100%;
          clip-path: inset(120px 0% 110px 0% round 20px); 
          z-index: 0;
      }
      .banner-content-box{
          position: absolute;
          top: 49%;
          left: 50%;
          width: 60%;
          transform: translate(-50%, -50%);
          z-index: 2;
          @include respond(tab-land){
              top: 50%;
              width: 80%;
          }
          @include respond(tab-port){
              width: 70%;
          }
          @include respond(phone){
              width: 92%;
          }
          
      }
      @media (max-width: 1600px) {
          height: 878px;
      }
      @include respond(phone){
          margin-top: -115px;
      }
  }
  
  </style>