<template>
    <div class="esports-landing">
        <nav class="landing-nav" :class="{ 'scrolled': isScrolled }">
            <div class="container nav-container">
                <div class="nav-left">
                    <div class="nav-brand">
                        <span class="logo-icon">🎮</span>
                        <span class="logo-text">Esports Manager</span>
                    </div>
                    <div class="nav-links" :class="{ 'active': isMobileMenuOpen }">
                        <a href="#features" class="nav-link" @click="isMobileMenuOpen = false">Features</a>
                        <a href="#sports" class="nav-link" @click="isMobileMenuOpen = false">Sports</a>
                        <a href="#pricing" class="nav-link" @click="isMobileMenuOpen = false">Pricing</a>
                        <!-- Mobile-only actions -->
                        <div class="mobile-actions">
                            <button class="btn-login mobile-nav-btn" @click="isMobileMenuOpen = false">Login</button>
                            <button class="btn-cta mobile-nav-btn" @click="isMobileMenuOpen = false">Organize event</button>
                        </div>
                    </div>
                </div>
                <div class="nav-right">
                    <button class="btn-text desktop-only">Explore events</button>
                    <button class="btn-login desktop-only">Login</button>
                    <button class="btn-cta desktop-only">Organize event</button>
                    <button class="mobile-menu-btn" @click="isMobileMenuOpen = !isMobileMenuOpen">
                        ☰
                    </button>
                </div>
            </div>
        </nav>

        <section class="hero-section">
            <div class="hero-overlay"></div>
            <div class="container">
                <div class="hero-content">
                    <h1 class="hero-title">Organize esports tournaments and leagues they’ll never forget</h1>
                    <p class="hero-subtitle">
                        Manage teams, create match schedules, and share live results in one powerful and easy-to-use platform designed for esports.
                    </p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary">Organize Event</button>
                        <button class="btn btn-secondary">Explore Events</button>
                    </div>
                </div>
            </div>
        </section>

        <section id="features" class="features-section">
            <div class="container">
                <div class="section-header u-center-text">
                    <h2 class="section-title">Everything you need to run a great tournament</h2>
                    <p class="section-subtitle">No more spreadsheets. Choose your format, enjoy smart scheduling, and automate referee assignment.</p>
                </div>
                
                <div class="features-grid">
                    <div class="feature-card" v-for="(feature, index) in features" :key="index">
                        <div class="feature-icon">
                            <span class="icon-text">{{ feature.icon }}</span>
                        </div>
                        <h3 class="feature-title">{{ feature.title }}</h3>
                        <p class="feature-description">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="showcase-section">
            <div class="container">
                <div class="showcase-content">
                    <h2 class="section-title">Present your tournament, your way</h2>
                    <p class="section-subtitle">Enable players and fans to follow the action live on a beautifully designed website, app, and stream overlay.</p>
                    
                    <div class="showcase-tabs">
                        <span class="tab active">Website</span>
                        <span class="tab">Stream Overlay</span>
                        <span class="tab">App</span>
                    </div>

                    <div class="showcase-display">
                        <!-- Placeholder for visual showcase -->
                        <div class="display-mockup">
                             <div class="bracket-preview">
                                 <div class="match-line">
                                     <div class="team">Team Liquid</div>
                                     <div class="score">2</div>
                                 </div>
                                 <div class="match-line">
                                     <div class="team">G2 Esports</div>
                                     <div class="score">1</div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section ref="eventsRef" class="past-events-section" :class="{ 'animate-in': eventsInView }">
            <div class="background-shape"></div>
            <div class="container">
                <div class="u-center-text u-margin-bottom-medium">
                    <h2 class="section-title text-white">Powered by Game Cast Network 🚀</h2>
                </div>
                
                <div class="events-scroller">
                    <div class="events-track">
                        <!-- Double the events for infinite scroll effect -->
                        <div class="event-card" v-for="(event, index) in [...pastEvents, ...pastEvents]" :key="index">
                            <div class="card-image" :style="{ backgroundImage: `url(${event.image})` }">
                                <div class="card-overlay"></div>
                            </div>
                            <div class="card-content">
                                <div class="event-date">{{ event.date }}</div>
                                <h3 class="event-title">{{ event.title }}</h3>
                                <div class="event-location">
                                    <span class="location-icon">📍</span> {{ event.location }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="services-scroll-section">
            <div class="container">
                <div class="services-intro u-center-text u-margin-bottom-big">
                    <h2 class="section-title">Our Services</h2>
                    <p class="section-subtitle">Comprehensive solutions for the esports ecosystem</p>
                </div>
                
                <div class="services-list">
                    <div 
                        class="service-block" 
                        v-for="(service, index) in servicesWithDetails" 
                        :key="index"
                        ref="serviceRefs"
                    >
                        <div class="service-content">
                            <h2 class="service-title" v-html="service.titleHtml"></h2>
                            <p class="service-desc">{{ service.description }}</p>
                            <button class="service-btn">{{ service.cta }}</button>
                        </div>
                        <div class="service-visual">
                            <img :src="service.image" :alt="service.title" loading="lazy" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="about-us-section">
            <div class="container">
                <div class="about-content">
                    <div class="about-header u-center-text">
                        <h2 class="section-title">About <span class="highlight">GCN</span></h2>
                        <p class="section-subtitle">From Passion to Impact – We Create the Hype!</p>
                    </div>
                    
                    <div class="about-grid">
                        <div class="about-card">
                            <h3>Our Origin</h3>
                            <p>Founded in 2016, GCN began as a Facebook-based gaming and broadcasting channel and has since evolved into a full-service gaming and esports solutions provider. Between 2016 and 2024, GCN has successfully organized 45+ esports tournaments and executed 30+ gaming-focused marketing campaigns and community activities, playing a key role in shaping Myanmar’s gaming and esports ecosystem.</p>
                        </div>
                        <div class="about-card">
                            <h3>Our Approach</h3>
                            <p>GCN’s approach extends beyond competition. We focus on building and growing gaming ecosystems by connecting publishers, players, creators, and communities through strategic marketing, community development, and structured competitive programs.</p>
                        </div>
                        <div class="about-card">
                            <h3>Market Expertise</h3>
                            <p>By combining deep local market knowledge, a strong understanding of player behavior, and experience working with international partners, GCN effectively manages key audience perception across both casual gaming and competitive esports segments.</p>
                        </div>
                        <div class="about-card">
                            <h3>Sustainable Value</h3>
                            <p>Adherence to strong ethical standards, combined with creative and community-first execution, enables GCN to deliver sustainable value for partners by supporting game launches, audience engagement, and competitive community growth through marketing and esports.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section id="sports" class="trusted-section">
             <div class="container u-center-text">
                <h2 class="section-title">Trusted by organizers at every level</h2>
                <div class="logos-grid">
                    <div class="logo-item">Pro League</div>
                    <div class="logo-item">Community Cup</div>
                    <div class="logo-item">Varsity Esports</div>
                    <div class="logo-item">Local LAN</div>
                </div>
             </div>
        </section>

        <footer class="footer-section">
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-col">
                        <h4>Product</h4>
                        <ul>
                            <li>Features</li>
                            <li>Pricing</li>
                            <li>Case Studies</li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Sports</h4>
                        <ul>
                            <li>FPS</li>
                            <li>MOBA</li>
                            <li>Battle Royale</li>
                            <li>Fighting Games</li>
                        </ul>
                    </div>
                    <div class="footer-col">
                        <h4>Company</h4>
                        <ul>
                            <li>About Us</li>
                            <li>Contact</li>
                            <li>Terms</li>
                        </ul>
                    </div>
                </div>
                <div class="footer-bottom">
                    &copy; 2026 Esports Manager. All rights reserved.
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue';
import useIntersectionObserver from '@/helper/utility';

const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

const eventsRef = useTemplateRef('eventsRef');
const eventsInView = useIntersectionObserver(eventsRef, { threshold: 0.1 });

const handleScroll = () => {
    isScrolled.value = window.scrollY > 50;
};

onMounted(() => {
    window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});

const features = ref([
    {
        title: "Team & Player Management",
        description: "Centralize all roster information in one secure workspace. Verify player identities and manage substitutes easily.",
        icon: "👥"
    },
    {
        title: "Flexible Tournament Formats",
        description: "Build any structure: Single Elimination, Double Elimination, Round Robin, Swiss, or custom hybrid formats.",
        icon: "🏆"
    },
    {
        title: "Drag & Drop Scheduling",
        description: "Plan matches with full flexibility. Auto-schedule based on availability or drag and drop to customize.",
        icon: "📅"
    },
    {
        title: "Referee Management",
        description: "Assign referees to matches efficiently or allow teams to report their own scores with dispute resolution tools.",
        icon: "⚖️"
    },
    {
        title: "Online Registration",
        description: "Launch a custom sign-up page with built-in payment support for entry fees.",
        icon: "📝"
    },
    {
        title: "Live Scorekeeping",
        description: "Update scores in real-time. Changes reflect instantly on the public bracket and stream overlays.",
        icon: "⚡"
    }
]);

const pastEvents = ref([
    {
        title: "North West Region National Schools Qualifiers 2026",
        date: "January 31 - February 1, 2026",
        location: "GB",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "Snowbowl 2026",
        date: "January 31 - February 1, 2026",
        location: "Kriens, CH",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "OilQuick Cup 2026",
        date: "January 30 - February 1, 2026",
        location: "Iggesund, SE",
        image: "https://images.unsplash.com/photo-1511882150382-421056c89033?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "TR10 Cup 2026",
        date: "January 31 - February 1, 2026",
        location: "Prague, CZ",
        image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "MicroCup 2026 1.0",
        date: "January 31 - February 1, 2026",
        location: "Copenhagen, DK",
        image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600"
    },
    {
        title: "Premier League Cup 2025/26",
        date: "February 1 - May 17, 2026",
        location: "England, GB",
        image: "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&q=80&w=600"
    }
]);

const servicesWithDetails = ref([
    {
        title: "Event Management",
        titleHtml: "Event <span class='highlight'>Management</span>",
        description: "From venue selection to live stage production, we handle end-to-end tournament operations to deliver unforgettable experiences.",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800",
        cta: "Plan Your Event"
    },
    {
        title: "Social Media & Campaign Management",
        titleHtml: "Social Media & <span class='highlight'>Campaigns</span>",
        description: "Engage your community with tailored content strategies and data-driven social media campaigns that resonate with gamers.",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800",
        cta: "Boost Engagement"
    },
    {
        title: "Video Games & Esports Marketing",
        titleHtml: "Esports <span class='highlight'>Marketing</span>",
        description: "Connect your brand with the esports audience through authentic partnerships, sponsorships, and creative activations.",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
        cta: "Market Your Game"
    },
    {
        title: "Talent Management",
        titleHtml: "Talent <span class='highlight'>Management</span>",
        description: "Representing and developing the next generation of esports pros, casters, and content creators.",
        image: "https://images.unsplash.com/photo-1528731708534-1c6692984243?auto=format&fit=crop&q=80&w=800",
        cta: "Discover Talent"
    },
    {
        title: "Strategy & Consultation",
        titleHtml: "Strategy & <span class='highlight'>Consultation</span>",
        description: "Expert guidance on entering the esports market, tournament structuring, and sustainable business modeling.",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
        cta: "Get Consulted"
    },
    {
        title: "Business Development",
        titleHtml: "Business <span class='highlight'>Development</span>",
        description: "Forging strategic partnerships and unlocking new revenue streams for teams, organizers, and brands.",
        image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=800",
        cta: "Grow Business"
    },
    {
        title: "Content Development & Localization",
        titleHtml: "Content & <span class='highlight'>Localization</span>",
        description: "Creating high-quality broadcast content and localizing games for diverse global audiences.",
        image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=800",
        cta: "Create Content"
    }
]);

const serviceRefs = useTemplateRef('serviceRefs');

onMounted(() => {
    // Intersection Observer for Service Blocks
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                // Remove class to reset animation when out of view
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0.2 });

    if (serviceRefs.value) {
        // Handle array of refs or single ref depending on Vue version/setup
        const elements = Array.isArray(serviceRefs.value) ? serviceRefs.value : [serviceRefs.value];
        elements.forEach(el => observer.observe(el));
    }
    
    // Also scroll listener
    window.addEventListener('scroll', handleScroll);
});
</script>

<style lang="scss" scoped>
// Variables
$color-primary: #8475FF;
$color-secondary: #379CFF;
$color-dark: #121212;
$color-darker: #0a0a12;
$color-text: #ffffff;
$color-text-muted: #cccccc;
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

.u-center-text {
    text-align: center;
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
        // Allow growing to push mobile button to right if needed, but flex-between handles it mostly
    }

    .nav-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        font-size: 1.25rem;
        color: white;
        cursor: pointer;

        .logo-icon {
            font-size: 1.5rem;
        }
        
        @media (max-width: 600px) {
            font-size: 1.1rem;
            .logo-text { display: none; } // Hide text on very small screens if needed
            .logo-icon { font-size: 1.8rem; }
        }
    }

    .mobile-menu-btn {
        display: none;
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;

        @media (max-width: 960px) {
            display: block;
            margin-left: auto; // Push to right if inside flex container
        }
    }

    .nav-links {
        display: flex;
        gap: 24px;

        @media (max-width: 960px) {
            display: none; // Default hidden on mobile
        }

        &.active {
            display: flex;
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

        .nav-link {
            color: $color-text-muted;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
            font-size: 0.95rem;
            padding: 10px 0; // Better touch target

            &:hover {
                color: white;
            }
        }

        .mobile-actions {
            display: none;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            margin-top: 16px;
            border-top: 1px solid rgba(255,255,255,0.1);
            padding-top: 16px;

            @media (max-width: 960px) {
                display: flex;
            }

            .mobile-nav-btn {
                width: 100%;
                justify-content: center;
                padding: 12px;
            }
        }
    }

    .nav-right {
        display: flex;
        align-items: center;
        gap: 16px;

        @media (max-width: 600px) {
            gap: 8px;
        }

        button {
            cursor: pointer;
            font-weight: 600;
            border: none;
            transition: all 0.2s;
            font-size: 0.9rem;
        }

        .btn-text {
            background: none;
            color: white;
            &:hover { opacity: 0.8; }
        }

        .btn-login {
            background: none;
            color: white;
            padding: 8px 16px;
            &:hover { color: $color-primary; }
        }

        .btn-cta {
            background: $color-primary;
            color: white;
            padding: 10px 24px;
            border-radius: 50px;
            
            &:hover {
                background: lighten($color-primary, 5%);
                transform: translateY(-1px);
            }
        }
    }
}

// Hero Section
.hero-section {
    padding-top: calc(180px + #{$nav-height}); // Increased top padding for better centering
    padding-bottom: 180px; // Increased bottom padding
    background-image: url('@/assets/image/banner.jpg');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    text-align: center;
    position: relative;
    overflow: hidden;

    .hero-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7); // Black transparent overlay
        z-index: 0;
    }

    &::before {
        // Keeping the SVG pattern but making it more subtle
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 100%;
        background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIvPjwvc3ZnPg==');
        opacity: 0.3;
        z-index: 0;
    }

    .container {
        position: relative;
        z-index: 2; // Ensure content is above overlay
    }

    .hero-content {
        max-width: 900px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
    }

    .hero-title {
        font-size: 4.5rem; // Slightly larger title for impact
        font-weight: 800;
        margin-bottom: 24px;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: white; // Solid white text for better contrast on image
        text-shadow: 0 2px 10px rgba(0,0,0,0.5); // Text shadow for readability
        // Removed gradient text as it might be hard to read over image
    }

    .hero-subtitle {
        font-size: 1.35rem; // Slightly larger subtitle
        color: rgba(255, 255, 255, 0.9); // Brighter text for contrast
        margin-bottom: 40px;
        line-height: 1.6;
        max-width: 700px; // Slightly wider
        margin-left: auto;
        margin-right: auto;
        text-shadow: 0 1px 5px rgba(0,0,0,0.5);
    }

    .hero-buttons {
        display: flex;
        justify-content: center;
        gap: 20px;

        .btn {
            padding: 16px 36px; // Larger buttons
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); // Add shadow to buttons

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.4);
            }

            &-primary {
                background: $color-primary;
                color: white;
            }

            &-secondary {
                background: rgba(255,255,255,0.15); // Slightly more opaque
                border: 2px solid rgba(255,255,255,0.5); // Thicker border
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

// Features Section
.features-section {
    padding: 120px 0;
    background-color: $color-darker;
    position: relative;

    .section-header {
        margin-bottom: 80px;
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 16px;
        }

        .section-subtitle {
            font-size: 1.1rem;
            color: $color-text-muted;
            max-width: 600px;
            margin: 0 auto;
        }
    }

    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 30px;
    }

    .feature-card {
        background: lighten($color-darker, 3%);
        padding: 40px 30px;
        border-radius: 24px;
        transition: all 0.3s;
        border: 1px solid transparent;

        &:hover {
            transform: translateY(-5px);
            background: lighten($color-darker, 5%);
            border-color: rgba($color-primary, 0.3);
        }

        .feature-icon {
            width: 60px;
            height: 60px;
            background: rgba($color-secondary, 0.1);
            border-radius: 16px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;

            .icon-text {
                font-size: 1.8rem;
            }
        }

        .feature-title {
            font-size: 1.25rem;
            margin-bottom: 12px;
            font-weight: 600;
            color: white;
        }

        .feature-description {
            color: $color-text-muted;
            line-height: 1.6;
            font-size: 0.95rem;
        }
    }
}

// Showcase Section
.showcase-section {
    padding: 120px 0;
    background: linear-gradient(180deg, $color-darker 0%, #1a1a2e 100%);
    text-align: center;

    .showcase-tabs {
        display: inline-flex;
        padding: 4px;
        background: rgba(255,255,255,0.05);
        border-radius: 50px;
        margin: 40px 0 60px;

        .tab {
            padding: 10px 24px;
            border-radius: 40px;
            cursor: pointer;
            color: $color-text-muted;
            font-weight: 500;
            transition: all 0.3s;
            
            &.active {
                background: $color-primary;
                color: white;
                box-shadow: 0 4px 12px rgba($color-primary, 0.3);
            }

            &:hover:not(.active) {
                color: white;
            }
        }
    }

    .display-mockup {
        background: #1e1e24;
        max-width: 900px;
        height: 500px;
        margin: 0 auto;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 8px solid #2a2a35;
        box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
        position: relative;
        overflow: hidden;

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.05) 50%, transparent 60%);
            animation: shine 3s infinite;
        }

        .bracket-preview {
            display: flex;
            flex-direction: column;
            gap: 16px;
            z-index: 2;
            
            .match-line {
                background: #2a2a35;
                padding: 16px 24px;
                border-radius: 8px;
                width: 280px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-left: 4px solid $color-secondary;

                .team {
                    font-weight: 600;
                }

                .score {
                    background: rgba(255,255,255,0.1);
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-family: monospace;
                }
            }
        }
    }
}

// Past Events Section
.past-events-section {
    padding: 100px 0 160px 0;
    // Blue/Purple Gradient Background
    background: linear-gradient(135deg, #4c1d95 0%, #2563eb 100%);
    position: relative;
    overflow: hidden;
    opacity: 0;
    transform: translateY(50px);
    transition: all 0.8s ease-out;

    &.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    // Slanted decoration
    .background-shape {
        position: absolute;
        top: -50px;
        left: -10%;
        width: 120%;
        height: 100px;
        background: $color-darker; // Assuming previous section color
        transform: rotate(-3deg);
        z-index: 1;
    }
    
    // Fix z-index for content
    .container {
        position: relative;
        z-index: 2;
    }

    .text-white {
        color: white;
    }

    .events-scroller {
        width: 100%;
        overflow: hidden;
        padding: 20px 0;
        mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
    }

    .events-track {
        display: flex;
        gap: 24px;
        // Infinite scroll animation
        animation: scroll-left 40s linear infinite;
        width: max-content;

        &:hover {
            animation-play-state: paused;
        }
    }

    .event-card {
        width: 350px;
        height: 180px;
        background: #1e1e24;
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-shrink: 0;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        transition: transform 0.3s;
        cursor: pointer;

        &:hover {
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 15px 30px rgba(0,0,0,0.3);
            
            .card-image {
                 transform: scale(1.1);
            }
        }

        .card-image {
            width: 120px;
            background-size: cover;
            background-position: center;
            position: relative;
            transition: transform 0.5s;
        }

        .card-content {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }

        .event-date {
            font-size: 0.75rem;
            color: #aaa;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .event-title {
            font-size: 1.1rem;
            font-weight: 700;
            color: white;
            line-height: 1.3;
            margin-bottom: 12px;
            // Limit lines
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .event-location {
            font-size: 0.85rem;
            color: #888;
            display: flex;
            align-items: center;
            gap: 4px;
            
            .location-icon {
                font-size: 1rem;
            }
        }
    }
}

@keyframes scroll-left {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

// Services Scroll Section
.services-scroll-section {
    margin-top: -100px;
    padding: 100px 0;
    background-color: #020210; // Dark navy/black background
    position: relative;
    border-top-left-radius: 60px;
    border-top-right-radius: 60px;

    .services-intro {
        margin-bottom: 80px;
    }

    .services-list {
        display: flex;
        flex-direction: column;
        gap: 120px;
    }

    .service-block {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 60px;
        opacity: 0;
        transform: translateY(50px);
        transition: all 0.8s ease-out;

        &.visible {
            opacity: 1;
            transform: translateY(0);
        }

        // Alternate layout
        &:nth-child(even) {
            flex-direction: row-reverse;
        }

        @media (max-width: 900px) {
            flex-direction: column !important;
            gap: 40px;
            text-align: center;
        }
    }

    .service-content {
        flex: 1;
        max-width: 500px;

        @media (max-width: 900px) {
            max-width: 100%;
        }
    }

    .service-title {
        font-size: 3rem;
        font-weight: 700;
        line-height: 1.1;
        margin-bottom: 24px;
        color: white;

        :deep(.highlight) {
            color: #D4F845; // Neon Lime/Yellow accent
            font-style: italic;
        }

        @media (max-width: 600px) {
            font-size: 2.2rem;
        }
    }

    .service-desc {
        font-size: 1.1rem;
        color: #b0b0c0;
        line-height: 1.6;
        margin-bottom: 32px;
    }

    .service-btn {
        padding: 14px 32px;
        background: #D4F845;
        color: #020210;
        border: none;
        border-radius: 50px;
        font-weight: 600;
        font-size: 1rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;

        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(212, 248, 69, 0.3);
        }
    }

    .service-visual {
        flex: 1;
        max-width: 500px;
        height: 500px;
        position: relative;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 40px; // Large rounded corners
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        
        @media (max-width: 600px) {
             height: 350px;
        }
    }
}

// About Us Section
.about-us-section {
    padding: 120px 0;
    background: linear-gradient(180deg, #020210 0%, #1a1a2e 100%);
    position: relative;

    .about-header {
        margin-bottom: 80px;

        .section-title {
            font-size: 3rem;
            font-weight: 700;
            color: white;
            margin-bottom: 16px;

            .highlight {
                color: #D4F845;
            }
        }

        .section-subtitle {
            font-size: 1.25rem;
            color: $color-text-muted;
            font-style: italic;
        }
    }

    .about-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 40px;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }
    }

    .about-card {
        background: rgba(255, 255, 255, 0.03);
        padding: 40px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        transition: all 0.3s ease;

        &:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(212, 248, 69, 0.3);
            transform: translateY(-5px);
        }

        h3 {
            font-size: 1.5rem;
            color: white;
            margin-bottom: 20px;
            font-weight: 600;
            border-bottom: 2px solid $color-secondary;
            padding-bottom: 10px;
            display: inline-block;
        }

        p {
            color: #ccc;
            line-height: 1.7;
            font-size: 1rem;
        }
    }
}

// Trusted Section
.trusted-section {
    padding: 100px 0;
    background-color: $color-dark;
    border-top: 1px solid rgba(255,255,255,0.05);

    .logos-grid {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 60px;
        margin-top: 60px;
        opacity: 0.5;
        
        .logo-item {
            font-size: 1.5rem;
            font-weight: 700;
            color: #fff;
            filter: grayscale(100%);
            transition: all 0.3s;

            &:hover {
                filter: grayscale(0%);
                opacity: 1;
                color: $color-primary;
            }
        }
    }
}

// Footer
.footer-section {
    padding: 80px 0 40px;
    background-color: #050505;
    border-top: 1px solid #1a1a1a;

    .footer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 60px;
        margin-bottom: 60px;

        h4 {
            margin-bottom: 24px;
            font-size: 1.1rem;
            color: white;
            font-weight: 600;
        }

        ul {
            list-style: none;
            padding: 0;

            li {
                margin-bottom: 16px;
                color: #888;
                cursor: pointer;
                transition: color 0.2s;
                font-size: 0.95rem;

                &:hover {
                    color: white;
                }
            }
        }
    }

    .footer-bottom {
        text-align: center;
        color: #444;
        padding-top: 40px;
        border-top: 1px solid #111;
        font-size: 0.9rem;
    }
}

@keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
}

// Responsive Media Queries
@media (max-width: 960px) {
    .hero-title {
        font-size: 3rem;
    }

    .nav-links {
        display: none; // Simplified mobile menu
    }
    
    .desktop-only {
        display: none !important;
    }
}

@media (max-width: 600px) {
    .hero-title {
        font-size: 2.2rem;
    }
    
    .hero-buttons {
        flex-direction: column;
        padding: 0 20px;
    }

    .features-grid {
        grid-template-columns: 1fr;
    }

    .nav-container {
        padding: 0 20px;
    }
}
</style>
