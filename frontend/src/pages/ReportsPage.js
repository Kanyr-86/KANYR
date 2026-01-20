import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getStudentStatistics, getActiveStudents, getRooms, generateOccupancyReport, generateStudentReport } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import PeopleIcon from '@mui/icons-material/People';
import BedroomChildIcon from '@mui/icons-material/BedroomChild';

const ReportsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [activeStudents, setActiveStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('occupancy');

  useEffect(() => {
    fetchReportData();
  }, [reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch statistics
      const statsResponse = await getStudentStatistics();
      setStats(statsResponse.data);

      if (reportType === 'occupancy') {
        // Fetch rooms data for occupancy report
        const roomsResponse = await getRooms();
        setRooms(roomsResponse.data.szobas || []);
      } else {
        // Fetch active students for student report
        const studentsResponse = await getActiveStudents();
        setActiveStudents(studentsResponse.data.students || []);
      }

    } catch (err) {
      console.error('Report data fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (type) => {
    try {
      setReportType(type);
    } catch (err) {
      console.error('Report generation failed:', err);
      setError(err.response?.data?.error || 'Report generation failed');
    }
  };

  const handleExport = (format) => {
    // This would be implemented with proper export functionality
    alert(`Exportálás ${format.toUpperCase()} formátumban - ez a funkció még fejlesztés alatt áll`);
  };

  const occupancyColumns = [
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
    {
      field: 'foglaltsagi_arany',
      headerName: 'Foglaltsági arány',
      width: 150,
      valueGetter: (params) => {
        const occupied = params.row.bekoltozesek?.length || 0;
        const total = params.row.osszes_hely || 1;
        return `${Math.round((occupied / total) * 100)}%`;
      }
    },
  ];

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
    {
      field: 'bekoltozes_datum',
      headerName: 'Beköltözés dátuma',
      width: 180,
      valueGetter: (params) => params.row.bekoltozesek?.[0]?.bekoltozes_datum
        ? new Date(params.row.bekoltozesek?.[0]?.bekoltozes_datum).toLocaleDateString()
        : 'N/A'
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Jelentések és statisztikák
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Statistics */}
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
            <PeopleIcon sx={{ fontSize: 50, color: 'success.main' }} />
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
            <BedroomChildIcon sx={{ fontSize: 50, color: 'warning.main' }} />
            <Typography variant="h6">Szabad helyek</Typography>
            <Typography variant="h4">{stats?.availableSpaces || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Report Controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Jelentés típusának kiválasztása
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant={reportType === 'occupancy' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleGenerateReport('occupancy')}
            startIcon={<BedroomChildIcon />}
          >
            Szobafoglaltsági jelentés
          </Button>
          <Button
            variant={reportType === 'students' ? 'contained' : 'outlined'}
            color="primary"
            onClick={() => handleGenerateReport('students')}
            startIcon={<PeopleIcon />}
          >
            Diák jelentés
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleExport('pdf')}
            startIcon={<PictureAsPdfIcon />}
            disabled
          >
            Exportálás PDF-be
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleExport('csv')}
            startIcon={<TableChartIcon />}
            disabled
          >
            Exportálás CSV-be
          </Button>
        </Box>
      </Paper>

      {/* Report Data */}
      <Paper sx={{ height: 600 }}>
        <Typography variant="h6" sx={{ p: 2 }}>
          {reportType === 'occupancy' ? 'Szobafoglaltsági jelentés' : 'Diák jelentés'}
        </Typography>

        {reportType === 'occupancy' ? (
          <DataGrid
            rows={rooms}
            columns={occupancyColumns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            getRowId={(row) => row.szoba_id}
          />
        ) : (
          <DataGrid
            rows={activeStudents}
            columns={studentColumns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            getRowId={(row) => row.diak_id}
          />
        )}
      </Paper>

      {/* Additional Statistics */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Részletes statisztikák
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Átlagos foglaltsági arány:</strong> {stats?.averageOccupancy || 0}%
            </Typography>
            <Typography variant="body1">
              <strong>Legmagasabb foglaltságú szoba:</strong> {stats?.mostOccupiedRoom || 'N/A'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1">
              <strong>Legutóbbi beköltözés:</strong> {stats?.latestMoveIn || 'N/A'}
            </Typography>
            <Typography variant="body1">
              <strong>Legutóbbi kiköltözés:</strong> {stats?.latestMoveOut || 'N/A'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ReportsPage;
