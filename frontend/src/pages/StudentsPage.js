import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getStudents, createStudent, updateStudent, deleteStudent, enrollStudent, transferStudent, moveOutStudent } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Form validation schema
const studentSchema = yup.object().shape({
  nev: yup.string().required('A név kötelező').min(2, 'Minimum 2 karakter'),
  email: yup.string().email('Érvényes email címet adjon meg').required('Az email kötelező'),
  telefonszam: yup.string().required('A telefonszám kötelező'),
  szuletesi_datum: yup.date().required('A születési dátum kötelező'),
  szemelyi_igazolvany_szam: yup.string().required('A személyi igazolvány szám kötelező'),
  taj_szam: yup.string().required('A TAJ szám kötelező'),
  diakigazolvany_szam: yup.string().required('A diákigazolvány szám kötelező'),
  kapcsolat_tipusa: yup.string().oneOf(['anya', 'apa', 'gondviselo']).required('A kapcsolat típusa kötelező'),
  szulo_id: yup.number().positive('Érvényes szülő ID-t adjon meg').integer(),
  cim_id: yup.number().positive('Érvényes cím ID-t adjon meg').integer(),
});

const StudentsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' or 'edit'

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(studentSchema),
    defaultValues: {
      nev: '',
      email: '',
      telefonszam: '',
      szuletesi_datum: '',
      szemelyi_igazolvany_szam: '',
      taj_szam: '',
      diakigazolvany_szam: '',
      kapcsolat_tipusa: 'anya',
      szulo_id: '',
      cim_id: '',
    }
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getStudents();
      setStudents(response.data.diaks || []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError(err.response?.data?.error || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode, student = null) => {
    setDialogMode(mode);
    setCurrentStudent(student);

    if (student) {
      reset({
        nev: student.nev,
        email: student.email,
        telefonszam: student.telefonszam,
        szuletesi_datum: student.szuletesi_datum,
        szemelyi_igazolvany_szam: student.szemelyi_igazolvany_szam,
        taj_szam: student.taj_szam,
        diakigazolvany_szam: student.diakigazolvany_szam,
        kapcsolat_tipusa: student.kapcsolat_tipusa,
        szulo_id: student.szulo_id || '',
        cim_id: student.cim_id || '',
      });
    } else {
      reset({
        nev: '',
        email: '',
        telefonszam: '',
        szuletesi_datum: '',
        szemelyi_igazolvany_szam: '',
        taj_szam: '',
        diakigazolvany_szam: '',
        kapcsolat_tipusa: 'anya',
        szulo_id: '',
        cim_id: '',
      });
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentStudent(null);
  };

  const onSubmit = async (data) => {
    try {
      if (dialogMode === 'create') {
        await createStudent(data);
      } else if (dialogMode === 'edit' && currentStudent) {
        await updateStudent(currentStudent.diak_id, data);
      }

      fetchStudents();
      handleCloseDialog();
    } catch (err) {
      console.error('Student operation failed:', err);
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Biztosan törölni szeretné ezt a diákot?')) {
      try {
        await deleteStudent(id);
        fetchStudents();
      } catch (err) {
        console.error('Delete failed:', err);
        setError(err.response?.data?.error || 'Delete failed');
      }
    }
  };

  const columns = [
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
      field: 'actions',
      headerName: 'Műveletek',
      width: 150,
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
            onClick={() => handleDelete(params.row.diak_id)}
            startIcon={<DeleteIcon />}
          >
            Töröl
          </Button>
        </Box>
      ),
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
        Diákok kezelése
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Diákok listája</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog('create')}
            disabled={!user?.admin}
          >
            Új diák hozzáadása
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={students}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          getRowId={(row) => row.diak_id}
        />
      </Paper>

      {/* Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Új diák hozzáadása' : 'Diák szerkesztése'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Controller
                name="nev"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Név"
                    fullWidth
                    error={!!errors.nev}
                    helperText={errors.nev?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="telefonszam"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Telefonszám"
                    fullWidth
                    error={!!errors.telefonszam}
                    helperText={errors.telefonszam?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="szuletesi_datum"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Születési dátum (YYYY-MM-DD)"
                    fullWidth
                    error={!!errors.szuletesi_datum}
                    helperText={errors.szuletesi_datum?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="szemelyi_igazolvany_szam"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Személyi igazolvány szám"
                    fullWidth
                    error={!!errors.szemelyi_igazolvany_szam}
                    helperText={errors.szemelyi_igazolvany_szam?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="taj_szam"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="TAJ szám"
                    fullWidth
                    error={!!errors.taj_szam}
                    helperText={errors.taj_szam?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="diakigazolvany_szam"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Diákigazolvány szám"
                    fullWidth
                    error={!!errors.diakigazolvany_szam}
                    helperText={errors.diakigazolvany_szam?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="kapcsolat_tipusa"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Kapcsolat típusa"
                    select
                    fullWidth
                    error={!!errors.kapcsolat_tipusa}
                    helperText={errors.kapcsolat_tipusa?.message}
                  >
                    <MenuItem value="anya">Anya</MenuItem>
                    <MenuItem value="apa">Apa</MenuItem>
                    <MenuItem value="gondviselo">Gondviselő</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="szulo_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Szülő ID (opcionális)"
                    fullWidth
                    type="number"
                    error={!!errors.szulo_id}
                    helperText={errors.szulo_id?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="cim_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Cím ID (opcionális)"
                    fullWidth
                    type="number"
                    error={!!errors.cim_id}
                    helperText={errors.cim_id?.message}
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

export default StudentsPage;
