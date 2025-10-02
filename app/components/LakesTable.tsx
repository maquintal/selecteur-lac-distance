'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import { Lake } from '../types/lake';


const columns: ColumnDef<Lake>[] = [
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
];

export default function LakesTable() {
    const [data, setData] = useState<Lake[]>([]);
    const [loading, setLoading] = useState(true);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    useEffect(() => {
        const fetchLakes = async () => {
            try {
                console.log('Fetching lakes...');
                const response = await fetch('/api/lakes');
                const result = await response.json();
                console.log('Received data:', result);
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
        },
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        // getPaginationRowModel: getPaginationRowModel(),
    });

    if (loading) {
        return <div>Chargement...</div>;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Filtres */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filtrer par région"
                        value={table.getColumn('regionAdministrativeQuebec')?.getFilterValue() as string ?? ''}
                        onChange={e => table.getColumn('regionAdministrativeQuebec')?.setFilterValue(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filtrer par réserve"
                        value={table.getColumn('juridiction')?.getFilterValue() as string ?? ''}
                        onChange={e => table.getColumn('juridiction')?.setFilterValue(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Filtrer par nom de lac"
                        value={table.getColumn('nomDuLac')?.getFilterValue() as string ?? ''}
                        onChange={e => table.getColumn('nomDuLac')?.setFilterValue(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                </div>
            </div>

            <TableContainer>
                <Table>
                    <TableHead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableCell
                                        key={header.id}
                                        sx={{
                                            fontWeight: 'bold',
                                            backgroundColor: 'grey.50'
                                        }}
                                    >
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
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
                        {[10, 25, 50].map(pageSize => (
                            <option key={pageSize} value={pageSize}>
                                Afficher {pageSize}
                            </option>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
        </div>
    );
}