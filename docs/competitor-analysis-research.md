# OpenClaw Competitor Analysis & Content Repurposing Research
**Date:** 2026-03-17
**Purpose:** Feature specifications for building competitor analysis, social listening, and content repurposing into OpenClaw

---

## PART 1: COMPETITOR ANALYSIS & SOCIAL LISTENING

### 1.1 Competitor Post Frequency Tracking

**What the best tools do (Rival IQ, Hootsuite, Sprout Social, Socialinsider):**

- Track number of posts per day/week/month per competitor per platform
- Show posting frequency trends over time (line charts)
- Break down by content type: how many Reels vs carousels vs static images vs text posts
- Compare your posting frequency side-by-side with up to 10 competitors
- Alert when a competitor significantly increases or decreases posting frequency (anomaly detection)

**How it works technically:**
- Platform APIs (Meta Graph API, TikTok API, YouTube Data API) are polled on a schedule (every 1-6 hours)
- Each new post is logged with timestamp, platform, content type, and metadata
- Frequency is calculated as posts/time-period and stored as time series data
- Trend lines are computed via rolling averages (7-day, 30-day)

**What OpenClaw should build:**
- `competitor_posts` table: competitor_id, platform, post_id, post_type (video/image/carousel/text/reel/story), published_at, url, raw_metadata_json
- Scheduled scraper jobs per competitor per platform (cron or BullMQ)
- Dashboard widget: "Posting Frequency" line chart with competitor overlay
- Alert: "Competitor X increased posting frequency by 40% this week"

---

### 1.2 Competitor Engagement Rate Tracking

**What the best tools do (Rival IQ, Socialinsider, Fanpage Karma):**

- Calculate engagement rate = (likes + comments + shares + saves) / follower count * 100
- Track engagement rate over time per competitor
- Break down by content type: which format gets highest engagement
- Show engagement per post distribution (histogram)
- Benchmark against industry averages (Rival IQ publishes annual benchmarks across 14 industries)
- Social Blade assigns letter grades (A+ through F) based on engagement metrics

**How it works technically:**
- For each tracked competitor post, engagement metrics are fetched via API or scraping
- Engagement rate formula: `(total_interactions / followers_at_time) * 100`
- Some tools use "engagement rate by reach" instead: `(interactions / estimated_reach) * 100`
- Metrics are aggregated per day/week/month and stored as time series
- Industry benchmarks are computed from large datasets (Rival IQ uses 2,100+ brands across 14 industries)

**What OpenClaw should build:**
- `competitor_post_metrics` table: post_id, likes, comments, shares, saves, views, reach_estimate, engagement_rate, fetched_at
- `competitor_profiles` table: competitor_id, platform, follower_count, follower_count_updated_at
- Engagement rate calculation job that runs after metric fetch
- Dashboard: engagement rate trend line per competitor, with industry benchmark overlay
- Content type breakdown: average engagement rate by format (bar chart)

---

### 1.3 Competitor Hashtag Strategy Analysis

**What the best tools do (Keyhole, Sprout Social, BrandMentions, Hootsuite):**

- Extract all hashtags from competitor posts
- Rank hashtags by frequency of use and engagement generated
- Track hashtag performance over time (which hashtags are rising/falling)
- Show word cloud of competitor hashtags, color-coded by engagement
- Identify competitor-unique hashtags vs shared/industry hashtags
- Predict which hashtags are likely to go viral based on current traction (Keyhole)
- Show average hashtags per post for each competitor

**How it works technically:**
- Parse post captions/text to extract hashtags (regex: `#\w+`)
- For each hashtag: count usage frequency, sum engagement on posts using it
- Calculate "hashtag engagement lift" = avg engagement of posts with hashtag vs without
- Cluster hashtags into categories: branded, industry, trending, niche
- Historical tracking via time-series storage per hashtag

**What OpenClaw should build:**
- `competitor_hashtags` table: post_id, hashtag, position_in_caption
- Hashtag analytics view: frequency, avg engagement, engagement lift, trend direction
- "Hashtag Gap Analysis": hashtags competitors use successfully that our client doesn't
- Word cloud visualization with size = frequency, color = engagement level
- Alert: "Competitor X started using #NewHashtag and it's driving 2x engagement"

---

### 1.4 Competitor Content Format Analysis (Video vs Image vs Carousel)

**What the best tools do (Socialinsider, Fanpage Karma, Sprout Social):**

- Auto-categorize every competitor post into format types:
  - Static image
  - Carousel (multiple images/videos)
  - Video (feed video)
  - Reel / Short / TikTok
  - Story
  - Text-only post
  - Poll / Quiz
  - Live video
  - Thread (X/Threads)
- Show content mix pie chart per competitor (% of each format)
- Show engagement rate per format type
- Track format mix changes over time (is competitor shifting to more Reels?)
- AI auto-tagging of content themes/pillars (Socialinsider)

**How it works technically:**
- Post type is determined from API response metadata (e.g., Instagram Graph API returns `media_type`: IMAGE, VIDEO, CAROUSEL_ALBUM)
- Some platforms require inference: a video under 60s on IG = Reel, etc.
- Content pillar tagging uses NLP on captions + image classification on visuals
- Format performance is aggregated: avg engagement per format per competitor

**What OpenClaw should build:**
- `post_type` enum: image, carousel, video, reel, short, story, text, poll, live, thread
- Auto-detection logic per platform API
- Content mix dashboard: pie charts per competitor, stacked bar charts over time
- "Format Performance" table: format type | avg engagement | avg reach | post count
- AI content pillar tagging using Claude/Gemini on caption text
- Recommendation engine: "Competitor X gets 3x more engagement on carousels than images -- consider increasing carousel usage"

---

### 1.5 Competitor Audience Growth Tracking

**What the best tools do (Social Blade, Rival IQ, Hootsuite):**

- Track follower/subscriber count over time per competitor per platform
- Show growth rate: absolute new followers and % growth
- Detect anomalies: sudden spikes (viral moment or purchased followers) or drops (controversy/cleanup)
- Compare growth rates across competitors on same chart
- Social Blade provides estimated growth projections

**How it works technically:**
- Follower count is fetched daily via API (or scraped from public profiles)
- Stored as time series: competitor_id, platform, date, follower_count
- Growth rate = (current - previous) / previous * 100
- Anomaly detection: flag if daily change exceeds 3x standard deviation of rolling 30-day average
- Fake follower detection: rapid gain followed by rapid loss pattern

**What OpenClaw should build:**
- `competitor_follower_history` table: competitor_id, platform, date, follower_count, following_count
- Daily fetch job
- Growth rate calculations stored per day/week/month
- Dashboard: follower growth line chart with competitor overlay
- Anomaly alerts: "Competitor X gained 50K followers in 24 hours (unusual)"
- Growth rate comparison table

---

### 1.6 Competitor Best Performing Content Detection

**What the best tools do (BuzzSumo, Hootsuite, Socialinsider, Social Status):**

- Sort all competitor posts by engagement rate, total interactions, shares, or comments
- Surface top 10/25/50 posts per competitor per time period
- BuzzSumo's "Evergreen Score" measures how well content performs over time (not just initial spike)
- Filter top content by format, topic, hashtag
- Show what makes top content different: length, format, time posted, hashtags used
- Machine learning detects if a competitor boosted/promoted a post (Rival IQ)

**How it works technically:**
- All competitor posts are stored with engagement metrics
- Posts are ranked by engagement rate or total interactions
- "Top performing" threshold: posts above 90th percentile of engagement for that competitor
- Pattern analysis on top posts: NLP extracts common topics, caption length, emoji usage, CTA presence
- Boosted post detection: if a post has unusually high reach relative to engagement pattern, likely paid

**What OpenClaw should build:**
- "Top Posts" view per competitor: sortable by engagement rate, likes, comments, shares, views
- Pattern analyzer: what do top posts have in common?
  - Average caption length of top posts vs average
  - Most common hashtags in top posts
  - Most common format type in top posts
  - Most common posting time of top posts
  - CTA presence detection
- Boosted post flag (heuristic: reach/engagement ratio anomaly)
- "Content Inspiration" feed: top performing competitor content with one-click "create similar" button

---

### 1.7 Competitor Posting Time Analysis

**What the best tools do (Hootsuite, Sprout Social, Sprinklr):**

- Map competitor posts to a heatmap: day of week (x-axis) vs hour of day (y-axis)
- Show which time slots get highest engagement for each competitor
- Sprout Social's ViralPost uses your own historical data to find optimal send times
- Hootsuite uses last 30 days of results: impressions, engagement rate, link clicks, comments
- Identify gaps: times competitors DON'T post that might be opportunities
- Compare posting schedules across competitors

**How it works technically:**
- Each post's published_at timestamp is converted to local timezone
- Heatmap bins: 7 days x 24 hours = 168 cells
- Each cell shows: number of posts, average engagement rate
- "Best time" = cell with highest average engagement rate (minimum post threshold)
- Gap analysis: cells where no competitor posts but audience is active (based on engagement on nearby slots)

**What OpenClaw should build:**
- Posting time heatmap per competitor (day x hour grid, color = engagement)
- "Time Gap Analysis": identify underserved time slots
- Optimal posting time recommendation: weighted average of high-engagement competitor times + own audience activity
- Schedule suggestion: "Based on competitor analysis, consider posting at [time] on [day]"

---

### 1.8 Brand Mention Tracking

**What the best tools do (Brandwatch, Mention, Brand24):**

- Monitor 1 billion+ sources daily: social platforms, blogs, news sites, forums, review sites, podcasts (transcripts), TV/radio (transcripts)
- Track mentions of: brand name, product names, CEO/founder names, common misspellings, branded hashtags
- Boolean query builder: (brand OR product) AND NOT (unrelated_term)
- Real-time email/Slack/push alerts for new mentions
- Mention volume over time chart
- Filter by source type, sentiment, language, geography
- Mention.com tracks across social media, forums, blogs, and web sources

**How it works technically:**
- Streaming APIs (Twitter/X Firehose, Reddit API) for real-time social mentions
- Web crawlers for blogs, news sites, forums (scheduled crawls)
- Google Alerts API or custom news API for news mentions
- NLP entity recognition to catch brand mentions even without @ tags
- Boolean query matching on incoming content stream
- Results stored with: source, url, text_snippet, author, timestamp, sentiment_score, reach_estimate

**What OpenClaw should build:**
- `brand_mentions` table: mention_id, brand_id, source_type (social/news/blog/forum/review), platform, url, text_snippet, author, author_followers, timestamp, sentiment_score, language, country
- Configurable mention tracking queries per brand (with boolean operators)
- Real-time mention feed with filters
- Mention volume trend chart
- Source breakdown pie chart
- Integration with notification system (email, Discord webhook, Slack)
- Daily/weekly mention digest report

---

### 1.9 Sentiment Analysis of Mentions

**What the best tools do (Brandwatch, Sprout Social, Hootsuite/Talkwalker):**

- Classify every mention as positive, negative, or neutral
- Advanced tools detect specific emotions: joy, anger, sadness, fear, surprise, disgust, frustration, excitement
- Detect sarcasm and context-dependent sentiment
- Process emojis as sentiment signals
- Show sentiment ratio over time (% positive / % negative / % neutral)
- Sentiment breakdown by topic, product, or campaign
- Alert when negative sentiment spikes (crisis detection)

**How it works technically:**

Two primary approaches:

1. **Rule-based / Lexicon approach:**
   - Predefined dictionary of words with sentiment scores (e.g., "love" = +0.8, "terrible" = -0.9)
   - Scan text, sum sentiment scores, classify based on total
   - Fast but misses context and sarcasm

2. **ML/NLP approach (what modern tools use):**
   - Transformer models (BERT, RoBERTa, or custom fine-tuned models) trained on labeled social media text
   - Input: raw text + emojis + context
   - Output: sentiment class + confidence score + optional emotion labels
   - Handles sarcasm, slang, emojis, multi-language
   - Some tools use aspect-based sentiment: "The food was great but service was terrible" -> food: positive, service: negative

**What OpenClaw should build:**
- Sentiment classification on all incoming mentions using Claude API (or Gemini for cost efficiency)
- Prompt engineering for social media sentiment: handle emojis, slang, sarcasm
- Store: mention_id, sentiment (positive/negative/neutral), confidence_score, emotions[] (joy, anger, etc.)
- Sentiment trend dashboard: stacked area chart over time
- Sentiment by topic/product breakdown
- Crisis alert: "Negative sentiment increased 300% in last 2 hours around [topic]"
- Sentiment comparison: your brand vs competitors

---

### 1.10 Share of Voice (SOV) Calculations

**What the best tools do (Brandwatch, Sprout Social, Brand24, Mention):**

- Formula: `SOV = Your brand mentions / (Your mentions + All competitor mentions) * 100`
- Calculate across: total mentions, social media only, news only, per platform
- Track SOV over time to see market position changes
- Break down by: volume SOV, engagement SOV, reach SOV, sentiment-weighted SOV
- Sprout Social visualizes SOV with breakdown by engagements, impressions, unique authors, and sentiment
- Compare SOV across multiple competitors simultaneously

**How it works technically:**
- Requires mention tracking for your brand AND all tracked competitors
- Mention counts aggregated per time period per brand
- SOV % = brand_mentions / sum(all_tracked_brand_mentions) * 100
- Variants:
  - Volume SOV: raw mention count
  - Engagement SOV: total engagement on mentions
  - Reach SOV: estimated audience reached by mentions
  - Sentiment SOV: positive mentions only (filters noise)
- Stored as time series for trend tracking

**What OpenClaw should build:**
- `share_of_voice` table: date, brand_id, sov_volume_pct, sov_engagement_pct, sov_reach_pct, sov_positive_pct
- Daily SOV calculation job that aggregates across all tracked brands
- SOV dashboard: stacked bar chart showing all brands' share over time
- SOV by platform breakdown
- SOV trend alerts: "Your SOV dropped from 35% to 22% this week"

---

### 1.11 Trending Topic Detection & Alerts

**What the best tools do (Brandwatch, Hootsuite/Talkwalker, Keyhole):**

- Process 600M+ social messages daily
- Detect trending topics in real-time within your industry/niche
- Cluster related conversations into topics using NLP
- Show topic velocity: how fast a topic is growing
- Predict which topics will go viral based on early traction
- Send alerts when relevant trending topics emerge
- Show related hashtags, key influencers, and top posts per trend

**How it works technically:**
- Streaming ingestion of social media posts (via APIs)
- Topic extraction: TF-IDF (Term Frequency-Inverse Document Frequency) on incoming text
- Topic clustering: group similar terms/phrases using embedding similarity
- Trend detection: time series analysis on topic volume
  - Calculate rate of change in mention volume per topic
  - If rate exceeds threshold (e.g., 5x normal volume in 1 hour), flag as trending
- Velocity scoring: mentions/hour acceleration
- Relevance filtering: only surface trends related to configured keywords/industry

**What OpenClaw should build:**
- Industry keyword configuration per brand
- Topic extraction from mentions using Claude/Gemini NLP
- Topic volume time series tracking
- Trend detection algorithm: flag topics with >3x volume increase in 6-hour window
- Trending topics dashboard: topic name, volume, velocity, sentiment, top posts
- Real-time alerts: "Trending in your industry: [topic] -- 500% volume increase"
- "Newsjacking" suggestions: trending topics + recommended content angles

---

### 1.12 Competitor Ad Tracking

**What the best tools do (Panoramata, Meta Ad Library, BigSpy, Madgicx):**

- Track all active ads from competitors across Meta (Facebook/Instagram), TikTok, Google Display, LinkedIn, Pinterest
- Show ad creative (image/video), copy, CTA, landing page URL
- Track when ads were launched and how long they've been running
- Estimate ad spend and engagement
- Filter by country, platform, CTA type
- Historical ad archive (further back than native ad libraries)
- Alert when competitor launches new ad campaigns
- Track A/B test variations (multiple creatives for same product)

**How it works technically:**
- Primary source: Meta Ad Library (public, free API) -- shows ALL active Facebook/Instagram ads for any page
- TikTok Ad Library: public, searchable
- Google Ads Transparency Center: public
- Tools scrape/index these public ad libraries on a schedule
- Match ads to tracked competitors
- Track ad lifespan: first_seen, last_seen, still_active
- Long-running ads = likely profitable (key insight)
- Landing page scraping for offer/funnel analysis

**What OpenClaw should build:**
- `competitor_ads` table: ad_id, competitor_id, platform, creative_url, ad_copy, cta_text, landing_page_url, first_seen, last_seen, is_active, estimated_spend_range
- Meta Ad Library API integration (primary source -- it's free and public)
- TikTok Ad Library scraper
- Ad tracking dashboard: active ads per competitor, ad lifespan, creative gallery
- New ad alerts: "Competitor X launched 5 new Facebook ads today"
- Ad longevity insight: "This ad has been running for 90 days -- likely profitable"
- Landing page snapshot storage for funnel analysis

---

## PART 2: CONTENT REPURPOSING

### 2.1 Long Video to Shorts Extraction

**What the best tools do (OpusClip, Vizard, Kapwing, Pictory, Reap, quso.ai):**

OpusClip is the market leader. Here's exactly how it works:

1. **Upload/URL input:** User provides a long video (up to 45-60 min) or a YouTube/TikTok URL
2. **AI Transcription:** Audio is transcribed with 97%+ accuracy, including speaker detection
3. **Content Analysis:** AI analyzes the transcript against "big data" of viral social media trends to identify which segments have highest viral potential
4. **Gold Nugget Detection:** The AI doesn't just clip continuous segments -- it finds "gold nuggets" from DIFFERENT parts of the video and seamlessly combines them into a coherent short
5. **Virality Scoring:** Each potential clip gets a "virality score" (1-100) based on:
   - Hook strength (first 3 seconds)
   - Emotional intensity
   - Information density
   - Novelty/surprise factor
   - Alignment with current trending formats
6. **Auto-editing:** Selected clips are polished with:
   - Dynamic animated captions (customizable font, color, style)
   - AI reframing (16:9 to 9:16 with speaker tracking)
   - Smooth transitions between combined segments
   - Strong call-to-action endings
7. **Output:** Multiple shorts (typically 5-15 per long video) ranked by virality score
8. **Publishing:** Direct posting to YouTube Shorts, TikTok, Instagram Reels via scheduler

**Supported content types:** Interviews, podcasts, vlogs, gaming, sports, explainers, webinars, talks, demos -- all genres via "ClipAnything" model

**What OpenClaw should build:**
- Video upload + YouTube/TikTok URL ingestion
- FFmpeg-based audio extraction
- Whisper (or cloud ASR) transcription with speaker diarization
- Claude/Gemini analysis of transcript to identify high-value segments:
  - Prompt: "Analyze this transcript. Identify 5-10 segments that would make compelling short-form clips. For each, provide start_time, end_time, hook_text, topic, and a virality_score (1-100). Prioritize segments with strong hooks, emotional content, surprising insights, or actionable advice."
- FFmpeg clip extraction at identified timestamps
- Auto-captioning with styled subtitles (ASS/SRT format rendered via FFmpeg)
- AI reframing pipeline (see section 2.5)
- Output queue with virality scores for user review
- One-click publish to connected platforms

---

### 2.2 Blog to Social Posts Conversion

**What the best tools do (Planable, Cassidy AI, Jasper, Typeface, Predis.ai):**

1. **Input:** User provides blog post URL or pastes text
2. **AI Analysis:** Tool reads the full blog post and identifies:
   - Key points/takeaways
   - Quotable sentences
   - Statistics/data points
   - Actionable tips
3. **Platform-specific generation:** Creates adapted versions for each platform:
   - **X/Twitter:** Punchy 1-2 sentence takes, thread breakdowns (numbered tweets), stat highlights (max 280 chars)
   - **LinkedIn:** Professional tone, insight-driven, proper spacing, paragraph breaks, ending with engagement question
   - **Instagram:** Caption with emojis, hashtag block, carousel slide text (for 5-10 slide carousels)
   - **TikTok:** Script format -- hook + body + CTA, designed to be spoken
   - **Facebook:** Conversational tone, medium length, with question or poll prompt
   - **Threads:** Conversational, relatable, shorter than LinkedIn
4. **Visual generation:** Some tools create carousel images, quote graphics, or infographics from blog data
5. **Scheduling:** Posts can be scheduled directly to each platform

**What OpenClaw should build:**
- Blog URL ingestion (fetch + parse with readability algorithm)
- Claude/Gemini prompt pipeline:
  - Step 1: Extract key points, quotes, stats, tips from blog
  - Step 2: Generate platform-specific versions with correct tone, length, format constraints
  - Step 3: Generate hashtag suggestions per platform
- Platform-specific templates with character limits and formatting rules
- Carousel generator: extract 5-10 key points -> generate slide images (using Gemini image gen or template system)
- Preview panel showing how each version looks on each platform
- Direct scheduling to connected accounts

---

### 2.3 Podcast to Video Clips

**What the best tools do (Headliner, Flowjin, Opus Clip, Descript, Wavve):**

Two main output types:

**A. Audiograms (audio + visual wrapper):**
- Take an audio clip + static background image + animated waveform + captions = video file
- Waveform styles: bar, wave, blob, circle, line (customizable colors)
- Speaker avatars: photos of speakers that animate when their audio plays
- Branded templates: logo, colors, fonts matching brand
- Caption styles: word-by-word highlight, karaoke-style, full sentence
- Export formats: 9:16 (Stories/Reels), 1:1 (Feed), 16:9 (YouTube)

**B. Video clips from video podcasts:**
- Same as long video to shorts (section 2.1) but optimized for conversation format
- Speaker detection and auto-switching between camera angles
- Split-screen layouts for remote interviews
- AI identifies most engaging exchanges/moments

**How clip selection works for podcasts specifically:**
- AI identifies: strong opinions, laughter/emotion moments, quotable statements, surprising facts, storytelling peaks, disagreements/debates
- Flowjin: speaker diarization -> identifies who's talking -> assigns speaker photos/names to audiogram
- Viral score based on conversational energy and topic relevance

**What OpenClaw should build:**
- Audio file upload (.mp3, .wav, .m4a) + RSS feed URL ingestion
- Whisper transcription with speaker diarization
- AI clip selection (same pipeline as 2.1 but podcast-optimized prompts)
- Audiogram generator:
  - FFmpeg: combine background image + audio + waveform animation + caption overlay
  - Waveform generation from audio amplitude data
  - Speaker avatar overlay with voice activity detection
- Multiple export aspect ratios
- Template system for branded audiograms

---

### 2.4 One Post to Multi-Platform Versions

**What the best tools do (Repurpose.io, Loomly, Fedica, Jasper, IFTTT):**

- User creates ONE piece of content (post, video, image)
- Tool automatically generates platform-specific versions:

| Platform | Adaptations Applied |
|----------|-------------------|
| Instagram | Square/vertical crop, hashtag block (up to 30), caption with emojis, alt text |
| TikTok | 9:16 aspect ratio, trending audio suggestion, caption with hashtags |
| YouTube Shorts | 9:16, title optimization for search, description with keywords |
| X/Twitter | Truncate to 280 chars, remove hashtag blocks, sharpen hook |
| LinkedIn | Professional tone rewrite, remove emojis, add paragraph breaks, thought-leader framing |
| Facebook | Conversational rewrite, add question/poll prompt, link preview optimization |
| Pinterest | Vertical image (2:3), SEO-rich description, keyword-rich title |
| Threads | Conversational, shorter, remove excessive hashtags |

- Repurpose.io also handles: watermark removal (from TikTok downloads), automatic scheduling across all platforms, workflow automation ("when I post to TikTok, automatically cross-post to YouTube Shorts and Instagram Reels")

**What OpenClaw should build:**
- "Create Once, Publish Everywhere" workflow:
  1. User creates primary content (text + media)
  2. AI generates adapted versions for each connected platform
  3. User reviews/edits each version in split-pane preview
  4. One-click schedule/publish to all platforms
- Platform adaptation rules engine:
  - Character limits per platform
  - Hashtag strategy per platform (Instagram: 20-30, Twitter: 2-3, LinkedIn: 3-5)
  - Tone adjustment (professional for LinkedIn, casual for TikTok)
  - Media format requirements (aspect ratios, file sizes, video length limits)
- Watermark removal for cross-posted video content
- Workflow automation: trigger-based cross-posting rules

---

### 2.5 Aspect Ratio Conversion (16:9 to 9:16) -- AI Reframing

**What the best tools do (OpusClip ReframeAnything, StreamYard, Vizard, Choppity, LiveLink):**

This is NOT simple center-cropping. Modern AI reframing does:

1. **Subject Detection:** AI identifies the primary subject(s) in each frame using object detection / pose estimation
2. **Speaker Tracking:** When someone is talking, the AI locks focus on them. When dialogue switches, the crop smoothly pans to the new speaker
3. **Face Detection + Centering:** Facial recognition ensures faces (especially eyes and mouth) stay centered in the vertical frame
4. **Multi-speaker Layouts:** For conversations with 2+ people:
   - Split screen (top/bottom) showing both speakers
   - Dynamic switching between speakers based on who's talking
   - Picture-in-picture for reaction shots
5. **Action Tracking:** For non-talking-head content (sports, demos), the AI tracks the primary action/motion and keeps it in frame
6. **Smooth Camera Motion:** The virtual crop moves smoothly (no jarring jumps) using easing curves
7. **Safe Zone Awareness:** Keeps important content away from edges where platform UI overlays appear (like TikTok's right-side buttons)

**What OpenClaw should build:**
- FFmpeg-based cropping pipeline with dynamic crop coordinates per frame
- Face/person detection using lightweight model (MediaPipe or YOLO)
- Speaker diarization synced to video frames (who's talking when)
- Crop coordinate calculation:
  - Center crop on detected face/subject
  - Smooth interpolation between crop positions (ease-in-out)
  - Safe zone margins (10% from edges)
- Multi-speaker templates:
  - Single speaker: center crop following face
  - Two speakers: 50/50 split or dynamic switching
  - Group: wider crop with smart zoom on active speaker
- Output formats: 9:16 (Reels/TikTok/Shorts), 1:1 (Feed), 4:5 (Instagram Feed), 16:9 (YouTube)

---

## PART 3: IMPLEMENTATION PRIORITY FOR OPENCLAW

### Phase 1 (High Value, Medium Effort)
1. **Competitor Post Tracking** -- foundation for everything else
2. **Engagement Rate Tracking** -- immediate competitive insight
3. **Content Format Analysis** -- informs content strategy
4. **One Post to Multi-Platform** -- daily workflow value for users

### Phase 2 (High Value, Higher Effort)
5. **Blog to Social Posts** -- content multiplication
6. **Brand Mention Tracking** -- requires web crawling infrastructure
7. **Sentiment Analysis** -- builds on mention tracking
8. **Competitor Best Performing Content** -- builds on post tracking

### Phase 3 (Highest Value, Highest Effort)
9. **Long Video to Shorts** -- requires video processing pipeline (FFmpeg + Whisper + AI)
10. **AI Reframing (16:9 to 9:16)** -- requires face detection + dynamic cropping
11. **Podcast to Video Clips** -- builds on video pipeline
12. **Share of Voice** -- builds on mention tracking

### Phase 4 (Differentiation Features)
13. **Trending Topic Detection** -- requires real-time data processing
14. **Competitor Ad Tracking** -- Meta Ad Library API integration
15. **Posting Time Analysis** -- builds on post tracking data
16. **Hashtag Strategy Analysis** -- builds on post tracking data

---

## PART 4: DATA MODEL SUMMARY

### Core Tables Needed

```
competitor_profiles
  id, brand_id, platform, handle, display_name, profile_url,
  follower_count, following_count, post_count, bio,
  last_synced_at, created_at

competitor_posts
  id, competitor_profile_id, platform_post_id, post_type,
  caption, hashtags[], media_urls[], thumbnail_url,
  published_at, permalink, raw_metadata,
  created_at

competitor_post_metrics
  id, competitor_post_id, fetched_at,
  likes, comments, shares, saves, views, reach_estimate,
  engagement_rate, is_boosted_estimate

competitor_follower_history
  id, competitor_profile_id, date, follower_count,
  following_count, daily_change, growth_rate_pct

brand_mentions
  id, brand_id, source_type, platform, url, text_snippet,
  author, author_handle, author_followers,
  sentiment, sentiment_score, emotions[],
  timestamp, language, country, created_at

share_of_voice
  id, brand_id, date, platform,
  mention_count, total_market_mentions,
  sov_volume_pct, sov_engagement_pct, sov_reach_pct

competitor_ads
  id, competitor_profile_id, platform, ad_library_id,
  creative_url, ad_copy, cta_text, landing_page_url,
  first_seen, last_seen, is_active, estimated_spend_range

competitor_hashtags (view or materialized)
  hashtag, competitor_profile_id, usage_count,
  avg_engagement_rate, first_used, last_used, trend_direction

repurpose_jobs
  id, brand_id, source_type (video/blog/podcast/post),
  source_url, source_file_path, status, config_json,
  created_at, completed_at

repurpose_outputs
  id, job_id, output_type (short/social_post/audiogram),
  platform_target, content_text, media_url,
  virality_score, aspect_ratio, duration_seconds,
  status, published_at
```

---

## PART 5: KEY TECHNICAL DEPENDENCIES

| Feature | Dependencies |
|---------|-------------|
| Post tracking | Platform APIs (Meta Graph, TikTok, YouTube Data, X API) |
| Mention tracking | Web crawling, streaming APIs, Google Alerts |
| Sentiment analysis | Claude API or fine-tuned model |
| Video clipping | FFmpeg, Whisper/cloud ASR, Claude/Gemini for analysis |
| AI reframing | MediaPipe or YOLO face detection, FFmpeg |
| Audiograms | FFmpeg, audio waveform generation library |
| Blog parsing | Readability/Mercury parser, web fetch |
| Ad tracking | Meta Ad Library API (free), TikTok Ad Library |
| Trending topics | High-volume ingestion, topic clustering, time-series DB |
| Multi-platform posting | Platform publishing APIs + OAuth per platform |

---

## Sources

### Social Listening & Competitor Analysis
- [18 Best Social Listening Tools 2026](https://thecmo.com/tools/best-social-listening-tools/)
- [Brandwatch Competitor Analysis](https://www.brandwatch.com/p/competitor-analysis/)
- [Brandwatch Top 10 Competitor Benchmarking Tools](https://www.brandwatch.com/blog/best-competitor-benchmarking-tools/)
- [Sprout Social Competitive Analysis](https://sproutsocial.com/competitive-analysis/)
- [Sprout Social Competitive Analysis Topic Template](https://support.sproutsocial.com/hc/en-us/articles/360044731451-Competitive-Analysis-Topic-Template)
- [Mention.com](https://mention.com/en/)
- [Rival IQ Competitive Social Media Analytics](https://www.rivaliq.com/)
- [Rival IQ Social Media Competitive Analysis](https://www.rivaliq.com/social-media-competitive-analysis/)
- [Hootsuite Competitive Analysis Tool](https://www.hootsuite.com/platform/competitive-analysis)
- [Hootsuite Social Listening](https://www.hootsuite.com/platform/listening)
- [Socialinsider Competitor Analysis](https://www.socialinsider.io/social-media-competitor-analysis)
- [Fanpage Karma Competitor Analysis](https://www.fanpagekarma.com/insights/social-media-competitor-analysis-and-benchmarking/)

### Sentiment Analysis
- [AWS Sentiment Analysis Explained](https://aws.amazon.com/what-is/sentiment-analysis/)
- [IBM Sentiment Analysis](https://www.ibm.com/think/topics/sentiment-analysis)
- [Thematic Sentiment Analysis Guide](https://getthematic.com/sentiment-analysis)
- [Sprout Social Sentiment Analysis Tools](https://sproutsocial.com/insights/sentiment-analysis-tools/)

### Share of Voice
- [Sprout Social Share of Voice](https://sproutsocial.com/insights/share-of-voice/)
- [Brandwatch Share of Voice](https://www.brandwatch.com/blog/share-of-voice/)
- [Brand24 Share of Voice Guide](https://brand24.com/blog/how-to-measure-the-share-of-voice/)
- [Mention.com SOV Calculator](https://mention.com/en/share-of-voice-calculator/)

### Hashtag Analysis
- [Sprout Social Hashtag Analytics Guide](https://sproutsocial.com/insights/hashtag-analytics/)
- [BrandMentions Hashtag Tracker](https://brandmentions.com/hashtag-tracker/)
- [Hootsuite Hashtag Tools](https://blog.hootsuite.com/hashtag-analytics/)

### Competitor Ad Tracking
- [Panoramata Ad Tracking](https://www.panoramata.co/features/track-competitors-ads-automatically)
- [WordStream Spy on Competitor Ads](https://www.wordstream.com/blog/competitors-ads)
- [Madgicx Competitor Ad Tools](https://madgicx.com/blog/competitor-ads)

### Trending Topics
- [Hootsuite Trend Research](https://www.hootsuite.com/platform/trend-research)
- [Microsoft ISE Trending Topics Detection](https://devblogs.microsoft.com/ise/real-time-time-series-analysis-at-scale-for-trending-topics-detection/)
- [Dialzara AI Trend Forecasting](https://dialzara.com/blog/how-ai-predicts-social-media-trends-before-they-happen)

### Content Repurposing -- Video Clipping
- [OpusClip How It Works](https://www.opus.pro/how-does-opus-clip-work)
- [OpusClip Features](https://www.opus.pro/)
- [Vizard Best AI Video Clipping Tools 2026](https://vizard.ai/blog/best-ai-video-clipping-tools-2026)
- [CapCut Long Video Repurposing AI Tools](https://www.capcut.com/resource/top-7-long-video-repurposing-ai-tools)
- [Joyspace Top 5 AI Tools to Turn Long Videos into Shorts](https://joyspace.ai/top-5-ai-tools-repurpose-long-videos-shorts)

### Content Repurposing -- Blog to Social
- [Planable Blog to Social Post Tool](https://planable.io/repurpose-blog-post-into-social-media-post/)
- [Typeface AI Content Repurposing](https://www.typeface.ai/blog/ai-content-repurposing)
- [Cassidy AI Blog to Social](https://www.cassidyai.com/use-cases/convert-blog-posts-to-social-media-content)

### Content Repurposing -- Podcast to Video
- [Headliner](https://www.headliner.app/)
- [Flowjin AI Waveform Generator](https://www.flowjin.com/tools/ai-audio-waveform-generator)
- [Wavve Audio to Video](https://wavve.co/)
- [quso.ai Best Video Repurposing Tools for Podcasters](https://quso.ai/blog/best-video-repurposing-tools-for-podcasters)

### Content Repurposing -- Multi-Platform
- [Repurpose.io](https://repurpose.io/)
- [Repurpose.io Features & Pricing](https://ampifire.com/blog/repurpose-io-features-pricing-can-this-tool-distribute-your-content-everywhere/)
- [Multi-Platform Posting Tools 2026](https://influencermarketinghub.com/social-media-posting-scheduling-tools/multi-social-media-posting-tools/)
- [Planable Cross-Posting](https://planable.io/blog/cross-posting-social-media/)

### AI Video Reframing
- [OpusClip AI Reframe](https://www.opus.pro/ai-reframe)
- [StreamYard Aspect Ratio Converter](https://streamyard.com/blog/aspect-ratio-converter-for-videos)
- [Choppity Automated Framing](https://www.choppity.com/features/automated-framing)

### Posting Time Optimization
- [Hootsuite Best Time to Post](https://blog.hootsuite.com/best-time-to-post-on-social-media/)
- [Sprout Social Best Times to Post](https://sproutsocial.com/insights/best-times-to-post-on-social-media/)
- [Sprinklr Best Times to Post](https://www.sprinklr.com/blog/best-times-to-post-on-social-media/)
