import React, { useEffect, useRef } from 'react';
import { Box, Container, Grid, Typography, Card, CardContent, CardMedia, useTheme, useMediaQuery } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import { images } from '../../assets/imageUrls';

// Define animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const StepCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.4s ease',
  '&:hover': {
    transform: 'translateY(-10px) scale(1.02)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
  },
}));

const StepMedia = styled(CardMedia)(({ theme }) => ({
  height: 180,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
  },
}));

const StepNumber = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 50,
  height: 50,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontWeight: 'bold',
  fontSize: '1.25rem',
  position: 'absolute',
  top: 15,
  left: 15,
  zIndex: 2,
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  border: '2px solid white',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(2),
  color: theme.palette.primary.main,
  animation: `${pulse} 3s infinite ease-in-out`,
}));

const StepContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  position: 'relative',
  display: 'inline-block',
  marginBottom: theme.spacing(6),
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '2px',
  },
}));

const ConnectingLine = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: 'calc(50% + 20px)',
  right: 'calc(50% + 20px)',
  height: 3,
  backgroundColor: theme.palette.divider,
  zIndex: 0,
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));

const steps = [
  {
    number: 1,
    title: 'Create Your Account',
    description: 'Sign up and create your profile in just a few minutes.',
    icon: <PersonAddIcon fontSize="large" />,
    image: images.createAccount,
  },
  {
    number: 2,
    title: 'Build Your Team',
    description: 'Invite team members and organize them into groups based on roles.',
    icon: <GroupWorkIcon fontSize="large" />,
    image: images.buildTeam,
  },
  {
    number: 3,
    title: 'Manage Projects & Tasks',
    description: 'Create projects, assign tasks, and set deadlines for your team.',
    icon: <AssignmentIcon fontSize="large" />,
    image: images.manageTasks,
  },
  {
    number: 4,
    title: 'Track Progress',
    description: 'Monitor team performance and project progress with detailed analytics.',
    icon: <BarChartIcon fontSize="large" />,
    image: images.trackProgress,
  },
];

const HowItWorksSection: React.FC = () => {
  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.up('md'));
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
      id="how-it-works"
      ref={sectionRef}
      sx={{
        py: 10,
        bgcolor: 'grey.50',
        opacity: 0,
        transition: 'opacity 0.6s ease-in-out',
        position: 'relative',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography
            variant="overline"
            component="span"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
              letterSpacing: 1.2,
              mb: 2,
              display: 'block'
            }}
          >
            SIMPLE PROCESS
          </Typography>

          <SectionTitle
            component="h2"
            variant="h3"
            align="center"
            color="text.primary"
            sx={{ fontWeight: 800 }}
          >
            How It Works
          </SectionTitle>

          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 6, maxWidth: 800, mx: 'auto', mt: 2 }}
          >
            Get started with our platform in four simple steps
          </Typography>
        </Box>

        <Box sx={{ position: 'relative' }}>
          {isMediumScreen && (
            <ConnectingLine />
          )}

          <Grid container spacing={4}>
            {steps.map((step, index) => (
              <Grid
                item
                key={step.number}
                xs={12}
                sm={6}
                md={3}
                sx={{
                  animation: `${slideIn} 0.5s ease-out forwards`,
                  animationDelay: `${index * 0.2}s`,
                  opacity: 0,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <StepCard elevation={3}>
                  <StepMedia
                    image={step.image}
                    title={step.title}
                  >
                    <StepNumber>{step.number}</StepNumber>
                  </StepMedia>
                  <StepContent>
                    <IconWrapper>
                      {step.icon}
                    </IconWrapper>
                    <Typography gutterBottom variant="h5" component="h3" sx={{ fontWeight: 700 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </StepCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default HowItWorksSection;
