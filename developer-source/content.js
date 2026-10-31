// Public-source content snapshot. All external links can be edited here.
export const profile = {
  name: 'Tanveer Shaikh',
  indexedDisplayName: 'Tanveer Khan',
  handle: 'tanveer_shaikh_official',
  instagram: 'https://www.instagram.com/tanveer_shaikh_official/',
  management: 'https://www.instagram.com/socialbridge.co.in/',
  researchedOn: '2026-10-15',
  film: { youtubeId: 'biI3D6gS7Aw', url: 'https://www.youtube.com/watch?v=biI3D6gS7Aw' }
};

export const media = [
  {
    id: 'reel-gym', category: 'comedy', type: 'video',
    title: 'When the gym becomes the scene',
    short: 'GYM MODE.\nCOMEDY ON.',
    subtitle: 'Instagram archive · 00:35',
    label: 'PUBLIC REEL / 01',
    src: './media/reel-01.mp4', poster: './media/reel-gym.webp',
    original: profile.instagram,
    description: 'A comedy scene at the gym. Public video retrieved from the linked Instagram profile archive; original post permalink was not exposed.'
  },
  {
    id: 'reel-street', category: 'comedy', type: 'video',
    title: 'Characters around the corner',
    short: 'STREET SCENE.\nFULL CHARACTER.',
    subtitle: 'Instagram archive · 01:02',
    label: 'PUBLIC REEL / 02',
    src: './media/reel-02.mp4', poster: './media/reel-street.webp',
    original: profile.instagram,
    description: 'An outdoor comedy scene from the public Instagram archive. Original post permalink was not exposed.'
  },
  {
    id: 'film', category: 'film', type: 'youtube',
    title: 'Amravati Ke Potte',
    short: 'BEYOND\nTHE REELS.',
    subtitle: 'Short film · 2025 · YouTube',
    label: 'FILM / EXECUTIVE PRODUCER',
    poster: './media/film-poster.webp',
    original: profile.film.url,
    description: 'Amravati Ke Potte, published by Aarish Shah19. Tanveer is credited as executive producer in the film description.'
  },
  {
    id: 'reel-wait', category: 'comedy', type: 'instagram',
    title: 'Wait for end',
    short: 'WAIT FOR\nTHE END.',
    subtitle: 'Indexed Instagram selection · External embed',
    label: 'INSTAGRAM / ORIGINAL POST',
    shortcode: 'DZmyfC3s_wh',
    cover: 'lime',
    original: 'https://www.instagram.com/p/DZmyfC3s_wh/',
    description: 'A post linked by Modash to this profile. Instagram may require sign-in or block embeds; use Open Original if the embed is unavailable.'
  },
  {
    id: 'reel-sher', category: 'comedy', type: 'instagram',
    title: 'Hum 2 sher',
    short: 'HUM\n2 SHER.',
    subtitle: 'With Aarish Shah · External embed',
    label: 'INSTAGRAM / COLLABORATION',
    shortcode: 'DSAcZ4WiO-B',
    cover: 'purple',
    original: 'https://www.instagram.com/p/DSAcZ4WiO-B/',
    description: 'Publicly indexed collaboration mentioning Tanveer and Aarish Shah. Embed availability is controlled by Instagram.'
  }
];

export const gallery = [
  { src: './media/portrait-original.webp', title: 'From the Instagram archive', kind: 'PHOTOGRAPH', description: 'Public photograph from @tanveer_shaikh_official, featuring a group of three people. No identities of the other people are claimed.', source: profile.instagram },
  { src: './media/avatar.webp', title: 'The public profile picture', kind: 'PORTRAIT', description: 'The profile image associated with @tanveer_shaikh_official, retrieved through the Modash public listing.', source: 'https://www.modash.io/find-influencers/india/amravati' },
  { src: './media/reel-gym.webp', title: 'In character, at the gym', kind: 'REEL STILL', description: 'Still from the included gym comedy reel. Extracted from the public-profile video, not a separate photograph.', source: profile.instagram },
  { src: './media/film-premiere.webp', title: 'Amravati Ke Potte premiere', kind: 'FILM / PRESS', description: 'Premiere photograph from the Mahavoice coverage of Amravati Ke Potte. Event reported as 25 September 2025.', source: 'https://mahavoice.com/amravati-ke-potte-a-story-make-you-laugh-and-cry/' },
  { src: './media/reel-street.webp', title: 'A scene from the street', kind: 'REEL STILL', description: 'Still from the included outdoor comedy reel, extracted from the public-profile video.', source: profile.instagram },
  { src: './media/film-poster.webp', title: 'The short film, in one frame', kind: 'FILM ARTWORK', description: 'Amravati Ke Potte artwork as published in the Mahavoice report. Original artwork and film remain credited to their creators.', source: 'https://mahavoice.com/amravati-ke-potte-a-story-make-you-laugh-and-cry/' }
];

export const cities = [
  { name: 'Amravati', share: 12.1 },
  { name: 'Nagpur', share: 7.58 },
  { name: 'Aurangabad', share: 6.94 },
  { name: 'Mumbai', share: 4.29 },
  { name: 'Pune', share: 3.43 }
];

export const sources = [
  { name: 'Instagram · original public profile', url: profile.instagram, note: 'The profile supplied by the user. Direct live profile retrieval was limited; no claim of account access or endorsement.' },
  { name: 'Imginn · public profile archive', url: 'https://imginn.com/tanveer_shaikh_official/', note: 'Indexed display name, bio, two public videos and one public photograph. Counters are snapshots, not live metrics.' },
  { name: 'Modash · Amravati creator listing', url: 'https://www.modash.io/find-influencers/india/amravati', note: 'Dated follower and engagement estimates, average reel plays, audience-city estimates and original post links. Retrieved snapshots differed slightly.' },
  { name: 'YouTube · Amravati Ke Potte', url: profile.film.url, note: 'Published 25 September 2025 by Aarish Shah19. Primary film description names Tanveer as executive producer.' },
  { name: 'Mahavoice · film coverage', url: 'https://mahavoice.com/amravati-ke-potte-a-story-make-you-laugh-and-cry/', note: 'Report dated 27 September 2025. Lists Tanveer in the cast and as executive producer, and supplies the premiere image and film artwork.' },
  { name: 'ClickAnalytic · secondary profile listing', url: 'https://www.clickanalytic.com/find-influencers/india/amravati-influencers/', note: 'Older listing: 271K followers and 2.86% estimated engagement, demonstrating why third-party snapshots should not be treated as live counts.' }
];
