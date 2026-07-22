/**
 * Content for the Noor onboarding intro slides. Kept separate from presentation
 * so copy can be tuned without touching layout code.
 */

import { ImageSourcePropType } from 'react-native';

export type IntroSlide = {
  key: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
};

export const INTRO_SLIDES: IntroSlide[] = [
  {
    key: 'guidance',
    title: 'Guidance, whenever you need it',
    subtitle: 'Ask anything about the Qur’an and receive clear, grounded answers.',
    image: require('../../../assets/onboarding/guidance.jpg'),
  },
  {
    key: 'authentic',
    title: 'Rooted in the Qur’an',
    subtitle: 'Every answer cites real ayat — Arabic, translation, and reference.',
    image: require('../../../assets/onboarding/authentic.jpg'),
  },
  {
    key: 'daily',
    title: 'A little light, every day',
    subtitle: 'One ayah each morning to steady your heart and start your day.',
    image: require('../../../assets/onboarding/daily.jpg'),
  },
];
