import React from 'react';
import { Box, Paper, Typography, LinearProgress } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const PerformanceAlert = ({ sku, data, goal = 0 }) => {
  const theme = useTheme();
  
  const getStatusInfo = () => {
    const currentSales = data?.total || 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const dailyAverage = currentDay > 0 ? currentSales / currentDay : 0;
    const projectedSales = dailyAverage * daysInMonth;
    const progress = goal > 0 ? (currentSales / goal) * 100 : 0;
    const remainingDays = daysInMonth - currentDay;
    const remainingToGoal = Math.max(0, goal - currentSales);
    const neededDaily = remainingDays > 0 ? remainingToGoal / remainingDays : 0;

    let status, message, color, icon;
    
    if (currentSales >= goal) {
      status = 'success';
      message = `Meta atingida! Superou em ${((currentSales / goal - 1) * 100).toFixed(1)}%`;
      color = theme.palette.success.main;
      icon = <CheckCircleIcon />;
    } else if (projectedSales >= goal) {
      status = 'reachable';
      message = `Faltam R$ ${neededDaily.toFixed(2)} por dia para atingir a meta`;
      color = theme.palette.info.main;
      icon = <TrendingUpIcon />;
    } else if (progress >= 40) {
      status = 'warning';
      message = `Faltam R$ ${neededDaily.toFixed(2)} por dia para atingir a meta`;
      color = theme.palette.warning.main;
      icon = <WarningIcon />;
    } else {
      status = 'danger';
      message = `Projeção atual está ${((goal - projectedSales) / goal * 100).toFixed(1)}% abaixo da meta`;
      color = theme.palette.error.main;
      icon = <ErrorIcon />;
    }

    return {
      status,
      message,
      color,
      icon,
      progress: progress || 0,
      currentSales,
      dailyAverage,
      remainingToGoal
    };
  };

  const info = getStatusInfo();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        border: '1px solid',
        borderColor: alpha(info.color, 0.2)
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          SKU: {sku}
        </Typography>
        <Box sx={{ color: info.color }}>
          {info.icon}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {info.message}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Vendas Atuais
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            R$ {info.currentSales.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Meta Mensal
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            R$ {goal.toFixed(2)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Média Diária
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            R$ {info.dailyAverage.toFixed(2)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Progresso
          </Typography>
          <Typography variant="body2" sx={{ color: info.color }}>
            {info.progress.toFixed(1)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(info.progress, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(info.color, 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: info.color,
              borderRadius: 3
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default PerformanceAlert;
