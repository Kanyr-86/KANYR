import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getStudentStatistics, getActiveStudents, getRooms } from '../services/api';
import PeopleIcon from '@mui/icons-material/People';
import BedroomChildIcon from '@mui/icons-material/BedroomChild';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { DataGrid } from '@mui/x-data-grid';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeStudents, setActiveStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics
        const statsResponse = await getStudentStatistics();
        setStats(statsResponse.data);

        // Fetch active students
        const studentsResponse = await getActiveStudents();
        setActiveStudents(studentsResponse.data.students || []);

        // Fetch rooms
        const roomsResponse = await getRooms();
        setRooms(roomsResponse.data.szobas || []);

      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const studentColumns = [
    { field: 'diak_id', headerName: 'ID', width: 70 },
    { field: 'nev', headerName: 'Név', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'telefonszam', headerName: 'Telefon', width: 150 },
    {
      field: 'szoba',
      headerName: 'Szoba',
      width: 100,
      valueGetter: (params) => params.row.bekoltozesek?.[0]?.szoba?.szoba_szama || 'N/A'
    },
  ];

  const roomColumns = [
    { field: 'szoba_id', headerName: 'ID', width: 70 },
    { field: 'szoba_szama', headerName: 'Szoba száma', width: 150 },
    { field: 'osszes_hely', headerName: 'Férőhelyek', width: 120 },
    {
      field: 'foglalt_helyek',
      headerName: 'Foglalt helyek',
      width: 150,
      valueGetter: (params) => params.row.bekoltozesek?.length || 0
    },
    {
      field: 'szabad_helyek',
      headerName: 'Szabad helyek',
      width: 120,
      valueGetter: (params) => (params.row.osszes_hely || 0) - (params.row.bekoltozesek?.length || 0)
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" gutterBottom>
        Üdvözöljük, {user?.username}!
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.light' }}>
            <PeopleIcon sx={{ fontSize: 50, color: 'primary.main' }} />
            <Typography variant="h6">Összes diák</Typography>
            <Typography variant="h4">{stats?.totalStudents || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.light' }}>
            <CheckCircleIcon sx={{ fontSize: 50, color: 'success.main' }} />
            <Typography variant="h6">Aktív diákok</Typography>
            <Typography variant="h4">{stats?.activeStudents || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.light' }}>
            <BedroomChildIcon sx={{ fontSize: 50, color: 'info.main' }} />
            <Typography variant="h6">Összes szoba</Typography>
            <Typography variant="h4">{stats?.totalRooms || 0}</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.light' }}>
            <WarningIcon sx={{ fontSize: 50, color: 'warning.main' }} />
            <Typography variant="h6">Szabad helyek</Typography>
            <Typography variant="h4">{stats?.availableSpaces || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Legutóbbi aktív diákok
            </Typography>
            <DataGrid
              rows={activeStudents}
              columns={studentColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              getRowId={(row) => row.diak_id}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Szobák állapota
            </Typography>
            <DataGrid
              rows={rooms}
              columns={roomColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              getRowId={(row) => row.szoba_id}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
