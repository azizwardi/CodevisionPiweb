import * as React from "react";
import { alpha, styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Drawer from "@mui/material/Drawer";
import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ColorModeIconDropdown from "../shared-theme/ColorModeIconDropdown";
import Sitemark from "./SitemarkIcon";
import { Link } from 'react-router-dom';
import UserDropdown from "./UserDropdown";
import { useAuth } from "../../context/AuthContext";

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: "blur(24px)",
  border: "1px solid",
  borderColor: theme.palette.divider,
  backgroundColor: alpha(theme.palette.background.default, 0.4),
  boxShadow: theme.shadows[1],
  padding: "8px 24px", // Increased horizontal padding
  minHeight: "60px", // Increased height
}));

export default function AppAppBar() {
  const [open, setOpen] = React.useState(false);
  const { isAuthenticated } = useAuth();

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  return (
    <AppBar
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: "transparent",
        backgroundImage: "none",
        mt: "calc(var(--template-frame-height, 0px) + 28px)",
      }}
    >
      <Container maxWidth="xl"> {/* Changed from "lg" to "xl" for wider container */}
        <StyledToolbar variant="regular" disableGutters> {/* Changed from "dense" to "regular" */}
          <Box
            sx={{ flexGrow: 1, display: "flex", alignItems: "center", px: 0 }}
          >
            <Sitemark />
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, ml: 4 }}>
              <Button
                variant="text"
                color="info"
                size="medium"
                component="a"
                href="#features"
              >
                Features
              </Button>
              <Button
                variant="text"
                color="info"
                size="medium"
                component="a"
                href="#how-it-works"
              >
                How It Works
              </Button>
              <Button
                variant="text"
                color="info"
                size="medium"
                component="a"
                href="#testimonials"
              >
                Testimonials
              </Button>
              <Button
                variant="text"
                color="info"
                size="medium"
                component="a"
                href="/contact"
              >
                Contact
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 2, // Increased gap
              alignItems: "center",
            }}
          >
            {isAuthenticated ? (
              <>
                <UserDropdown />
                <ColorModeIconDropdown />
              </>
            ) : (
              <>
                <Link to="/signin" style={{ textDecoration: "none" }}>
                  <Button color="primary" variant="text" size="medium">
                    Sign in
                  </Button>
                </Link>

                <Link to="/signup" style={{ textDecoration: "none" }}>
                  <Button color="secondary" variant="contained" size="medium">
                    Sign up
                  </Button>
                </Link>
                <ColorModeIconDropdown />
              </>
            )}
          </Box>
          <Box sx={{ display: { xs: "flex", md: "none" }, gap: 2 }}> {/* Increased gap */}
            <ColorModeIconDropdown size="medium" />
            <IconButton aria-label="Menu button" onClick={toggleDrawer(true)} size="large"> {/* Increased size */}
              <MenuIcon fontSize="medium" /> {/* Increased icon size */}
            </IconButton>
            <Drawer
              anchor="top"
              open={open}
              onClose={toggleDrawer(false)}
              PaperProps={{
                sx: {
                  top: "var(--template-frame-height, 0px)",
                  width: '100%', // Full width drawer
                },
              }}
            >
              <Box sx={{ p: 3, backgroundColor: "background.default" }}> {/* Increased padding */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton onClick={toggleDrawer(false)} size="large"> {/* Increased size */}
                    <CloseRoundedIcon fontSize="medium" /> {/* Increased icon size */}
                  </IconButton>
                </Box>
                <MenuItem
                  sx={{ py: 1.5 }}
                  component="a"
                  href="#features"
                  onClick={toggleDrawer(false)}
                >
                  Features
                </MenuItem>
                <MenuItem
                  sx={{ py: 1.5 }}
                  component="a"
                  href="#how-it-works"
                  onClick={toggleDrawer(false)}
                >
                  How It Works
                </MenuItem>
                <MenuItem
                  sx={{ py: 1.5 }}
                  component="a"
                  href="#testimonials"
                  onClick={toggleDrawer(false)}
                >
                  Testimonials
                </MenuItem>
                <MenuItem
                  sx={{ py: 1.5 }}
                  component="a"
                  href="/contact"
                  onClick={toggleDrawer(false)}
                >
                  Contact
                </MenuItem>
                <Divider sx={{ my: 3 }} />

                {isAuthenticated ? (
                  <>
                    <MenuItem component={Link} to="/profile">
                      <Button color="primary" variant="outlined" fullWidth size="medium">
                        Profile
                      </Button>
                    </MenuItem>
                    <MenuItem component={Link} to="/dashboard">
                      <Button color="primary" variant="contained" fullWidth size="medium">
                        Dashboard
                      </Button>
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem>
                      <Button
                        color="primary"
                        variant="contained"
                        fullWidth
                        size="medium"
                        component={Link}
                        to="/signup"
                      >
                        Sign up
                      </Button>
                    </MenuItem>
                    <MenuItem>
                      <Button
                        color="primary"
                        variant="outlined"
                        fullWidth
                        size="medium"
                        component={Link}
                        to="/signin"
                      >
                        Sign in
                      </Button>
                    </MenuItem>
                  </>
                )}
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}