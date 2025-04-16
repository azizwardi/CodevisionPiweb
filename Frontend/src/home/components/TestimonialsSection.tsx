import React, { useRef, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Avatar, Grid, useTheme, Rating } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import StarIcon from '@mui/icons-material/Star';
import { images } from '../../assets/imageUrls';

// Define animations
const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const shine = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const TestimonialCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  overflow: 'visible',
  position: 'relative',
  paddingTop: theme.spacing(6),
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
  },
}));

const QuoteIcon = styled(FormatQuoteIcon)(({ theme }) => ({
  position: 'absolute',
  top: -20,
  left: 20,
  color: theme.palette.primary.main,
  fontSize: 40,
  transform: 'rotate(180deg)',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '50%',
  padding: theme.spacing(1),
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  animation: `${float} 6s ease-in-out infinite`,
}));

const AvatarWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: 'auto',
  paddingTop: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  border: `3px solid ${theme.palette.background.paper}`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  marginRight: theme.spacing(2),
}));

const StyledRating = styled(Rating)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
  '& .MuiRating-iconFilled': {
    color: theme.palette.warning.main,
  },
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

const TestimonialContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(3),
}));

const QuoteText = styled(Typography)(({ theme }) => ({
  fontStyle: 'italic',
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&::before, &::after': {
    content: '""',
    position: 'absolute',
    width: 10,
    height: 10,
    opacity: 0.1,
    backgroundColor: theme.palette.primary.main,
  },
  '&::before': {
    top: -5,
    left: -5,
  },
  '&::after': {
    bottom: -5,
    right: -5,
  },
}));

const testimonials = [
  {
    quote: "This platform has transformed how our team collaborates. We've seen a 40% increase in productivity since we started using it.",
    name: "Sarah Johnson",
    title: "Project Manager, TechCorp",
    avatar: images.testimonial1,
    rating: 5,
  },
  {
    quote: "The task management features are intuitive and powerful. It's helped us stay organized and meet deadlines consistently.",
    name: "Michael Chen",
    title: "Team Lead, InnovateSoft",
    avatar: images.testimonial2,
    rating: 5,
  },
  {
    quote: "As a remote team, communication was challenging until we found this platform. Now we're all on the same page, all the time.",
    name: "Emily Rodriguez",
    title: "Marketing Director, GrowthBrand",
    avatar: images.testimonial3,
    rating: 4,
  },
];

const TestimonialsSection: React.FC = () => {
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
      id="testimonials"
      ref={sectionRef}
      sx={{
        py: 10,
        bgcolor: 'background.paper',
        opacity: 0,
        transition: 'opacity 0.6s ease-in-out',
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
            TESTIMONIALS
          </Typography>

          <SectionTitle
            component="h2"
            variant="h3"
            align="center"
            color="text.primary"
            sx={{ fontWeight: 800 }}
          >
            What Our Users Say
          </SectionTitle>

          <Typography
            variant="h6"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ mb: 6, maxWidth: 800, mx: 'auto', mt: 2 }}
          >
            Don't just take our word for it - hear from some of our satisfied users
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {testimonials.map((testimonial, index) => (
            <Grid
              item
              key={index}
              xs={12}
              md={4}
              sx={{
                animation: `${fadeInUp} 0.5s ease-out forwards`,
                animationDelay: `${index * 0.2}s`,
                opacity: 0
              }}
            >
              <TestimonialCard elevation={3}>
                <QuoteIcon fontSize="large" />
                <TestimonialContent>
                  <StyledRating
                    value={testimonial.rating}
                    readOnly
                    precision={0.5}
                    icon={<StarIcon fontSize="inherit" />}
                    emptyIcon={<StarIcon fontSize="inherit" />}
                  />

                  <QuoteText variant="body1">
                    "{testimonial.quote}"
                  </QuoteText>

                  <AvatarWrapper>
                    <StyledAvatar
                      src={testimonial.avatar}
                      alt={testimonial.name}
                    />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.title}
                      </Typography>
                    </Box>
                  </AvatarWrapper>
                </TestimonialContent>
              </TestimonialCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default TestimonialsSection;
