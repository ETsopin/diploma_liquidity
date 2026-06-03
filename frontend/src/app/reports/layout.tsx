import '@/styles/globals.css'

import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'; 
import ThemeProvider from '@/styles/theme/ThemeProvider'
import theme from '@/styles/theme/theme'
import CssBaseline from '@mui/material/CssBaseline';

import '@fontsource-variable/inter';
import '@fontsource-variable/inter-tight';

import Header from '@/components/AppBar/Header';
import LeftSidebar from '@/components/AppBar/Sidebars'
import { Stack } from '@mui/material';

export default function RootLayout({ children }) {
	return (
		<html>
			<head>
				<title>Liquidity Analytics</title>
				<meta name="apple-mobile-web-app-title" content="Liquidity Analytics" />  
			</head>
			<body>
				<AppRouterCacheProvider>
					<ThemeProvider theme={theme}>
						<Header />
						<CssBaseline />
						<Stack 
							direction="row"
							sx = {{
								justifyContent: "space-between",
							}}
						>
							<LeftSidebar />
							<LeftSidebar />
						</Stack>
					</ThemeProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}
