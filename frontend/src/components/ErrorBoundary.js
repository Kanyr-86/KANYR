import React, { Component } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="h6">Hiba történt az alkalmazásban</Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {this.state.error?.message || 'Ismeretlen hiba'}
            </Typography>
          </Alert>
          <Button variant="contained" onClick={this.handleReload}>
            Oldal újratöltése
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
