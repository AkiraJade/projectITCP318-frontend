import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MetaData from '../Layout/MetaData';
import Loader from '../Layout/Loader';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Chip, Box } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { getAdminConfig } from '../../Utils/helpers';
import axios from 'axios';

const OrdersList = () => {
    let navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [allOrders, setAllOrders] = useState([]);
    const [deletingId, setDeletingId] = useState(null);

    const listOrders = async () => {
        try {
            const config = getAdminConfig();
            const { data } = await axios.get(`${import.meta.env.VITE_API}/admin/orders`, config);
            setAllOrders(data.orders || []);
            setLoading(false);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message, { position: 'bottom-right' });
            setLoading(false);
        }
    };

    const deleteOrderHandler = async (id, status) => {
        if (status === 'Delivered') {
            toast.error('Completed & delivered transactions cannot be deleted to preserve accounting integrity.', {
                position: 'bottom-right'
            });
            return;
        }

        if (!window.confirm('Are you sure you want to cancel and remove this unfulfilled order? This cannot be undone.')) {
            return;
        }

        setDeletingId(id);
        try {
            const config = getAdminConfig();
            const { data } = await axios.delete(`${import.meta.env.VITE_API}/admin/order/${id}`, config);
            if (data.success) {
                toast.success('Order deleted successfully', { position: 'bottom-right' });
                listOrders();
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete order', { position: 'bottom-right' });
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        listOrders();
    }, []);

    const getStatusChip = (status) => {
        const statusMap = {
            Processing: { className: 'ds-badge-warning', label: 'Processing' },
            Assembled: { className: 'ds-badge-info', label: 'Assembled' },
            Delivered: { className: 'ds-badge-success', label: 'Delivered' },
            Cancelled: { className: 'ds-badge-danger', label: 'Cancelled' }
        };
        const s = statusMap[status] || { className: 'ds-badge-neutral', label: status || 'Pending' };

        return (
            <span className={`ds-table-badge ${s.className}`}>
                <span className="ds-table-badge-dot"></span>
                {s.label}
            </span>
        );
    };

    const columns = [
        {
            field: 'id',
            headerName: 'Order Reference',
            flex: 1.2,
            renderCell: (params) => (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: '1.3' }}>
                    <span style={{
                        fontFamily: 'var(--ds-font-grotesk, sans-serif)',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--ds-text-primary, #111827)',
                        letterSpacing: '0.04em'
                    }}>
                        #ORD-{String(params.value).slice(-8).toUpperCase()}
                    </span>
                    <span style={{
                        fontFamily: 'monospace',
                        fontSize: '10.5px',
                        color: 'var(--ds-text-muted, #6B7280)',
                        letterSpacing: '0.02em'
                    }}>
                        {params.value}
                    </span>
                </div>
            )
        },
        {
            field: 'customer',
            headerName: 'Customer',
            flex: 1,
            renderCell: (params) => (
                <span style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--ds-text-primary, #1F2937)'
                }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'numofItems',
            headerName: 'Items',
            width: 90,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => (
                <span style={{
                    fontWeight: 600,
                    color: 'var(--ds-text-secondary, #374151)',
                    fontFamily: 'var(--ds-font-grotesk, sans-serif)',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {params.value}
                </span>
            )
        },
        {
            field: 'amount',
            headerName: 'Grand Total',
            width: 140,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <span style={{
                    fontWeight: 700,
                    color: 'var(--ds-text-primary, #111827)',
                    fontSize: '13.5px',
                    fontFamily: 'var(--ds-font-grotesk, sans-serif)',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    ${Number(params.value).toFixed(2)}
                </span>
            )
        },
        {
            field: 'status',
            headerName: 'Fulfillment Status',
            width: 170,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => getStatusChip(params.value)
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 150,
            sortable: false,
            filterable: false,
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', width: '100%' }}>
                    <Link to={`/admin/order/${params.row.rawId}`} className="ds-table-action-btn ds-table-btn-view">
                        <VisibilityIcon style={{ fontSize: '13px' }} />
                        Process
                    </Link>
                    {params.row.status !== 'Delivered' && (
                        <button
                            type="button"
                            disabled={deletingId === params.row.rawId}
                            onClick={() => deleteOrderHandler(params.row.rawId, params.row.status)}
                            className="ds-table-action-btn ds-table-btn-trash"
                            title="Cancel / delete unfulfilled order"
                        >
                            <DeleteOutlineIcon style={{ fontSize: '13px' }} />
                            Cancel
                        </button>
                    )}
                </div>
            )
        }
    ];

    const rows = allOrders.map((order) => ({
        id: order._id,
        rawId: order._id,
        customer: order.user?.name || order.shippingInfo?.city || 'Guest Rider',
        numofItems: order.orderItems?.length || 0,
        amount: order.totalPrice,
        status: order.orderStatus,
    }));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <MetaData title="Orders & Fulfillment — DOSNOVENTA" />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>
                        Orders & Fulfillment
                    </h2>
                    <p style={{ fontSize: '12.5px', color: '#6B7280', margin: '4px 0 0' }}>
                        Customer orders, build queue progress, and automated PDF delivery logs.
                    </p>
                </div>
            </div>

            {/* Content Card */}
            <div className="ds-card" style={{ padding: '24px 28px' }}>
                {loading ? (
                    <Loader />
                ) : allOrders.length > 0 ? (
                    <Box className="ds-datagrid-container">
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            pageSizeOptions={[10, 25, 50]}
                            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                            disableSelectionOnClick
                            getRowId={(row) => row.id}
                            autoHeight
                        />
                    </Box>
                ) : (
                    <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6B7280' }}>
                        <p style={{ margin: 0, fontSize: '14px' }}>No customer orders placed yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersList;