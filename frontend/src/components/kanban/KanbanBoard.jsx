import React from 'react';
import { Grid, Box } from '@mui/material';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './KanbanColumn';

const KanbanBoard = ({
    pedidos,
    colunas,
    onDragEnd,
    onEdit,
    onDelete,
    onHistory,
    estaAtrasado,
    formatarValor,
    calcularDiasEmEtapa
}) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Grid container spacing={2} sx={{ height: '100%' }}>
                {colunas.map((coluna) => {
                    const pedidosDaColuna = pedidos.filter(p => p.status === coluna.id);

                    return (
                        <Grid item xs={12} md={2.4} key={coluna.id} sx={{ height: '100%' }}>
                            <KanbanColumn
                                coluna={coluna}
                                pedidos={pedidosDaColuna}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onHistory={onHistory}
                                estaAtrasado={estaAtrasado}
                                formatarValor={formatarValor}
                                calcularDiasEmEtapa={calcularDiasEmEtapa}
                            />
                        </Grid>
                    );
                })}
            </Grid>
        </DragDropContext>
    );
};

export default KanbanBoard;
