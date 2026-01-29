import React from 'react';
import { Box, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Memoized action cell renderers to prevent unnecessary re-renders
export const createActionsRenderer = (onEdit, onDelete, onExport, labels = {}) => {
  return React.memo(({ params }) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {onEdit && (
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => onEdit(params.row)}
          startIcon={<EditIcon />}
        >
          {labels.edit || 'Szerkeszt'}
        </Button>
      )}
      {onDelete && (
        <Button
          variant="contained"
          color="error"
          size="small"
          onClick={() => onDelete(params.row.id || params.row.diak_id || params.row.szoba_id)}
          startIcon={<DeleteIcon />}
        >
          {labels.delete || 'Töröl'}
        </Button>
      )}
      {onExport && (
        <Button
          variant="outlined"
          color="info"
          size="small"
          onClick={() => onExport(params.row)}
          startIcon={<PictureAsPdfIcon />}
        >
          {labels.export || 'Export'}
        </Button>
      )}
    </Box>
  ));
};

// Common column configurations
export const commonColumns = {
  id: { field: 'id', headerName: 'ID', width: 70 },
  diakId: { field: 'diak_id', headerName: 'ID', width: 70 },
  szobaId: { field: 'szoba_id', headerName: 'ID', width: 70 },
  nev: { field: 'nev', headerName: 'Név', width: 200 },
  email: { field: 'email', headerName: 'Email', width: 200 },
  telefonszam: { field: 'telefonszam', headerName: 'Telefon', width: 150 },
  szobaSzama: { field: 'szoba_szama', headerName: 'Szoba száma', width: 150 },
  osszesHely: { field: 'osszes_hely', headerName: 'Férőhelyek', width: 120 },
  foglaltHelyek: {
    field: 'foglalt_helyek',
    headerName: 'Foglalt helyek',
    width: 150,
    valueGetter: (params) => params.row.bekoltozesek?.length || 0
  },
  szabadHelyek: {
    field: 'szabad_helyek',
    headerName: 'Szabad helyek',
    width: 120,
    valueGetter: (params) => (params.row.osszes_hely || 0) - (params.row.bekoltozesek?.length || 0)
  },
  szoba: {
    field: 'szoba',
    headerName: 'Szoba',
    width: 100,
    valueGetter: (params) => params.row.bekoltozesek?.[0]?.szoba?.szoba_szama || 'N/A'
  }
};

// Utility to create memoized column arrays
export const createColumns = (columns, actionsRenderer = null) => {
  const baseColumns = columns.map(col => ({
    ...col,
    sortable: col.sortable !== false,
    filterable: col.filterable !== false,
    resizable: col.resizable !== false
  }));

  if (actionsRenderer) {
    baseColumns.push({
      field: 'actions',
      headerName: 'Műveletek',
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: actionsRenderer
    });
  }

  return baseColumns;
};

// Debounce utility for search inputs
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format date utility
export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('hu-HU');
};

// Format currency utility
export const formatCurrency = (amount) => {
  if (!amount) return '0 Ft';
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0
  }).format(amount);
};