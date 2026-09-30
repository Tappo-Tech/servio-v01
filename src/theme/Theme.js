import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: { main: '#F47920', light: '#F79952', dark: '#D96210', contrastText: '#FFFFFF' },
    secondary: { main: '#171A2F', light: '#2E3250', dark: '#0B0D1A', contrastText: '#FFFFFF' },
    background: { default: '#F8F9FA', paper: '#FFFFFF' },
    text: { primary: '#171A2F', secondary: '#6B7280' },
    divider: '#E5E7EB',
  },
  typography: { fontFamily: `'Tajawal', 'Inter', sans-serif`, h1: { fontWeight: 700, color: '#171A2F' }, h3: { fontWeight: 700, color: '#171A2F' } },
  shape: { borderRadius: 12 },
});

export default theme;
