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
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, ml: 4 }}> {/* Added gap and margin */}
              <Button variant="text" color="info" size="medium"> {/* Increased size */}
                One
              </Button>
              <Button variant="text" color="info" size="medium">
                Two
              </Button>
              <Button variant="text" color="info" size="medium">
                Three
              </Button>
              <Button variant="text" color="info" size="medium">
                Four
              </Button>
              <Button
                variant="text"
                color="info"
                size="medium"
                sx={{ minWidth: 0 }}
              >
                Five
              </Button>
              <Button
                variant="text"
                color="info"
                size="medium"
                sx={{ minWidth: 0 }}
              >
                Six
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
            <Link to="/signin" style={{ textDecoration: "none" }}>
              <Button color="primary" variant="text" size="medium"> {/* Increased size */}
                Sign in
              </Button>
            </Link>

            <Link to="/signup" style={{ textDecoration: "none" }}>
              <Button color="secondary" variant="contained" size="medium"> {/* Increased size */}
                Sign up
              </Button>
            </Link>
            <ColorModeIconDropdown />
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
                <MenuItem sx={{ py: 1.5 }}>One</MenuItem> {/* Increased padding */}
                <MenuItem sx={{ py: 1.5 }}>Two</MenuItem>
                <MenuItem sx={{ py: 1.5 }}>Three</MenuItem>
                <MenuItem sx={{ py: 1.5 }}>Four</MenuItem>
                <MenuItem sx={{ py: 1.5 }}>Five</MenuItem>
                <MenuItem sx={{ py: 1.5 }}>Six</MenuItem>
                <Divider sx={{ my: 3 }} />
                <MenuItem>
                  <Button color="primary" variant="contained" fullWidth size="medium"> {/* Increased size */}
                    Sign up
                  </Button>
                </MenuItem>
                <MenuItem>
                  <Button color="primary" variant="outlined" fullWidth size="medium"> {/* Increased size */}
                    Sign in
                  </Button>
                </MenuItem>
              </Box>
            </Drawer>
          </Box>
        </StyledToolbar>
      </Container>
    </AppBar>
  );
}