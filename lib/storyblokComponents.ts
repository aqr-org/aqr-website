import dynamic from 'next/dynamic';

// Lazy load Storyblok components to reduce initial bundle size
// These components are only needed when rendering Storyblok content
const Page = dynamic(() => import("@/components/storyblok/Page"), { ssr: true });
const Hero_Homepage = dynamic(() => import('@/components/storyblok/Hero_Homepage'), { ssr: true });
const PictureCard = dynamic(() => import('@/components/storyblok/PictureCard'), { ssr: true });
const RichText = dynamic(() => import('@/components/storyblok/RichText'), { ssr: true });
const Glossary_Entry = dynamic(() => import('@/components/storyblok/Glossary_Entry'), { ssr: true });
const Article = dynamic(() => import('@/components/storyblok/Article'), { ssr: true });
const Webinar = dynamic(() => import('@/components/storyblok/Webinar'), { ssr: true });
const Event = dynamic(() => import('@/components/storyblok/Event'), { ssr: true });
const BeaconForm = dynamic(() => import('@/components/storyblok/BeaconForm'), { ssr: true });
const Youtube = dynamic(() => import('@/components/storyblok/Youtube'), { ssr: true });
const Audio = dynamic(() => import('@/components/storyblok/Audio'), { ssr: true });
const Image = dynamic(() => import('@/components/storyblok/Image'), { ssr: true });
const Flex = dynamic(() => import('@/components/storyblok/Flex'), { ssr: true });
const Button = dynamic(() => import('@/components/storyblok/Button'), { ssr: true });
const FeatureCards = dynamic(() => import('@/components/storyblok/FeatureCards'), { ssr: true });
const HomepageJoinUsBlock = dynamic(() => import('@/components/storyblok/HomepageJoinUsBlock'), { ssr: true });
const LatestSeasonCalendar = dynamic(() => import('@/components/storyblok/LatestSeasonCalendar'), { ssr: true });
const BoardMembers = dynamic(() => import('@/components/storyblok/BoardMembers'), { ssr: true });
const TestimonialCarousel = dynamic(() => import('@/components/storyblok/TestimonialCarousel'), { ssr: true });
const Expandable = dynamic(() => import('@/components/storyblok/Expandable'), { ssr: true });
const Homepage_joinus_benefits = dynamic(() => import('@/components/storyblok/Homepage_joinus_benefits'), { ssr: true });
const Homepage_awards_section = dynamic(() => import('@/components/storyblok/Homepage_awards_section'), { ssr: true });
const Homepage_awards_section_shortlist_item2 = dynamic(() => import('@/components/storyblok/Homepage_awards_section_shortlist_item2'), { ssr: true });
const Homepage_awards_section_shortlist_item_wrapper = dynamic(() => import('@/components/storyblok/Homepage_awards_section_shortlist_item_wrapper'), { ssr: true });
const PodcastCard = dynamic(() => import('@/components/storyblok/PodcastCard'), { ssr: true });
const Timeline = dynamic(() => import('@/components/storyblok/Timeline'), { ssr: true });
const TimelineMilestone = dynamic(() => import('@/components/storyblok/TimelineMilestone'), { ssr: true });

const components = {
  hero_homepage: Hero_Homepage,
  page: Page,
  picture_card: PictureCard,
  rich_text: RichText,
  glossary_entry: Glossary_Entry,
  article: Article,
  webinar: Webinar,
  event: Event,
  beacon_form: BeaconForm,
  youtube: Youtube,
  audio: Audio,
  image: Image,
  flex: Flex,
  button: Button,
  feature_cards: FeatureCards,
  homepage_joinus_block: HomepageJoinUsBlock,
  latest_season_calendar: LatestSeasonCalendar,
  board_members: BoardMembers,
  testimonials_carousel: TestimonialCarousel,
  expandable: Expandable,
  homepage_joinus_benefits: Homepage_joinus_benefits,
  homepage_awards_section: Homepage_awards_section,
  homepage_awards_section_shortlist_item2: Homepage_awards_section_shortlist_item2,
  homepage_awards_section_shortlist_item: Homepage_awards_section_shortlist_item_wrapper,
  podcast_card: PodcastCard,
  timeline: Timeline,
  timeline_milestone: TimelineMilestone,
};

export default components ;