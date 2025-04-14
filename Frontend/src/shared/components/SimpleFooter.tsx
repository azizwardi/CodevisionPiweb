import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import TwitterIcon from '@mui/icons-material/X';

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary">
      {'Copyright © '}
      <Link color="inherit" href="https://mui.com/">
        CodevisionPiweb
      </Link>{' '}
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function SimpleFooter() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        py: 3,
        width: '100%',
        mt: 4,
        borderTop: '1px solid #e0e0e0'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          py: 1
        }}>
          <Copyright />
          <Stack direction="row" spacing={1}>
            <IconButton
              color="inherit"
              size="small"
              href="https://github.com"
              aria-label="GitHub"
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              href="https://twitter.com"
              aria-label="Twitter"
            >
              <TwitterIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              href="https://linkedin.com"
              aria-label="LinkedIn"
            >
              <LinkedInIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
