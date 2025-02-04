import React from 'react';
import { Box, Card, Typography, Tooltip, useTheme } from '@mui/material';

function MetricCard({ title, value, icon, color, tooltip }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const formattedValue = value || '0';

  return (
    <Card
      sx={{
        p: 3,
        backgroundColor: theme.palette.background.paper,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          '& .icon-container': {
            transform: 'scale(1.1) rotate(5deg)',
          },
          '& .metric-value': {
            transform: 'scale(1.05)',
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Box
          className="icon-container"
          sx={{
            width: 48,
            height: 48,
            display: 'flex',
            borderRadius: '12px',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark
              ? `linear-gradient(135deg, ${color}40, ${color}20)`
              : `linear-gradient(135deg, ${color}15, ${color}25)`,
            color: color,
            transition: 'all 0.3s ease',
            '& svg': {
              fontSize: '1.6rem',
            },
          }}
        >
          {icon}
        </Box>
      </Box>

      <Box>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: theme.palette.text.secondary,
            mb: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>

        <Tooltip title={tooltip || ''} placement="top">
          <Typography 
            className="metric-value"
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: color,
              letterSpacing: '-0.5px',
              transition: 'all 0.3s ease',
            }}
          >
            {formattedValue}
          </Typography>
        </Tooltip>
      </Box>
    </Card>
  );
}

export default MetricCard; 