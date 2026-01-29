import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Button, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomOccupancy } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Form validation schema
const roomSchema = yup.object().shape({
  szoba_szama: yup.string().required('A szoba száma kötelező'),
  osszes_hely: yup.number().required('A férőhelyek száma kötelező').min(1, 'Minimum 1 férőhely'),
});

const RoomsPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'
  const [occupancyData, setOccupancyData] = useState(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(roomSchema),
    defaultValues: {
      szoba_szama: '',
      osszes_hely: 1,
    }
  });

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRooms();
      setRooms(response.data.szobas || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError(err.response?.data?.error || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoomOccupancy = useCallback(async (roomId) => {
    try {
      const response = await getRoomOccupancy(roomId);
      setOccupancyData(response.data);
    } catch (err) {
      console.error('Failed to fetch occupancy:', err);
      setError(err.response?.data?.error || 'Failed to load occupancy data');
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleOpenDialog = useCallback((mode, room = null) => {
    setDialogMode(mode);
    setCurrentRoom(room);

    if (room) {
      reset({
        szoba_szama: room.szoba_szama,
        osszes_hely: room.osszes_hely,
      });
    } else {
      reset({
        szoba_szama: '',
        osszes_hely: 1,
      });
    }

    setOpenDialog(true);
  }, [reset]);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setCurrentRoom(null);
  }, []);

  const onSubmit = useCallback(async (data) => {
    try {
      if (dialogMode === 'create') {
        await createRoom(data);
      } else if (dialogMode === 'edit' && currentRoom) {
        await updateRoom(currentRoom.szoba_id, data);
      }

      fetchRooms();
      handleCloseDialog();
    } catch (err) {
      console.error('Room operation failed:', err);
      setError(err.response?.data?.error || 'Operation failed');
    }
  }, [dialogMode, currentRoom, fetchRooms, handleCloseDialog]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm('Biztosan törölni szeretné ezt a szobát?')) {
      try {
        await deleteRoom(id);
        fetchRooms();
      } catch (err) {
        console.error('Delete failed:', err);
        setError(err.response?.data?.error || 'Delete failed');
      }
    }
  }, [fetchRooms]);

  const columns = useMemo(() => [
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
      field: 'actions',
      headerName: 'Műveletek',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleOpenDialog('edit', params.row)}
            startIcon={<EditIcon />}
          >
            Szerkeszt
          </Button>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.szoba_id)}
            startIcon={<DeleteIcon />}
          >
            Töröl
          </Button>
          <Button
            variant="outlined"
            color="info"
            size="small"
            onClick={() => fetchRoomOccupancy(params.row.szoba_id)}
          >
            Foglaltság
          </Button>
        </Box>
      ),
    },
  ], [handleOpenDialog, handleDelete, fetchRoomOccupancy]);

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
        Szobák kezelése
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Szobák listája</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            disabled={!user?.admin}
          >
            Új szoba hozzáadása
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, mb: 2 }}>
        <DataGrid
          rows={rooms}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          getRowId={(row) => row.szoba_id}
        />
      </Paper>

      {occupancyData && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Szoba foglaltság: {occupancyData.szoba?.szoba_szama}
          </Typography>
          <Typography variant="body1">
            Férőhelyek: {occupancyData.szoba?.osszes_hely} | Foglalt: {occupancyData.bekoltozesek?.length || 0}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Aktuális lakók:
          </Typography>
          {occupancyData.bekoltozesek?.length > 0 ? (
            <ul>
              {occupancyData.bekoltozesek.map((bekoltozes) => (
                <li key={bekoltozes.bekoltozes_id}>
                  {bekoltozes.diak?.nev} (Beköltözés: {new Date(bekoltozes.bekoltozes_datum).toLocaleDateString()})
                  {bekoltozes.kikoltozes_datum && ` - Kiköltözés: ${new Date(bekoltozes.kikoltozes_datum).toLocaleDateString()}`}
                </li>
              ))}
            </ul>
          ) : (
            <Typography variant="body2">Jelenleg nincs lakó ebben a szobában.</Typography>
          )}
        </Paper>
      )}

      {/* Room Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Új szoba hozzáadása' : 'Szoba szerkesztése'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="szoba_szama"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Szoba száma"
                    fullWidth
                    error={!!errors.szoba_szama}
                    helperText={errors.szoba_szama?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="osszes_hely"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Férőhelyek száma"
                    fullWidth
                    type="number"
                    error={!!errors.osszes_hely}
                    helperText={errors.osszes_hely?.message}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Mégse
          </Button>
          <Button onClick={handleSubmit(onSubmit)} color="primary" variant="contained">
            {dialogMode === 'create' ? 'Hozzáadás' : 'Mentés'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomsPage;
