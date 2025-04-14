import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Button, Grid, useTheme, useMediaQuery } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { images, screenshots } from '../../assets/imageUrls';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const HeroBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  marginBottom: theme.spacing(4),
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundImage: `url(${images.hero})`,
  padding: theme.spacing(10, 0),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(15, 0),
    minHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)',
  },
}));

const HeroContent = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(3),
  animation: `${fadeIn} 1s ease-out`,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(6),
    paddingRight: 0,
  },
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  lineHeight: 1.2,
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('md')]: {
    fontSize: '3.5rem',
  },
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  opacity: 0.9,
  [theme.breakpoints.up('md')]: {
    fontSize: '1.5rem',
    maxWidth: '80%',
  },
}));

const HeroImageContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'none',
  [theme.breakpoints.up('md')]: {
    display: 'block',
    animation: `${float} 6s ease-in-out infinite`,
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '30px',
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0,118,255,0.39)',
  },
}));

const HeroSection: React.FC = () => {
  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    setIsVisible(true);
  }, []);

  return (
    <HeroBox>
      <Container maxWidth="lg">
        <Grid container alignItems="center" spacing={4}>
          <Grid item xs={12} md={6}>
            <HeroContent sx={{ opacity: isVisible ? 1 : 0, transition: 'opacity 1s ease-out' }}>
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="overline"
                  sx={{
                    color: theme.palette.primary.light,
                    letterSpacing: 2,
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  WELCOME TO CODEVISIONPIWEB
                </Typography>
              </Box>

              <HeroTitle variant="h1" component="h1" color="inherit">
                Collaborate, Manage, Succeed
              </HeroTitle>

              <HeroSubtitle variant="h5" color="inherit" paragraph>
                A powerful platform for teams to collaborate, manage projects, and achieve success together.
              </HeroSubtitle>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 4 }}>
                <StyledButton
                  variant="contained"
                  color="primary"
                  size="large"
                  component={RouterLink}
                  to="/signup"
                  endIcon={<ArrowForwardIcon />}
                >
                  Get Started Free
                </StyledButton>

                <StyledButton
                  variant="outlined"
                  color="inherit"
                  size="large"
                  component={RouterLink}
                  to="/signin"
                  sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
                >
                  Sign In
                </StyledButton>
              </Box>

              <Box sx={{ mt: 4, display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  display: 'flex',
                  mr: 2,
                }}>
                  {[1, 2, 3].map((i) => (
                    <Box
                      key={i}
                      component="img"
                      src={images[`testimonial${i}` as keyof typeof images]}
                      alt={`User ${i}`}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '2px solid white',
                        marginLeft: i > 1 ? '-10px' : 0,
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="inherit" sx={{ opacity: 0.9 }}>
                  Trusted by <b>10,000+</b> teams worldwide
                </Typography>
              </Box>
            </HeroContent>
          </Grid>

          {isMediumScreen && (
            <Grid item md={6}>
              <HeroImageContainer>
                <Box
                  component="img"
                  src={screenshots.dashboard}
                  alt="Dashboard Preview"
                  sx={{
                    maxWidth: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    transform: 'perspective(1000px) rotateY(-10deg) rotateX(5deg)',
                  }}
                />
              </HeroImageContainer>
            </Grid>
          )}
        </Grid>
      </Container>
    </HeroBox>
  );
};

export default HeroSection;
