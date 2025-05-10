import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '../../context/AuthContext';

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      // Appeler la fonction de déconnexion du contexte d'authentification
      logout();
      navigate("/signin");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      handleClose();
    }
  };

  const handleProfile = () => {
    // Normalize the role for consistent comparison
    const normalizedRole = user?.role ? user.role.toLowerCase() : '';
    console.log('UserDropdown - Profile - User role:', user?.role, 'Normalized role:', normalizedRole);

    // Navigate to the appropriate profile page based on user role
    if (normalizedRole === 'admin') {
      navigate("/profile");
    } else if (normalizedRole === 'teamleader') {
      navigate("/team-leader/profile");
    } else if (normalizedRole === 'member') {
      navigate("/member/profile");
    } else {
      // Default fallback - redirect to role selection
      navigate("/role-select");
    }
    handleClose();
  };

  const handleDashboard = () => {
    // Normalize the role for consistent comparison
    const normalizedRole = user?.role ? user.role.toLowerCase() : '';
    console.log('UserDropdown - Dashboard - User role:', user?.role, 'Normalized role:', normalizedRole);

    // Navigate to the appropriate dashboard based on user role
    if (normalizedRole === 'admin') {
      navigate("/dashboard");
    } else if (normalizedRole === 'teamleader') {
      navigate("/team-leader-dashboard");
    } else if (normalizedRole === 'member') {
      navigate("/member-dashboard");
    } else {
      // Default fallback - redirect to role selection
      navigate("/role-select");
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
