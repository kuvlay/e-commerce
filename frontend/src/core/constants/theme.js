// Design System Constants - Orange-Based Theme
export const COLORS = {
  // Primary Orange Colors
  primary: '#FF6B35',      // Vibrant orange - main brand color
  primaryLight: '#FF8A65',  // Light orange
  primaryDark: '#E64A19',   // Dark orange
  
  // Complementary Colors
  secondary: '#FF9800',     // Amber orange
  accent: '#FFC107',        // Golden accent
  
  // Supporting Colors
  tertiary: '#795548',      // Warm brown
  quaternary: '#607D8B',    // Blue grey for contrast
  
  // Background Colors
  background: '#FFF8F5',    // Very light orange tint
  backgroundAlt: '#FFF3E0', // Light orange background
  
  // Text Colors
  textPrimary: '#3E2723',   // Dark brown for text
  textSecondary: '#5D4037', // Medium brown
  textLight: '#FFFFFF',     // White for dark backgrounds
  textMuted: '#8D6E63',     // Muted brown
  
  // Neutral Colors
  white: '#FFFFFF',
  black: '#000000',
  neutral100: '#F5F5F5',
  neutral200: '#EEEEEE',
  neutral300: '#E0E0E0',
  neutral400: '#BDBDBD',
  neutral500: '#9E9E9E',
  neutral600: '#757575',
  neutral700: '#616161',
  neutral800: '#424242',
  neutral900: '#212121',
};

export const GRADIENTS = {
  // Orange-based gradients
  primary: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
  secondary: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
  accent: `linear-gradient(135deg, ${COLORS.accent} 0%, ${COLORS.secondary} 100%)`,
  hero: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
  
  // Complementary gradients
  warm: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.tertiary} 100%)`,
  sunset: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.primaryDark} 100%)`,
  elegant: `linear-gradient(135deg, ${COLORS.tertiary} 0%, ${COLORS.quaternary} 100%)`,
  
  // Background gradients
  backgroundGradient: `linear-gradient(135deg, ${COLORS.background} 0%, ${COLORS.backgroundAlt} 100%)`,
  cardGradient: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.background} 100%)`,
};

export const SHADOWS = {
  text: '2px 2px 4px rgba(0,0,0,0.3)',
  textOrange: `2px 2px 8px ${COLORS.primary}40`,
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  cardHover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  cardOrange: `0 8px 25px ${COLORS.primary}30`,
  cardOrangeHover: `0 15px 35px ${COLORS.primary}40`,
  glow: `0 0 20px ${COLORS.primary}50`,
  glowStrong: `0 0 30px ${COLORS.primary}70`,
};

export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};