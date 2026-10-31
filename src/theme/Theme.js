// إعداد مظهر الواجهة واتجاهاتها عبر `Theme`.
import { createTheme } from '@mui/material/styles';

export const createAppTheme = (direction = 'rtl') => createTheme({
  direction,
  palette: {
    primary: { main: '#F47920', light: '#F79952', dark: '#D96210', contrastText: '#FFFFFF' },
    secondary: { main: '#171A2F', light: '#2E3250', dark: '#0B0D1A', contrastText: '#FFFFFF' },
    background: { default: '#F8F9FA', paper: '#FFFFFF' },
    text: { primary: '#171A2F', secondary: '#6B7280' },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: `'Tajawal', 'Inter', sans-serif`,
    fontSize: 15,
    fontWeightRegular: 500,
    h1: { fontWeight: 950, color: '#171A2F', letterSpacing: '-0.035em', lineHeight: 1.12 },
    h2: { fontWeight: 950, color: '#171A2F', letterSpacing: '-0.03em', lineHeight: 1.16 },
    h3: { fontWeight: 900, color: '#171A2F', letterSpacing: '-0.025em', lineHeight: 1.2 },
    h4: { fontWeight: 900, color: '#171A2F', letterSpacing: '-0.02em', lineHeight: 1.22 },
    h5: { fontWeight: 900, color: '#171A2F', lineHeight: 1.25 },
    h6: { fontWeight: 900, color: '#171A2F', lineHeight: 1.3 },
    body1: { fontWeight: 550, lineHeight: 1.65 },
    body2: { fontWeight: 550, lineHeight: 1.55 },
    button: { fontWeight: 850, letterSpacing: '-0.01em', textTransform: 'none' },
    caption: { fontWeight: 650, lineHeight: 1.45 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 42,
          paddingInline: 14,
          gap: 6,
          whiteSpace: 'normal',
          lineHeight: 1.25,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: { flexShrink: 0 },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: { gap: 8, flexWrap: 'wrap', alignItems: 'center' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { gap: 8, flexWrap: 'wrap', padding: 16 },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: { gap: 12, flexWrap: 'wrap' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { gap: 8, alignItems: 'flex-start' },
        message: { minWidth: 0, overflowWrap: 'anywhere' },
      },
    },
    MuiFormControl: {
      defaultProps: { margin: 'none' },
    },
  },
});

export default createAppTheme('rtl');
