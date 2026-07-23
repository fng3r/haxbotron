import { getAlpha2Codes } from 'i18n-iso-countries';

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

export const countries = Object.keys(getAlpha2Codes())
  .map((code) => ({
    code,
    name: countryNames.of(code) ?? code,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));
