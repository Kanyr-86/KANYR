import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getStudentStatistics, getActiveStudents, getRooms } from '../services/api';
import PeopleIcon from '@mui/icons-material/People';
import BedroomChildIcon from '@mui/icons-material/BedroomChild';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { DataGrid } from '@mui/x-data-grid';
import useApiData from '../hooks/useApiData';
import { commonColumns, createColumns } from '../utils/gridUtils';

const Dashboard = () => {
  const { user } = useAuth();
  
  // Use optimized API hooks with caching
  const {
    data: stats,
    loading: statsLoading,
    error: statsError
  } = useApiData(getStudentStatistics, [], { keyPrefix: 'dashboard-stats' });

  const {
    data: activeStudents,
    loading: studentsLoading,
    error: studentsError
  } = useApiData(getActiveStudents, [], { keyPrefix: 'dashboard-students' });

  const {
    data: rooms,
    loading: roomsLoading,
    error: roomsError
  } = useApiData(getRooms, [], { keyPrefix: 'dashboard-rooms' });

  const loading = statsLoading || studentsLoading || roomsLoading;
  const error = statsError || studentsError || roomsError;

  const studentColumns = useMemo(() => createColumns([
    commonColumns.diakId,
    commonColumns.nev,
    commonColumns.email,
    commonColumns.telefonszam,
    commonColumns.szoba
  ]), []);

  const roomColumns = useMemo(() => createColumns([
    commonColumns.szobaId,
    commonColumns.szobaSzama,
    commonColumns.osszesHely,
    commonColumns.foglaltHelyek,
    commonColumns.szabadHelyek
  ]), []);

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
