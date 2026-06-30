<template>
    <div class="esports-landing">
        <!-- Navigation -->
        <nav class="landing-nav" :class="{ 'scrolled': isScrolled }">
            <div class="container nav-container">
                <div class="nav-left">
                    <div class="nav-brand">
                        <img src="/for_landing/gcn_logo.png" alt="GCN" class="nav-logo-img" />
                        <!-- <span class="logo-text">GAME CAST<br>NETWORK.</span> -->
                    </div>
                    <div class="nav-links" :class="{ 'active': isMobileMenuOpen }">
                        <a href="#about" class="nav-link" @click="isMobileMenuOpen = false">About</a>
                        <a href="#expertise" class="nav-link" @click="isMobileMenuOpen = false">Expertise</a>
                        <a href="#process" class="nav-link" @click="isMobileMenuOpen = false">Process</a>
                        <a href="#works" class="nav-link" @click="isMobileMenuOpen = false">Works</a>
                        <a href="#team" class="nav-link" @click="isMobileMenuOpen = false">Team</a>
                        <a href="#tournament-gallery" class="nav-link" @click="isMobileMenuOpen = false">Gallery</a>
                        <a href="#clients" class="nav-link" @click="isMobileMenuOpen = false">Clients</a>
                        <a href="#contact" class="nav-link" @click="isMobileMenuOpen = false">Contact</a>
                    </div>
                </div>
                <div class="nav-right">
                    <button
                        type="button"
                        class="mobile-menu-btn"
                        :class="{ 'mobile-menu-btn--open': isMobileMenuOpen }"
                        :aria-expanded="isMobileMenuOpen"
                        aria-label="Toggle menu"
                        @click="isMobileMenuOpen = !isMobileMenuOpen"
                    >
                        <span class="mobile-menu-btn-bar"></span>
                        <span class="mobile-menu-btn-bar"></span>
                        <span class="mobile-menu-btn-bar"></span>
                    </button>
                </div>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="hero-section">
            <div class="container">
                <div class="hero-content">
                    <h1 class="hero-title">From Passion to Impact<br>We Create the Hype!</h1>
                    <p class="hero-subtitle">
                        Full-service gaming and esports solutions provider. Building ecosystems that connect publishers, players, creators, and communities across Myanmar, Cambodia, and Thailand.
                    </p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary" @click="scrollToSection('expertise')">Our Services</button>
                        <button class="btn btn-secondary" @click="scrollToSection('contact')">Contact Us</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Live & Upcoming Events Section -->
        <section class="live-upcoming-section" :class="{ 'section-inview': liveVisible }" ref="liveSectionRef">
            <div class="live-upcoming-bg"></div>
            <div class="container">
                <div class="live-upcoming-header">
                    <div class="live-upcoming-header-left">
                        <p class="live-upcoming-powered">
                            <img src="/for_landing/thunder_icon.svg" alt="" class="powered-icon" />
                            Powered by Game Cast Network
                        </p>
                        <h2 class="live-upcoming-title">LIVE & UPCOMING</h2>
                    </div>
                    <a href="#" class="live-upcoming-view-all">
                        VIEW ALL
                        <img src="/for_landing/arrow_forward.png" alt="" class="live-upcoming-view-all-icon" />
                    </a>
                </div>
                <div class="live-upcoming-cards">
                    <div
                        v-for="event in liveUpcomingEvents"
                        :key="event.id"
                        class="live-card"
                        :class="event.statusClass"
                    >
                        <div class="live-card-bg" :style="{ backgroundImage: `url(${event.bgImage})` }"></div>
                        <div class="live-card-overlay"></div>
                        <span class="live-card-badge" :class="event.statusClass">
                            <span v-if="event.liveDot" class="live-dot"></span>
                            {{ event.status }}
                        </span>
                        <div class="live-card-corner-icon">
                            <img v-if="event.iconSrc" :src="event.iconSrc" :alt="event.status" />
                            <svg v-else-if="event.statusClass === 'live-now'" class="globe-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <h3 class="live-card-title">{{ event.title }}</h3>
                        <p class="live-card-subtitle">{{ event.subtitle }}</p>
                        <div class="live-card-details">
                            <span class="live-card-detail">
                                <img src="/for_landing/calander_icon.svg" alt="" class="detail-icon" />
                                {{ event.detail1 }}
                            </span>
                            <span class="live-card-detail">
                                <img v-if="event.detail2Icon" :src="event.detail2Icon" alt="" class="detail-icon" />
                                {{ event.detail2 }}
                            </span>
                        </div>
                        <p class="live-card-footer">POWERED BY GAME CAST NETWORK</p>
                        <button class="live-card-cta" :class="event.statusClass">{{ event.cta }}</button>
                    </div>
                </div>
            </div>
             <!-- Past & Coming Events Carousel (infinite marquee) -->
        <section class="events-carousel-section" ref="carouselSectionRef">
           
           
            <div class="events-carousel-track-wrapper">
                <div class="events-carousel-track">
                    <div
                        v-for="(event, index) in carouselEventsDoubled"
                        :key="`${event.id}-${index}`"
                        class="event-carousel-card"
                    >
                        <div
                            class="event-carousel-card-image"
                            :style="{
                                backgroundImage: event.imageSrc ? `url(${event.imageSrc})` : 'none',
                                backgroundColor: event.logoBgColor || '#2a2a4a'
                            }"
                        >
                            <img v-if="event.imageSrc" :src="event.imageSrc" :alt="event.name" class="event-card-image-img" />
                            <span v-else class="event-card-image-text">{{ event.logoText }}</span>
                        </div>
                        <div class="event-carousel-card-overlay">
                            <span class="event-carousel-date">{{ event.date }}</span>
                            <h3 class="event-carousel-name">{{ event.name }}</h3>
                            <span v-if="event.location" class="event-carousel-location">
                                <span class="event-carousel-pin">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#E53935"/><circle cx="12" cy="9" r="2.5" fill="white"/></svg>
                                </span>
                                {{ event.location }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        </section>

        

        

        <!-- About Us Section -->
        <section id="about" class="about-section" :class="{ 'section-inview': aboutVisible }" ref="aboutSectionRef">
            <div class="container">
                <div class="about-content">
                    <div class="about-text">
                        <h1 class="about-heading">About <span class="about-heading-accent">GCN</span></h1>
                        <p class="about-tagline">From Passion to Impact – We Create the Hype!</p>
                        <div class="about-body">
                            <p>
                                Founded in 2016, GCN began as a Facebook-based gaming and broadcasting channel and has since evolved into a full-service gaming and Esports solutions provider.
                            </p>
                            <p>
                                From 2016 to present, GCN has successfully organized 70+ Esports tournaments and executed 35+ gaming-focused marketing campaigns and community activities, playing a key role in shaping the gaming and Esports ecosystem across Myanmar, Cambodia, and Thailand.
                            </p>
                        </div>
                    </div>
                    <div class="about-image">
                        <img src="/for_landing/about_us_gcn.png" alt="GCN Team" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Our Approach Section -->
        <section class="approach-section" :class="{ 'section-inview': approachVisible }" ref="approachSectionRef">
            <!-- <div class="approach-bg"></div> -->
            <div class="container">
                <h2 class="approach-title">Our <span class="approach-title-accent">Approach</span></h2>
                <p class="approach-subtitle">Sit back and relax - we will take care of everything!</p>
                <div class="approach-grid">
                    <div class="approach-main">
                        <p class="approach-lead">
                            GCN's approach extends beyond competition. We focus on building and growing gaming ecosystems by connecting publishers, players, creators, and communities through strategic marketing, community development, and structured competitive programs.
                        </p>
                    </div>
                    <div class="approach-cards">
                        <div class="approach-card">
                            <p>
                                By combining deep local market knowledge, a strong understanding of player behavior, and experience working with international partners, GCN effectively manages key audience perception across both casual gaming and competitive Esports segments in multiple markets.
                            </p>
                        </div>
                        <div class="approach-card">
                            <p>
                                Adherence to strong ethical standards, combined with creative and community-first execution, enables GCN to deliver sustainable value for partners by supporting game launches, audience engagement, and competitive community growth through marketing and Esports.
                            </p>
                        </div>
                    </div>
                </div>
                <div class="approach-tagline-wrap">
                    <div class="approach-tagline">
                        <span class="approach-tagline-text">From Passion to Impact – </span>
                        <span class="approach-tagline-accent">We Create the Hype!</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- How We Process Section -->
        <section id="process" class="process-section" :class="{ 'section-inview': processVisible }" ref="processSectionRef">
            <div class="container">
                <p class="process-label">Our Process</p>
                <h2 class="process-title">How We <span class="process-title-accent">Roll</span></h2>
                <div class="process-steps">
                    <article
                        v-for="(step, index) in processSteps"
                        :key="step.title"
                        class="process-step"
                        tabindex="0"
                        :class="{ 'process-step--active': activeProcessStep === index }"
                        @mouseenter="activeProcessStep = index"
                        @mouseleave="activeProcessStep = null"
                        @focus="activeProcessStep = index"
                        @blur="activeProcessStep = null"
                    >
                        <div class="process-step-icon" :aria-hidden="true">
                            <svg v-if="index === 0" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="28" height="20" rx="2" stroke="currentColor" stroke-width="2"/><path d="M32 28l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="38" r="6" stroke="currentColor" stroke-width="2"/></svg>
                            <svg v-else-if="index === 1" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="6" width="28" height="24" rx="2" stroke="currentColor" stroke-width="2"/><path d="M14 14h16M14 20h12M14 26h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M34 32l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="38" cy="36" r="3" fill="currentColor"/></svg>
                            <svg v-else-if="index === 2" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 28c0-2 2-6 10-6s10 4 10 6v10c0 2-2 6-10 6S8 40 8 38V28z" stroke="currentColor" stroke-width="2"/><path d="M18 22c5.5 0 10-4.5 10-10S23.5 2 18 2 8 6.5 8 12s4.5 10 10 10z" stroke="currentColor" stroke-width="2"/><path d="M32 18l6 6 10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            <svg v-else-if="index === 3" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="26" width="8" height="14" rx="1" stroke="currentColor" stroke-width="2"/><rect x="20" y="18" width="8" height="22" rx="1" stroke="currentColor" stroke-width="2"/><rect x="32" y="10" width="8" height="30" rx="1" stroke="currentColor" stroke-width="2"/><path d="M12 24l8-8 8 4 8-12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </div>
                        <h3 class="process-step-title">{{ step.title }}</h3>
                        <p class="process-step-desc">{{ step.description }}</p>
                    </article>
                </div>
                <!-- <div class="process-footer">
                    <span class="process-tagline">From Passion to Impact – We Create the Hype!</span>
                    <span class="process-brand">GCN</span>
                </div> -->
            </div>
        </section>

        <!-- Operating Regions Section -->
        <section class="regions-section" :class="{ 'regions-section--visible': regionsVisible }" ref="regionsSectionRef">
            <div class="container">
                <h2 class="section-title">Our <span class="regions-title-accent">Operating</span> Regions</h2>
                <div class="regions-grid">
                    <div
                        v-for="(region, index) in regions"
                        :key="region.id"
                        class="region-card"
                        :style="{ animationDelay: `${index * 0.15}s` }"
                    >
                        <div class="region-map">
                            <img :src="region.image" :alt="region.name" class="region-image" />
                            <div class="region-overlay"></div>
                            <span class="region-label">{{ region.name }}</span>
                        </div>
                        <!-- <h3 class="region-name">{{ region.name }}</h3> -->
                    </div>
                </div>
            </div>
        </section>

        <!-- Management Team Section -->
        <section id="team" class="team-section">
            <div class="container">
                <div class="team-header">
                    <div class="team-title-wrapper">
                        <p class="team-subtitle">Our Management Team</p>
                        <h2 class="team-title">The<span class="regions-title-accent"> Hype</span> Makers</h2>
                        <p class="team-description">Our greatest strength lies in our dedicated team of Esports and marketing professionals who shape strategy, build communities, and move GCN forward.</p>
                    </div>
                </div>
                <div class="team-grid">
                    <div class="team-member" v-for="member in teamMembers" :key="member.name">
                        <div class="member-photo">
                            <img :src="member.photo" :alt="member.name" />
                        </div>
                        <h3 class="member-name">{{ member.name }}</h3>
                        <p class="member-title">{{ member.title }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Our Expertise Section -->
        <section id="expertise" class="expertise-section">
            <div class="container">
                <h2 class="section-title">Our <span class="regions-title-accent">Expertise</span></h2>
                <div class="expertise-grid">
                    <div class="expertise-item" v-for="(service, index) in expertiseServices" :key="index">
                        <span class="service-number">{{ String(index + 1).padStart(2, '0') }}</span>
                        <span class="service-name">{{ service }}</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Our Works Section -->
        <section id="works" class="works-section" ref="worksSectionRef">
            <div class="works-bg"></div>
            <div class="container">
                <h2 class="works-title">Our <span class="regions-title-accent">Works</span></h2>
                <p class="works-subtitle">We Create the Hype! Shaping the gaming and esports ecosystem across Myanmar, Cambodia, and Thailand.</p>
                <div class="works-stats">
                    <div
                        v-for="(stat, index) in worksStats"
                        :key="index"
                        class="stat-card"
                        :class="`stat-card--${stat.accent}`"
                    >
                        <div class="stat-number" :class="`stat-number--${stat.accent}`">
                            {{ animatedWorksValues[index] }}{{ stat.number.includes('+') ? '+' : '' }}
                        </div>
                        <div class="stat-label">{{ stat.label }}</div>
                        <div v-if="stat.sublabel" class="stat-sublabel">{{ stat.sublabel }}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Esports Spotlight Section -->
        <section class="spotlight-section">
            <div class="container">
                <h2 class="section-title">Esports<span class="regions-title-accent"> Spotlight</span></h2>
                <div class="spotlight-grid">
                    <div class="spotlight-column" v-for="category in esportsCategories" :key="category.title">
                        <h3 class="spotlight-title">{{ category.title }}</h3>
                        <ul class="spotlight-list">
                            <li v-for="event in category.events" :key="event">{{ event }}</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Clients & Networks Section -->
        <section id="clients" class="clients-section" :class="{ 'clients-section--visible': clientsVisible }" ref="clientsSectionRef">
            <div class="container">
                <h2 class="section-title">Our<span class="regions-title-accent"> Clients</span> & Networks</h2>
                <div class="clients-grid">
                    <div
                        v-for="(client, index) in clients"
                        :key="client.id || index"
                        class="client-logo"
                        :class="{ 'client-logo--visible': clientsVisible }"
                        :style="{ animationDelay: `${index * 0.5}s` }"
                    >
                        <img v-if="client.image" :src="client.image" :alt="client.name" class="client-image" />
                        <div v-else class="logo-placeholder">{{ client.name }}</div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tournament Gallery Section (MSL Case Study) -->
        <section id="tournament-gallery" class="tournament-gallery-section" :class="{ 'section-inview': galleryVisible }" ref="gallerySectionRef">
            <div class="container">

                <!-- Intro block: title + quote box -->
                <div class="tournament-gallery-intro">
                    <div class="tournament-gallery-intro-text">
                        <h2 class="tournament-gallery-title">Beyond Destiny<br>Seize the Throne</h2>
                        <p class="tournament-gallery-paragraph">We crafted distinct taglines for Season 1 and Season 2 to reflect the evolving journey of the league.</p>
                        <p class="tournament-gallery-paragraph">Season 1 marked the beginning where teams were new, dreams were alive, and everything was possible. It was the first step beyond comfort, beyond limits, and beyond destiny.</p>
                        <p class="tournament-gallery-paragraph">Season 2 is no longer about dreams. It's about dominance. Only the strongest will rise, challenge the champions, and seize their place at the top.</p>
                    </div>
                  
                </div>

                <!-- Photo block: left text, right two large MSL photos -->
                <div class="tournament-gallery-photo-block">
                    <div class="tournament-gallery-photo-text">
                        <h2 class="tournament-gallery-photo-title">MSL MM S1 & S2</h2>
                        <div class="tournament-gallery-year">2025</div>
                        <div class="tournament-gallery-quote-inner">
                            <p>The return of the league after six years – new branding, a new setup, and new possibilities.</p>
                        </div>
                    </div>
                    <div class="tournament-gallery-photo-stack">
                        <img src="/for_landing/msl/msl_2.png" alt="MSL Season 2" />
                    </div>
                </div>

                <!-- Stats block -->
                <div class="tournament-gallery-stats">
                    <div class="tournament-gallery-stat-card">
                        <h3 class="tournament-gallery-stat-title">S1 Viewership</h3>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">130K+</span>
                            <span class="tournament-gallery-stat-label">Highest Peak Viewers</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">17K+</span>
                            <span class="tournament-gallery-stat-label">Average Viewers</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">2.2M+</span>
                            <span class="tournament-gallery-stat-label">Total Watch Hours</span>
                        </div>
                    </div>
                    <div class="tournament-gallery-stat-card">
                        <h3 class="tournament-gallery-stat-title">S2 Viewership</h3>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">98K+</span>
                            <span class="tournament-gallery-stat-label">Highest Peak Viewers</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">32K+</span>
                            <span class="tournament-gallery-stat-label">Average Viewers</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">2.5M+</span>
                            <span class="tournament-gallery-stat-label">Total Watch Hours</span>
                        </div>
                    </div>
                    <div class="tournament-gallery-stat-card">
                        <h3 class="tournament-gallery-stat-title">S1+S2 Performance</h3>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">93M+</span>
                            <span class="tournament-gallery-stat-label">Total Impressions</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">46M+</span>
                            <span class="tournament-gallery-stat-label">Total Video Views</span>
                        </div>
                    </div>
                </div>

                <!-- Gallery grid: MSL photos -->
                <div class="tournament-gallery-grid-wrap">
                    <div class="tournament-gallery-grid">
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_1.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_2.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_3.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_4.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_5.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_6.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_7.png" alt="MSL Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/msl/msl_8.png" alt="MSL Broadcast" /></div>
                    </div>
                  
                </div>

                <div class="tournament-gallery-footer">
                    <span class="tournament-gallery-tagline">From Passion to Impact – We Create the Hype!</span>
                    <span class="tournament-gallery-brand">GCN</span>
                </div>
            </div>
        </section>

        <!-- Tournament Gallery Section (WKS Case Study) -->
        <section id="tournament-gallery-wks" class="tournament-gallery-section" :class="{ 'section-inview': galleryWksVisible }" ref="galleryWksSectionRef">
            <div class="container">
               

                <!-- Intro: key message callout (from 17) -->
                <div class="tournament-gallery-intro">
                    <div class="tournament-gallery-intro-text">
                        <h2 class="tournament-gallery-title">Claim Your Throne</h2>
                        <p class="tournament-gallery-paragraph">8 Regions. Multiple language streams – Myanmar, English, Khmer – distributed across Facebook and YouTube for maximum reach.</p>
                    </div>
                    
                </div>

                <!-- Photo block: left text, right two WKS photos -->
                <div class="tournament-gallery-photo-block">
                    <div class="tournament-gallery-photo-text">
                        <h2 class="tournament-gallery-photo-title">WKS Spring 2025</h2>
                        <div class="tournament-gallery-year">2025</div>
                        <div class="tournament-gallery-quote-inner">
                            <p>The first-ever Wildcard Kings Series for Honor of Kings — a cross-regional online tournament where teams from eight countries competed for a slot at the Esports World Cup.</p>
                            <p>Set up media days across Cambodia, Myanmar, and China for different teams.</p>
                            <p>Beyond photoshoots, we produced a diverse range of content including educational videos, player stories, tips &amp; tricks, and star-building features, resulting in over 20 high-quality video assets.</p>
                        </div>
                    </div>
                    <div class="tournament-gallery-photo-stack">
                        <img src="/for_landing/wks/wks_cover.jpg" alt="WKS Spring 2025" />
                        
                    </div>
                </div>

                <!-- Stats block (from 18) -->
                <div class="tournament-gallery-stats">
                    <div class="tournament-gallery-stat-card">
                        <h3 class="tournament-gallery-stat-title">Viewership</h3>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">6K+</span>
                            <span class="tournament-gallery-stat-label">Highest Peak Viewers</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">20K+</span>
                            <span class="tournament-gallery-stat-label">Total Watch Hours</span>
                        </div>
                    </div>
                    <div class="tournament-gallery-stat-card">
                        <h3 class="tournament-gallery-stat-title">Performance</h3>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">23M+</span>
                            <span class="tournament-gallery-stat-label">Total Impressions</span>
                        </div>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">13M+</span>
                            <span class="tournament-gallery-stat-label">Total Video Views</span>
                        </div>
                    </div>
                    <div class="tournament-gallery-stat-card">
                        <h3 class="tournament-gallery-stat-title">Posts</h3>
                        <div class="tournament-gallery-stat-row">
                            <span class="tournament-gallery-stat-value">500+</span>
                            <span class="tournament-gallery-stat-label">Content pieces</span>
                        </div>
                    </div>
                </div>

                <!-- Gallery grid: WKS photos (from 20 – Broadcast Design) -->
                <div class="tournament-gallery-grid-wrap">
                    <div class="tournament-gallery-grid">
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_1.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_2.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_3.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_4.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_5.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_6.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_7.png" alt="WKS Broadcast" /></div>
                        <div class="tournament-gallery-grid-item"><img src="/for_landing/wks/wks_8.png" alt="WKS Broadcast" /></div>
                    </div>
                    
                </div>

                <div class="tournament-gallery-footer">
                    <span class="tournament-gallery-tagline">From Passion to Impact – We Create the Hype!</span>
                    <span class="tournament-gallery-brand">GCN</span>
                </div>
            </div>
        </section>

        <!-- Tournament Gallery Section (PMMC / PMNC – different UI) -->
        <section id="tournament-gallery-pmmc" class="gallery-pmmc-section" :class="{ 'section-inview': galleryPmmcVisible }" ref="galleryPmmcSectionRef">
            <div class="container">
                <h2 class="gallery-pmmc-heading">PUBG Mobile Championships</h2>
                <p class="gallery-pmmc-subheading">Powered by GCN from Myanmar</p>

                <!-- Card 1: PMMC 2019 – text left, images right -->
                <article class="gallery-pmmc-card gallery-pmmc-card--text-left">
                    <div class="gallery-pmmc-card-content">
                        <p class="gallery-pmmc-label"> PUBG Mobile Myanmar Championship 2019</p>
                        <h3 class="gallery-pmmc-title">PMMC</h3>
                        <span class="gallery-pmmc-year">2019</span>
                        <blockquote class="gallery-pmmc-quote">The first-ever on-ground Myanmar Championship for PUBG Mobile, successfully hosted with 512 teams.</blockquote>
                    </div>
                    <div class="gallery-pmmc-card-media">
                        <img src="/for_landing/pmmc/pmmc_1.png" alt="PMMC 2019" />
                        <img src="/for_landing/pmmc/pmmc_2.png" alt="PMMC 2019" />
                    </div>
                </article>

                <!-- Card 2: PMNC – images left, text right -->
                <article class="gallery-pmmc-card gallery-pmmc-card--text-right">
                    <div class="gallery-pmmc-card-media">
                        <img src="/for_landing/pmmc/pmmc_3.png" alt="PMNC Myanmar" />
                        <img src="/for_landing/pmmc/pmmc_4.png" alt="PMNC Myanmar" />
                    </div>
                    <div class="gallery-pmmc-card-content">
                        <p class="gallery-pmmc-label"> PUBG Mobile National Championship</p>
                        <h3 class="gallery-pmmc-title">PMNC</h3>
                        <span class="gallery-pmmc-year">2022 – 2025</span>
                        <blockquote class="gallery-pmmc-quote">Online tournaments for the national PUBG Mobile championship, successfully managed by GCN from 2022 to the present.</blockquote>
                    </div>
                </article>

                <div class="gallery-pmmc-footer">
                    <span class="gallery-pmmc-tagline">From Passion to Impact – We Create the Hype!</span>
                    <span class="gallery-pmmc-brand">GCN</span>
                </div>
            </div>
        </section>

        <!-- Event Gallery Section (Honor of Kings Myanmar Launch) -->
        <section id="event-gallery" class="event-gallery-section" :class="{ 'section-inview': eventGalleryVisible }" ref="eventGalleryRef">
            <div class="container">
                <p class="event-gallery-label">Honor of Kings Myanmar Launch</p>
                <h2 class="event-gallery-title">Event Gallery</h2>

                <!-- Block 1: Key Visual & Tagline (from 25) -->
                <div class="event-gallery-block event-gallery-block--img-left">
                    <div class="event-gallery-block-media">
                        <img src="/for_landing/hok/hok_cover.png" alt="Honor of Kings Myanmar Launch" />
                    </div>
                    <div class="event-gallery-block-content">
                        <h3 class="event-gallery-block-heading">Key Visual &amp; Tagline</h3>
                        <p>We collaborated with the client to craft a catchy and fun tagline that clearly conveyed the objective message. Leveraging a memorable and impactful word, it quickly gained traction and widespread recognition within the gaming audience.</p>
                        <p>The Key Visual (KV) incorporated local trademarks alongside Honor of Kings' original hero, "Ying." It also featured a clear Call-to-Action (CTA) text, along with download links and a QR code for easy access.</p>
                    </div>
                </div>

                <!-- Block 2: Promotional Video (from 26) -->
                <div class="event-gallery-block event-gallery-block--img-right">
                    <div class="event-gallery-block-content">
                        <h3 class="event-gallery-block-heading">Promotional Video</h3>
                        <p>We produced a promotional video infused with cultural elements to resonate with the local audience's experiences. Featuring a renowned singer and actor, the video garnered over 4 million views across all social media platforms.</p>
                        <p>From the start of pre-production, we carefully planned to incorporate elements of local day-to-day activities and culturally significant items as props, ensuring the content deeply resonated with the audience's experiences and heritage. Additionally, the scripts blended trending internet punchlines with the game's core message, creating a strong connection with the local audience.</p>
                    </div>
                    <div class="event-gallery-block-media">
                        <img src="/for_landing/hok/hok_1.png" alt="HOK Promotional Video" />
                    </div>
                </div>

                <!-- Block 3: OOH Campaign (from 27) -->
                <div class="event-gallery-block event-gallery-block--grid">
                    <div class="event-gallery-block-content">
                        <h3 class="event-gallery-block-heading">OOH Advertising Campaign</h3>
                        <p>We utilized a diverse mix of OOH advertising, including shopping mall LED screens, inside-mall LED screens, bus shelters, and hanging banners, to effectively promote the launch.</p>
                        <p>For the first time in the region, hanging banners were displayed in a renowned mall, featuring different heroes and their unique, catchy taglines. The campaign included 20 parallel banners inside the mall, 16 inside-mall LED screens, one main shopping mall LED screen, and 5 bus shelters strategically located in high-footfall areas frequented by our target audience.</p>
                        <p class="event-gallery-highlight">This comprehensive approach helped us achieve over <strong>65 million impressions</strong>, maximizing visibility and engagement across all channels.</p>
                    </div>
                    <div class="event-gallery-block-media event-gallery-block-media--grid">
                        <img src="/for_landing/hok/hok_2.png" alt="HOK OOH Campaign" />
                        <img src="/for_landing/hok/hok_3.png" alt="HOK OOH Campaign" />
                    </div>
                </div>

                <!-- <div class="event-gallery-footer">
                    <span class="event-gallery-tagline">From Passion to Impact – We Create the Hype!</span>
                    <span class="event-gallery-brand">GCN</span>
                </div> -->
            </div>
        </section>

        <!-- KOL Management Section -->
        <section id="kol-management" class="kol-section" :class="{ 'section-inview': kolVisible }" ref="kolSectionRef">
            <div class="container">
               
                <div class="kol-header">
                    <div class="kol-header-text">
                        <h2 class="kol-title">KOL Management</h2>
                        <span class="kol-year">2024–2025</span>
                        <p class="kol-desc">Since its global launch, we have been collaborating with over 15 KOLs and streamers to maximize Honor of Kings' (HOK) visibility and engagement in the gaming community. One of the key highlights was the KOL All-Star Tournament, where top influencers competed in thrilling matches, driving massive viewership and interaction. This tournament was seamlessly integrated into HOK's ongoing activities, creating excitement and strengthening the game's presence in the market.</p>
                    </div>
                    <div class="kol-grid-wrap">
                        <div class="kol-grid">
                            <div class="kol-avatar" v-for="(kol, index) in kolImages" :key="kol.src">
                                <img :src="kol.src" :alt="kol.alt" />
                            </div>
                        </div>
                        <div class="kol-kpis">
                            <div class="kol-kpi">
                                <span class="kol-kpi-value">2,000+</span>
                                <span class="kol-kpi-label">Content Produced</span>
                            </div>
                            <div class="kol-kpi">
                                <span class="kol-kpi-value">30M+</span>
                                <span class="kol-kpi-label">Video Views</span>
                            </div>
                            <div class="kol-kpi">
                                <span class="kol-kpi-value">2M+</span>
                                <span class="kol-kpi-label">Engagement</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="kol-footer">
                    <span class="kol-tagline">From Passion to Impact – We Create the Hype!</span>
                    <span class="kol-brand">GCN</span>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="contact-section" :class="{ 'section-inview': contactVisible }" ref="contactSectionRef">
            <div class="container">
                <div class="contact-card">
                    <p class="contact-label">Get in Touch</p>
                    <h2 class="contact-title">Ready to <span class="contact-title-accent">Create the Hype?</span></h2>
                    <p class="contact-subtitle">Let's build something amazing together. Whether you're launching a game, building a community, or planning your next tournament — we're here for it.</p>
                    <div class="contact-actions">
                        <a href="mailto:contact@gcn.com" class="contact-btn contact-btn--primary">
                            <span class="contact-btn-text">Get in Touch</span>
                            <span class="contact-btn-icon" aria-hidden="true">→</span>
                        </a>
                        <a href="#" class="contact-btn contact-btn--secondary">
                            <span class="contact-btn-text">View Our Portfolio</span>
                            <span class="contact-btn-icon" aria-hidden="true">→</span>
                        </a>
                    </div>
                    <div class="contact-info">
                        <a href="mailto:hello@gamecastnetwork.com" class="contact-info-item">
                            <span class="contact-info-icon" aria-hidden="true">✉</span>
                            <span>hello@gamecastnetwork.com</span>
                        </a>
                        <span class="contact-info-divider">·</span>
                        <span class="contact-info-item contact-info-tagline">From Passion to Impact – We Create the Hype!</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer-section">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-tagline">From Passion to Impact - We Create the Hype!</div>
                    <div class="footer-brand">GCN</div>
                </div>
                <div class="footer-bottom">
                    <p>&copy; 2026 Game Cast Network. All rights reserved.</p>
                    <div class="footer-links">
                        <RouterLink to="/terms_of_service">Terms of Service</RouterLink>
                        <RouterLink to="/privacy_policy">Privacy Policy</RouterLink>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);
const carouselSectionRef = ref(null);
const liveSectionRef = ref(null);
const liveVisible = ref(false);
const aboutSectionRef = ref(null);
const aboutVisible = ref(false);
const approachSectionRef = ref(null);
const approachVisible = ref(false);
const processSectionRef = ref(null);
const processVisible = ref(false);
const activeProcessStep = ref(null);
const regionsSectionRef = ref(null);
const regionsVisible = ref(false);
const clientsSectionRef = ref(null);
const clientsVisible = ref(false);
const gallerySectionRef = ref(null);
const galleryVisible = ref(false);
const galleryWksSectionRef = ref(null);
const galleryWksVisible = ref(false);
const galleryPmmcSectionRef = ref(null);
const galleryPmmcVisible = ref(false);
const eventGalleryRef = ref(null);
const eventGalleryVisible = ref(false);
const contactSectionRef = ref(null);
const contactVisible = ref(false);
const kolSectionRef = ref(null);
const kolVisible = ref(false);

const kolImages = [
    { src: '/for_landing/kol/pp_01.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_02.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_03.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_04.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_05.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_06.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_07.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_08.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_09.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_10.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_11.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_12.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_13.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_14.png', alt: 'KOL' },
    { src: '/for_landing/kol/pp_15.png', alt: 'KOL' }
];

const processSteps = [
    { title: 'We Know the Game', description: 'We live in the scene. We understand how players think, grind, flex, and compete. From casual gamers to hardcore professionals, we read the culture fast and turn local insight into winning strategies.' },
    { title: 'We Control the Narrative', description: 'Perception is power. With experience across multiple markets and global partners, we position brands to hit hard, cut through noise, and own their space in gaming and Esports.' },
    { title: 'We Rally the Community', description: 'No fake hype. No shortcuts. We build real communities with strong ethics, bold creativity, and player-first execution, fueling game launches, tournaments, and movements people actually care about.' },
    { title: 'We Create the Hype & Make It Last', description: "We don't chase moments. We build momentum. Through marketing, Esports, and live activations, we deliver impact that sticks growth, loyalty, and competitive energy that keeps rolling." }
];

const regions = ref([
    { id: 'myanmar', name: 'Myanmar', image: '/for_landing/myanmar.png' },
    { id: 'thailand', name: 'Thailand', image: '/for_landing/thailand.png' },
    { id: 'cambodia', name: 'Cambodia', image: '/for_landing/cambodia.png' }
]);

const liveUpcomingEvents = ref([
    {
        id: 1,
        status: 'REGISTRATION OPEN',
        statusClass: 'registration',
        bgImage: '/for_landing/live_bg_1.png',
        iconSrc: '/for_landing/trophy.svg',
        title: 'MSL Thailand',
        subtitle: '2026/27 Season',
        detail1: 'Start: APR 2026',
        detail2: 'Open for Thailand',
        detail2Icon: null,
        cta: 'REGISTER NOW',
        liveDot: false
    },
    {
        id: 2,
        status: 'COMING SOON',
        statusClass: 'coming-soon',
        bgImage: '/for_landing/live_bg_2.png',
        iconSrc: '/for_landing/thunder_red.svg',
        title: 'MSL Myanmar Season 3',
        subtitle: '2026 Edition',
        detail1: 'Summer 2026',
        detail2: 'Largest Prize Pool Yet',
        detail2Icon: null,
        cta: 'VIEW DETAILS',
        liveDot: false
    },
    {
        id: 3,
        status: 'LIVE NOW',
        statusClass: 'live-now',
        bgImage: '/for_landing/live_bg_3.png',
        iconSrc: null,
        title: 'MSL Thailand',
        subtitle: '2026 Season',
        detail1: 'Myanmar, Thailand, Cambodia',
        detail2: 'Open Qualifiers: Round 1',
        detail2Icon: null,
        cta: 'REGISTER NOW',
        liveDot: true
    }
]);

const pastComingEvents = ref([
    { id: 'e1', date: 'February 1 - May 17, 2022', name: 'Neymar Campaign', location: null, logoText: 'ML', logoBgColor: '#c44', imageSrc: '/for_landing/naymar.png' },
    { id: 'e2', date: '2023 - 2024', name: 'Spark 20', location: null, logoText: 'ML', logoBgColor: '#4a4a6a', imageSrc: '/for_landing/spark20.png' },
    { id: 'e3', date: 'February 1 - May 17, 2024', name: 'HOK MM Launch', location: 'Yangon', logoText: 'HOK', logoBgColor: '#2a1a3a', imageSrc: '/for_landing/hok/hok_cover.png' },
    { id: 'e4', date: 'December 01 - December 30, 2024', name: 'HOK Xmas Campaign', location: 'Yangon', logoText: 'HOK', logoBgColor: '#4a2020', imageSrc: '/for_landing/xmas.png' },
    { id: 'e5', date: '2022 - 2025', name: 'PMNC', location: null, logoText: 'PUBG', logoBgColor: '#1a1a2a', imageSrc: '/for_landing/pmmc/pmmc_3.png' },
    { id: 'e6', date: '2019', name: 'PMMC', location: null, logoText: 'PUBG', logoBgColor: '#1a1a2a', imageSrc: '/for_landing/pmmc/pmmc_1.png' },
    { id: 'e7', date: 'February 1 - May 17, 2025', name: 'WKS Spring', location: 'Yangon', logoText: 'HOK', logoBgColor: '#1a2a3a', imageSrc: '/for_landing/wks/wks_cover.jpg' },
    { id: 'e8', date: '2025', name: 'MSL MM Season 1 & 2', location: 'Yangon', logoText: 'MSL', logoBgColor: '#1a1a2a', imageSrc: '/for_landing/msl/msl_4.png' },
   
]);

// Duplicate events for seamless infinite marquee
const carouselEventsDoubled = computed(() => {
    const events = pastComingEvents.value;
    return [...events, ...events];
});

const handleScroll = () => {
    isScrolled.value = window.scrollY > 50;
};

const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
    isMobileMenuOpen.value = false;
};

const observerOptions = { rootMargin: '0px 0px -80px 0px', threshold: 0.1 };

const SEO_TITLE = 'Game Cast Network | Full-Service Gaming & Esports Solutions';
const SEO_DESCRIPTION = 'Full-service gaming and esports solutions provider. Building ecosystems that connect publishers, players, creators, and communities across Myanmar, Cambodia, and Thailand. From Passion to Impact – We Create the Hype!';

onMounted(() => {
    document.title = SEO_TITLE;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', SEO_DESCRIPTION);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', SEO_TITLE);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', SEO_DESCRIPTION);

    window.addEventListener('scroll', handleScroll);
    if (typeof IntersectionObserver === 'undefined') return;

    const observeSection = (el, visibleRef) => {
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    visibleRef.value = entry.isIntersecting;
                });
            },
            observerOptions
        );
        observer.observe(el);
    };

    observeSection(liveSectionRef.value, liveVisible);
    if (!liveSectionRef.value) liveVisible.value = true;

    observeSection(aboutSectionRef.value, aboutVisible);
    if (!aboutSectionRef.value) aboutVisible.value = true;

    observeSection(approachSectionRef.value, approachVisible);
    if (!approachSectionRef.value) approachVisible.value = true;

    observeSection(processSectionRef.value, processVisible);
    if (!processSectionRef.value) processVisible.value = true;

    observeSection(gallerySectionRef.value, galleryVisible);
    if (!gallerySectionRef.value) galleryVisible.value = true;

    observeSection(galleryWksSectionRef.value, galleryWksVisible);
    if (!galleryWksSectionRef.value) galleryWksVisible.value = true;

    observeSection(galleryPmmcSectionRef.value, galleryPmmcVisible);
    if (!galleryPmmcSectionRef.value) galleryPmmcVisible.value = true;

    observeSection(eventGalleryRef.value, eventGalleryVisible);
    if (!eventGalleryRef.value) eventGalleryVisible.value = true;

    observeSection(contactSectionRef.value, contactVisible);
    if (!contactSectionRef.value) contactVisible.value = true;

    observeSection(kolSectionRef.value, kolVisible);
    if (!kolSectionRef.value) kolVisible.value = true;

    const regionsEl = regionsSectionRef.value;
    if (regionsEl) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    regionsVisible.value = entry.isIntersecting;
                });
            },
            { rootMargin: '0px 0px -60px 0px', threshold: 0.2 }
        );
        observer.observe(regionsEl);
    } else {
        regionsVisible.value = true;
    }
    const clientsEl = clientsSectionRef.value;
    if (clientsEl) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    clientsVisible.value = entry.isIntersecting;
                });
            },
            { rootMargin: '0px 0px -80px 0px', threshold: 0.15 }
        );
        observer.observe(clientsEl);
    } else {
        clientsVisible.value = true;
    }
    const worksEl = worksSectionRef.value;
    if (worksEl) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    worksVisible.value = entry.isIntersecting;
                    if (entry.isIntersecting) {
                        animatedWorksValues.value = [0, 0, 0, 0];
                        animateWorksNumbers();
                    }
                });
            },
            { rootMargin: '0px 0px -80px 0px', threshold: 0.2 }
        );
        observer.observe(worksEl);
    } else {
        worksVisible.value = true;
        animatedWorksValues.value = [70, 20, 3, 15];
    }
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const teamMembers = ref([
    { name: 'Yone Fang', title: 'CEO', photo: '/for_landing/people/pp_06.png' },
    { name: 'Sai Kaung', title: 'Operation Director', photo: '/for_landing/people/pp_05.png' },
    { name: 'Ye Thu', title: 'Marketing & Strategic Director', photo: '/for_landing/people/pp_02.png' },
    { name: 'Min Gaung', title: 'Creative Director', photo: '/for_landing/people/pp_04.png' },
    { name: 'Matt', title: 'Business Development Manager', photo: '/for_landing/people/pp_03.png' },
    { name: 'Bob', title: 'Broadcast Director', photo: '/for_landing/people/pp_01.png' }
]);

const worksSectionRef = ref(null);
const worksVisible = ref(false);
const worksAnimated = ref(false);
const animatedWorksValues = ref([0, 0, 0, 0]);

const worksStats = ref([
    { number: '70+', label: 'Esports Tournaments', sublabel: 'Since 2016', accent: 'green' },
    { number: '20+', label: 'Marketing Campaigns', sublabel: 'Successfully Executed', accent: 'gold' },
    { number: '3', label: 'Retainer', sublabel: '(including KOL, Social Media and Community Management)', accent: 'green' },
    { number: '15+', label: 'Content Campaigns', sublabel: 'Audience-driven content campaigns for gaming, esports, and digital communities.', accent: 'blue' }
]);

function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/*
  This function animates the numbers shown in the "works" statistics section, giving a smooth counting-up effect.

  1. First, it determines the target numbers to count to by extracting numeric values from each stat (removing any "+" symbol and converting to numbers).
  2. It sets the total animation time (duration) to 1400 milliseconds (1.4 seconds).
  3. It records the animation's start time using performance.now().
  4. The inner function `update` is repeatedly called by requestAnimationFrame:
      - It calculates how much time has elapsed since the animation started.
      - It calculates progress (from 0 to 1) using how far the elapsed time is into the duration.
      - It applies an "ease out expo" easing function so numbers increase quickly at first and slow down at the end.
      - It updates the animatedWorksValues array, calculating the animated value for each stat based on progress.
      - If progress isn't finished (<1), it requests the next animation frame, so the numbers keep animating.
  5. The animation is kicked off by calling requestAnimationFrame(update), causing the numbers to start counting up.
*/
function animateWorksNumbers() {
    // Get the numeric target values for each stat, e.g. "70+" turns to 70
    const targets = worksStats.value.map((stat) => parseInt(stat.number.replace(/\+/g, ''), 10) || 0);
    // Animation duration in milliseconds
    const duration = 1400;
    // Timestamp when animation starts
    const startTime = performance.now();

    // Animation frame handler
    function update(currentTime) {
        // Time elapsed since animation started
        const elapsed = currentTime - startTime;
        // Progress value from 0 (start) to 1 (end)
        const progress = Math.min(elapsed / duration, 1);
        // Easing for smooth effect
        const eased = easeOutExpo(progress);

        // Update current animated values for display
        animatedWorksValues.value = targets.map((target) => Math.round(eased * target));

        // Continue animating if not done
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    // Start the animation
    requestAnimationFrame(update);
}

const expertiseServices = ref([
    'Event Management',
    'Social Media and Campaign Management',
    'Video Games and Esports Marketing',
    'Talent Management',
    'Business Development',
    'Strategy and Consultation',
    'Content Development and Localization',
    'Production'
]);

const esportsCategories = ref([
    {
        title: 'ESPORTS LEAGUE',
        events: [
            'MPL Season 3', 'MPL Season 4', 'MPL Season 5',
            'MSL MM Season 1', 'V-Code Play-In', 'MSL MM Season 2',
            'MSL TH Season 1', 'MSL MM Season 3'
        ]
    },
    {
        title: 'NATIONAL CHAMPIONSHIP',
        events: [
            'PMMC 2019', 'PMNC MM 2020', 'PMNC MM Season 2',
            'PMNC MM 2022', 'PMNC MM 2023 Spring', 'PMNC MM 2024 Spring',
            'PMNC MM 2024 Fall', 'PMNC KH 2024 Fall', 'PMNC MM 2025 Summer',
            'PMNC MM 2025 Fall', 'HOK KCC 2024', 'HOK NYC 2025'
        ]
    },
    {
        title: 'NATIONAL QUALIFIERS',
        events: [
            'Hyperplay MM Qualifier 2018 (LOL)', 'DUC 2018 MM Qualifier (Dota 2)',
            'MSC 2018 MM Qualifier', 'MSC 2022 MM Qualifier', 'M4 MM Qualifier',
            'MSC 2023 MM Qualifier', 'M5 MM Qualifier', 'MSC 2024 MM Qualifier',
            'M6 MM Qualifier', 'MWI 2025 MM Qualifier', 'V-Road to MSL'
        ]
    },
    {
        title: "INT'L TOURNAMENT & REBROADCAST",
        events: [
            'WKS Spring 2025', 'SEA Games 2019', 'M1 World Championship', 'MPLI',
            'WCC 2020 (PUBGM, MLBB)', 'One Esports MPLI', 'M2 World Championship',
            'MSC 2022', 'M4 World Championship', 'MSC 2023', 'M5 World Championship',
            'MSC 2024 x EWC', 'M6 World Championship', 'MSC 2025 x EWC', 'MWI 2025 x EWC',
            'M7 World Championship', 'V-code MY Championship 2026'
        ]
    }
]);

const clients = ref([
    { id: 12, name: 'Grab', image: '/for_landing/clients/Clients12.png' },
    { id: 1, name: 'MOBILE LEGENDS BANG BANG', image: '/for_landing/clients/Clients01.png' },
    { id: 2, name: 'HONOR OF KINGS', image: '/for_landing/clients/Clients02.png' },
    { id: 3, name: 'PUBG MOBILE', image: '/for_landing/clients/Clients03.png' },
    
    { id: 5, name: 'KBZ Pay', image: '/for_landing/clients/Clients05.png' },
    { id: 6, name: 'HUAWEI', image: '/for_landing/clients/Clients06.png' },
    { id: 7, name: 'AYA PAY', image: '/for_landing/clients/Clients07.png' },
    { id: 8, name: 'AGB COMMUNICATION', image: '/for_landing/clients/Clients08.png' },
    { id: 9, name: 'Power Flash', image: '/for_landing/clients/Clients09.png' },
    { id: 10, name: 'MPT', image: '/for_landing/clients/Clients10.png' },
    { id: 11, name: 'oppo', image: '/for_landing/clients/Clients11.png' },
    
    { id: 13, name: 'CODE', image: '/for_landing/clients/Clients13.png' },
   
    { id: 15, name: 'ENERVON-C', image: '/for_landing/clients/Clients15.png' },
    { id: 16, name: 'REMAX', image: '/for_landing/clients/Clients16.png' },
    { id: 17, name: 'Rangoon cineplex', image: '/for_landing/clients/Clients17.png' },
    { id: 18, name: 'Rakuten Viber', image: '/for_landing/clients/Clients18.png' },
    { id: 19, name: 'Rexona', image: '/for_landing/clients/Clients19.png' },
    { id: 20, name: 'HONOR', image: '/for_landing/clients/Clients20.png' },
    { id: 21, name: 'M', image: '/for_landing/clients/Clients21.png' },
    { id: 22, name: 'MYANMAR EXPO', image: '/for_landing/clients/Clients22.png' },
    { id: 23, name: 'KBZ BANK', image: '/for_landing/clients/Clients23.png' },
    { id: 24, name: 'Tonamel', image: '/for_landing/clients/Clients24.png' },
    { id: 25, name: 'SKY NET', image: '/for_landing/clients/Clients25.png' },
    { id: 26, name: "POND'S MEN", image: '/for_landing/clients/Clients26.png' },
    { id: 27, name: 'CLEAR MEN', image: '/for_landing/clients/Clients27.png' },
    { id: 28, name: 'ATOM', image: '/for_landing/clients/Clients28.png' },
    { id: 29, name: 'HYPE ENERGY DRINKS', image: '/for_landing/clients/Clients29.png' },
    { id: 30, name: 'msi', image: '/for_landing/clients/Clients30.png' },
    { id: 31, name: 'Red Bull', image: '/for_landing/clients/Clients31.png' },
    { id: 32, name: '+ More Brands', image: '/for_landing/clients/Clients32.png' }
]);
</script>

<style lang="scss" scoped>
// Variables
$color-primary: #D4F845; // GCN Green
$color-secondary: #379CFF;
$color-dark: #0a0a12;
$color-darker: #020210;
$color-text: #ffffff;
$color-text-muted: #b0b0c0;
$nav-height: 80px;

.esports-landing {
    background-color: $color-dark;
    color: $color-text;
    min-height: 100vh;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

// Navigation
.landing-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: $nav-height;
    z-index: 1000;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba($color-dark, 0.8);
    backdrop-filter: blur(10px);

    &.scrolled {
        background: rgba($color-darker, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }

    .nav-container {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .nav-left {
        display: flex;
        align-items: center;
        gap: 40px;
    }

    .nav-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;

        .nav-logo-img {
            height: 50px;
            width: auto;
            object-fit: contain;
        }

        .logo-text {
            font-weight: 700;
            font-size: 0.9rem;
            line-height: 1.2;
            color: white;
        }
    }

    .mobile-menu-btn {
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 6px;
        width: 44px;
        height: 44px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        border-radius: 10px;
        transition: transform 0.2s ease, background 0.2s ease;

        &:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        &:active {
            transform: scale(0.92);
            background: rgba(255, 255, 255, 0.12);
        }

        @media (max-width: 960px) {
            display: flex;
        }
    }

    .mobile-menu-btn-bar {
        display: block;
        width: 22px;
        height: 2px;
        background: white;
        border-radius: 1px;
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .mobile-menu-btn--open {
        .mobile-menu-btn-bar:nth-child(1) {
            transform: translateY(8px) rotate(45deg);
        }

        .mobile-menu-btn-bar:nth-child(2) {
            opacity: 0;
        }

        .mobile-menu-btn-bar:nth-child(3) {
            transform: translateY(-8px) rotate(-45deg);
        }
    }

    .nav-links {
        display: flex;
        gap: 32px;

        @media (max-width: 960px) {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background: rgba($color-dark, 0.95);
            flex-direction: column;
            padding: 20px;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        &.active {
            @media (max-width: 960px) {
                display: flex;
            }
        }

        .nav-link {
            color: $color-text-muted;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
            font-size: 0.95rem;

            &:hover {
                color: $color-primary;
            }
        }
    }

    .nav-right {
        display: flex;
        align-items: center;

        @media (max-width: 960px) {
            display: flex;
        }
    }
}

// Hero Section
.hero-section {
    padding-top: calc(140px + #{$nav-height});
    padding-bottom: 140px;
    background-image: url('/for_landing/hero.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    text-align: center;
    position: relative;
    overflow: hidden;
    min-height: 420px;

    @media (max-width: 768px) {
        padding-top: calc(100px + #{$nav-height});
        padding-bottom: 80px;
        min-height: 380px;
        background-size: cover;
        background-position: center 30%;
    }

    @media (max-width: 480px) {
        padding-top: calc(80px + #{$nav-height});
        padding-bottom: 60px;
        min-height: 340px;
        background-position: center 25%;
    }

    .container {
        position: relative;
        z-index: 2;
        padding-left: 24px;
        padding-right: 24px;

        @media (max-width: 480px) {
            padding-left: 16px;
            padding-right: 16px;
        }
    }

    .hero-content {
        max-width: 900px;
        margin: 0 auto;
    }

    .hero-title {
        font-size: clamp(2rem, 6vw, 4.5rem);
        font-weight: 800;
        margin-bottom: 24px;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: white;
        text-shadow: 0 2px 10px rgba(0,0,0,0.5);

        @media (max-width: 768px) {
            font-size: 2.25rem;
            margin-bottom: 18px;
        }

        @media (max-width: 480px) {
            font-size: 1.75rem;
            margin-bottom: 14px;
        }
    }

    .hero-subtitle {
        font-size: 1.35rem;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 40px;
        line-height: 1.6;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
        text-shadow: 0 1px 5px rgba(0,0,0,0.5);

        @media (max-width: 768px) {
            font-size: 1.1rem;
            margin-bottom: 32px;
            line-height: 1.55;
        }

        @media (max-width: 480px) {
            font-size: 0.95rem;
            margin-bottom: 24px;
            line-height: 1.5;
        }
    }

    .hero-buttons {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16px;

        @media (max-width: 480px) {
            flex-direction: column;
            gap: 12px;
        }

        .btn {
            padding: 16px 36px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);

            @media (max-width: 480px) {
                padding: 14px 28px;
                font-size: 1rem;
                width: 100%;
                max-width: 280px;
                margin: 0 auto;
            }

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.4);
            }

            &-primary {
                background: $color-primary;
                color: $color-darker;
            }

            &-secondary {
                background: rgba(255,255,255,0.15);
                border: 2px solid rgba(255,255,255,0.5);
                color: white;
                backdrop-filter: blur(5px);

                &:hover {
                    background: rgba(255,255,255,0.25);
                    border-color: white;
                }
            }
        }
    }
}

// Live & Upcoming Events Section
.live-upcoming-section {
    padding: 80px 0 100px;
    position: relative;
    overflow: hidden;
}

.live-upcoming-bg {
    position: absolute;
    inset: 0;
    background-image: url('/for_landing/live_section_background.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
}

.live-upcoming-section .container {
    position: relative;
    z-index: 1;
}

.live-upcoming-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 40px;
    flex-wrap: wrap;
    gap: 16px;
}

.live-upcoming-powered {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    color: $color-text-muted;
    margin: 0 0 8px;
}

.powered-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
}

.live-upcoming-title {
    font-size: 2.5rem;
    font-weight: 800;
    color: white;
    letter-spacing: 0.02em;
    margin: 0;
}

.live-upcoming-view-all {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    transition: color 0.2s;

    &:hover {
        color: $color-primary;
    }
}

.live-upcoming-view-all-icon {
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.live-upcoming-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
    }
}

.live-card {
    position: relative;
    border-radius: 16px;
    padding: 28px 24px 32px;
    min-height: 416px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    text-align: left;
}

.live-card-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

.live-card-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    border-radius: 16px;
    pointer-events: none;
}

.live-card.registration .live-card-overlay {
    background: linear-gradient(180deg, #0E1C3ACC 0%, #0E1C3ACC 100%);
}

.live-card.coming-soon .live-card-overlay {
    background: linear-gradient(180deg, #3A0E0FCC 0%, #3A0E0FCC 100%);
}

.live-card.live-now .live-card-overlay {
    background: linear-gradient(180deg, #0E3A1ACC 0%, #0E3A1ACC 100%);
}

.live-card-badge {
    position: relative;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 16px;
    width: fit-content;
}

.live-card.registration .live-card-badge {
    background: rgba(230, 180, 50, 0.95);
    color: #020210;
}

.live-card.coming-soon .live-card-badge {
    background: rgba(200, 80, 100, 0.9);
    color: white;
}

.live-card.live-now .live-card-badge {
    background: rgba(46, 157, 106, 0.95);
    color: white;
}

.live-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #e05050;
    margin-right: 6px;
    flex-shrink: 0;
    animation: live-pulse 1.5s ease-in-out infinite;
}

.live-card-corner-icon {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 2;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    img, .globe-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
    }

    .globe-icon {
        color: #2e9d6a;
    }
}

.live-card-title {
    position: relative;
    z-index: 2;
    font-size: 1.35rem;
    font-weight: 800;
    color: white;
    margin: 0 0 6px;
    letter-spacing: 0.02em;
}

.live-card.coming-soon .live-card-title {
    color: white;
}

.live-card-subtitle {
    position: relative;
    z-index: 2;
    font-size: 0.95rem;
    margin: 0 0 20px;
}

.live-card.registration .live-card-subtitle {
    color: #7eb8ff;
}

.live-card.coming-soon .live-card-subtitle {
    color: #ff8888;
}

.live-card.live-now .live-card-subtitle {
    color: #6ee89e;
}

.live-card-details {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 20px;
}

.live-card-detail {
    display: flex;
    align-items: center;
    gap: 8px;

    .detail-icon {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
    }
}

.live-card-footer {
    position: relative;
    z-index: 2;
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    margin: auto 0 20px 0;
    letter-spacing: 0.03em;
}

.live-card-cta {
    position: relative;
    z-index: 2;
    width: 100%;
    padding: 14px 20px;
    border-radius: 12px;
    border: none;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    cursor: pointer;
    color: white;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    }

    &.registration {
        background: #379CFF;
    }

    &.coming-soon {
        background: transparent;
        border: 2px solid #c44;
        color: white;

        &:hover {
            background: rgba(204, 68, 68, 0.2);
        }
    }

    &.live-now {
        background: #2e9d6a;
    }
}

@keyframes live-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

// Past & Coming Events Carousel (infinite marquee, image + overlay cards)
.events-carousel-section {
    padding: 100px 0 0px;
    position: relative;
    overflow: hidden;
}

.events-carousel-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, $color-dark 0%, $color-darker 100%);
    z-index: 0;
}

.events-carousel-header {
    position: relative;
    z-index: 1;
    text-align: center;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 32px;
    letter-spacing: 0.02em;
}

.events-carousel-rocket {
    display: inline-block;
    margin-left: 6px;
    vertical-align: middle;
    font-size: 1rem;
}

.events-carousel-track-wrapper {
    position: relative;
    z-index: 1;
    width: 100%;
    overflow: hidden;
    mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
}

.events-carousel-track {
    display: flex;
    gap: 24px;
    width: max-content;
    padding: 16px 0 24px;
    animation: eventsMarquee 50s linear infinite;
}

.events-carousel-track:hover {
    animation-play-state: paused;
}

@keyframes eventsMarquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.event-carousel-card {
    flex: 0 0 380px;
    min-height: 200px;
    display: flex;
    flex-direction: row;
    border-radius: 14px;
    overflow: hidden;
    cursor: default;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    transition: transform 0.25s ease, box-shadow 0.25s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
    }
}

.event-carousel-card-image {
    flex: 0 0 45%;
    min-width: 0;
    position: relative;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
}

.event-card-image-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    position: absolute;
    inset: 0;
}

.event-card-image-text {
    position: relative;
    z-index: 1;
    font-size: 1rem;
    font-weight: 800;
    color: white;
    text-align: center;
    padding: 0 12px;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.event-carousel-card-overlay {
    flex: 1;
    min-width: 0;
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(90deg, rgba(14, 28, 58, 0.92) 0%, rgba(27, 29, 44, 0.98) 100%);
}

.event-carousel-date {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.4;
}

.event-carousel-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: white;
    margin: 0;
    line-height: 1.35;
}

.event-carousel-location {
    font-size: 0.82rem;
    color: rgba(255, 255, 255, 0.7);
    display: flex;
    align-items: center;
    gap: 6px;
}

.event-carousel-pin {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

// Section Styles
section {
    padding: 100px 0;
    position: relative;
}

.section-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 60px;
    color: white;
}

// Scroll-in view animation (runs every time section enters viewport)
@keyframes scrollReveal {
    from {
        opacity: 0;
        transform: translateY(28px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// About Section
.about-section {
    background: $color-dark;
}

.about-section .about-content {
    opacity: 0;
    transform: translateY(28px);
}

.about-section.section-inview .about-content {
    animation: scrollReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.about-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 40px;
    }
}

.about-text {
    max-width: 540px;

    @media (max-width: 960px) {
        max-width: none;
        order: 2;
    }
}

.about-heading {
    font-size: 3rem;
    font-weight: 700;
    color: white;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
    line-height: 1.15;

    @media (max-width: 768px) {
        font-size: 2.25rem;
    }
}

.about-heading-accent {
    color: $color-primary;
}

.about-tagline {
    font-size: 1.15rem;
    font-weight: 400;
    font-style: italic;
    color: rgba(255, 255, 255, 0.85);
    margin: 0 0 32px;
    line-height: 1.5;
}

.about-body {
    p {
        font-size: 1.05rem;
        line-height: 1.8;
        color: $color-text-muted;
        margin: 0 0 20px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

.about-image {
    @media (max-width: 960px) {
        order: 1;
    }

    img {
        width: 100%;
        height: auto;
        border-radius: 12px;
        display: block;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
    }
}

// Our Approach Section
.approach-section {
    position: relative;
    overflow: hidden;
}

.approach-section .approach-title,
.approach-section .approach-subtitle {
    opacity: 0;
    transform: translateY(24px);
}

.approach-section .approach-grid {
    opacity: 0;
    transform: translateY(24px);
}

.approach-section .approach-tagline-wrap {
    opacity: 0;
    transform: translateY(24px);
}

.approach-section.section-inview .approach-title {
    animation: scrollReveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.approach-section.section-inview .approach-subtitle {
    animation: scrollReveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s forwards;
}

.approach-section.section-inview .approach-grid {
    animation: scrollReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.14s forwards;
}

.approach-section.section-inview .approach-tagline-wrap {
    animation: scrollReveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) 0.22s forwards;
}

.approach-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(30, 25, 20, 0.95) 0%, $color-dark 25%, rgba(15, 25, 45, 0.98) 50%, rgba(10, 30, 35, 0.98) 100%);
    z-index: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 80% 50% at 20% 50%, rgba(55, 156, 255, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 80% at 80% 80%, rgba(212, 248, 69, 0.06) 0%, transparent 50%);
        pointer-events: none;
    }
}

.approach-section .container {
    position: relative;
    z-index: 1;
}

.approach-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 12px;
    letter-spacing: -0.02em;
    line-height: 1.2;

    @media (max-width: 768px) {
        font-size: 2rem;
    }
}

.approach-title-accent {
    color: $color-primary;
}

.approach-subtitle {
    font-size: 1.2rem;
    font-weight: 400;
    font-style: italic;
    color: white;
    margin: 0 0 48px;
    line-height: 1.5;

    @media (max-width: 768px) {
        font-size: 1.1rem;
        margin-bottom: 36px;
    }
}

.approach-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: start;
    margin-bottom: 48px;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 32px;
        margin-bottom: 40px;
    }
}

.approach-main {
    .approach-lead {
        font-size: 1.5rem;
        font-weight: 400;
        color: white;
        line-height: 1.85;
        margin: 0;
    }
}

.approach-cards {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.approach-card {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 28px 32px;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease;

    p {
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.85;
        color: rgba(255, 255, 255, 0.92);
        margin: 0;
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba($color-primary, 0.4);
        border-color: rgba($color-primary, 0.35);
        background: rgba(0, 0, 0, 0.55);

        p {
            color: rgba(255, 255, 255, 0.9);
        }
    }
}

.approach-tagline-wrap {
    text-align: center;
}

.approach-tagline {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 20px 40px;
    background: rgba(0, 0, 0, 0.45);
    border: 2px solid $color-primary;
    border-radius: 16px;
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease;

    &:hover {
        background: rgba(0, 0, 0, 0.6);
        border-color: $color-primary;
        box-shadow: 0 8px 32px rgba($color-primary, 0.3);
        transform: scale(1.02);
    }
}

.approach-tagline-text {
    font-size: 1.15rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
}

.approach-tagline-accent {
    font-size: 1.15rem;
    font-weight: 700;
    color: $color-primary;
    margin-left: 2px;
}

// How We Process Section
.process-section {
    background: $color-darker;
    padding: 100px 0 80px;
    position: relative;
}

.process-label {
    color: $color-text-muted;
    font-size: 0.9rem;
    margin: 0 0 8px;
}

.process-title {
    font-size: clamp(2.25rem, 4vw, 3rem);
    font-weight: 800;
    color: white;
    margin: 0 0 56px;
    letter-spacing: -0.02em;
    line-height: 1.15;
}

.process-title-accent {
    color: $color-primary;
}

.process-steps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 28px;
    margin-bottom: 56px;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 48px;
    }
}

.process-step {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 32px 28px;
    text-align: center;
    cursor: default;
    opacity: 0;
    transform: translateY(24px);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;

    &:hover,
    &.process-step--active {
        border-color: rgba($color-primary, 0.4);
        box-shadow: 0 12px 40px rgba($color-primary, 0.12);
        background: rgba($color-primary, 0.04);
        transform: translateY(-6px);

        .process-step-icon {
            color: $color-primary;
            transform: scale(1.08);
        }

        .process-step-title {
            color: $color-primary;
        }
    }
}

.process-section.section-inview .process-step {
    animation: scrollReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    @for $i from 0 through 3 {
        &:nth-child(#{$i + 1}) {
            animation-delay: #{$i * 0.1}s;
        }
    }
}

.process-step-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    border: 2px solid rgba($color-primary, 0.35);
    color: rgba($color-primary, 0.9);
    transition: color 0.3s ease, transform 0.3s ease;

    svg {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
    }
}

.process-step-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: white;
    margin: 0 0 14px;
    line-height: 1.3;
    transition: color 0.3s ease;
}

.process-step-desc {
    font-size: 0.95rem;
    line-height: 1.7;
    color: $color-text-muted;
    margin: 0;
}

.process-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    @media (max-width: 600px) {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
}

.process-tagline {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-style: italic;
}

.process-brand {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-weight: 600;
}

// Regions Section
.regions-section {
    background: $color-dark;
}

.regions-title-accent {
    color: $color-primary;
}

.regions-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 24px;
    }
}

.region-card {
    text-align: center;
    opacity: 0;
    transform: translateY(28px);

    .regions-section--visible & {
        animation: regionReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
}

@keyframes regionReveal {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.region-map {
    position: relative;
    height: 600px;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 20px;
    cursor: pointer;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease;

    &:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba($color-primary, 0.4);

        .region-overlay {
            opacity: 0.85;
        }

        .region-label {
            opacity: 1;
            transform: scale(1.05);
        }
    }
}

.region-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.5s ease;

    .region-map:hover & {
        transform: scale(1.08);
    }
}

.region-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%);
    opacity: 0.6;
    transition: opacity 0.4s ease;
    pointer-events: none;
}

.region-label {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.6);
    opacity: 0.95;
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
}

.region-name {
    font-size: 1.35rem;
    font-weight: 600;
    color: white;
    margin: 0;
    transition: color 0.3s ease;

    .region-card:hover & {
        color: $color-primary;
    }
}

// Team Section
.team-section {
    background: linear-gradient(180deg, $color-dark 0%, $color-darker 100%);

    .team-header {
        margin-bottom: 60px;
    }

    .team-subtitle {
        color: $color-text-muted;
        font-size: 0.9rem;
        margin-bottom: 8px;
    }

    .team-title {
        font-size: 4rem;
        font-weight: 800;
        color: white;
        margin-bottom: 24px;
    }

    .team-description {
        font-size: 1.1rem;
        line-height: 1.7;
        color: $color-text-muted;
        max-width: 600px;
    }

    .team-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 40px;

        @media (max-width: 900px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 600px) {
            grid-template-columns: 1fr;
        }
    }

    .team-member {
        text-align: center;

        .member-photo {
            width: 200px;
            height: 200px;
            margin: 0 auto 20px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid $color-primary;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            &:hover {
                border-color: rgba($color-primary, 0.9);
                box-shadow: 0 0 24px rgba($color-primary, 0.3);

                img {
                    transform: scale(1.15);
                }
            }
        }

        .member-name {
            font-size: 1.25rem;
            font-weight: 600;
            color: white;
            margin-bottom: 8px;
        }

        .member-title {
            color: $color-text-muted;
            font-size: 0.95rem;
        }
    }
}

// Expertise Section
.expertise-section {
    background: $color-darker;

    .expertise-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .expertise-item {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        background: rgba(255,255,255,0.03);
        border-radius: 12px;
        border-left: 4px solid $color-primary;
        transition: all 0.3s;

        &:hover {
            background: rgba(255,255,255,0.05);
            transform: translateX(10px);
        }

        .service-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: $color-primary;
            min-width: 50px;
        }

        .service-name {
            font-size: 1.1rem;
            color: $color-text-muted;
        }
    }
}

// Works Section
.works-section {
    position: relative;
    overflow: hidden;
}

.works-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #0a0a18 0%, #0d1220 40%, #0a0e18 100%);
    z-index: 0;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.4), transparent),
            radial-gradient(2px 2px at 40% 70%, rgba(255,255,255,0.3), transparent),
            radial-gradient(2px 2px at 60% 20%, rgba(255,255,255,0.35), transparent),
            radial-gradient(2px 2px at 80% 50%, rgba(255,255,255,0.25), transparent),
            radial-gradient(2px 2px at 30% 80%, rgba(255,255,255,0.3), transparent);
        background-size: 200% 200%;
        opacity: 0.8;
        pointer-events: none;
    }

    &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        height: 40%;
        background: radial-gradient(ellipse at center, rgba($color-primary, 0.06) 0%, transparent 70%);
        pointer-events: none;
    }
}

.works-section .container {
    position: relative;
    z-index: 1;
}

.works-title {
    font-size: 3rem;
    font-weight: 700;
    color: white;
    text-align: center;
    margin: 0 0 12px;
    letter-spacing: -0.02em;

    &::after {
        content: '';
        display: block;
        width: 120px;
        height: 4px;
        background: $color-primary;
        margin: 16px auto 0;
        border-radius: 2px;
    }

    @media (max-width: 768px) {
        font-size: 2.25rem;
    }
}

.works-subtitle {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.85);
    text-align: center;
    margin: 0 0 56px;
    line-height: 1.6;
    max-width: 700px;
    margin-left: auto;
    margin-right: auto;

    @media (max-width: 768px) {
        font-size: 1rem;
        margin-bottom: 40px;
    }
}

.works-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;

    @media (max-width: 1024px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
        gap: 20px;
    }
}

.stat-card {
    background: rgba(20, 22, 32, 0.9);
    border-radius: 16px;
    padding: 36px 28px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.35s ease;

    &:hover {
        transform: translateY(-8px);
        border-color: rgba(255, 255, 255, 0.15);
    }

    &--green:hover {
        box-shadow: 0 16px 40px rgba($color-primary, 0.25), 0 0 0 1px rgba($color-primary, 0.2);
    }

    &--gold:hover {
        box-shadow: 0 16px 40px rgba(230, 180, 50, 0.25), 0 0 0 1px rgba(230, 180, 50, 0.2);
    }

    &--blue:hover {
        box-shadow: 0 16px 40px rgba(55, 156, 255, 0.25), 0 0 0 1px rgba(55, 156, 255, 0.2);
    }
}

.stat-number {
    font-size: 3.5rem;
    font-weight: 800;
    margin-bottom: 12px;
    line-height: 1.1;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);

    .stat-card:hover & {
        transform: scale(1.08);
    }

    &--green {
        color: $color-primary;
    }

    &--gold {
        color: #e6b432;
    }

    &--blue {
        color: #379cff;
    }
}

.stat-label {
    font-size: 1.2rem;
    color: white;
    font-weight: 600;
    margin-bottom: 8px;
}

.stat-sublabel {
    font-size: 0.9rem;
    color: $color-text-muted;
    line-height: 1.4;
}

// Spotlight Section
.spotlight-section {
    background: $color-darker;

    .spotlight-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 30px;

        @media (max-width: 1200px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .spotlight-column {
        background: rgba($color-primary, 0.05);
        border-left: 4px solid $color-primary;
        padding: 30px 20px;
        border-radius: 12px;

        .spotlight-title {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-size: 0.9rem;
            font-weight: 700;
            color: $color-primary;
            margin-bottom: 20px;
            transform: rotate(180deg);
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .spotlight-list {
            list-style: none;
            padding: 0;
            margin: 0;

            li {
                color: $color-text-muted;
                font-size: 0.9rem;
                line-height: 1.8;
                margin-bottom: 8px;
                padding-left: 20px;
                position: relative;

                &::before {
                    content: '•';
                    position: absolute;
                    left: 0;
                    color: $color-primary;
                }
            }
        }
    }
}

// Clients Section
.clients-section {
    background: $color-dark;
}

.clients-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 24px;

    @media (max-width: 1200px) {
        grid-template-columns: repeat(4, 1fr);
    }

    @media (max-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
    }

    @media (max-width: 600px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
}

.client-logo {
    aspect-ratio: 1;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow: hidden;
    position: relative;
    opacity: 0;
    transform: scale(0.85) translateY(20px);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, border-color 0.3s ease, box-shadow 0.3s ease;

    .clients-section--visible & {
        animation: clientReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba($color-primary, 0) 0%, rgba($color-primary, 0.15) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
    }

    &:hover {
        transform: translateY(-8px) scale(1.05);
        border-color: rgba($color-primary, 0.5);
        box-shadow: 0 12px 32px rgba($color-primary, 0.2), 0 0 0 2px rgba($color-primary, 0.3);
        background: rgba(255, 255, 255, 0.08);

        &::before {
            opacity: 1;
        }

        .client-image {
            transform: scale(1.1);
            filter: brightness(1.15);
        }
    }
}

.clients-section--visible .client-logo--visible {
    opacity: 1;
    transform: scale(1) translateY(0);
}

@keyframes clientReveal {
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.client-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    position: relative;
    z-index: 0;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease;
}

.logo-placeholder {
    font-size: 0.7rem;
    color: $color-text-muted;
    text-align: center;
    line-height: 1.3;
    position: relative;
    z-index: 0;
}

// Tournament Gallery Section (MSL Case Study)
.tournament-gallery-section {
    background: $color-darker;
    padding: 100px 0 80px;
    position: relative;

    .container {
        max-width: 1200px;
    }
}

.tournament-gallery-label {
    color: $color-text-muted;
    font-size: 0.9rem;
    margin: 0 0 40px;
}

.tournament-gallery-intro {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 48px;
    align-items: start;
    margin-bottom: 80px;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 32px;
        margin-bottom: 60px;
    }
}

.tournament-gallery-intro-text {
    opacity: 0;
    transform: translateY(28px);
}

.tournament-gallery-section.section-inview .tournament-gallery-intro-text {
    animation: scrollReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.tournament-gallery-title {
    font-size: clamp(2.5rem, 5vw, 4rem);
    font-weight: 800;
    color: white;
    margin: 0 0 32px;
    line-height: 1.15;
    letter-spacing: -0.02em;
}

.tournament-gallery-paragraph {
    font-size: 1rem;
    line-height: 1.75;
    color: $color-text-muted;
    margin: 0 0 20px;

    &:last-child {
        margin-bottom: 0;
    }
}

.tournament-gallery-quote-box {
    background: white;
    border-radius: 16px;
    padding: 32px 40px;
    min-width: 280px;
    text-align: center;
    opacity: 0;
    transform: translateY(28px);

    p {
        font-size: 1.2rem;
        line-height: 1.5;
        margin: 0 0 12px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

.tournament-gallery-section.section-inview .tournament-gallery-quote-box {
    animation: scrollReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.12s forwards;
}

.quote-green {
    color: #569D57;
    font-weight: 600;
}

.quote-teal {
    color: #3A877B;
    font-weight: 500;
}

.tournament-gallery-photo-block {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 64px;
    align-items: start;
    margin-bottom: 80px;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 40px;
        margin-bottom: 60px;
    }
}

.tournament-gallery-photo-text {
    opacity: 0;
    transform: translateY(28px);
}

.tournament-gallery-section.section-inview .tournament-gallery-photo-text {
    animation: scrollReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.tournament-gallery-photo-title {
    font-size: 3rem;
    font-weight: 800;
    color: white;
    margin: 0 0 20px;
    line-height: 1.1;
    letter-spacing: -0.02em;

    @media (max-width: 768px) {
        font-size: 2.25rem;
    }
}

.tournament-gallery-year {
    display: inline-block;
    padding: 8px 20px;
    background: rgba($color-primary, 0.1);
    border: 2px solid $color-primary;
    border-radius: 8px;
    color: $color-primary;
    font-weight: 600;
    margin-bottom: 24px;
}

.tournament-gallery-quote-inner {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px 28px;

    p {
        font-size: 1.1rem;
        line-height: 1.7;
        color: white;
        font-style: italic;
        margin: 0;

        & + p {
            margin-top: 14px;
        }
    }
}

.tournament-gallery-photo-stack {
    display: flex;
    flex-direction: column;
    gap: 24px;
    opacity: 0;
    transform: translateY(28px);

    img {
        width: 100%;
        height: auto;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: block;
    }
}

.tournament-gallery-section.section-inview .tournament-gallery-photo-stack {
    animation: scrollReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
}

.tournament-gallery-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 80px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        margin-bottom: 60px;
    }
}

.tournament-gallery-stat-card {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 28px 24px;
    opacity: 0;
    transform: translateY(24px);
}

.tournament-gallery-section.section-inview .tournament-gallery-stat-card {
    animation: scrollReveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    @for $i from 0 through 2 {
        &:nth-child(#{$i + 1}) {
            animation-delay: #{$i * 0.1}s;
        }
    }
}

.tournament-gallery-stat-title {
    font-size: 1rem;
    font-weight: 600;
    color: $color-text-muted;
    margin: 0 0 20px;
}

.tournament-gallery-stat-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 16px;

    &:last-child {
        margin-bottom: 0;
    }
}

.tournament-gallery-stat-value {
    font-size: 1.75rem;
    font-weight: 800;
    color: white;
}

.tournament-gallery-stat-label {
    font-size: 0.9rem;
    color: $color-text-muted;
}

.tournament-gallery-grid-wrap {
    margin-bottom: 48px;
}

.tournament-gallery-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
    }
}

.tournament-gallery-grid-item {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.08);
    opacity: 0;
    transform: translateY(20px);

    img {
        width: 100%;
        height: auto;
        display: block;
        object-fit: cover;
        aspect-ratio: 4/3;
    }
}

.tournament-gallery-section.section-inview .tournament-gallery-grid-item {
    animation: scrollReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    @for $i from 0 through 7 {
        &:nth-child(#{$i + 1}) {
            animation-delay: #{$i * 0.06}s;
        }
    }
}

.tournament-gallery-subtitle {
    text-align: center;
    color: $color-text-muted;
    font-size: 1rem;
    margin: 0;
}

.tournament-gallery-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    @media (max-width: 600px) {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
}

.tournament-gallery-tagline {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-style: italic;
}

.tournament-gallery-brand {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-weight: 600;
}

// PMMC/PMNC Gallery Section (different UI: card-based, alternating)
.gallery-pmmc-section {
    background: linear-gradient(180deg, #0d0d14 0%, #12121a 50%, #0a0a12 100%);
    padding: 100px 0 80px;
    position: relative;
}

.gallery-pmmc-heading {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    color: white;
    text-align: center;
    margin: 0 0 8px;
    letter-spacing: -0.02em;
}

.gallery-pmmc-subheading {
    text-align: center;
    color: $color-text-muted;
    font-size: 1rem;
    margin: 0 0 56px;
}

.gallery-pmmc-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    padding: 48px 56px;
    margin-bottom: 32px;
    opacity: 0;
    transform: translateY(32px);
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:last-of-type {
        margin-bottom: 48px;
    }

    &:hover {
        border-color: rgba($color-primary, 0.25);
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
    }

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 32px;
        padding: 32px 24px;

        &.gallery-pmmc-card--text-right .gallery-pmmc-card-media {
            order: -1;
        }
    }
}

.gallery-pmmc-section.section-inview .gallery-pmmc-card {
    animation: scrollReveal 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    &:nth-child(3) {
        animation-delay: 0.1s;
    }

    &:nth-child(5) {
        animation-delay: 0.2s;
    }
}

.gallery-pmmc-card-content {
    min-width: 0;
}

.gallery-pmmc-label {
    color: $color-text-muted;
    font-size: 0.85rem;
    margin: 0 0 16px;
}

.gallery-pmmc-title {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 800;
    color: white;
    margin: 0 0 16px;
    letter-spacing: -0.03em;
    line-height: 1;
}

.gallery-pmmc-year {
    display: inline-block;
    padding: 8px 18px;
    background: rgba($color-primary, 0.12);
    border: 1px solid rgba($color-primary, 0.5);
    border-radius: 8px;
    color: $color-primary;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 24px;
}

.gallery-pmmc-quote {
    font-size: 1.05rem;
    line-height: 1.75;
    color: rgba(255, 255, 255, 0.88);
    font-style: italic;
    margin: 0;
    padding: 0;
    border: none;
}

.gallery-pmmc-card-media {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;

    img {
        width: 100%;
        height: auto;
        border-radius: 14px;
        display: block;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }
}

.gallery-pmmc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    @media (max-width: 600px) {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
}

.gallery-pmmc-tagline {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-style: italic;
}

.gallery-pmmc-brand {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-weight: 600;
}

// Event Gallery Section (Honor of Kings Myanmar Launch)
.event-gallery-section {
    background: #0b0b10;
    padding: 100px 0 80px;
    position: relative;
}

.event-gallery-label {
    color: $color-text-muted;
    font-size: 0.9rem;
    margin: 0 0 12px;
}

.event-gallery-title {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    color: white;
    margin: 0 0 56px;
    letter-spacing: -0.02em;
}

.event-gallery-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: start;
    margin-bottom: 72px;
    opacity: 0;
    transform: translateY(28px);

    &:last-of-type {
        margin-bottom: 56px;
    }

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 32px;
        margin-bottom: 56px;

        &.event-gallery-block--img-right .event-gallery-block-media {
            order: -1;
        }

        &.event-gallery-block--grid .event-gallery-block-media {
            order: -1;
        }
    }
}

.event-gallery-section.section-inview .event-gallery-block {
    animation: scrollReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;

    &:nth-child(3) {
        animation-delay: 0.08s;
    }

    &:nth-child(5) {
        animation-delay: 0.16s;
    }

    &:nth-child(7) {
        animation-delay: 0.24s;
    }
}

.event-gallery-block-content {
    min-width: 0;
    padding-top: 8px;
}

.event-gallery-block-heading {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid rgba($color-primary, 0.5);
    letter-spacing: -0.02em;
}

.event-gallery-block-content p {
    font-size: 1.05rem;
    line-height: 1.8;
    color: rgba(255, 255, 255, 0.88);
    margin: 0 0 16px;

    &:last-child {
        margin-bottom: 0;
    }
}

.event-gallery-highlight {
    margin-top: 20px !important;
    padding: 16px 20px;
    background: rgba($color-primary, 0.08);
    border-left: 4px solid $color-primary;
    border-radius: 0 10px 10px 0;

    strong {
        color: $color-primary;
    }
}

.event-gallery-block-media {
    min-width: 0;

    img {
        width: 100%;
        height: auto;
        border-radius: 16px;
        display: block;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
    }
}

.event-gallery-block-media--grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    @media (max-width: 600px) {
        grid-template-columns: 1fr;
    }
}

.event-gallery-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    @media (max-width: 600px) {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
}

.event-gallery-tagline {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-style: italic;
}

.event-gallery-brand {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-weight: 600;
}

// KOL Management Section
.kol-section {
    background: $color-darker;
    padding: 100px 0 80px;
    position: relative;
}

.kol-label {
    color: $color-text-muted;
    font-size: 0.9rem;
    margin: 0 0 12px;
}

.kol-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: start;
    margin-bottom: 48px;

    @media (max-width: 960px) {
        grid-template-columns: 1fr;
        gap: 40px;
        margin-bottom: 40px;
    }
}

.kol-header-text {
    min-width: 0;
    opacity: 0;
    transform: translateY(28px);
}

.kol-section.section-inview .kol-header-text {
    animation: scrollReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.kol-title {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    color: white;
    margin: 0 0 16px;
    letter-spacing: -0.02em;
    line-height: 1.15;
}

.kol-year {
    display: inline-block;
    padding: 8px 20px;
    background: rgba($color-primary, 0.12);
    border: 2px solid $color-primary;
    border-radius: 8px;
    color: $color-primary;
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 24px;
}

.kol-desc {
    font-size: 1.05rem;
    line-height: 1.75;
    color: $color-text-muted;
    margin: 0;
}

.kol-grid-wrap {
    min-width: 0;
    opacity: 0;
    transform: translateY(28px);
}

.kol-section.section-inview .kol-grid-wrap {
    animation: scrollReveal 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) 0.12s forwards;
}

.kol-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;

    @media (max-width: 640px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
    }
}

.kol-avatar {
    position: relative;
    aspect-ratio: 1;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid rgba(255, 255, 255, 0.08);
    transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;

    &:hover {
        border-color: $color-primary;
        transform: scale(1.08);
        box-shadow: 0 8px 24px rgba($color-primary, 0.25);
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
}

.kol-kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.kol-kpi {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 20px;
    text-align: center;
    transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;

    &:hover {
        border-color: rgba($color-primary, 0.3);
        background: rgba($color-primary, 0.06);
        box-shadow: 0 8px 24px rgba($color-primary, 0.1);
    }
}

.kol-kpi-value {
    display: block;
    font-size: 1.75rem;
    font-weight: 800;
    color: $color-primary;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
}

.kol-kpi-label {
    font-size: 0.9rem;
    color: $color-text-muted;
}

.kol-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    @media (max-width: 600px) {
        flex-direction: column;
        gap: 12px;
        text-align: center;
    }
}

.kol-tagline {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-style: italic;
}

.kol-brand {
    font-size: 0.9rem;
    color: $color-text-muted;
    font-weight: 600;
}

// Contact Section
.contact-section {
    background: $color-darker;
    padding: 100px 0 100px;
    position: relative;
}

.contact-card {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 24px;
    padding: 56px 48px 48px;
    opacity: 0;
    transform: translateY(28px);
    transition: border-color 0.35s ease, box-shadow 0.35s ease;

    &:hover {
        border-color: rgba($color-primary, 0.2);
        box-shadow: 0 20px 60px rgba($color-primary, 0.08);
    }

    @media (max-width: 640px) {
        padding: 40px 24px 36px;
    }
}

.contact-section.section-inview .contact-card {
    animation: scrollReveal 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.contact-label {
    font-size: 0.9rem;
    color: $color-primary;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 12px;
}

.contact-title {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    color: white;
    margin: 0 0 20px;
    letter-spacing: -0.02em;
    line-height: 1.15;
}

.contact-title-accent {
    color: $color-primary;
}

.contact-subtitle {
    font-size: 1.1rem;
    line-height: 1.7;
    color: $color-text-muted;
    margin: 0 0 36px;
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
}

.contact-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 40px;

    @media (max-width: 480px) {
        flex-direction: column;
    }
}

.contact-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 32px;
    border-radius: 50px;
    font-size: 1.05rem;
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease, color 0.25s ease;
    border: 2px solid transparent;

    &:hover {
        transform: translateY(-3px) scale(1.02);
    }

    &:focus-visible {
        outline: 2px solid $color-primary;
        outline-offset: 4px;
    }

    &--primary {
        background: $color-primary;
        color: $color-darker;
        box-shadow: 0 4px 20px rgba($color-primary, 0.35);

        &:hover {
            box-shadow: 0 12px 32px rgba($color-primary, 0.45);
            background: lighten($color-primary, 4%);
        }
    }

    &--secondary {
        background: transparent;
        color: white;
        border-color: rgba($color-primary, 0.5);

        &:hover {
            border-color: $color-primary;
            background: rgba($color-primary, 0.1);
            color: $color-primary;
            box-shadow: 0 8px 24px rgba($color-primary, 0.2);
        }
    }
}

.contact-btn-icon {
    font-size: 1.2rem;
    transition: transform 0.25s ease;
}

.contact-btn:hover .contact-btn-icon {
    transform: translateX(4px);
}

.contact-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px 16px;
    padding-top: 32px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.contact-info-item {
    font-size: 0.95rem;
    color: $color-text-muted;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: color 0.25s ease;

    &:hover {
        color: $color-primary;
    }
}

.contact-info-icon {
    opacity: 0.9;
}

.contact-info-divider {
    color: rgba(255, 255, 255, 0.2);
    font-weight: 300;
}

.contact-info-tagline {
    font-style: italic;
    cursor: default;
}

// Footer
.footer-section {
    background: $color-darker;
    padding: 60px 0 40px;
    border-top: 1px solid rgba(255,255,255,0.1);

    .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 40px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        margin-bottom: 40px;

        @media (max-width: 600px) {
            flex-direction: column;
            gap: 20px;
            text-align: center;
        }

        .footer-tagline {
            color: white;
            font-size: 1.1rem;
        }

        .footer-brand {
            font-size: 2rem;
            font-weight: 700;
            color: $color-primary;
        }
    }

    .footer-bottom {
        text-align: center;
        color: $color-text-muted;
        font-size: 0.9rem;

        .footer-links {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            justify-content: center;
            margin-top: 14px;

            a {
                color: rgba(255,255,255,0.82);
                font-weight: 600;
                text-decoration: none;
                transition: color 0.2s ease;

                &:hover {
                    color: $color-primary;
                }
            }
        }
    }
}

// Responsive (global overrides; hero-section has its own responsive rules)
@media (max-width: 960px) {
    .section-title {
        font-size: 2.5rem;
    }
}

@media (max-width: 600px) {
    .section-title {
        font-size: 2rem;
    }
}
</style>
