# OpenClaw Visual Editor - Workflow Template Catalog

> Compiled 2026-03-17 from web research across ComfyUI, n8n, Fuser, Banana Pro AI Studio, and major AI ad platforms.
> These templates are designed for import into the OpenClaw visual node-based editor as preset workflows.

---

## Template 1: UGC Talking Head Testimonial

**What it produces:** Realistic AI-generated "customer testimonial" videos — a talking head spokesperson delivering a product review, scripted to sound authentic and casual (selfie-style, eye contact, conversational tone).

**Content type:** Testimonial / Product Review

**Node chain:**
1. **Product Input** — Upload product image + URL
2. **Script Generator** (GPT-4o) — Generates authentic-sounding testimonial script with brand voice, hooks, and CTA
3. **Spokesperson Image Generator** (Nano Banana Pro / Flux) — Creates realistic AI person holding or near the product
4. **Voice Synthesis** (ElevenLabs) — Converts script to natural voiceover audio
5. **Lip Sync** (WaveSpeed / InfiniteTalk) — Frame-by-frame lip synchronization matching audio to face
6. **Caption Overlay** — Auto-generates animated captions/subtitles
7. **Export** — Platform-specific formats (9:16 TikTok, 1:1 Instagram, 16:9 YouTube)

**AI Models:** GPT-4o, ElevenLabs TTS, Nano Banana Pro (Gemini 3 Pro Image), WaveSpeed lip-sync
**Source:** [n8n UGC Video Ads Template](https://n8n.io/workflows/10070-create-authentic-ugc-video-ads-with-gpt-4o-elevenlabs-and-wavespeed-lip-sync/)

---

## Template 2: Product Scene Transformation

**What it produces:** Dynamic video showing a product transforming between scenes/environments — e.g., a bottle transitioning from a studio shot to a beach, kitchen, or luxury setting.

**Content type:** Product Demo / Brand Showcase

**Node chain:**
1. **Product Video Input** — Upload existing product footage or static image
2. **Scene Prompt** (Text Input) — Describe target environment/scene
3. **Scene Generation** (Nano Banana Pro) — Generates target scene background matching product style
4. **Video Transformation** (Wan VACE 2.1) — Animates smooth transition between scenes
5. **Color Grading** — Automatic color matching between product and new scene
6. **Audio Layer** — Background music/SFX selection
7. **Export** — Final rendered video with transitions

**AI Models:** Nano Banana Pro (Gemini 3 Pro Image), Wan VACE 2.1
**Source:** [ComfyUI Product Scene Transformation](https://comfy.org/templates/templates_product_scene_transformation/)

---

## Template 3: Cinematic First-Frame Last-Frame Ad

**What it produces:** Smooth cinematic video that transitions from a defined starting image to a defined ending image — perfect for "mystery box to reveal" or "before/after" product ads.

**Content type:** Before/After / Product Reveal

**Node chain:**
1. **First Frame Input** — Upload highly detailed starting image (e.g., mystery box, problem state, plain product)
2. **Last Frame Input** — Upload ending image (e.g., revealed product, solution state, branded product)
3. **Motion Prompt** (Text Input) — Describe the desired motion/transition style
4. **Video Generation** (WAN 2.2 14B FLF) — Generates seamless motion between first and last frames
5. **Upscale/Enhance** — Optional quality enhancement pass
6. **Audio Sync** — Add reveal sound effects or music
7. **Text Overlay** — Brand name, tagline, CTA
8. **Export** — Multiple aspect ratios

**AI Models:** WAN 2.2 14B (First-Last-Frame model), optional GGUF variants for lower VRAM
**Source:** [WAN 2.2 First-Last Frame in ComfyUI](https://www.nextdiffusion.ai/tutorials/wan-22-first-last-frame-video-generation-in-comfyui)

---

## Template 4: Automated Multi-Platform Video Campaign

**What it produces:** Complete end-to-end pipeline: takes an idea from a spreadsheet, generates a full short-form video with visuals + voiceover + captions, and auto-publishes to TikTok, Instagram, YouTube, Facebook, LinkedIn simultaneously.

**Content type:** Multi-Platform Social Content

**Node chain:**
1. **Content Brief Input** (Google Sheets / Form) — Campaign idea, product details, target audience
2. **Script Writer** (GPT-4o / Gemini) — Generates video script + image prompts + platform descriptions
3. **Image Generation** (Flux / Nano Banana) — Creates visual frames from prompts
4. **Video Clip Generation** (Kling / Veo 3.1) — Animates images into video clips
5. **Voiceover** (ElevenLabs) — Generates narration from script
6. **Video Assembly** (Creatomate) — Combines clips + audio + captions into final video
7. **Platform Optimization** — Adjusts aspect ratio, compression, captions per platform
8. **Multi-Platform Publish** (Blotato / Upload-Post) — Auto-posts to 9+ platforms

**AI Models:** GPT-4o, Flux, Kling AI, ElevenLabs, Creatomate
**Source:** [n8n Fully Automated Video Generation](https://n8n.io/workflows/3442-fully-automated-ai-video-generation-and-multi-platform-publishing/)

---

## Template 5: Product Photography Ad Poster (Flux)

**What it produces:** Professional advertisement poster/image with product placed in a designed scene — studio-quality lighting, shadows, and branding. Outputs print-ready and social-media-ready ad images.

**Content type:** Static Ad / Product Photography

**Node chain:**
1. **Product Image Input** — Upload product photo (ideally on white/transparent background)
2. **Product Masking** — Auto-extract product from background
3. **Background Generation** (Flux / FluxFill-dev) — Generate or select ad background scene
4. **Product Placement** — Merge product into generated background with correct perspective
5. **Lighting Adjustment** (NEAR IC Light) — Generate realistic lighting map for the composite
6. **Detail Enhancement** (Flux Inpainting) — Low-intensity inpainting to blend product into scene
7. **Color Matching** — Auto-adjust colors for cohesion between product and background
8. **Text/Logo Overlay** — Add brand text, tagline, logo
9. **Export** — Multiple formats and sizes

**AI Models:** Flux (FluxFill-dev), NEAR IC Light nodes, Llama (for lighting prompts)
**Source:** [OpenArt Ads Products Design (Flux)](https://openart.ai/workflows/alswa80/ads-products-designflux/HcAnGZWvGqMh6KSWL6Mn)

---

## Template 6: Branding Product Shot (SeedDream)

**What it produces:** Product shot with your brand logo/label overlaid on the product — the AI understands how labels wrap around surfaces, creating realistic branded product mockups.

**Content type:** Branded Product Mockup

**Node chain:**
1. **Product Image Input** — Upload product image
2. **Logo/Label Input** — Upload brand logo or label design
3. **Dual-Input Processing** (SeedDream-v4) — AI overlays branding onto product with realistic wrapping, perspective, and lighting
4. **Scene Enhancement** — Optional background swap or enhancement
5. **Export** — High-resolution branded product images

**AI Models:** SeedDream-v4 (Doubao/ByteDance), Dual-Input architecture
**Source:** [ComfyDeploy Branding Product Shot](https://studio.comfydeploy.com/share/workflow/branding-product-shot-with-seeddream-v4-dual-input)

---

## Template 7: Product Image to Hero Shot

**What it produces:** Transforms a basic product photo into a dramatic "hero shot" with enhanced lighting, professional shadows, depth effects, and polished backgrounds — making products look premium for marketing materials and e-commerce listings.

**Content type:** E-Commerce Hero Image

**Node chain:**
1. **Product Image Input** — Upload standard product photo
2. **Image Encoding** (VAEEncode) — Encode image to latent space
3. **Mask Generation** (GrowMask) — Create mask around product
4. **Lighting Enhancement** (ICLightApplyMaskGrey) — Apply dramatic lighting and shadow effects
5. **Background Enhancement** (CLIPTextEncode + KSampler) — Generate premium background context
6. **Decode & Refine** (VAEDecode) — Convert back to final image
7. **Preview & Export** (SaveImage) — Output hero shot in multiple resolutions

**AI Models:** Stable Diffusion checkpoint (via KSampler), ICLight model, CLIP
**Source:** [OpenArt Product Image to Hero Shot](https://openart.ai/workflows/nouvo_ai/product-image-to-hero-shot/3JOVHeA2U4xW3UnoOsw9)

---

## Template 8: Ad Poster/Asset Generator

**What it produces:** Complete advertisement poster or ad asset — upload your product, type a text prompt describing the poster style, iterate on the design, then swap the product into the generated layout.

**Content type:** Ad Creative / Poster Design

**Node chain:**
1. **Product Image Input** — Upload product photo
2. **Design Prompt** (Text Input) — Describe desired poster style, theme, mood
3. **Layout Generation** (Nano Banana Pro / Flux) — Generate ad layout/background based on prompt
4. **Product Integration** — Swap product into the generated layout with correct proportions
5. **Text Rendering** — Add headline, body text, CTA with AI text rendering
6. **Logo Placement** — Position brand logo
7. **Iteration Loop** — Adjust and regenerate until satisfied
8. **Export** — Print and digital formats

**AI Models:** Nano Banana Pro (supports 4K, clean text rendering), Flux
**Source:** [ComfyUI Poster/Product Integration](https://comfy.org/workflows/templates-poster_product_integration/)

---

## Template 9: Faceless Explainer Video

**What it produces:** Professional "faceless" explainer or educational video — AI-generated visuals with voiceover narration and captions, no human presenter needed. Ideal for product explainers, "5 reasons to buy," or educational content.

**Content type:** Tutorial / How-To / Explainer

**Node chain:**
1. **Topic Input** (Text/Form) — Product name, key features, target audience
2. **Script Generation** (Gemini 2.5 Pro) — Creates 60-second educational script
3. **Transcription & Timestamps** (OpenAI Whisper) — Generate word-level timestamps
4. **Image Prompt Generation** (Gemini) — Creates timestamped image prompts matching script
5. **Image Generation** (Leonardo AI) — Generates visuals for each scene
6. **Voiceover** (ElevenLabs) — High-quality narration
7. **Video Assembly** (Shotstack) — Combines images + audio + captions with timing
8. **Export** — Final video download

**AI Models:** Gemini 2.5 Pro, Leonardo AI, ElevenLabs, OpenAI Whisper, Shotstack
**Source:** [n8n Faceless Videos with Gemini & Leonardo](https://n8n.io/workflows/6014-create-faceless-videos-with-gemini-elevenlabs-leonardo-ai-and-shotstack/)

---

## Template 10: 3D Product Video from 2D Image

**What it produces:** Converts a flat 2D product image into a rotating 3D product showcase video — products spin, zoom, and display from multiple angles without needing actual 3D models or photography.

**Content type:** E-Commerce Product Showcase / 360 View

**Node chain:**
1. **Product Image Input** (Form Upload) — Upload 2D product photo + product name
2. **Background Removal** (Remove.bg API) — Clean extraction of product from background
3. **Image Upload** — Store cleaned image in cloud storage
4. **3D Video Generation** (Fal.ai) — Convert 2D image to animated 3D rotation video
5. **Status Polling** — Wait for 3D render completion
6. **Video Download & Storage** (Google Drive) — Store final video
7. **Notification** — Email store owner with video download link

**AI Models:** Remove.bg, Fal.ai (3D generation), Google Drive API
**Source:** [n8n 3D Product Video Generator](https://n8n.io/workflows/4987-3d-product-video-generator-from-2d-image-for-e-commerce-stores/)

---

## Template 11: UGC Walk-and-Talk Testimonial (Sora 2)

**What it produces:** Three distinct 15-second UGC-style video ads with consistent AI character — following proven UGC archetypes: (A) On-the-Go Testimonial (walk-and-talk), (B) Driver's Seat Review, (C) At-Home Demo.

**Content type:** UGC Testimonial / Product Review

**Node chain:**
1. **Character Input** — Sora 2 character reference (username/style)
2. **Product Input** — Product image + website URL
3. **Product Research** (Firecrawl) — Scrapes product page for key features/benefits
4. **Prompt Guide Fetch** (Firecrawl) — Loads Sora 2 prompting best practices
5. **Script Generation** (Gemini 2.5 Pro) — Creates 3 distinct 15-sec ad scripts in UGC archetypes
6. **Video Generation** (Sora 2 via Kie.AI) — Generates 3 consistent-character videos
7. **Quality Review** — Preview and approve loop
8. **Export** — Platform-optimized formats

**AI Models:** Sora 2 (OpenAI), Gemini 2.5 Pro, Firecrawl (web scraping)
**Source:** [n8n Sora 2 UGC Consistent Character Ads](https://github.com/anirudhaeran/Automated-UGC-Ad)

---

## Template 12: Eye-Catching Product Video Ad (ComfyUI)

**What it produces:** Dynamic video ad from a static product image — product placed in a matching scene with professional lighting, style-consistent background, and motion effects. Turns catalog photos into scroll-stopping video ads.

**Content type:** Product Ad Video

**Node chain:**
1. **Product Image Input** — Upload product photo
2. **Background Reference Input** — Upload style/mood reference image
3. **Prompt Generation** (Auto) — Generates optimized prompts from reference + product features
4. **Smart Masking** — Isolates product with detail preservation
5. **Style Extraction** (IPA - Image Prompt Adapter) — Extracts background style for seamless blending
6. **Lighting Effects** — Professional lighting to enhance product texture and scene brightness
7. **Visual Refinement** (Flux) — Redraws scene ensuring color/style harmony
8. **Animation** (WAN 2.2 / AnimateDiff) — Adds subtle motion to create video from refined composite
9. **Export** — Video ad in multiple formats

**AI Models:** Flux, IPA (IP-Adapter), AnimateDiff / WAN 2.2
**Source:** [MimicPC Eye-Catching Product Video Ads](https://www.mimicpc.com/workflows/template-of-comfyui-01-10-2025-1)

---

## Template 13: Cinematic Video Ad Campaign (Multi-Model)

**What it produces:** Polished cinematic video ads — AI generates scripts, then produces multiple short video clips, merges them into a final ad, and auto-publishes across all major platforms. Uses dual video models for A/B testing.

**Content type:** Brand Advertisement / Commercial

**Node chain:**
1. **Campaign Brief** (Google Sheets / Form) — Product details, target audience, campaign goals
2. **Script Generation** (GPT-4o) — Writes ad script with scene breakdowns
3. **Image Generation** (Seedream / Nano Banana) — Creates key frames for each scene
4. **Video Generation A** (Veo 3) — Generates cinematic clips from scenes
5. **Video Generation B** (Sora 2) — Alternate clips for A/B comparison
6. **Video Merge** — Combines best clips into polished final ad
7. **Multi-Platform Publish** (Blotato) — Auto-posts to TikTok, Instagram, LinkedIn, X, YouTube, Facebook, Pinterest, Threads, Bluesky
8. **Analytics Tracking** — Track performance across platforms

**AI Models:** GPT-4o, Seedream, Nano Banana, Veo 3 (Google), Sora 2 (OpenAI)
**Source:** [n8n Video Ad Campaigns with Veo 3](https://n8n.io/workflows/9200-automate-and-publish-video-ad-campaigns-with-nanobanana-seedream-gpt-4o-veo-3/)

---

## Template 14: Talking Avatar Product Presenter

**What it produces:** AI avatar talking-head video — a digital presenter (generated from a single photo) delivers a scripted product pitch with lip-synced speech, expressive gestures, and auto-generated TikTok-optimized title. Auto-posts to TikTok.

**Content type:** Product Pitch / Spokesperson

**Node chain:**
1. **Avatar Image Input** — Upload reference photo of desired presenter
2. **Script Input** (Text) — Product pitch script
3. **Expression Prompt** — Guide avatar emotion/style ("enthusiastic product reviewer")
4. **Voice Generation** (ElevenLabs via Fal.ai) — Generate voiceover audio
5. **Avatar Animation** (InfiniteTalk via Fal.ai) — Animate avatar with lip-sync + expression
6. **Title Generation** (GPT-4o-mini) — Create optimized post title (<60 chars)
7. **Auto-Publish** (Postiz) — Post to TikTok with optimized title

**AI Models:** ElevenLabs (via Fal.ai), InfiniteTalk (WanVideo 2.1 + MultiTalk), GPT-4o-mini
**Source:** [n8n Talking Avatar Videos](https://n8n.io/workflows/8378-create-talking-avatar-videos-with-elevenlabs-and-infinitalk-and-auto-post-to-tiktok/)

---

## Template 15: Ultimate Modular Marketing Workflow

**What it produces:** Flexible marketing asset creator — generates on-brand visual content by compositing AI-generated or uploaded elements (logos, people, characters, products) onto generated or custom backgrounds. Supports blog images, social posts, product shots, and watermarked content.

**Content type:** Multi-Purpose Marketing Assets

**Node chain:**
1. **Foreground Input** — Load checkpoint, LoRA, and prompt for focal element (product/logo/person)
2. **Background Input** — Load checkpoint, LoRA, and prompt for background scene
3. **Foreground Generation** (SDXL / Any Checkpoint) — Generate or load focal element
4. **Background Generation** (SDXL / Any Checkpoint) — Generate or load background
5. **FreeU Enhancement** — Apply FreeU quality boost to foreground and/or background
6. **Compositing** — Position elements, apply masks, blend
7. **Logo/Watermark Overlay** — Add brand logo or watermark
8. **ControlNet Integration** (Optional) — Apply poses or structural controls
9. **Export** — Final marketing asset

**AI Models:** SDXL (or any Stable Diffusion checkpoint), LoRA adapters, FreeU, optional ControlNet
**Source:** [OpenArt Ultimate Modular Marketing Workflow](https://openart.ai/workflows/indri_weird_87/ultimate-modular-marketing-workflow/Dux3orM5G8cZYG8T0Lvm)

---

## Template 16: Multimodal Product Ad Pipeline (Fuser)

**What it produces:** Complete product advertising package — hero images, lifestyle shots, 6-8 second video clips, and voiceover — all visually consistent through a shared "brand nucleus" (style board, color LUT, logo).

**Content type:** Full Ad Package (Image + Video + Audio)

**Node chain:**
1. **Brand Nucleus Setup** — Create style board with hex codes, textures, palette LUT, brand descriptor
2. **Product Photo Input** — Upload true-to-color product photo
3. **Reference Compositions** — Upload 2 reference images for desired composition style
4. **Hero Image Generation** (Text-to-Image Node) — Generate crisp hero image locked to brand palette
5. **Lifestyle Image Generation** (Image-to-Image Node) — Generate product-in-context lifestyle shot
6. **Video Generation** (Video Node) — Create 6-8 second product video with locked camera angle/color temp
7. **Voiceover** (TTS Node) — Generate brand-consistent narration
8. **Consistency Check** — Verify all outputs match brand nucleus (color, style, lighting)
9. **Export Package** — All assets bundled for campaign deployment

**AI Models:** Nano Banana Pro, Veo 3/3.1, ElevenLabs TTS, various (connected via Fuser canvas)
**Source:** [Skywork Fuser Multimodal Product Ad Workflow](https://skywork.ai/blog/agent/fuser-multimodal-product-ad-workflow/)

---

## Template 17: UGC E-Commerce Video from Google Sheets

**What it produces:** Automated UGC-style video ads generated at scale from a product spreadsheet — input product details and photos into Google Sheets, and the workflow generates realistic UGC video creative automatically for each product row.

**Content type:** E-Commerce UGC Ads (Batch)

**Node chain:**
1. **Google Sheets Input** — Product rows with name, description, image URL, target audience
2. **Row Processing** — Split into individual product entries
3. **Script Generation** (GPT-4o) — Write UGC-style ad script per product
4. **Product Image Enhancement** (Nano Banana) — Enhance product photo for video use
5. **Video Generation** (WAN 2.2 / Veo 3) — Generate UGC-style video per product
6. **Batch Assembly** — Compile all generated videos
7. **Quality Review** — Preview generated batch
8. **Export/Publish** — Deliver to ad platforms or store

**AI Models:** GPT-4o, Nano Banana (Gemini), WAN 2.2, Veo 3 (via Fal.ai)
**Source:** [n8n UGC Ads from Google Sheets](https://n8n.io/workflows/8205-generate-ugc-ads-from-google-sheets-with-falai-models-nano-banana-wan22-veo3/)

---

## Template 18: Product Video from Product Images (Auto-Commercial)

**What it produces:** Full commercial video generated directly from product images — AI analyzes the product, writes a script, generates scenes, adds voiceover, and produces a ready-to-run video ad.

**Content type:** Product Commercial / Auto-Ad

**Node chain:**
1. **Product Image Input** — Upload product photos
2. **Product Analysis** (GPT-4o Vision) — Analyze product features, colors, category
3. **Script Generation** (GPT-4o) — Write commercial script based on analysis
4. **Scene Planning** — Break script into visual scenes with camera directions
5. **Scene Generation** (Veo 3.1) — Generate video clips for each scene
6. **Voiceover** (ElevenLabs) — Narration matching script
7. **Video Merge** — Combine all scenes into final commercial
8. **Music & SFX** — Add background music and sound effects
9. **Platform Publish** — Auto-post to advertising platforms

**AI Models:** GPT-4o (vision + text), Veo 3.1, ElevenLabs
**Source:** [n8n AI Video Ad Generator from Product Images](https://webspacekit.com/n8n-workflows/ai-commercial-video-generator-from-product-images/)

---

## Template 19: AI Ad Creator (ComfyUI VLM)

**What it produces:** Complete advertising campaign materials — enter campaign parameters (product, audience, goals), and a Visual Language Model generates ad concepts, copy, and visuals. Supports multi-language output with built-in translation.

**Content type:** Ad Campaign Creative

**Node chain:**
1. **Campaign Input** — Product info, target audience, campaign goals, brand guidelines (fields can be left empty for AI suggestions)
2. **VLM Processing** (Visual Language Model) — Analyzes inputs and generates creative direction
3. **Ad Copy Generation** — Headlines, body text, CTAs in target language
4. **Visual Generation** — Ad images based on VLM creative direction
5. **Translation** (Optional) — Multi-language support for non-supported languages
6. **Review & Iterate** — Queue prompt, review, adjust
7. **Export** — Final ad creative package

**AI Models:** VLM (Visual Language Model) nodes, translation models
**Source:** [OpenArt Ad Creator for Comfy](https://openart.ai/workflows/skb/ad-creator-for-comfy/KnCfGCT0WkWCYXKgk4WJ)

---

## Template 20: Logo & Brand Asset Animator

**What it produces:** Animated brand assets — takes a static logo or brand element, applies textures/materials (plush, metal, glass, wood), and generates a short video of the textured logo. Perfect for brand intros, social media posts, and ad outros.

**Content type:** Brand Animation / Logo Reveal

**Node chain:**
1. **Logo Input** — Upload logo/logotype image
2. **Texture Input** — Upload or select desired texture (leather, chrome, fabric, etc.)
3. **Element Input** (Optional) — Additional design elements (particles, smoke, etc.)
4. **Texture Application** (Diffusion Model) — Apply texture to logo with material-aware rendering
5. **Element Compositing** — Add extra design elements around logo
6. **Video Animation** (AnimateDiff / WAN 2.2) — Animate the textured logo (reveal, spin, pulse)
7. **Export** — Video loop and static frame versions

**AI Models:** Stable Diffusion (texture generation), AnimateDiff / WAN 2.2 (animation)
**Source:** [ComfyUI Apply Texture + Elements to Logo](https://comfy.org/workflows/templates-textured_logo_elements/)

---

## Template 21: Day-in-the-Life Product Placement

**What it produces:** Lifestyle "day in the life" content with product naturally integrated — AI generates a short video of a person using the product in their daily routine (morning routine, commute, workout, cooking, etc.).

**Content type:** Day-in-the-Life / Lifestyle Content

**Node chain:**
1. **Product Input** — Product image + name + category
2. **Character Input** — Reference image or description of target persona
3. **Scenario Selection** — Choose lifestyle scenario (morning routine, gym, office, cooking, etc.)
4. **Script Generation** (GPT-4o / Gemini) — Write authentic day-in-the-life narrative
5. **Scene Generation** (Sora 2 / Veo 3.1) — Generate lifestyle video clips with product integration
6. **Character Consistency** — Maintain same character across all clips
7. **Voiceover** (ElevenLabs) — Casual, authentic-sounding narration
8. **Music Layer** — Add trending/lifestyle background music
9. **Caption Overlay** — Animated captions matching platform trends
10. **Export** — TikTok/Instagram Reels optimized

**AI Models:** GPT-4o, Sora 2 / Veo 3.1 (character consistency), ElevenLabs
**Source:** [HeyGen AI Product Placement](https://www.heygen.com/tool/ai-product-placement), [n8n Consistent Character Videos](https://n8n.io/workflows/11276-generate-and-publish-ai-videos-with-sora-2-veo-31-gemini-and-blotato/)

---

## Template 22: Unboxing Video Generator

**What it produces:** AI-generated unboxing experience video — shows a package arriving, being opened, and the product being revealed with excitement and close-up shots. Mimics popular unboxing content creator style.

**Content type:** Unboxing / Product Reveal

**Node chain:**
1. **Product Input** — Product image + packaging image (optional)
2. **Unboxing Script** (GPT-4o) — Write unboxing narration with excitement beats
3. **First Frame** — Generate packaging/box arrival scene
4. **Last Frame** — Generate product revealed in full glory
5. **Transition Video** (WAN 2.2 FLF) — Generate smooth unboxing motion between frames
6. **Reaction Overlay** (Optional) — Add emoji reactions or text callouts
7. **Voiceover** (ElevenLabs) — Excited, authentic unboxing narration
8. **Sound Effects** — Package tearing, reveal whoosh, etc.
9. **Export** — Vertical video format for social media

**AI Models:** GPT-4o, WAN 2.2 (First-Last-Frame), ElevenLabs, Nano Banana Pro (frame generation)
**Source:** Composite from [UGCGen Templates](https://ugcgen.ai/), [WAN 2.2 FLF Workflow](https://www.nextdiffusion.ai/tutorials/wan-22-first-last-frame-video-generation-in-comfyui)

---

## Template 23: Product Video Auto-Animator (Veo 3.1)

**What it produces:** Automatically animates static e-commerce product photos into short video clips — adds motion, camera movement, and dynamic lighting to make catalog images come alive for product listings and ads.

**Content type:** E-Commerce Product Animation

**Node chain:**
1. **Product Catalog Input** (Google Sheets) — Rows with product images and descriptions
2. **Row Iterator** — Process each product
3. **Image Enhancement** (Nano Banana) — Enhance product photo quality
4. **Animation Generation** (Veo 3.1) — Generate 5-10 second animated product video
5. **Storage** (Google Drive) — Save generated videos
6. **Batch Export** — All animated product videos ready for store upload

**AI Models:** Nano Banana (enhancement), Veo 3.1 (Google, animation)
**Source:** [n8n Veo 3.1 Product Photo Animator](https://github.com/anirudhaeran/Automated-UGC-Ad)

---

## Template 24: Consistent Multi-Shot Product Photography

**What it produces:** Multiple consistent product shots from a single input image — generates the product from different angles, in different settings, maintaining visual consistency across all shots. Ideal for creating a full product photo set without a photoshoot.

**Content type:** Product Photography Set

**Node chain:**
1. **Product Image Input** — Upload single product reference photo
2. **Angle/Shot Selection** — Choose desired angles: front, side, top-down, lifestyle, close-up
3. **Multi-Shot Generation** (Nano Banana Pro) — Generate consistent product views from all angles
4. **Background Variants** — Generate each shot with different backgrounds (studio, lifestyle, contextual)
5. **Lighting Consistency** — Ensure matched lighting across all variants
6. **Color Calibration** — Match colors to original product reference
7. **Export** — Full photo set in e-commerce-ready formats

**AI Models:** Nano Banana Pro (Gemini 3 Pro Image, multi-image consistency, up to 14 image blending)
**Source:** [ComfyUI Single Image to Multiple Consistent Shots](https://comfy.org/workflows/templates-multiple_consistent_shots-nb_pro/)

---

## Template 25: Short-Form POV Content Generator

**What it produces:** Point-of-view style short-form videos — the viewer sees the product experience from a first-person perspective. Popular format for food, beauty, fashion, and tech products. Auto-generates and publishes.

**Content type:** POV / First-Person Content

**Node chain:**
1. **Content Brief** (Google Sheets) — Product, POV scenario description, mood
2. **Script Generation** (OpenAI GPT-4) — Write POV narrative with scene directions
3. **Scene Image Generation** (Flux) — Create POV-perspective images for each scene
4. **Video Generation** (Kling AI) — Animate POV scenes with natural camera movement
5. **Voiceover** (ElevenLabs) — Internal monologue or reaction narration
6. **Captions** — Auto-generate trending caption style
7. **Video Assembly** (Creatomate) — Compile scenes with transitions
8. **Multi-Platform Publish** — Post to TikTok, Instagram Reels, YouTube Shorts

**AI Models:** GPT-4, Flux, Kling AI, ElevenLabs, Creatomate
**Source:** [n8n AI-Powered Short-Form Video Generator](https://n8n.io/workflows/3121-ai-powered-short-form-video-generator-with-openai-flux-kling-and-elevenlabs/)

---

## Summary Table

| # | Template Name | Content Type | Key Models | Output Format |
|---|---|---|---|---|
| 1 | UGC Talking Head Testimonial | Testimonial | GPT-4o, ElevenLabs, WaveSpeed | Video (9:16, 1:1, 16:9) |
| 2 | Product Scene Transformation | Product Demo | Nano Banana, Wan VACE 2.1 | Video |
| 3 | Cinematic First-Frame Last-Frame Ad | Before/After | WAN 2.2 14B | Video |
| 4 | Automated Multi-Platform Campaign | Social Content | GPT-4o, Flux, Kling, ElevenLabs | Video (multi-platform) |
| 5 | Product Photography Ad Poster | Static Ad | Flux, IC Light, Llama | Image |
| 6 | Branding Product Shot | Product Mockup | SeedDream-v4 | Image |
| 7 | Product Image to Hero Shot | Hero Image | SD, ICLight, CLIP | Image |
| 8 | Ad Poster/Asset Generator | Ad Creative | Nano Banana Pro, Flux | Image |
| 9 | Faceless Explainer Video | Tutorial/How-To | Gemini, Leonardo, ElevenLabs | Video |
| 10 | 3D Product Video from 2D | 360 Product View | Fal.ai, Remove.bg | Video |
| 11 | UGC Walk-and-Talk (Sora 2) | UGC Testimonial | Sora 2, Gemini 2.5 Pro | Video (x3) |
| 12 | Eye-Catching Product Video Ad | Product Ad | Flux, IPA, AnimateDiff | Video |
| 13 | Cinematic Video Ad Campaign | Commercial | GPT-4o, Veo 3, Sora 2 | Video (multi-platform) |
| 14 | Talking Avatar Presenter | Product Pitch | ElevenLabs, InfiniteTalk | Video (TikTok) |
| 15 | Ultimate Modular Marketing | Marketing Assets | SDXL, LoRA, FreeU | Image |
| 16 | Multimodal Product Ad Pipeline | Full Ad Package | Nano Banana, Veo 3, TTS | Image + Video + Audio |
| 17 | UGC from Google Sheets | E-Commerce UGC | GPT-4o, WAN 2.2, Veo 3 | Video (batch) |
| 18 | Auto-Commercial from Images | Product Commercial | GPT-4o Vision, Veo 3.1 | Video |
| 19 | AI Ad Creator (VLM) | Campaign Creative | VLM, Translation | Image + Copy |
| 20 | Logo & Brand Asset Animator | Brand Animation | SD, AnimateDiff/WAN 2.2 | Video |
| 21 | Day-in-the-Life Placement | Lifestyle Content | GPT-4o, Sora 2/Veo 3.1 | Video |
| 22 | Unboxing Video Generator | Unboxing/Reveal | GPT-4o, WAN 2.2 FLF | Video |
| 23 | Product Video Auto-Animator | Product Animation | Nano Banana, Veo 3.1 | Video |
| 24 | Consistent Multi-Shot Photography | Photo Set | Nano Banana Pro | Images (set) |
| 25 | Short-Form POV Content | POV Content | GPT-4, Flux, Kling, ElevenLabs | Video |

---

## Key AI Models Referenced

| Model | Provider | Use Case |
|---|---|---|
| GPT-4o / GPT-4o-mini | OpenAI | Script writing, product analysis, content strategy |
| Gemini 2.5 Pro | Google | Script generation, prompt engineering, research |
| Nano Banana Pro | Google DeepMind | Image generation, product photography, 4K, text rendering |
| Flux / FluxFill-dev | Black Forest Labs | Image generation, inpainting, product compositing |
| SeedDream-v4 | ByteDance/Doubao | Branded product shots, logo overlay |
| SDXL | Stability AI | General image generation, marketing assets |
| Sora 2 | OpenAI | Video generation, character-consistent UGC |
| Veo 3 / 3.1 | Google | Cinematic video generation, product animation |
| WAN 2.2 | Alibaba | Video generation, first-last-frame transitions |
| Kling AI | Kuaishou | Video generation from images |
| AnimateDiff | Community | Image-to-video animation |
| ElevenLabs | ElevenLabs | Text-to-speech, voiceover, voice cloning |
| InfiniteTalk | Community | Talking head lip-sync from single image |
| WaveSpeed | WaveSpeed | Frame-by-frame lip synchronization |
| Leonardo AI | Leonardo | Image generation for scenes |
| ICLight | Community | Lighting enhancement for product photography |
| Remove.bg | Kaleido | Background removal |
| Creatomate | Creatomate | Video assembly and rendering |
| Shotstack | Shotstack | Video editing and rendering |

---

## Key Source Platforms

| Platform | URL | Type |
|---|---|---|
| n8n | n8n.io/workflows | No-code automation workflows |
| OpenArt | openart.ai/workflows | ComfyUI workflow sharing |
| ComfyUI Official | comfy.org/workflows | Official ComfyUI templates |
| ComfyDeploy | studio.comfydeploy.com | ComfyUI cloud deployment |
| RunComfy | runcomfy.com/comfyui-workflows | ComfyUI cloud runner |
| MimicPC | mimicpc.com/workflows | ComfyUI cloud GPU |
| Banana Pro AI Studio | bananaproai.com/studio | Visual workflow canvas |
| Skywork Fuser | skywork.ai | Multimodal workflow builder |
