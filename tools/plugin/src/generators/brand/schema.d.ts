export interface BrandGeneratorSchema {
  /** Brand name (dasherized), e.g. `midnight`. */
  name: string;
  /** Primary seed color (hex). */
  primary: string;
  /** Tertiary seed color (hex). */
  tertiary: string;
  /** Neutral seed color (hex). */
  neutral: string;
  /** Output directory for the SCSS pair. */
  directory?: string;
}
