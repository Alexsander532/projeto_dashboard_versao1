import React from 'react';
import { Paper, Box, Typography, Badge } from '@mui/material';
import { Droppable } from '@hello-pangea/dnd';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({
    coluna,
    pedidos,
    onEdit,
    onDelete,
    onHistory,
    estaAtrasado,
    formatarValor,
    calcularDiasEmEtapa
}) => {
    return (
        <Droppable droppableId={coluna.id}>
            {(provided, snapshot) => (
                <Paper
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    elevation={0}
                    sx={{
                        p: 2,
                        borderRadius: '12px',
                        height: '100%',
                        maxHeight: '100%',
                        bgcolor: snapshot.isDraggingOver ? `${coluna.cor}25` : `${coluna.cor}10`,
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden' // Garante que o scroll fique apenas na lista
                    }}
                >
                    {/* Column Header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                        color: coluna.cor
                    }}>
                        {coluna.icon}
                        <Typography variant="subtitle1" fontWeight="bold">
                            {coluna.titulo}
                        </Typography>
                        <Badge
                            badgeContent={pedidos.length}
                            color="primary"
                            sx={{ ml: 'auto' }}
                            showZero
                        />
                    </Box>

                    {/* Cards List - Scrollable Area */}
                    <Box sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        px: 1, // Padding para a barra de rolagem não colar
                        mr: -1, // Compensar o padding para alinhar visualmente
                        '&::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '&::-webkit-scrollbar-track': {
                            background: 'transparent',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            background: `${coluna.cor}40`,
                            borderRadius: '3px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                            background: `${coluna.cor}80`,
                        }
                    }}>
                        {pedidos.map((pedido, index) => (
                            <KanbanCard
                                key={pedido.id}
                                pedido={pedido}
                                index={index}
                                colunaCor={coluna.cor}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onHistory={onHistory}
                                estaAtrasado={estaAtrasado}
                                formatarValor={formatarValor}
                                calcularDiasEmEtapa={calcularDiasEmEtapa}
                            />
                        ))}
                        {provided.placeholder}
                    </Box>
                </Paper>
            )}
        </Droppable>
    );
};

export default KanbanColumn;
