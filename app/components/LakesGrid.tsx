// 'use client';

// import { useEffect, useState } from 'react';
// import { 
//     DataGrid, 
//     GridColDef,
//     GridFilterModel,
//     GridLogicOperator,
//     GridToolbar,
//     GridRenderCellParams,
// } from '@mui/x-data-grid';
// import { Box } from '@mui/material';
// import { Lake } from '../types/lake';

// type Juridiction = {
//     organisme: string;
//     site: string;
// };

// const columns: GridColDef[] = [
//     { 
//         field: 'regionAdministrativeQuebec', 
//         headerName: 'Région', 
//         width: 150,
//         filterable: true,
//     },
//     {
//         field: 'reserveFaunique',
//         headerName: 'Reserve Faunique',
//         width: 200,
//         filterable: true,
//         valueGetter: (params) => {
//             const juridiction = params.row.juridiction;
//             return juridiction?.organisme === "SEPAQ" ? juridiction.site : '';
//         }
//     },
//     { 
//         field: 'nomDuLac', 
//         headerName: 'Nom du lac', 
//         width: 200,
//         filterable: true,
//     },
//     // { 
//     //     field: 'especes',
//     //     headerName: 'Espèces',
//     //     width: 300,
//     //     renderCell: (params) => Array.isArray(params.value) ? params.value.join(', ') : ''
//     // },
//     // { field: 'acces', headerName: 'Accès', width: 150 },
//     // { 
//     //     field: 'camping',
//     //     headerName: 'Camping',
//     //     width: 120,
//     //     renderCell: (params) => params.value ? 'Oui' : 'Non'
//     // },
//     // { field: 'latitude', headerName: 'Latitude', width: 120 },
//     // { field: 'longitude', headerName: 'Longitude', width: 120 },
// ];

// export default function LakesGrid() {
//     const [lakes, setLakes] = useState<Lake[]>([]);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchLakes = async () => {
//             try {
//                 const response = await fetch('/api/lakes');
//                 const data = await response.json();
//                 // Transformer les données pour faciliter le filtrage
//                 const lakesWithId = data.map((lake: Lake, index: number) => ({
//                     ...lake,
//                     id: lake._id || index,
//                     // Ajouter un champ plat pour le filtrage des réserves fauniques
//                     reserveFaunique: lake.juridiction?.organisme === "SEPAQ" ? lake.juridiction.site : ''
//                 }));
//                 setLakes(lakesWithId);
//             } catch (error) {
//                 console.error('Error fetching lakes:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchLakes();
//     }, []);

//     // Log des données pour déboguer la structure
//     console.log('Tous les lacs:', lakes);
//     console.log('Premier lac avec juridiction:', lakes.find(lake => lake.juridiction));
//     return (
//         <Box sx={{ height: 600, width: '100%' }}>
//             <DataGrid
//                 rows={lakes}
//                 columns={columns}
//                 // pagination
//                 // pageSizeOptions={[10, 25, 50]}
//                 initialState={{
//                     // pagination: {
//                     //     paginationModel: {
//                     //         pageSize: 25,
//                     //     },
//                     // },
//                     filter: {
//                         filterModel: {
//                             items: [],
//                             logicOperator: GridLogicOperator.And,
//                         },
//                     },
//                 }}
//                 filterMode="server"
//                 disableRowSelectionOnClick
//                 loading={loading}
//                 slots={{
//                     toolbar: GridToolbar,
//                 }}
//                 slotProps={{
//                     toolbar: {
//                         showQuickFilter: true,
//                     },
//                 }}
//             />
//         </Box>
//     );
// }