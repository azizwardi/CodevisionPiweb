import React, { useRef, useEffect } from 'react';
import { Box, Container, Typography, Button, Paper, useTheme } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { images } from '../../assets/imageUrls';

// Define animations
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const CtaContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(8),
  color: theme.palette.common.white,
  borderRadius: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  backgroundImage: `url(${images.ctaBackground})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
    zIndex: 1,
  },
  '&:hover': {
    animation: `${pulse} 2s infinite ease-in-out`,
  },
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(10),
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
}));

const CtaTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  marginBottom: theme.spacing(3),
  position: 'relative',
  display: 'inline-block',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -10,
    left: 0,
    width: 100,
    height: 4,
    backgroundColor: theme.palette.secondary.main,
    borderRadius: 2,
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '2.75rem',
  },
}));

const CtaSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  opacity: 0.9,
  maxWidth: 800,
  [theme.breakpoints.up('md')]: {
    fontSize: '1.25rem',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '30px',
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
  },
}));

const ShimmerOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
  backgroundSize: '1000px 100%',
  animation: `${shimmer} 8s infinite linear`,
  zIndex: 1,
}));

const CtaSection: React.FC = () => {
  const theme = useTheme();
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add animation classes when section comes into view
          if (sectionRef.current) {
            sectionRef.current.style.opacity = '1';
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <Box
      ref={sectionRef}
      sx={{
        py: 12,
        bgcolor: 'grey.50',
        opacity: 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      <Container maxWidth="lg">
        <CtaContainer elevation={6}>
          <ShimmerOverlay />
          <ContentWrapper>
            <Box sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              justifyContent: 'space-between',
              gap: 4,
            }}>
              <Box sx={{
                maxWidth: { xs: '100%', md: '60%' },
                textAlign: { xs: 'center', md: 'left' },
              }}>
                <CtaTitle variant="h3" component="h2">
                  Ready to Transform Your Team?
                </CtaTitle>

                <CtaSubtitle variant="h6">
                  Join thousands of teams who have already improved their collaboration and productivity with our platform.
                </CtaSubtitle>

                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', md: 'flex-start' },
                }}>
                  <StyledButton
                    variant="contained"
                    color="secondary"
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
                    to="/contact"
                    sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
                  >
                    Contact Sales
                  </StyledButton>
                </Box>
              </Box>

              <Box sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${fadeIn} 1s ease-out`,
              }}>
                <Box
                  component="img"
                  src="https://cdn-icons-png.flaticon.com/512/6295/6295417.png"
                  alt="Success Icon"
                  sx={{
                    width: 150,
                    height: 150,
                    filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))',
                    animation: `${pulse} 3s infinite ease-in-out`,
                  }}
                />
              </Box>
            </Box>
          </ContentWrapper>
        </CtaContainer>
      </Container>
    </Box>
  );
};

export default CtaSection;
