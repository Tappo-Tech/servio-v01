// MUI COMPONENTS
import { Box, Typography } from '@mui/material';

// ICONS
import ReportGmailerrorredOutlinedIcon from '@mui/icons-material/ReportGmailerrorredOutlined';
import LanguageToggle from './LanguageToggle';

function NotFound({ title, message }) {
  return (
    <Box sx={{ textAlign: 'center', mt: 10, px: 2 }}>
      <Box sx={{ position: 'absolute', top: 18, insetInlineEnd: 18 }}><LanguageToggle /></Box>
      <ReportGmailerrorredOutlinedIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

export default NotFound;
