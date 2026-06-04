import '@/styles/globals.css'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'; 
import ThemeProvider from '@/styles/theme/ThemeProvider'
import theme from '@/styles/theme/theme'
import CssBaseline from '@mui/material/CssBaseline';

import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';

import Wrapper from '@/components/Layout/Wrapper';


export default function RootLayout({ children }) {
	return (
		<html>
			<head>
				<title>Liquidity Analytics</title>
				<meta name="apple-mobile-web-app-title" content="Liquidity Analytics" />  
			</head>
			<body>
				<AppRouterCacheProvider>
					<ThemeProvider>
						{children}
					</ThemeProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
