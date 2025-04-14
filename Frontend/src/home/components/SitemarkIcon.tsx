import SvgIcon from '@mui/material/SvgIcon';
import { useTheme } from '@mui/material/styles';

export default function CodeVisionLogo() {
  const theme = useTheme();
  const primaryColor = theme.palette.mode === 'dark' ? '#ffffff' : '#4661FF'; // Blue in light mode, white in dark
  const textColor = theme.palette.text.primary;

  return (
    <SvgIcon sx={{ height: 32, width: 180 }}>
      <svg
        width="180"
        height="32"
        viewBox="0 0 180 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Code Symbol (Left) */}
        <path
          d="M12 8L4 16L12 24M20 8L28 16L20 24"
          stroke={primaryColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* CodeVision Text (Right) */}
        <text
          x="40"
          y="22"
          fontFamily="'Inter', sans-serif"
          fontSize="20"
          fontWeight="600"
          fill={textColor}
        >
          CodeVision
        </text>
        
        {/* Optional Tech Pulse Effect (Dot) */}
        <circle cx="160" cy="16" r="4" fill="#00D3AB" opacity="0.8">
          <animate
            attributeName="r"
            values="4;6;4"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0.4;0.8"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </SvgIcon>
  );
}