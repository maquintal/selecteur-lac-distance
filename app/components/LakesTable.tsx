'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    ColumnDef,
    flexRender,
    ColumnFiltersState
} from '@tanstack/react-table';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    IconButton,
    Stack,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
} from '@mui/material';
import {
    FirstPage,
    LastPage,
    NavigateBefore,
    NavigateNext,
    DirectionsCar,
} from '@mui/icons-material';
import { Lake } from '../types/lake';
import Icon from '@mdi/react';
import { mdiFuel, mdiMapMarkerRadiusOutline } from '@mdi/js';
import OfflineBoltOutlinedIcon from '@mui/icons-material/OfflineBoltOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';

const columns: ColumnDef<Lake>[] = [
    {
        id: 'logo',
        header: '',
        cell: ({ row }) => {
            const juridiction = row.original.juridiction;
            if (juridiction?.organisme === "SEPAQ") {
                return (
                    <Image
                        src="/sepaq_logo2.png"
                        alt="Logo SEPAQ"
                        width={30}
                        height={30}
                        style={{ objectFit: 'contain' }}
                    />
                );
            }
            return null;
        },
        enableColumnFilter: false
    },
    {
        accessorKey: 'regionAdministrativeQuebec',
        header: 'Région',
    },
    {
        accessorKey: 'juridiction',
        header: 'Réserve Faunique',
        cell: ({ row }) => {
            const juridiction = row.original.juridiction;
            return juridiction?.organisme === "SEPAQ" ? juridiction.site : '';
        },
        filterFn: (row, columnId, filterValue) => {
            const juridiction = row.original.juridiction;
            const siteName = juridiction?.organisme === "SEPAQ" ? juridiction.site : '';
            return siteName.toLowerCase().includes(filterValue.toLowerCase());
        }
    },
    {
        accessorKey: 'nomDuLac',
        header: 'Nom du lac',
    },
    {
        id: 'motorisation',
        header: 'Motorisation',
        cell: ({ row }) => {
            const { embarcation } = row.original;

            return embarcation.motorisation.type === "electrique" ?
                // <OfflineBoltOutlinedIcon />
                <BoltOutlinedIcon />
                : <Icon path={mdiFuel} size={1} />;

            // if (embarcation.motorisation.type === "electrique") {
            //     return (
            //         <Icon path={mdiMapMarkerRadiusOutline} size={1} />
            //     );
            // } else if (embarcation.motorisation.type === "essence") {
            //     return (
            //         <Icon path={mdiMapMarkerRadiusOutline} size={1} />
            //     );
            // }
            // return null;
        },
        enableColumnFilter: false
    },
    {
        id: 'portage',
        header: 'Accès',
        cell: ({ row }) => {
            const { acces } = row.original;

            if (acces?.portage === "Aucune marche d'approche nécessaire") {
                return (
                    <Icon path={mdiMapMarkerRadiusOutline} size={1} />
                );
            }
            return null;
        },
        enableColumnFilter: false
    },
];

export default function LakesTable() {
    const [data, setData] = useState<Lake[]>([]);
    const [loading, setLoading] = useState(true);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    useEffect(() => {
        const fetchLakes = async () => {
            try {
                const response = await fetch('/api/lakes');
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching lakes:', error);
            } finally {
                setLoading(false);
            }
        }; fetchLakes();
    }, []);

    const table = useReactTable({
        data,
        columns,
        state: {
            columnFilters,
            pagination: {
                pageSize: 100,
                pageIndex: 0
            }
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) {
        return <div>Chargement...</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <TableContainer>
                <Table>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <React.Fragment key={headerGroup.id}>
                                <TableRow key={`${headerGroup.id}-header`}>
                                    {headerGroup.headers.map(header => (
                                        <TableCell
                                            key={header.id}
                                            sx={{
                                                fontWeight: 'bold',
                                                backgroundColor: 'grey.50',
                                                borderBottom: 'none',
                                                pb: 1
                                            }}
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                                <TableRow key={`${headerGroup.id}-filters`}>
                                    {headerGroup.headers.map(header => (
                                        <TableCell
                                            key={`${header.id}-filter`}
                                            sx={{
                                                backgroundColor: 'grey.50',
                                                pt: 0
                                            }}
                                        >
                                            <TextField
                                                placeholder={`Filtrer...`}
                                                variant="outlined"
                                                size="small"
                                                fullWidth
                                                value={header.column.getFilterValue() as string ?? ''}
                                                onChange={e => header.column.setFilterValue(e.target.value)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        backgroundColor: 'white'
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.map(row => (
                            <TableRow
                                key={row.id}
                                hover
                            >
                                {row.getVisibleCells().map(cell => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 2 }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                        onClick={() => table.setPageIndex(0)}
                        disabled={!table.getCanPreviousPage()}
                        size="small"
                    >
                        <FirstPage />
                    </IconButton>
                    <IconButton
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        size="small"
                    >
                        <NavigateBefore />
                    </IconButton>
                    <Typography variant="body2">
                        Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
                    </Typography>
                    <IconButton
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        size="small"
                    >
                        <NavigateNext />
                    </IconButton>
                    <IconButton
                        onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                        disabled={!table.getCanNextPage()}
                        size="small"
                    >
                        <LastPage />
                    </IconButton>
                </Stack>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Lignes par page</InputLabel>
                    <Select
                        value={table.getState().pagination.pageSize}
                        onChange={e => {
                            table.setPageSize(Number(e.target.value));
                        }}
                        label="Lignes par page"
                    >
                        {[10, 25, 50, 100].map(pageSize => (
                            <MenuItem key={pageSize} value={pageSize}>
                                Afficher {pageSize}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
        </div>
    );
}