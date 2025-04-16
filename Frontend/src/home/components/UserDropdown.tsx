import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import { Typography } from '@mui/material';

interface User {
  _id?: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatarUrl?: string;
  username?: string;
}

interface DecodedToken {
  id: string;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

export default function UserDropdown() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);

        // Handle both structures
        const userData = decodedToken.user || decodedToken;

        // Set the user state with token data
        setUser({
          _id: userData.id,
          name: userData.name,
          firstName: userData.firstName || "",
          lastName: userData.lastName || "",
          username: userData.name || "",
          email: userData.email || "",
          avatarUrl: localStorage.getItem("userAvatarUrl") || "/images/user/owner.jpg",
          role: userData.role || "",
        });

        // Fetch complete user data if we have an ID
        if (userData.id) {
          fetchUserById(userData.id);
        }
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  const fetchUserById = async (userId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:5000/api/user/showByid/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.warn("No token found in localStorage. Redirecting to signin...");
        navigate("/signin");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.removeItem("authToken");
      localStorage.removeItem("userRole");

      // Dispatch an event to notify other components about the logout
      window.dispatchEvent(new Event('authChange'));

      navigate("/signin");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      handleClose();
    }
  };

  const handleProfile = () => {
    // Navigate to the appropriate profile page based on user role
    if (user?.role === 'admin') {
      navigate("/profile");
    } else if (user?.role === 'TeamLeader') {
      navigate("/team-leader/profile");
    } else if (user?.role === 'member') {
      navigate("/member/profile");
    } else {
      navigate("/profile");
    }
    handleClose();
  };

  const handleDashboard = () => {
    // Navigate to the appropriate dashboard based on user role
    if (user?.role === 'admin') {
      navigate("/dashboard");
    } else if (user?.role === 'TeamLeader') {
      navigate("/team-leader-dashboard");
    } else if (user?.role === 'member') {
      navigate("/member-dashboard");
    } else {
      navigate("/dashboard");
    }
    handleClose();
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            sx={{ width: 32, height: 32 }}
            src={user?.avatarUrl ?
              (user.avatarUrl.startsWith('http') ? user.avatarUrl :
               user.avatarUrl.startsWith('/') ? `http://localhost:5000${user.avatarUrl}` :
               `http://localhost:5000/${user.avatarUrl}`) :
              "/images/user/owner.jpg"}
            alt={user?.name || "User"}
          >
            {user?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {user?.username || user?.name || "User"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || "user@example.com"}
          </Typography>
          {user?.role && (
            <Typography
              variant="caption"
              sx={{
                display: 'inline-block',
                mt: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                bgcolor: user.role === 'admin' ? 'error.light' :
                         user.role === 'TeamLeader' ? 'primary.light' :
                         'success.light',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {user.role === 'TeamLeader' ? 'Team Leader' :
               user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Typography>
          )}
        </Box>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleDashboard}>
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          Dashboard
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
