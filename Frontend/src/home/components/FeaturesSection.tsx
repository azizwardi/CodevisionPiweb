import React from 'react';
import { Box, Container, Grid, Typography, Paper, Card, CardMedia, CardContent, useTheme, Divider } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import GroupsIcon from '@mui/icons-material/Groups';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import InsightsIcon from '@mui/icons-material/Insights';
import SecurityIcon from '@mui/icons-material/Security';
import ChatIcon from '@mui/icons-material/Chat';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import LockIcon from '@mui/icons-material/Lock';
import { images } from '../../assets/imageUrls';

// Define animations
const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)',
  },
  [theme.breakpoints.up('md')]: {
    minHeight: '450px', // Ensure consistent height for side-by-side cards
  },
}));

const FeatureMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  position: 'relative',
  overflow: 'hidden',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
  },
  [theme.breakpoints.up('md')]: {
    height: 220, // Slightly taller images for desktop
  },
}));

const FeatureContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.main,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  marginTop: '-50px',
  zIndex: 2,
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
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

// Feature categories
const featureCategories = [
  {
    category: 'Collaboration',
    features: [
      {
        title: 'Team Collaboration',
        description: 'Work together seamlessly with your team members, share resources, and communicate effectively.',
        icon: <GroupsIcon fontSize="large" />,
        image: images.teamCollaboration,
      },
      {
        title: 'Real-time Communication',
        description: 'Chat, video calls, and instant messaging keep your team connected no matter where they are located.',
        icon: <ChatIcon fontSize="large" />,
        image: images.communication,
      },
    ]
  },
  {
    category: 'Project Management',
    features: [
      {
        title: 'Task Management',
        description: 'Create, assign, and track tasks with ease. Set priorities, deadlines, and monitor progress in real-time.',
        icon: <TaskAltIcon fontSize="large" />,
        image: images.taskManagement,
      },
      {
        title: 'Project Planning',
        description: 'Plan and organize projects with intuitive tools for scheduling, resource allocation, and milestone tracking.',
        icon: <AssignmentIcon fontSize="large" />,
        image: images.projectPlanning,
      },
    ]
  },
  {
    category: 'Analytics',
    features: [
      {
        title: 'Analytics & Reporting',
        description: 'Gain valuable insights with comprehensive analytics and reporting tools to measure team performance.',
        icon: <InsightsIcon fontSize="large" />,
        image: images.analytics,
      },
      {
        title: 'Performance Metrics',
        description: 'Track key performance indicators and generate custom reports to optimize your team\'s productivity.',
        icon: <BarChartIcon fontSize="large" />,
        image: images.performanceMetrics,
      },
    ]
  },
  {
    category: 'Security',
    features: [
      {
        title: 'Secure & Reliable',
        description: 'Your data is protected with enterprise-grade security measures and regular backups.',
        icon: <SecurityIcon fontSize="large" />,
        image: images.security,
      },
      {
        title: 'Access Control',
        description: 'Fine-grained permissions and role-based access control ensure data is only accessible to authorized users.',
        icon: <LockIcon fontSize="large" />,
        image: images.accessControl,
      },
    ]
  },
];

// Flatten features for grid display
const allFeatures = featureCategories.flatMap(category => category.features);

const FeaturesSection: React.FC = () => {
  const theme = useTheme();

  return (
    <Box id="features" sx={{ py: 10, bgcolor: 'background.paper' }}>
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
            POWERFUL FEATURES
          </Typography>

          <SectionTitle
            component="h2"
            variant="h3"
            align="center"
            color="text.primary"
            sx={{ fontWeight: 800 }}
          >
            Everything You Need
          </SectionTitle>

          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            sx={{ maxWidth: 700, mx: 'auto', mt: 2 }}
          >
            Our platform provides all the tools your team needs to collaborate effectively,
            manage projects efficiently, and achieve your goals.
          </Typography>
        </Box>

        {/* Feature Categories */}
        {featureCategories.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 8 }}>
            {categoryIndex > 0 && (
              <Divider
                sx={{
                  mb: 6,
                  opacity: 0.7,
                  '&::before, &::after': {
                    borderColor: 'primary.light',
                  }
                }}
              />
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography
                variant="h4"
                component="h3"
                sx={{
                  fontWeight: 700,
                  position: 'relative',
                  display: 'inline-block',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: 60,
                    height: 3,
                    backgroundColor: theme.palette.primary.main,
                  }
                }}
              >
                {category.category}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4, width: '100%' }}>
              {category.features.map((feature, featureIndex) => (
                <Box
                  key={`${categoryIndex}-${featureIndex}`}
                  sx={{
                    flex: 1,
                    width: '100%',
                    animation: `${fadeInUp} 0.5s ease-out forwards`,
                    animationDelay: `${(categoryIndex * 2 + featureIndex) * 0.1}s`,
                    opacity: 0
                  }}
                >
                  <FeatureCard sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <FeatureMedia
                      image={feature.image}
                      title={feature.title}
                    />
                    <FeatureContent>
                      <IconWrapper>
                        {feature.icon}
                      </IconWrapper>
                      <Typography variant="h5" component="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </FeatureContent>
                  </FeatureCard>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Container>
    </Box>
  );
};

export default FeaturesSection;
