import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Toolbar } from '@mui/material';
import { Link } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import BedroomChildIcon from '@mui/icons-material/BedroomChild';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['admin', 'user'] },
    { text: 'Diákok', icon: <PeopleIcon />, path: '/students', roles: ['admin', 'user'] },
    { text: 'Szobák', icon: <BedroomChildIcon />, path: '/rooms', roles: ['admin'] },
    { text: 'Jelentések', icon: <AssessmentIcon />, path: '/reports', roles: ['admin'] },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      variant="temporary"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Divider />
      <List>
        {menuItems
          .filter(item => item.roles.includes(user?.admin ? 'admin' : 'user'))
          .map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              onClick={onClose}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
